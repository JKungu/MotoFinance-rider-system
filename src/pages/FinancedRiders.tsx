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
import { Plus, Search, User, Bike, Calendar, Phone } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FinancedRider {
  id: string;
  full_name: string;
  id_number: string;
  age: number;
  postal_address: string;
  primary_phone: string;
  secondary_phone?: string;
  tertiary_phone?: string;
  residential_area: string;
  operation_slot: string;
  referee_name?: string;
  referee_id?: string;
  referee_phone?: string;
  next_of_kin_name: string;
  next_of_kin_id: string;
  next_of_kin_phone: string;
  next_of_kin_relationship: string;
  bike_id?: string;
  start_date: string;
  daily_remittance: number;
  operation_slot_cost: number;
  total_investment: number;
  expected_operation_days: number;
  status: string;
  created_at: string;
  bikes?: {
    make: string;
    chassis_no: string;
    engine_no: string;
    registration_no?: string;
    colour: string;
    purchase_date: string;
  };
}

export default function FinancedRiders() {
  const [riders, setRiders] = useState<FinancedRider[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    potential_rider_id: "",
    bike_id: "",
    operation_slot: "",
    daily_remittance: "",
    operation_slot_cost: "",
    total_investment: "",
    expected_operation_days: "",
    next_of_kin_name: "",
    next_of_kin_id: "",
    next_of_kin_phone: "",
    next_of_kin_relationship: "",
    start_date: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchRiders();
  }, []);

  const fetchRiders = async () => {
    try {
      const { data, error } = await supabase
        .from("financed_riders")
        .select(`
          *,
          bikes (
            make,
            chassis_no,
            engine_no,
            registration_no,
            colour,
            purchase_date
          )
        `)
        .eq("status", "financed")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRiders(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch financed riders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // This would need to be implemented with proper rider selection
      toast({
        title: "Feature Coming Soon",
        description: "Financed rider creation will be available soon",
      });
      
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add financed rider",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      potential_rider_id: "",
      bike_id: "",
      operation_slot: "",
      daily_remittance: "",
      operation_slot_cost: "",
      total_investment: "",
      expected_operation_days: "",
      next_of_kin_name: "",
      next_of_kin_id: "",
      next_of_kin_phone: "",
      next_of_kin_relationship: "",
      start_date: "",
    });
  };

  const filteredRiders = riders.filter(rider =>
    rider.id_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rider.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'financed': return 'bg-blue-500';
      case 'active': return 'bg-green-500';
      case 'defaulted': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 p-6">
        <div className="flex items-center gap-4 mb-6">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Financed Riders</h1>
            <p className="text-muted-foreground">Riders with active financing agreements</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Financed Rider
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Financed Rider</DialogTitle>
                <DialogDescription>
                  Complete financing details for the rider
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="operation_slot">Operation Slot *</Label>
                    <Select onValueChange={(value) => setFormData({ ...formData, operation_slot: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select operation slot" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning (6AM - 2PM)</SelectItem>
                        <SelectItem value="evening">Evening (2PM - 10PM)</SelectItem>
                        <SelectItem value="night">Night (10PM - 6AM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="daily_remittance">Daily Remittance (KES) *</Label>
                    <Input
                      id="daily_remittance"
                      type="number"
                      value={formData.daily_remittance}
                      onChange={(e) => setFormData({ ...formData, daily_remittance: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="operation_slot_cost">Operation Slot Cost (KES) *</Label>
                    <Input
                      id="operation_slot_cost"
                      type="number"
                      value={formData.operation_slot_cost}
                      onChange={(e) => setFormData({ ...formData, operation_slot_cost: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="total_investment">Total Investment (KES) *</Label>
                    <Input
                      id="total_investment"
                      type="number"
                      value={formData.total_investment}
                      onChange={(e) => setFormData({ ...formData, total_investment: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expected_operation_days">Expected Operation Days *</Label>
                    <Input
                      id="expected_operation_days"
                      type="number"
                      value={formData.expected_operation_days}
                      onChange={(e) => setFormData({ ...formData, expected_operation_days: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Next of Kin Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="next_of_kin_name">Next of Kin Name *</Label>
                      <Input
                        id="next_of_kin_name"
                        value={formData.next_of_kin_name}
                        onChange={(e) => setFormData({ ...formData, next_of_kin_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="next_of_kin_id">Next of Kin ID *</Label>
                      <Input
                        id="next_of_kin_id"
                        value={formData.next_of_kin_id}
                        onChange={(e) => setFormData({ ...formData, next_of_kin_id: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="next_of_kin_phone">Next of Kin Phone *</Label>
                      <Input
                        id="next_of_kin_phone"
                        value={formData.next_of_kin_phone}
                        onChange={(e) => setFormData({ ...formData, next_of_kin_phone: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="next_of_kin_relationship">Relationship *</Label>
                      <Select onValueChange={(value) => setFormData({ ...formData, next_of_kin_relationship: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spouse">Spouse</SelectItem>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="sibling">Sibling</SelectItem>
                          <SelectItem value="child">Child</SelectItem>
                          <SelectItem value="friend">Friend</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    Add Financed Rider
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

        <Card>
          <CardHeader>
            <CardTitle>Active Financed Riders</CardTitle>
            <CardDescription>
              {filteredRiders.length} riders with active financing agreements
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rider Details</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Bike Details</TableHead>
                    <TableHead>Operation</TableHead>
                    <TableHead>Next of Kin</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRiders.map((rider) => (
                    <TableRow key={rider.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{rider.full_name}</div>
                          <div className="text-sm text-muted-foreground">ID: {rider.id_number}</div>
                          <div className="text-sm text-muted-foreground">Age: {rider.age}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {rider.primary_phone}
                          </div>
                          <div className="text-sm text-muted-foreground">{rider.residential_area}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Bike className="h-3 w-3" />
                            {rider.bikes?.make || "Not assigned"}
                          </div>
                          {rider.bikes && (
                            <>
                              <div className="text-sm text-muted-foreground">
                                Reg: {rider.bikes.registration_no || "Pending"}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Color: {rider.bikes.colour}
                              </div>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">{rider.operation_slot}</div>
                          <div className="text-sm text-muted-foreground">
                            Daily: KES {rider.daily_remittance.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Total: KES {rider.total_investment.toLocaleString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {rider.next_of_kin_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {rider.next_of_kin_relationship}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {rider.next_of_kin_phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(rider.status)}>
                          {rider.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </SidebarProvider>
  );
}