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
import { Plus, Search, TrendingUp, TrendingDown, DollarSign, Calculator } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatsCard } from "@/components/dashboard/StatsCard";

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  reference_no?: string;
  notes?: string;
  created_at: string;
  created_by: string;
}

interface ProfitAnalysis {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  revenueGrowth: number;
  expenseGrowth: number;
}

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [profitAnalysis, setProfitAnalysis] = useState<ProfitAnalysis>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    revenueGrowth: 0,
    expenseGrowth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("current-year");
  const [formData, setFormData] = useState({
    category: "",
    description: "",
    amount: "",
    expense_date: new Date().toISOString().split('T')[0],
    reference_no: "",
    notes: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchExpenses();
    calculateProfitAnalysis();
  }, [selectedPeriod]);

  const fetchExpenses = async () => {
    try {
      let query = supabase
        .from("business_expenses")
        .select("*")
        .order("expense_date", { ascending: false });

      // Apply date filtering based on selected period
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const startOfYear = `${currentYear}-01-01`;
      const endOfYear = `${currentYear}-12-31`;

      if (selectedPeriod === "current-year") {
        query = query.gte("expense_date", startOfYear).lte("expense_date", endOfYear);
      } else if (selectedPeriod === "current-month") {
        const startOfMonth = `${currentYear}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-01`;
        const endOfMonth = new Date(currentYear, currentDate.getMonth() + 1, 0).toISOString().split('T')[0];
        query = query.gte("expense_date", startOfMonth).lte("expense_date", endOfMonth);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Expenses fetch error:", error);
        throw error;
      }
      console.log("Expenses fetched successfully:", data);
      setExpenses(data || []);
    } catch (error: any) {
      console.error("Expenses catch block:", error);
      toast({
        title: "Error",
        description: `Failed to fetch expenses: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateProfitAnalysis = async () => {
    try {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const previousYear = currentYear - 1;

      // Get current year data
      const [currentRevenue, currentExpenses, previousRevenue, previousExpenses] = await Promise.all([
        supabase
          .from("payments")
          .select("amount")
          .eq("status", "completed")
          .gte("payment_date", `${currentYear}-01-01`)
          .lte("payment_date", `${currentYear}-12-31`),
        supabase
          .from("business_expenses")
          .select("amount")
          .gte("expense_date", `${currentYear}-01-01`)
          .lte("expense_date", `${currentYear}-12-31`),
        supabase
          .from("payments")
          .select("amount")
          .eq("status", "completed")
          .gte("payment_date", `${previousYear}-01-01`)
          .lte("payment_date", `${previousYear}-12-31`),
        supabase
          .from("business_expenses")
          .select("amount")
          .gte("expense_date", `${previousYear}-01-01`)
          .lte("expense_date", `${previousYear}-12-31`)
      ]);

      const totalRevenue = currentRevenue.data?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const totalExpenses = currentExpenses.data?.reduce((sum, e) => sum + e.amount, 0) || 0;
      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      const prevRevenue = previousRevenue.data?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const prevExpenses = previousExpenses.data?.reduce((sum, e) => sum + e.amount, 0) || 0;

      const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
      const expenseGrowth = prevExpenses > 0 ? ((totalExpenses - prevExpenses) / prevExpenses) * 100 : 0;

      setProfitAnalysis({
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        revenueGrowth,
        expenseGrowth,
      });

    } catch (error: any) {
      console.error("Error calculating profit analysis:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("business_expenses")
        .insert([{
          ...formData,
          amount: parseFloat(formData.amount),
          created_by: user.id,
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Expense recorded successfully",
      });
      
      setDialogOpen(false);
      resetForm();
      fetchExpenses();
      calculateProfitAnalysis();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to record expense",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      category: "",
      description: "",
      amount: "",
      expense_date: new Date().toISOString().split('T')[0],
      reference_no: "",
      notes: "",
    });
  };

  const filteredExpenses = expenses.filter(expense =>
    expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.reference_no?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'fuel': 'bg-red-500',
      'maintenance': 'bg-yellow-500',
      'insurance': 'bg-blue-500',
      'office': 'bg-green-500',
      'marketing': 'bg-purple-500',
      'utilities': 'bg-orange-500',
      'staff': 'bg-pink-500',
      'other': 'bg-gray-500',
    };
    return colors[category.toLowerCase()] || 'bg-gray-500';
  };

  // Calculate expense breakdown by category
  const expensesByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 p-6">
        <div className="flex items-center gap-4 mb-6">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Expenses & Profit Analysis</h1>
            <p className="text-muted-foreground">Track expenses and calculate organizational profits</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current-year">Current Year</SelectItem>
                <SelectItem value="current-month">Current Month</SelectItem>
                <SelectItem value="all-time">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Record Business Expense</DialogTitle>
                  <DialogDescription>
                    Add a new business expense to track costs
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select onValueChange={(value) => setFormData({ ...formData, category: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fuel">Fuel</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="insurance">Insurance</SelectItem>
                          <SelectItem value="office">Office Expenses</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="utilities">Utilities</SelectItem>
                          <SelectItem value="staff">Staff Costs</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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
                      <Label htmlFor="expense_date">Expense Date *</Label>
                      <Input
                        id="expense_date"
                        type="date"
                        value={formData.expense_date}
                        onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reference_no">Reference Number</Label>
                      <Input
                        id="reference_no"
                        value={formData.reference_no}
                        onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })}
                        placeholder="Receipt number, invoice ID, etc."
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of the expense"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional notes about the expense"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      Record Expense
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Profit Analysis Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(profitAnalysis.totalRevenue)}
            description={`Revenue growth: ${profitAnalysis.revenueGrowth.toFixed(1)}%`}
            icon={DollarSign}
          />
          <StatsCard
            title="Total Expenses"
            value={formatCurrency(profitAnalysis.totalExpenses)}
            description={`Expense growth: ${profitAnalysis.expenseGrowth.toFixed(1)}%`}
            icon={TrendingDown}
          />
          <StatsCard
            title="Net Profit"
            value={formatCurrency(profitAnalysis.netProfit)}
            description={`${profitAnalysis.netProfit >= 0 ? 'Profit' : 'Loss'} this period`}
            icon={profitAnalysis.netProfit >= 0 ? TrendingUp : TrendingDown}
          />
          <StatsCard
            title="Profit Margin"
            value={`${profitAnalysis.profitMargin.toFixed(1)}%`}
            description="Net profit as % of revenue"
            icon={Calculator}
          />
        </div>

        <div className="grid gap-6 mb-6">
          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Expense Breakdown by Category</CardTitle>
              <CardDescription>
                Distribution of expenses across different categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Object.entries(expensesByCategory).map(([category, amount]) => (
                  <div key={category} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className={`w-3 h-3 rounded-full ${getCategoryColor(category)}`} />
                    <div className="flex-1">
                      <div className="font-medium capitalize">{category}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(amount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {profitAnalysis.totalExpenses > 0 ? 
                          ((amount / profitAnalysis.totalExpenses) * 100).toFixed(1) : 0}% of total
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-4 flex gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Business Expenses</CardTitle>
            <CardDescription>
              {filteredExpenses.length} expense records for the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        {new Date(expense.expense_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(expense.category)}>
                          {expense.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={expense.description}>
                          {expense.description}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          {expense.reference_no || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate text-sm text-muted-foreground" title={expense.notes || ""}>
                          {expense.notes || "No notes"}
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