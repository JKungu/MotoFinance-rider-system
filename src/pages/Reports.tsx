import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TrendingUp, TrendingDown, DollarSign, Users, Bike, Calendar } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalRiders: number;
  activeBikes: number;
  averageDailyCollection: number;
  monthlyGrowth: number;
}

interface MonthlyBreakdown {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  ridersFinanced: number;
}

export default function Reports() {
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalRiders: 0,
    activeBikes: 0,
    averageDailyCollection: 0,
    monthlyGrowth: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { toast } = useToast();

  useEffect(() => {
    fetchFinancialData();
  }, [selectedYear]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      
      // Fetch total revenue from payments
      const { data: payments, error: paymentsError } = await supabase
        .from("payments")
        .select("amount, payment_date")
        .eq("status", "completed")
        .gte("payment_date", `${selectedYear}-01-01`)
        .lte("payment_date", `${selectedYear}-12-31`);

      if (paymentsError) throw paymentsError;

      // Fetch total expenses
      const { data: expenses, error: expensesError } = await supabase
        .from("business_expenses")
        .select("amount, expense_date")
        .gte("expense_date", `${selectedYear}-01-01`)
        .lte("expense_date", `${selectedYear}-12-31`);

      if (expensesError) throw expensesError;

      // Fetch rider statistics
      const { data: riders, error: ridersError } = await supabase
        .from("financed_riders")
        .select("id, created_at, start_date")
        .gte("created_at", `${selectedYear}-01-01`)
        .lte("created_at", `${selectedYear}-12-31`);

      if (ridersError) throw ridersError;

      // Fetch active bikes
      const { data: bikes, error: bikesError } = await supabase
        .from("bikes")
        .select("id, status")
        .in("status", ["financed", "active"]);

      if (bikesError) throw bikesError;

      // Calculate totals
      const totalRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const totalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
      const netProfit = totalRevenue - totalExpenses;
      const totalRiders = riders?.length || 0;
      const activeBikes = bikes?.length || 0;

      // Calculate average daily collection
      const daysInYear = isLeapYear(selectedYear) ? 366 : 365;
      const averageDailyCollection = totalRevenue / daysInYear;

      // Calculate monthly breakdown
      const monthlyBreakdown: MonthlyBreakdown[] = [];
      for (let month = 1; month <= 12; month++) {
        const monthStr = month.toString().padStart(2, '0');
        const startDate = `${selectedYear}-${monthStr}-01`;
        const endDate = `${selectedYear}-${monthStr}-31`;

        const monthRevenue = payments?.filter(p => 
          p.payment_date >= startDate && p.payment_date <= endDate
        ).reduce((sum, p) => sum + p.amount, 0) || 0;

        const monthExpenses = expenses?.filter(e => 
          e.expense_date >= startDate && e.expense_date <= endDate
        ).reduce((sum, e) => sum + e.amount, 0) || 0;

        const monthRiders = riders?.filter(r => 
          r.created_at >= startDate && r.created_at <= endDate
        ).length || 0;

        monthlyBreakdown.push({
          month: new Date(selectedYear, month - 1).toLocaleString('default', { month: 'long' }),
          revenue: monthRevenue,
          expenses: monthExpenses,
          profit: monthRevenue - monthExpenses,
          ridersFinanced: monthRiders,
        });
      }

      // Calculate monthly growth (comparing current year to previous year)
      const { data: prevYearPayments } = await supabase
        .from("payments")
        .select("amount")
        .eq("status", "completed")
        .gte("payment_date", `${selectedYear - 1}-01-01`)
        .lte("payment_date", `${selectedYear - 1}-12-31`);

      const prevYearRevenue = prevYearPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const monthlyGrowth = prevYearRevenue > 0 ? ((totalRevenue - prevYearRevenue) / prevYearRevenue) * 100 : 0;

      setFinancialSummary({
        totalRevenue,
        totalExpenses,
        netProfit,
        totalRiders,
        activeBikes,
        averageDailyCollection,
        monthlyGrowth,
      });

      setMonthlyData(monthlyBreakdown);

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch financial data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isLeapYear = (year: number) => {
    return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? TrendingUp : TrendingDown;
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? "text-green-600" : "text-red-600";
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 p-6">
        <div className="flex items-center gap-4 mb-6">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Financial Reports</h1>
            <p className="text-muted-foreground">Organization's financial statements and performance metrics</p>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="year-select">Year:</Label>
            <Input
              id="year-select"
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-20"
              min="2020"
              max={new Date().getFullYear() + 1}
            />
            <Button onClick={fetchFinancialData} disabled={loading}>
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading financial data...</div>
        ) : (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Total Revenue"
                value={formatCurrency(financialSummary.totalRevenue)}
                description="Income from rider payments"
                icon={DollarSign}
              />
              <StatsCard
                title="Total Expenses"
                value={formatCurrency(financialSummary.totalExpenses)}
                description="Operating and business expenses"
                icon={TrendingDown}
              />
              <StatsCard
                title="Net Profit"
                value={formatCurrency(financialSummary.netProfit)}
                description={`${financialSummary.netProfit >= 0 ? 'Profit' : 'Loss'} for ${selectedYear}`}
                icon={financialSummary.netProfit >= 0 ? TrendingUp : TrendingDown}
              />
              <StatsCard
                title="Growth Rate"
                value={`${financialSummary.monthlyGrowth.toFixed(1)}%`}
                description="Year-over-year growth"
                icon={getGrowthIcon(financialSummary.monthlyGrowth)}
              />
            </div>

            {/* Operational Metrics */}
            <div className="grid gap-4 md:grid-cols-3">
              <StatsCard
                title="Financed Riders"
                value={financialSummary.totalRiders.toString()}
                description={`New riders in ${selectedYear}`}
                icon={Users}
              />
              <StatsCard
                title="Active Bikes"
                value={financialSummary.activeBikes.toString()}
                description="Currently in operation"
                icon={Bike}
              />
              <StatsCard
                title="Avg Daily Collection"
                value={formatCurrency(financialSummary.averageDailyCollection)}
                description="Average daily revenue"
                icon={Calendar}
              />
            </div>

            {/* Monthly Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Financial Breakdown - {selectedYear}</CardTitle>
                <CardDescription>
                  Month-by-month revenue, expenses, and profit analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Month</th>
                        <th className="text-right p-2">Revenue</th>
                        <th className="text-right p-2">Expenses</th>
                        <th className="text-right p-2">Profit/Loss</th>
                        <th className="text-right p-2">New Riders</th>
                        <th className="text-right p-2">Margin %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData.map((month, index) => {
                        const margin = month.revenue > 0 ? (month.profit / month.revenue) * 100 : 0;
                        return (
                          <tr key={index} className="border-b hover:bg-muted/50">
                            <td className="p-2 font-medium">{month.month}</td>
                            <td className="p-2 text-right">{formatCurrency(month.revenue)}</td>
                            <td className="p-2 text-right">{formatCurrency(month.expenses)}</td>
                            <td className={`p-2 text-right ${month.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(month.profit)}
                            </td>
                            <td className="p-2 text-right">{month.ridersFinanced}</td>
                            <td className={`p-2 text-right ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {margin.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 font-bold">
                        <td className="p-2">Total</td>
                        <td className="p-2 text-right">{formatCurrency(financialSummary.totalRevenue)}</td>
                        <td className="p-2 text-right">{formatCurrency(financialSummary.totalExpenses)}</td>
                        <td className={`p-2 text-right ${financialSummary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(financialSummary.netProfit)}
                        </td>
                        <td className="p-2 text-right">{financialSummary.totalRiders}</td>
                        <td className={`p-2 text-right ${financialSummary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {financialSummary.totalRevenue > 0 ? ((financialSummary.netProfit / financialSummary.totalRevenue) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Key Performance Indicators */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Profitability Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Gross Profit Margin:</span>
                      <span className={getGrowthColor(financialSummary.netProfit)}>
                        {financialSummary.totalRevenue > 0 ? 
                          ((financialSummary.netProfit / financialSummary.totalRevenue) * 100).toFixed(2) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Revenue per Rider:</span>
                      <span>
                        {financialSummary.totalRiders > 0 ? 
                          formatCurrency(financialSummary.totalRevenue / financialSummary.totalRiders) : 
                          formatCurrency(0)
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cost per Rider:</span>
                      <span>
                        {financialSummary.totalRiders > 0 ? 
                          formatCurrency(financialSummary.totalExpenses / financialSummary.totalRiders) : 
                          formatCurrency(0)
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Revenue per Active Bike:</span>
                      <span>
                        {financialSummary.activeBikes > 0 ? 
                          formatCurrency(financialSummary.totalRevenue / financialSummary.activeBikes) : 
                          formatCurrency(0)
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Growth Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>YoY Revenue Growth:</span>
                      <span className={getGrowthColor(financialSummary.monthlyGrowth)}>
                        {financialSummary.monthlyGrowth.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Best Performing Month:</span>
                      <span>
                        {monthlyData.length > 0 ? 
                          monthlyData.reduce((prev, current) => 
                            (prev.profit > current.profit) ? prev : current
                          ).month : 'N/A'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Peak Revenue Month:</span>
                      <span>
                        {monthlyData.length > 0 ? 
                          monthlyData.reduce((prev, current) => 
                            (prev.revenue > current.revenue) ? prev : current
                          ).month : 'N/A'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Most Riders Financed:</span>
                      <span>
                        {monthlyData.length > 0 ? 
                          `${Math.max(...monthlyData.map(m => m.ridersFinanced))} riders` : 
                          'N/A'
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </SidebarProvider>
  );
}