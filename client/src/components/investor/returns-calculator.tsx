import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { 
  calculateReturns, 
  validateInvestmentAmount, 
  getMaxInvestmentAmount,
  type ReturnsCalculation 
} from "@/lib/returns-calculator";

export default function ReturnsCalculator() {
  const [amount, setAmount] = useState("2000000"); // Default to 1 unit (₹20 lakhs)
  const [investmentDate, setInvestmentDate] = useState("2024-03-15");
  const [calculation, setCalculation] = useState<ReturnsCalculation | null>(null);
  const [error, setError] = useState<string>("");

  const handleCalculate = () => {
    const numAmount = parseFloat(amount);
    const validation = validateInvestmentAmount(numAmount);
    
    if (!validation.isValid) {
      setError(validation.error || "Invalid amount");
      setCalculation(null);
      return;
    }
    
    setError("");
    const startDate = new Date(investmentDate);
    const result = calculateReturns(numAmount, startDate);
    setCalculation(result);
  };

  const maxAmount = getMaxInvestmentAmount();

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
                  placeholder="Enter amount (₹20L, ₹40L, or ₹60L)"
                  className="mt-2"
                  data-testid="input-investment-amount"
                />
                <div className="mt-2 text-sm text-gray-500">
                  <p>Maximum: {formatCurrency(maxAmount)}</p>
                  <p>Units: ₹20 lakhs each (Max 3 units)</p>
                </div>
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
                className="w-full bg-primary hover:bg-primary-600 transition-colors"
                data-testid="button-calculate-returns"
              >
                Calculate Returns
              </Button>
              
              {error && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Returns Breakdown */}
          <div>
            <h4 className="font-medium mb-4">Projected Returns (10 Years)</h4>
            {calculation ? (
              <div className="space-y-2 text-sm" data-testid="returns-breakdown">
                {calculation.yearlyBreakdown.map((year) => (
                  <div
                    key={year.year}
                    className={`flex justify-between ${
                      year.bonus > 0 ? "text-green-600 font-medium" : ""
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
                    {formatCurrency(calculation.summary.maturityValue)}
                  </span>
                </div>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Original Principal:</span>
                    <span data-testid="summary-principal">
                      {formatCurrency(calculation.summary.principal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Dividends:</span>
                    <span data-testid="summary-dividends">
                      {formatCurrency(calculation.summary.totalDividends)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Bonuses:</span>
                    <span data-testid="summary-bonuses">
                      {formatCurrency(calculation.summary.totalBonuses)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-sm">
                Enter an amount and date to calculate projected returns
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
