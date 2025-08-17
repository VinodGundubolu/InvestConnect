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
                  max={maxAmount}
                />
                <div className="mt-2 text-sm text-gray-500">
                  <p>Maximum: {formatCurrency(maxAmount)} (3 units)</p>
                  <p>Must be in multiples of ₹20 lakhs</p>
                  <p className="text-red-600 font-medium">Lock-in Period: 3 Years Minimum</p>
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

          {/* Bond Returns Schedule Table */}
          <div>
            <h4 className="font-medium mb-4">
              Bond Returns Schedule 
              {calculation && (
                <span className="text-sm font-normal text-gray-600">
                  (Per ₹20 Lakh Bond)
                </span>
              )}
            </h4>
            {calculation ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden" data-testid="returns-breakdown">
                <div className="bg-gray-50 border-b border-gray-200 p-3 flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Lock-in Period:</span>
                  <Badge variant="destructive" className="text-xs">
                    3 Years Minimum
                  </Badge>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left p-3 font-medium text-gray-700">Year</th>
                        <th className="text-left p-3 font-medium text-gray-700">Dividend Yield</th>
                        <th className="text-right p-3 font-medium text-gray-700">Dividend Amount</th>
                        <th className="text-left p-3 font-medium text-gray-700">Bonus Yield</th>
                        <th className="text-right p-3 font-medium text-gray-700">Bonus Amount</th>
                        <th className="text-right p-3 font-medium text-gray-700">Present Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculation.yearlyBreakdown.map((year, index) => {
                        // Calculate present value per 20L bond (from reference image)
                        const perBondPrincipal = 2000000; // ₹20 lakhs
                        const perBondDividend = year.dividend * (perBondPrincipal / calculation.summary.principal);
                        const perBondBonus = year.bonus * (perBondPrincipal / calculation.summary.principal);
                        
                        // Present values from reference image
                        const presentValues = {
                          1: 2000000,   // ₹20,00,000
                          2: 2120000,   // ₹21,20,000  
                          3: 2300000,   // ₹23,00,000
                          4: 2540000,   // ₹25,40,000
                          5: 4900000,   // ₹49,00,000
                          6: 360000,    // 360000/year (displayed differently)
                          7: 360000,    // 360000/year
                          8: 360000,    // 360000/year
                          9: 360000,    // 360000/year (18% of 20L)
                          10: 8340000   // ₹83,40,000
                        };
                        
                        return (
                          <tr
                            key={year.year}
                            className={`border-b border-gray-100 ${
                              year.bonus > 0 ? "bg-orange-50" : ""
                            }`}
                            data-testid={`year-${year.year}-breakdown`}
                          >
                            <td className="p-3 font-medium">{year.year}</td>
                            <td className="p-3">
                              <span className={year.rate > 0 ? "text-green-600 font-medium" : ""}>
                                {year.rate}%
                              </span>
                            </td>
                            <td className="p-3 text-right font-medium">
                              {perBondDividend > 0 ? formatCurrency(perBondDividend) : "₹0"}
                            </td>
                            <td className="p-3">
                              <span className={year.bonus > 0 ? "text-orange-600 font-medium" : ""}>
                                {year.bonus > 0 ? "100%" : "0%"}
                              </span>
                            </td>
                            <td className="p-3 text-right font-medium">
                              {perBondBonus > 0 ? (
                                <span className="text-orange-600">
                                  {formatCurrency(perBondBonus)}
                                </span>
                              ) : (
                                "₹0"
                              )}
                            </td>
                            <td className="p-3 text-right font-semibold">
                              {(year.year >= 6 && year.year <= 9) ? (
                                <span className="text-blue-600">36000/year</span>
                              ) : (
                                <span className="text-blue-600">
                                  {formatCurrency(presentValues[year.year as keyof typeof presentValues])}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* Summary Section */}
                <div className="bg-gray-50 border-t border-gray-200 p-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-medium text-blue-600 text-lg">316%</div>
                      <div className="text-gray-600">Total Investment Recovery</div>
                      <div className="text-xs text-gray-500">Over 10 years</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-green-600 text-lg">11.6%</div>
                      <div className="text-gray-600">Annual Average Return</div>
                      <div className="text-xs text-gray-500">Compounded</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-orange-600 text-lg">
                        ₹83,40,000
                      </div>
                      <div className="text-gray-600">Final Value (10Y)</div>
                      <div className="text-xs text-gray-500">Per bond</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-sm border border-gray-200 rounded-lg p-8 text-center">
                Enter an amount and date to see bond returns schedule
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
