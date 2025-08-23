import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import AdminSidebar from "@/components/admin/admin-sidebar";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";

export default function AdminTransactions() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions"],
  });

  type Transaction = {
    id: string;
    investorName: string;
    type: string;
    amount: number;
    date: string;
    status: string;
    description: string;
    mode: string;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const sampleTransactions: Transaction[] = (transactions as Transaction[]) || [
    {
      id: "TXN-001",
      investorName: "Vinod Sharma",
      type: "investment",
      amount: 2000000,
      date: "2024-01-15",
      status: "completed",
      description: "Initial investment - 1 unit purchased",
      mode: "bank_transfer"
    },
    {
      id: "TXN-002",
      investorName: "Vinod Sharma", 
      type: "dividend_disbursement",
      amount: 120000,
      date: "2024-12-31",
      status: "completed",
      description: "Annual dividend payment for 2024 - 6% rate",
      mode: "bank_transfer"
    },
    {
      id: "TXN-003",
      investorName: "Suresh Kumar",
      type: "investment", 
      amount: 6000000,
      date: "2024-03-01",
      status: "completed",
      description: "Initial investment - 3 units purchased",
      mode: "bank_transfer"
    },
    {
      id: "TXN-004",
      investorName: "Suresh Kumar",
      type: "dividend_disbursement",
      amount: 360000,
      date: "2024-12-31", 
      status: "completed",
      description: "Annual dividend payment for 2024 - 6% rate",
      mode: "bank_transfer"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-50 text-green-700";
      case "pending": return "bg-yellow-50 text-yellow-700";
      case "failed": return "bg-red-50 text-red-700";
      default: return "bg-gray-50 text-gray-700";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "investment": return "bg-blue-50 text-blue-700";
      case "dividend_disbursement": return "bg-green-50 text-green-700";
      case "withdrawal": return "bg-orange-50 text-orange-700";
      default: return "bg-gray-50 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
              <p className="text-gray-600">Monitor all investment and dividend transactions</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={() => {
                toast({
                  title: "Filter Options",
                  description: "Transaction filtering options will be available soon",
                });
              }}>
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button 
                className="bg-blue-500 hover:bg-blue-600"
                onClick={() => {
                  // Export transactions as CSV
                  const csvData = sampleTransactions.map((t: Transaction) => 
                    `${t.id},${t.investorName},${t.type},${t.amount},${t.date},${t.status}`
                  ).join('\n');
                  const blob = new Blob([`ID,Investor,Type,Amount,Date,Status\n${csvData}`], 
                    { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'transactions.csv';
                  a.click();
                  toast({
                    title: "Export Complete",
                    description: "Transactions exported to CSV file",
                  });
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8">
          <div className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search transactions by ID, investor name, or description..."
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline">Search</Button>
                </div>
              </CardContent>
            </Card>

            {/* Transactions Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Transactions</p>
                    <p className="text-2xl font-bold">{sampleTransactions.length}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Value</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(sampleTransactions.reduce((sum: number, txn: Transaction) => sum + txn.amount, 0))}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Investments</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {sampleTransactions.filter((txn: Transaction) => txn.type === 'investment').length}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Dividends Paid</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(sampleTransactions.filter((txn: Transaction) => txn.type === 'dividend_disbursement').reduce((sum: number, txn: Transaction) => sum + txn.amount, 0))}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transactions Table */}
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium">Transaction ID</th>
                        <th className="text-left p-4 font-medium">Investor</th>
                        <th className="text-left p-4 font-medium">Type</th>
                        <th className="text-right p-4 font-medium">Amount</th>
                        <th className="text-left p-4 font-medium">Date</th>
                        <th className="text-left p-4 font-medium">Status</th>
                        <th className="text-left p-4 font-medium">Mode</th>
                        <th className="text-left p-4 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sampleTransactions.map((transaction: Transaction) => (
                        <tr key={transaction.id} className="border-b hover:bg-gray-50">
                          <td className="p-4 font-mono text-sm">{transaction.id}</td>
                          <td className="p-4 font-medium">{transaction.investorName}</td>
                          <td className="p-4">
                            <Badge variant="secondary" className={getTypeColor(transaction.type)}>
                              {transaction.type.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="p-4 text-right font-semibold">
                            <span className={transaction.type === 'investment' ? 'text-blue-600' : 'text-green-600'}>
                              {transaction.type === 'investment' ? '+' : '-'}{formatCurrency(transaction.amount)}
                            </span>
                          </td>
                          <td className="p-4">{transaction.date}</td>
                          <td className="p-4">
                            <Badge variant="secondary" className={getStatusColor(transaction.status)}>
                              {transaction.status}
                            </Badge>
                          </td>
                          <td className="p-4 capitalize">{transaction.mode.replace('_', ' ')}</td>
                          <td className="p-4 text-sm text-gray-600 max-w-xs truncate">
                            {transaction.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}