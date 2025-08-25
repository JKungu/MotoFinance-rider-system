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
import { Plus, Edit, Phone, MapPin, User, Calendar } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PotentialRider {
  id: string;
  full_name: string;
  id_number: string;
  age: number;
  postal_address: string;
  primary_phone: string;
  secondary_phone?: string;
  tertiary_phone?: string;
  introducer_name?: string;
  introducer_id?: string;
  introducer_phone?: string;
  introducer_previous_bike?: string;
  introducer_residential_area?: string;
  preferred_bike_make?: string;
  probable_financing_date?: string;
  status: string;
  created_at: string;
}

export default function PotentialRiders() {
  const [riders, setRiders] = useState<PotentialRider[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    id_number: "",
    age: "",
    postal_address: "",
    primary_phone: "",
    secondary_phone: "",
    tertiary_phone: "",
    introducer_name: "",
    introducer_id: "",
    introducer_phone: "",
    introducer_previous_bike: "",
    introducer_residential_area: "",
    preferred_bike_make: "",
    probable_financing_date: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchRiders();
  }, []);

  const fetchRiders = async () => {
    try {
      const { data, error } = await supabase
        .from("potential_riders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRiders(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch potential riders",
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
        .from("potential_riders")
        .insert([{
          ...formData,
          age: parseInt(formData.age),
          probable_financing_date: formData.probable_financing_date || null,
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Potential rider registered successfully",
      });
      
      setDialogOpen(false);
      setFormData({
        full_name: "",
        id_number: "",
        age: "",
        postal_address: "",
        primary_phone: "",
        secondary_phone: "",
        tertiary_phone: "",
        introducer_name: "",
        introducer_id: "",
        introducer_phone: "",
        introducer_previous_bike: "",
        introducer_residential_area: "",
        preferred_bike_make: "",
        probable_financing_date: "",
      });
      fetchRiders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to register potential rider",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'potential': return 'bg-blue-500';
      case 'financed': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
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
            <h1 className="text-3xl font-bold">Potential Riders</h1>
            <p className="text-muted-foreground">Manage riders awaiting financing</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Register New Rider
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Register Potential Rider</DialogTitle>
                <DialogDescription>
                  Fill in the details for the potential rider awaiting financing
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="id_number">ID Number *</Label>
                    <Input
                      id="id_number"
                      value={formData.id_number}
                      onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Age *</Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="primary_phone">Primary Phone *</Label>
                    <Input
                      id="primary_phone"
                      value={formData.primary_phone}
                      onChange={(e) => setFormData({ ...formData, primary_phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondary_phone">Secondary Phone</Label>
                    <Input
                      id="secondary_phone"
                      value={formData.secondary_phone}
                      onChange={(e) => setFormData({ ...formData, secondary_phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tertiary_phone">Tertiary Phone</Label>
                    <Input
                      id="tertiary_phone"
                      value={formData.tertiary_phone}
                      onChange={(e) => setFormData({ ...formData, tertiary_phone: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="postal_address">Postal Address *</Label>
                  <Textarea
                    id="postal_address"
                    value={formData.postal_address}
                    onChange={(e) => setFormData({ ...formData, postal_address: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Introducer/Referee Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="introducer_name">Introducer Name</Label>
                      <Input
                        id="introducer_name"
                        value={formData.introducer_name}
                        onChange={(e) => setFormData({ ...formData, introducer_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="introducer_id">Introducer ID</Label>
                      <Input
                        id="introducer_id"
                        value={formData.introducer_id}
                        onChange={(e) => setFormData({ ...formData, introducer_id: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="introducer_phone">Introducer Phone</Label>
                      <Input
                        id="introducer_phone"
                        value={formData.introducer_phone}
                        onChange={(e) => setFormData({ ...formData, introducer_phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="introducer_residential_area">Introducer Residential Area</Label>
                      <Input
                        id="introducer_residential_area"
                        value={formData.introducer_residential_area}
                        onChange={(e) => setFormData({ ...formData, introducer_residential_area: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="introducer_previous_bike">Introducer Previous Bike</Label>
                      <Input
                        id="introducer_previous_bike"
                        value={formData.introducer_previous_bike}
                        onChange={(e) => setFormData({ ...formData, introducer_previous_bike: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="preferred_bike_make">Preferred Bike Make</Label>
                    <Select onValueChange={(value) => setFormData({ ...formData, preferred_bike_make: value })}>
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
                    <Label htmlFor="probable_financing_date">Probable Financing Date</Label>
                    <Input
                      id="probable_financing_date"
                      type="date"
                      value={formData.probable_financing_date}
                      onChange={(e) => setFormData({ ...formData, probable_financing_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    Register Rider
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registered Potential Riders</CardTitle>
            <CardDescription>
              {riders.length} riders registered and awaiting financing
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>ID Number</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Preferred Bike</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Financing Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {riders.map((rider) => (
                    <TableRow key={rider.id}>
                      <TableCell className="font-medium">{rider.full_name}</TableCell>
                      <TableCell>{rider.id_number}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {rider.primary_phone}
                        </div>
                      </TableCell>
                      <TableCell>{rider.preferred_bike_make || "Not specified"}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(rider.status)}>
                          {rider.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {rider.probable_financing_date ? 
                          new Date(rider.probable_financing_date).toLocaleDateString() : 
                          "Not set"
                        }
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
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