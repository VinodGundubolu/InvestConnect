import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface InvestorPortfolioItem {
  id: string;
  name: string;
  aadhar: string;
  totalInvestment: number;
  bonds: number;
  dailyInterest: number;
  totalReturns: number;
  maturityStatus: string;
  year: number;
  bondMaturityProgress: string;
  investmentPlan?: string;
}

function InvestorPortfolioCard({ investor }: { investor: InvestorPortfolioItem }) {
  const initials = investor.name.split(' ').map(n => n[0]).join('');
  
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
              {initials}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{investor.name}</h3>
              <p className="text-sm text-gray-500">Aadhar: {investor.aadhar}</p>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-1">
            <Badge variant="secondary" className="bg-yellow-50 text-yellow-600">
              Year {investor.year}
            </Badge>
            <div className="text-xs font-medium text-blue-600">
              {investor.year === 1 ? '0%' : 
               investor.year === 2 ? '6%' : 
               investor.year === 3 ? '9%' : 
               investor.year === 4 ? '12%' : '18%'} Annual Return
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Daily Interest</p>
            <p className="text-lg font-semibold text-green-600">₹{isNaN(investor.dailyInterest) ? 0 : investor.dailyInterest.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Returns</p>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(isNaN(investor.totalReturns) ? 0 : investor.totalReturns)}</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Investment:</span>
            <span className="font-medium">{formatCurrency(investor.totalInvestment)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Debentures:</span>
            <span className="font-medium">{investor.bonds} Debentures</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Investment Type:</span>
            <span className="font-medium">{investor.investmentPlan || '10'} Years</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Maturity Status:</span>
            <span className="font-medium">{investor.maturityStatus}</span>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-600">Debenture Maturity Progress</span>
            <span className="text-sm font-medium">{investor.bondMaturityProgress}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full" 
              style={{ width: investor.bondMaturityProgress }}
            ></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function InvestorPortfolioOverview() {
  const { data: portfolioData, isLoading } = useQuery({
    queryKey: ["/api/admin/investor-portfolio"],
  });

  if (isLoading) {
    return (
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="animate-pulse h-6 bg-gray-200 rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-48"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Ensure we have valid data and fix NaN issues
  const portfolioList = Array.isArray(portfolioData) ? portfolioData : [];
  const investors: InvestorPortfolioItem[] = portfolioList.length > 0 ? portfolioList.map(investor => ({
    id: investor.id || `INV-${Math.random().toString(36).substr(2, 9)}`,
    name: investor.name || 'Unknown Investor',
    aadhar: investor.aadharNumber || investor.aadhar || investor.aadhaar || 'N/A',
    totalInvestment: Number(investor.investment) || Number(investor.totalInvestment) || Number(investor.total_investment) || 0,
    bonds: Number(investor.bonds) || Number(investor.bondsCount) || Number(investor.bonds_count) || 0,
    dailyInterest: Number(investor.todayInterest) || Number(investor.dailyInterest) || Number(investor.daily_interest) || 0,
    totalReturns: Number(investor.totalReturns) || Number(investor.total_returns) || 0,
    maturityStatus: investor.status || investor.maturityStatus || investor.maturity_status || 'Active',
    year: Number(investor.currentYear) || Number(investor.year) || Number(investor.current_year) || 1,
    bondMaturityProgress: `${investor.maturityProgress || 0}%`,
    investmentPlan: investor.investmentPlan || investor.investment_plan || '10'
  })) : [
    {
      id: "1",
      name: "Vinod Sharma", 
      aadhar: "****-****-9013",
      totalInvestment: 2000000,
      bonds: 1,
      dailyInterest: 329,
      totalReturns: 400000,
      maturityStatus: "Year 2",
      year: 2,
      bondMaturityProgress: "20%",
      investmentPlan: "10"
    },
    {
      id: "2", 
      name: "Suresh Kumar",
      aadhar: "****-****-8756",
      totalInvestment: 6000000,
      bonds: 3,
      dailyInterest: 986,
      totalReturns: 1200000,
      maturityStatus: "Year 2", 
      year: 2,
      bondMaturityProgress: "20%",
      investmentPlan: "10"
    }
  ];

  return (
    <Card className="border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Investor Portfolio Overview</CardTitle>
        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
          View All <ExternalLink className="ml-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {investors.map((investor) => (
            <InvestorPortfolioCard key={investor.id} investor={investor} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}