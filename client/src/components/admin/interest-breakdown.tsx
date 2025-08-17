import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface InterestBreakdownItem {
  name: string;
  bonds: number;
  rate: number;
  year: number;
  dailyInterest: number;
}

export default function TodayInterestBreakdown() {
  const { data: interestData, isLoading } = useQuery({
    queryKey: ["/api/admin/interest-breakdown"],
  });

  if (isLoading) {
    return (
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="animate-pulse h-6 bg-gray-200 rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded h-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sample data if no API data available
  const breakdownData: InterestBreakdownItem[] = interestData ? interestData : [
    {
      name: "Vinod Sharma",
      bonds: 1,
      rate: 6,
      year: 2,
      dailyInterest: 329
    },
    {
      name: "Suresh Kumar", 
      bonds: 3,
      rate: 6,
      year: 2,
      dailyInterest: 986
    }
  ];

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Today's Interest Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {breakdownData.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                  <span className="text-lg font-semibold text-green-600">₹{item.dailyInterest}</span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>{item.bonds} Bonds @ {item.rate}% (Year {item.year})</span>
                  <span className="text-blue-600">Daily</span>
                </div>
              </div>
            </div>
          ))}
          
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Total Daily Interest</span>
              <span className="text-xl font-bold text-green-600">
                ₹{breakdownData.reduce((sum, item) => sum + item.dailyInterest, 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}