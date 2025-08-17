import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText } from "lucide-react";
import { InvestorWithInvestments } from "@shared/schema";
import { formatCurrency, formatDate } from "@/lib/utils";
import { exportToPDF, exportToExcel } from "@/lib/pdf-export";

interface TransactionHistoryProps {
  investorProfile: InvestorWithInvestments;
}

export default function TransactionHistory({ investorProfile }: TransactionHistoryProps) {
  // Flatten all transactions from all investments
  const allTransactions = investorProfile.investments.flatMap((inv) =>
    inv.transactions.map((transaction) => ({
      ...transaction,
      investmentId: inv.id,
      planName: inv.plan.name,
    }))
  );

  // Sort by date descending
  const sortedTransactions = allTransactions.sort(
    (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
  );

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "investment":
        return { label: "Investment", variant: "default" as const };
      case "dividend_disbursement":
        return { label: "Dividend", variant: "secondary" as const };
      case "bonus_disbursement":
        return { label: "Bonus", variant: "success" as const };
      case "maturity_disbursement":
        return { label: "Maturity", variant: "warning" as const };
      default:
        return { label: type, variant: "outline" as const };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return { label: "Completed", variant: "success" as const };
      case "pending":
        return { label: "Pending", variant: "warning" as const };
      case "failed":
        return { label: "Failed", variant: "destructive" as const };
      default:
        return { label: status, variant: "outline" as const };
    }
  };

  const handleExportPDF = () => {
    exportToPDF({
      title: "Transaction History",
      data: sortedTransactions,
      investorName: `${investorProfile.firstName} ${investorProfile.lastName}`,
      investorId: investorProfile.id,
    });
  };

  const handleExportExcel = () => {
    exportToExcel({
      title: "Transaction History",
      data: sortedTransactions,
      investorName: `${investorProfile.firstName} ${investorProfile.lastName}`,
      investorId: investorProfile.id,
    });
  };

  return (
    <Card className="mt-8 border shadow-sm" data-testid="card-transaction-history">
      <div className="p-6 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold">Transaction History</h3>
        <div className="flex gap-2">
          <Button
            onClick={handleExportPDF}
            size="sm"
            className="bg-primary hover:bg-primary-600"
            data-testid="button-export-pdf"
          >
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button
            onClick={handleExportExcel}
            size="sm"
            className="bg-success-500 hover:bg-success-600"
            data-testid="button-export-excel"
          >
            <FileText className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>
      
      {sortedTransactions.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="table-transactions">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedTransactions.map((transaction) => {
                const typeInfo = getTransactionTypeLabel(transaction.type);
                const statusInfo = getStatusLabel(transaction.status);
                
                return (
                  <tr key={transaction.id} data-testid={`transaction-row-${transaction.id}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(transaction.transactionDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {formatCurrency(parseFloat(transaction.amount))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {transaction.mode.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                      {transaction.transactionId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <CardContent className="p-6">
          <div className="text-center py-8 text-gray-500">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No transactions found</h3>
            <p>No transaction history is available for your investments.</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
