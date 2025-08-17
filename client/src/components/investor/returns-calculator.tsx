import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";

interface ReturnsCalculation {
  yearlyBreakdown: Array<{
    year: number;
    rate: number;
    dividend: number;
    bonus: number;
    total: number;
  }>;
  summary: {
    principal: number;
    totalDividends: number;
    totalBonuses: number;
    maturityValue: number;
  };
}

export default function ReturnsCalculator() {
  const [amount, setAmount] = useState("500000");
  const [investmentDate, setInvestmentDate] = useState("2024-03-15");

  const calculateMutation = useMutation({
    mutationFn: async (data: { amount: string; startDate: string }) => {
      const response = await apiRequest("POST", "/api/calculate-returns", data);
      return response.json() as Promise<ReturnsCalculation>;
    },
  });

  const handleCalculate = () => {
    calculateMutation.mutate({
      amount,
      startDate: investmentDate,
    });
  };

  return (
    <Card className="mt-8 border shadow-sm" data-testid="card-returns-calculator">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold">Returns Calculator & Projection</h3>
      </div>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calculator Input */}
          <div>
            <h4 className="font-medium mb-4">Calculate Returns</h4>
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
                  Investment Amount
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="mt-2"
                  data-testid="input-investment-amount"
                />
              </div>
              <div>
                <Label htmlFor="date" className="text-sm font-medium text-gray-700">
                  Investment Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={investmentDate}
                  onChange={(e) => setInvestmentDate(e.target.value)}
                  className="mt-2"
                  data-testid="input-investment-date"
                />
              </div>
              <Button
                onClick={handleCalculate}
                disabled={calculateMutation.isPending}
                className="w-full bg-primary hover:bg-primary-600 transition-colors"
                data-testid="button-calculate-returns"
              >
                {calculateMutation.isPending ? "Calculating..." : "Calculate Returns"}
              </Button>
            </div>
          </div>

          {/* Returns Breakdown */}
          <div>
            <h4 className="font-medium mb-4">Projected Returns (10 Years)</h4>
            {calculateMutation.data ? (
              <div className="space-y-2 text-sm" data-testid="returns-breakdown">
                {calculateMutation.data.yearlyBreakdown.map((year) => (
                  <div
                    key={year.year}
                    className={`flex justify-between ${
                      year.bonus > 0 ? "text-success-600 font-medium" : ""
                    }`}
                    data-testid={`year-${year.year}-breakdown`}
                  >
                    <span>
                      Year {year.year} ({year.rate}%)
                      {year.bonus > 0 && " + 100% Bonus"}
                    </span>
                    <span data-testid={`year-${year.year}-total`}>
                      {formatCurrency(year.total)}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total Maturity Value</span>
                  <span data-testid="total-maturity-value">
                    {formatCurrency(calculateMutation.data.summary.maturityValue)}
                  </span>
                </div>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Original Principal:</span>
                    <span data-testid="summary-principal">
                      {formatCurrency(calculateMutation.data.summary.principal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Dividends:</span>
                    <span data-testid="summary-dividends">
                      {formatCurrency(calculateMutation.data.summary.totalDividends)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Bonuses:</span>
                    <span data-testid="summary-bonuses">
                      {formatCurrency(calculateMutation.data.summary.totalBonuses)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-sm">
                Enter an amount and date to calculate projected returns
              </div>
            )}
            {calculateMutation.isError && (
              <div className="text-red-500 text-sm mt-2">
                Error calculating returns. Please try again.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
