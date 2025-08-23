import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [maturityPeriod, setMaturityPeriod] = useState<number>(10); // Default to 10 years
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
    const result = calculateReturns(numAmount, startDate, new Date(), maturityPeriod);
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
                
                {/* Quick selection buttons */}
                <div className="mt-3 flex gap-2">
                  <Button
                    variant={amount === "2000000" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAmount("2000000")}
                    className="text-xs"
                    data-testid="button-select-20l"
                  >
                    ₹20L (1 Unit)
                  </Button>
                  <Button
                    variant={amount === "4000000" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAmount("4000000")}
                    className="text-xs"
                    data-testid="button-select-40l"
                  >
                    ₹40L (2 Units)
                  </Button>
                  <Button
                    variant={amount === "6000000" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAmount("6000000")}
                    className="text-xs"
                    data-testid="button-select-60l"
                  >
                    ₹60L (3 Units)
                  </Button>
                </div>
                
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

              <div>
                <Label htmlFor="maturity" className="text-sm font-medium text-gray-700">
                  Maturity Period
                </Label>
                <Select value={maturityPeriod.toString()} onValueChange={(value) => setMaturityPeriod(parseInt(value))}>
                  <SelectTrigger className="mt-2" data-testid="select-maturity-period">
                    <SelectValue placeholder="Select maturity period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 Years (Early Exit)</SelectItem>
                    <SelectItem value="10">10 Years (Full Term)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {maturityPeriod === 5 ? "Exit after 5 years with milestone bonus" : "Complete 10-year investment cycle"}
                </p>
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
              Bond Returns Schedule - {maturityPeriod} Year Plan
              {calculation && (
                <span className="text-sm font-normal text-gray-600">
                  <br />({calculation.summary.principal === 2000000 ? 'Per ₹20 Lakh Bond' : 
                    calculation.summary.principal === 4000000 ? 'Total for ₹40 Lakhs (2 Bonds)' :
                    calculation.summary.principal === 6000000 ? 'Total for ₹60 Lakhs (3 Bonds)' :
                    `Total for ${formatCurrency(calculation.summary.principal)}`})
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
                        // Calculate the number of bonds based on total investment
                        const numberOfBonds = calculation.summary.principal / 2000000;
                        
                        // Present values per bond based on maturity period
                        const perBondPresentValues = maturityPeriod === 5 ? {
                          1: 2000000,   // ₹20,00,000
                          2: 2120000,   // ₹21,20,000  
                          3: 2300000,   // ₹23,00,000
                          4: 2540000,   // ₹25,40,000
                          5: 4540000,   // ₹45,40,000 (5-year exit with milestone bonus)
                        } : {
                          1: 2000000,   // ₹20,00,000
                          2: 2120000,   // ₹21,20,000  
                          3: 2300000,   // ₹23,00,000
                          4: 2540000,   // ₹25,40,000
                          5: 4900000,   // ₹49,00,000 (includes ₹20L bonus)
                          6: 360000,    // ₹3,60,000/year (displayed differently)
                          7: 360000,    // ₹3,60,000/year
                          8: 360000,    // ₹3,60,000/year
                          9: 360000,    // ₹3,60,000/year (18% of 20L)
                          10: 8340000   // ₹83,40,000 (CORRECT: Capital + Interest + Bonus)
                        };
                        
                        // Calculate total present value for all bonds
                        const totalPresentValue = perBondPresentValues[year.year as keyof typeof perBondPresentValues] * numberOfBonds;
                        
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
                              {year.dividend > 0 ? formatCurrency(year.dividend) : "₹0"}
                            </td>
                            <td className="p-3">
                              <span className={year.bonus > 0 ? "text-orange-600 font-medium" : ""}>
                                {year.bonus > 0 ? "100%" : "0%"}
                              </span>
                            </td>
                            <td className="p-3 text-right font-medium">
                              {year.bonus > 0 ? (
                                <span className="text-orange-600">
                                  {formatCurrency(year.bonus)}
                                </span>
                              ) : (
                                "₹0"
                              )}
                            </td>
                            <td className="p-3 text-right font-semibold">
                              {(year.year >= 6 && year.year <= 9) ? (
                                <span className="text-blue-600">
                                  {formatCurrency(360000 * numberOfBonds)}/year
                                </span>
                              ) : (
                                <span className="text-blue-600">
                                  {formatCurrency(totalPresentValue)}
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
                        {formatCurrency(calculation.summary.maturityValue)}
                      </div>
                      <div className="text-gray-600">Final Value (10Y)</div>
                      <div className="text-xs text-gray-500">Total amount</div>
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
