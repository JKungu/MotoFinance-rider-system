import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Plus, Search, CreditCard, User, Calendar, TrendingUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Payment {
  id: string;
  rider_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  status: string;
  transaction_reference?: string;
  notes?: string;
  created_at: string;
  financed_riders?: {
    full_name: string;
    id_number: string;
    primary_phone: string;
    total_investment: number;
    daily_remittance: number;
    start_date: string;
    expected_operation_days: number;
  };
}

interface PaymentProgress {
  rider_id: string;
  rider_name: string;
  id_number: string;
  total_paid: number;
  total_investment: number;
  progress_percentage: number;
  days_elapsed: number;
  expected_days: number;
  last_payment_date?: string;
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentProgress, setPaymentProgress] = useState<PaymentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    rider_id: "",
    amount: "",
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: "mpesa",
    transaction_reference: "",
    notes: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchPayments();
    fetchPaymentProgress();
  }, []);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          financed_riders (
            full_name,
            id_number,
            primary_phone,
            total_investment,
            daily_remittance,
            start_date,
            expected_operation_days
          )
        `)
        .order("payment_date", { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch payments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentProgress = async () => {
    try {
      // Fetch financed riders with their payment totals
      const { data: riders, error: ridersError } = await supabase
        .from("financed_riders")
        .select(`
          id,
          full_name,
          id_number,
          total_investment,
          daily_remittance,
          start_date,
          expected_operation_days
        `);

      if (ridersError) throw ridersError;

      // Fetch payment totals for each rider
      const progressData: PaymentProgress[] = [];
      
      for (const rider of riders || []) {
        const { data: paymentSum, error: paymentError } = await supabase
          .from("payments")
          .select("amount, payment_date")
          .eq("rider_id", rider.id)
          .eq("status", "completed");

        if (paymentError) continue;

        const totalPaid = paymentSum?.reduce((sum, p) => sum + p.amount, 0) || 0;
        const progressPercentage = (totalPaid / rider.total_investment) * 100;
        const startDate = new Date(rider.start_date);
        const today = new Date();
        const daysElapsed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const lastPayment = paymentSum?.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())[0];

        progressData.push({
          rider_id: rider.id,
          rider_name: rider.full_name,
          id_number: rider.id_number,
          total_paid: totalPaid,
          total_investment: rider.total_investment,
          progress_percentage: Math.min(progressPercentage, 100),
          days_elapsed: daysElapsed,
          expected_days: rider.expected_operation_days,
          last_payment_date: lastPayment?.payment_date,
        });
      }

      setPaymentProgress(progressData);
    } catch (error: any) {
      console.error("Error fetching payment progress:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("payments")
        .insert([{
          ...formData,
          amount: parseFloat(formData.amount),
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });
      
      setDialogOpen(false);
      resetForm();
      fetchPayments();
      fetchPaymentProgress();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to record payment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      rider_id: "",
      amount: "",
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: "mpesa",
      transaction_reference: "",
      notes: "",
    });
  };

  const filteredPayments = payments.filter(payment =>
    payment.financed_riders?.id_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.financed_riders?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.transaction_reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProgress = paymentProgress.filter(progress =>
    progress.id_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    progress.rider_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 p-6">
        <div className="flex items-center gap-4 mb-6">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Payments Management</h1>
            <p className="text-muted-foreground">Track rider payments and progress</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Record New Payment</DialogTitle>
                <DialogDescription>
                  Record a payment received from a rider
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (KES) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_date">Payment Date *</Label>
                    <Input
                      id="payment_date"
                      type="date"
                      value={formData.payment_date}
                      onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_method">Payment Method *</Label>
                    <Select onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mpesa">M-Pesa</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transaction_reference">Transaction Reference</Label>
                    <Input
                      id="transaction_reference"
                      value={formData.transaction_reference}
                      onChange={(e) => setFormData({ ...formData, transaction_reference: e.target.value })}
                      placeholder="M-Pesa code, receipt number, etc."
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes about the payment"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    Record Payment
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-4 flex gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID number or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="grid gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Progress Overview</CardTitle>
              <CardDescription>
                Track rider payment progress and completion status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rider Details</TableHead>
                    <TableHead>Payment Progress</TableHead>
                    <TableHead>Financial Status</TableHead>
                    <TableHead>Timeline</TableHead>
                    <TableHead>Last Payment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProgress.map((progress) => (
                    <TableRow key={progress.rider_id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span className="font-medium">{progress.rider_name}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">ID: {progress.id_number}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{progress.progress_percentage.toFixed(1)}%</span>
                            <span className="text-muted-foreground">
                              KES {progress.total_paid.toLocaleString()} / {progress.total_investment.toLocaleString()}
                            </span>
                          </div>
                          <Progress 
                            value={progress.progress_percentage} 
                            className="w-full"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            Remaining: KES {(progress.total_investment - progress.total_paid).toLocaleString()}
                          </div>
                          <Badge className={getProgressColor(progress.progress_percentage)}>
                            {progress.progress_percentage >= 100 ? 'Completed' : 
                             progress.progress_percentage >= 90 ? 'Near Complete' :
                             progress.progress_percentage >= 50 ? 'On Track' : 'Behind'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            Day {progress.days_elapsed} of {progress.expected_days}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {progress.expected_days - progress.days_elapsed} days remaining
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span className="text-sm">
                            {progress.last_payment_date 
                              ? new Date(progress.last_payment_date).toLocaleDateString()
                              : "No payments"
                            }
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>
                {filteredPayments.length} payment records
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rider</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {payment.financed_riders?.full_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ID: {payment.financed_riders?.id_number}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            <span className="font-medium">
                              KES {payment.amount.toLocaleString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {payment.payment_method.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">
                            {payment.transaction_reference || "N/A"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(payment.payment_date).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(payment.status)}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </SidebarProvider>
  );
}