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
import { Plus, Search, Bike, Calendar, User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BikeData {
  id: string;
  make: string;
  chassis_no: string;
  engine_no: string;
  registration_no?: string;
  colour: string;
  purchase_price: number;
  purchase_date: string;
  status: string;
  current_rider_id?: string;
  created_at: string;
  financed_riders?: any;
}

export default function Bikes() {
  const [bikes, setBikes] = useState<BikeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    make: "",
    chassis_no: "",
    engine_no: "",
    registration_no: "",
    colour: "",
    purchase_price: "",
    purchase_date: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchBikes();
  }, []);

  const fetchBikes = async () => {
    try {
      const { data, error } = await supabase
        .from("bikes")
        .select(`
          *,
          financed_riders!fk_bikes_current_rider (
            full_name,
            primary_phone,
            start_date,
            daily_remittance
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBikes(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch bikes",
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
      const { error } = await supabase
        .from("bikes")
        .insert([{
          ...formData,
          purchase_price: parseFloat(formData.purchase_price),
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Bike added successfully",
      });
      
      setDialogOpen(false);
      resetForm();
      fetchBikes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add bike",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      make: "",
      chassis_no: "",
      engine_no: "",
      registration_no: "",
      colour: "",
      purchase_price: "",
      purchase_date: "",
    });
  };

  const filteredBikes = bikes.filter(bike =>
    bike.registration_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bike.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bike.chassis_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'financed': return 'bg-blue-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'repossessed': return 'bg-red-500';
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
            <h1 className="text-3xl font-bold">Bikes Management</h1>
            <p className="text-muted-foreground">Manage motorcycle inventory and assignments</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add New Bike
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Bike</DialogTitle>
                <DialogDescription>
                  Add a new motorcycle to the inventory
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="make">Make *</Label>
                    <Select onValueChange={(value) => setFormData({ ...formData, make: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select bike make" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="honda">Honda</SelectItem>
                        <SelectItem value="yamaha">Yamaha</SelectItem>
                        <SelectItem value="suzuki">Suzuki</SelectItem>
                        <SelectItem value="kawasaki">Kawasaki</SelectItem>
                        <SelectItem value="bajaj">Bajaj</SelectItem>
                        <SelectItem value="tvs">TVS</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="colour">Color *</Label>
                    <Input
                      id="colour"
                      value={formData.colour}
                      onChange={(e) => setFormData({ ...formData, colour: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chassis_no">Chassis Number *</Label>
                    <Input
                      id="chassis_no"
                      value={formData.chassis_no}
                      onChange={(e) => setFormData({ ...formData, chassis_no: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="engine_no">Engine Number *</Label>
                    <Input
                      id="engine_no"
                      value={formData.engine_no}
                      onChange={(e) => setFormData({ ...formData, engine_no: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registration_no">Registration Number</Label>
                    <Input
                      id="registration_no"
                      value={formData.registration_no}
                      onChange={(e) => setFormData({ ...formData, registration_no: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purchase_price">Purchase Price (KES) *</Label>
                    <Input
                      id="purchase_price"
                      type="number"
                      value={formData.purchase_price}
                      onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="purchase_date">Purchase Date *</Label>
                    <Input
                      id="purchase_date"
                      type="date"
                      value={formData.purchase_date}
                      onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    Add Bike
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
              placeholder="Search by registration, make, or chassis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Motorcycle Inventory</CardTitle>
            <CardDescription>
              {filteredBikes.length} bikes in inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bike Details</TableHead>
                    <TableHead>Registration</TableHead>
                    <TableHead>Current Rider</TableHead>
                    <TableHead>Financial Info</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Purchase Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBikes.map((bike) => (
                    <TableRow key={bike.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Bike className="h-3 w-3" />
                            <span className="font-medium">{bike.make}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">Color: {bike.colour}</div>
                          <div className="text-sm text-muted-foreground">
                            Chassis: {bike.chassis_no}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Engine: {bike.engine_no}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          {bike.registration_no || "Not registered"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">Not available</span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            Purchase: KES {bike.purchase_price.toLocaleString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(bike.status)}>
                          {bike.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(bike.purchase_date).toLocaleDateString()}
                        </div>
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