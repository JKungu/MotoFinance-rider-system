import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Users, UserCheck, Bike, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalPotentialRiders: 0,
    totalFinancedRiders: 0,
    totalBikes: 0,
    totalRevenue: 0,
    overduePayments: 0,
    activeRiders: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const [potentialRiders, financedRiders, bikes, payments] = await Promise.all([
        supabase.from("potential_riders").select("*", { count: "exact" }),
        supabase.from("financed_riders").select("*", { count: "exact" }),
        supabase.from("bikes").select("*", { count: "exact" }),
        supabase.from("payments").select("amount"),
      ]);

      const totalRevenue = payments.data?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
      const activeRiders = financedRiders.data?.filter(rider => rider.status === 'financed').length || 0;

      setStats({
        totalPotentialRiders: potentialRiders.count || 0,
        totalFinancedRiders: financedRiders.count || 0,
        totalBikes: bikes.count || 0,
        totalRevenue,
        overduePayments: 0, // TODO: Calculate based on overdue logic
        activeRiders,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch dashboard statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 p-6">
        <div className="flex items-center gap-4 mb-6">
          <SidebarTrigger />
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Motorcycle financing overview</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-6">
          <StatsCard
            title="Potential Riders"
            value={stats.totalPotentialRiders}
            icon={Users}
            description="Awaiting financing"
          />
          <StatsCard
            title="Financed Riders"
            value={stats.totalFinancedRiders}
            icon={UserCheck}
            description="All-time financed"
          />
          <StatsCard
            title="Active Riders"
            value={stats.activeRiders}
            icon={TrendingUp}
            description="Currently paying"
          />
          <StatsCard
            title="Total Bikes"
            value={stats.totalBikes}
            icon={Bike}
            description="In fleet"
          />
          <StatsCard
            title="Total Revenue"
            value={`KSh ${stats.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            description="All-time collection"
          />
          <StatsCard
            title="Overdue Payments"
            value={stats.overduePayments}
            icon={AlertTriangle}
            description="Requiring attention"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="col-span-full bg-card rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <button
                onClick={() => navigate("/potential-riders")}
                className="p-4 bg-primary text-primary-foreground rounded-lg text-left hover:bg-primary/90 transition-colors"
              >
                <Users className="h-6 w-6 mb-2" />
                <div className="font-medium">Add Potential Rider</div>
                <div className="text-sm opacity-90">Register new applicant</div>
              </button>
              <button
                onClick={() => navigate("/bikes")}
                className="p-4 bg-accent text-accent-foreground rounded-lg text-left hover:bg-accent/90 transition-colors"
              >
                <Bike className="h-6 w-6 mb-2" />
                <div className="font-medium">Manage Bikes</div>
                <div className="text-sm opacity-90">Add or update bikes</div>
              </button>
              <button
                onClick={() => navigate("/payments")}
                className="p-4 bg-secondary text-secondary-foreground rounded-lg text-left hover:bg-secondary/90 transition-colors"
              >
                <DollarSign className="h-6 w-6 mb-2" />
                <div className="font-medium">Record Payment</div>
                <div className="text-sm opacity-90">Log daily remittance</div>
              </button>
              <button
                onClick={() => navigate("/reports")}
                className="p-4 bg-muted text-muted-foreground rounded-lg text-left hover:bg-muted/90 transition-colors"
              >
                <TrendingUp className="h-6 w-6 mb-2" />
                <div className="font-medium">View Reports</div>
                <div className="text-sm opacity-90">Financial analytics</div>
              </button>
            </div>
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
};

export default Index;
