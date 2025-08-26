import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Plus, Search, MessageSquare, Send, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatsCard } from "@/components/dashboard/StatsCard";

interface SMSNotification {
  id: string;
  rider_id?: string;
  recipient_phone: string;
  message: string;
  message_type: string;
  status: string;
  sent_at?: string;
  error_message?: string;
  created_at: string;
}

interface AutomationRules {
  paymentConfirmation: boolean;
  paymentReminder: boolean;
  latePaymentWarning: boolean;
  repossessionNotice: boolean;
  ownershipCongratulations: boolean;
}

export default function SMSNotifications() {
  const [notifications, setNotifications] = useState<SMSNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [automationDialogOpen, setAutomationDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [automationRules, setAutomationRules] = useState<AutomationRules>({
    paymentConfirmation: true,
    paymentReminder: true,
    latePaymentWarning: true,
    repossessionNotice: true,
    ownershipCongratulations: true,
  });
  const [formData, setFormData] = useState({
    recipient_phone: "",
    message: "",
    message_type: "manual",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
    scheduleAutomatedMessages();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("sms_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch SMS notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const scheduleAutomatedMessages = async () => {
    try {
      // Check for payment confirmations needed
      if (automationRules.paymentConfirmation) {
        await checkRecentPayments();
      }

      // Check for payment reminders
      if (automationRules.paymentReminder) {
        await checkMissedPayments();
      }

      // Check for ownership completion (366 days)
      if (automationRules.ownershipCongratulations) {
        await checkOwnershipCompletion();
      }

    } catch (error: any) {
      console.error("Error scheduling automated messages:", error);
    }
  };

  const checkRecentPayments = async () => {
    // Get payments from today that don't have confirmation SMS
    const today = new Date().toISOString().split('T')[0];
    
    const { data: recentPayments, error } = await supabase
      .from("payments")
      .select(`
        id,
        rider_id,
        amount,
        payment_date,
        financed_riders (
          full_name,
          primary_phone
        )
      `)
      .eq("payment_date", today)
      .eq("status", "completed");

    if (error || !recentPayments) return;

    for (const payment of recentPayments) {
      // Check if confirmation SMS already sent
      const { data: existingSMS } = await supabase
        .from("sms_notifications")
        .select("id")
        .eq("rider_id", payment.rider_id)
        .eq("message_type", "payment_confirmation")
        .gte("created_at", `${today}T00:00:00`);

      if (!existingSMS || existingSMS.length === 0) {
        const message = `Dear ${payment.financed_riders?.full_name}, your payment of KES ${payment.amount.toLocaleString()} has been received. Thank you! - MotoFinance`;
        
        await sendSMS({
          rider_id: payment.rider_id,
          recipient_phone: payment.financed_riders?.primary_phone || "",
          message,
          message_type: "payment_confirmation",
        });
      }
    }
  };

  const checkMissedPayments = async () => {
    // Get riders who haven't paid in the last 2 days
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const dateThreshold = twoDaysAgo.toISOString().split('T')[0];

    const { data: riders, error } = await supabase
      .from("financed_riders")
      .select(`
        id,
        full_name,
        primary_phone,
        daily_remittance,
        start_date
      `)
      .eq("status", "financed");

    if (error || !riders) return;

    for (const rider of riders) {
      // Check last payment date
      const { data: lastPayment } = await supabase
        .from("payments")
        .select("payment_date")
        .eq("rider_id", rider.id)
        .eq("status", "completed")
        .order("payment_date", { ascending: false })
        .limit(1);

      const lastPaymentDate = lastPayment?.[0]?.payment_date;
      
      if (!lastPaymentDate || lastPaymentDate < dateThreshold) {
        // Check if reminder already sent today
        const today = new Date().toISOString().split('T')[0];
        const { data: existingSMS } = await supabase
          .from("sms_notifications")
          .select("id")
          .eq("rider_id", rider.id)
          .eq("message_type", "payment_reminder")
          .gte("created_at", `${today}T00:00:00`);

        if (!existingSMS || existingSMS.length === 0) {
          const message = `Dear ${rider.full_name}, this is a reminder that your daily remittance of KES ${rider.daily_remittance.toLocaleString()} is due before 9PM today. Please make your payment. - MotoFinance`;
          
          await sendSMS({
            rider_id: rider.id,
            recipient_phone: rider.primary_phone,
            message,
            message_type: "payment_reminder",
          });
        }
      }
    }
  };

  const checkOwnershipCompletion = async () => {
    // Check riders who started exactly 366 days ago
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() - 366);
    const targetDate = completionDate.toISOString().split('T')[0];

    const { data: completedRiders, error } = await supabase
      .from("financed_riders")
      .select(`
        id,
        full_name,
        primary_phone,
        start_date
      `)
      .eq("start_date", targetDate)
      .eq("status", "financed");

    if (error || !completedRiders) return;

    for (const rider of completedRiders) {
      // Check if congratulations already sent
      const { data: existingSMS } = await supabase
        .from("sms_notifications")
        .select("id")
        .eq("rider_id", rider.id)
        .eq("message_type", "ownership_congratulations");

      if (!existingSMS || existingSMS.length === 0) {
        const message = `Congratulations ${rider.full_name}! You have successfully completed your 366-day payment period and now fully own your motorcycle. Thank you for your commitment! - MotoFinance`;
        
        await sendSMS({
          rider_id: rider.id,
          recipient_phone: rider.primary_phone,
          message,
          message_type: "ownership_congratulations",
        });
      }
    }
  };

  const sendSMS = async (smsData: {
    rider_id?: string;
    recipient_phone: string;
    message: string;
    message_type: string;
  }) => {
    try {
      const { error } = await supabase
        .from("sms_notifications")
        .insert([{
          ...smsData,
          status: "pending", // In real implementation, this would integrate with SMS gateway
        }]);

      if (error) throw error;

      // Simulate SMS sending delay and update status
      setTimeout(async () => {
        const { error: updateError } = await supabase
          .from("sms_notifications")
          .update({ 
            status: "sent", 
            sent_at: new Date().toISOString() 
          })
          .eq("recipient_phone", smsData.recipient_phone)
          .eq("message_type", smsData.message_type)
          .eq("status", "pending");

        if (!updateError) {
          fetchNotifications(); // Refresh the list
        }
      }, 2000);

    } catch (error: any) {
      console.error("Error sending SMS:", error);
    }
  };

  const handleManualSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await sendSMS(formData);

      toast({
        title: "Success",
        description: "SMS queued for sending",
      });
      
      setDialogOpen(false);
      resetForm();
      fetchNotifications();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send SMS",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      recipient_phone: "",
      message: "",
      message_type: "manual",
    });
  };

  const filteredNotifications = notifications.filter(notification =>
    notification.recipient_phone.includes(searchTerm) ||
    notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notification.message_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return CheckCircle;
      case 'pending': return Clock;
      case 'failed': return XCircle;
      default: return MessageSquare;
    }
  };

  const getMessageTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'payment_confirmation': 'bg-green-500',
      'payment_reminder': 'bg-yellow-500',
      'late_payment_warning': 'bg-orange-500',
      'repossession_notice': 'bg-red-500',
      'ownership_congratulations': 'bg-blue-500',
      'manual': 'bg-purple-500',
    };
    return colors[type] || 'bg-gray-500';
  };

  // Calculate stats
  const totalSent = notifications.filter(n => n.status === 'sent').length;
  const totalPending = notifications.filter(n => n.status === 'pending').length;
  const totalFailed = notifications.filter(n => n.status === 'failed').length;
  const deliveryRate = notifications.length > 0 ? (totalSent / notifications.length) * 100 : 0;

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 p-6">
        <div className="flex items-center gap-4 mb-6">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-3xl font-bold">SMS Notifications</h1>
            <p className="text-muted-foreground">Automated messaging system for rider communications</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setAutomationDialogOpen(true)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Automation
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Send SMS
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Send Manual SMS</DialogTitle>
                  <DialogDescription>
                    Send a custom SMS message to a rider
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleManualSMS} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="recipient_phone">Recipient Phone *</Label>
                      <Input
                        id="recipient_phone"
                        value={formData.recipient_phone}
                        onChange={(e) => setFormData({ ...formData, recipient_phone: e.target.value })}
                        placeholder="+254700000000"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message_type">Message Type</Label>
                      <Select onValueChange={(value) => setFormData({ ...formData, message_type: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select message type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="payment_reminder">Payment Reminder</SelectItem>
                          <SelectItem value="late_payment_warning">Late Payment Warning</SelectItem>
                          <SelectItem value="general_notice">General Notice</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Type your message here..."
                      rows={4}
                      maxLength={160}
                      required
                    />
                    <div className="text-sm text-muted-foreground">
                      {formData.message.length}/160 characters
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      <Send className="h-4 w-4 mr-2" />
                      Send SMS
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <StatsCard
            title="Total Sent"
            value={totalSent.toString()}
            description="Successfully delivered messages"
            icon={CheckCircle}
          />
          <StatsCard
            title="Pending"
            value={totalPending.toString()}
            description="Messages in queue"
            icon={Clock}
          />
          <StatsCard
            title="Failed"
            value={totalFailed.toString()}
            description="Failed deliveries"
            icon={XCircle}
          />
          <StatsCard
            title="Delivery Rate"
            value={`${deliveryRate.toFixed(1)}%`}
            description="Successful delivery percentage"
            icon={MessageSquare}
          />
        </div>

        <div className="mb-4 flex gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button onClick={scheduleAutomatedMessages} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Run Automation
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>SMS History</CardTitle>
            <CardDescription>
              {filteredNotifications.length} message records
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Sent Date</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNotifications.map((notification) => {
                    const StatusIcon = getStatusIcon(notification.status);
                    return (
                      <TableRow key={notification.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StatusIcon className="h-4 w-4" />
                            <Badge className={getStatusColor(notification.status)}>
                              {notification.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getMessageTypeColor(notification.message_type)}>
                            {notification.message_type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {notification.recipient_phone}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={notification.message}>
                            {notification.message}
                          </div>
                        </TableCell>
                        <TableCell>
                          {notification.sent_at 
                            ? new Date(notification.sent_at).toLocaleString()
                            : "Not sent"
                          }
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate text-sm text-red-600" title={notification.error_message || ""}>
                            {notification.error_message || ""}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Automation Rules Dialog */}
        <Dialog open={automationDialogOpen} onOpenChange={setAutomationDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>SMS Automation Rules</DialogTitle>
              <DialogDescription>
                Configure automatic SMS notifications for different events
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Payment Confirmations</Label>
                    <p className="text-sm text-muted-foreground">Send confirmation SMS when payment is received</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={automationRules.paymentConfirmation}
                    onChange={(e) => setAutomationRules({...automationRules, paymentConfirmation: e.target.checked})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Payment Reminders</Label>
                    <p className="text-sm text-muted-foreground">Remind riders about daily payments (before 9PM)</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={automationRules.paymentReminder}
                    onChange={(e) => setAutomationRules({...automationRules, paymentReminder: e.target.checked})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Late Payment Warnings</Label>
                    <p className="text-sm text-muted-foreground">Send warnings for overdue payments</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={automationRules.latePaymentWarning}
                    onChange={(e) => setAutomationRules({...automationRules, latePaymentWarning: e.target.checked})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Ownership Congratulations</Label>
                    <p className="text-sm text-muted-foreground">Congratulate riders after 366 days completion</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={automationRules.ownershipCongratulations}
                    onChange={(e) => setAutomationRules({...automationRules, ownershipCongratulations: e.target.checked})}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setAutomationDialogOpen(false)}>
                Save Rules
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </SidebarProvider>
  );
}