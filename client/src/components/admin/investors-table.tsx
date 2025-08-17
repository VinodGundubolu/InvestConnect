import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Investor } from "@shared/schema";

export default function InvestorsTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("all");

  const { data: investors, isLoading, error } = useQuery({
    queryKey: ["/api/admin/investors"],
  });

  const { data: investmentPlans } = useQuery({
    queryKey: ["/api/investment-plans"],
  });

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="bg-gray-200 h-64 rounded-xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error loading investors</p>
      </div>
    );
  }

  const filteredInvestors = (investors || []).filter((investor: Investor) => {
    const matchesSearch = 
      investor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investor.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investor.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    // For now, we'll assume all match the plan filter since we don't have investment data joined
    const matchesPlan = selectedPlan === "all";
    
    return matchesSearch && matchesPlan;
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getRandomColor = (index: number) => {
    const colors = [
      "bg-primary-100 text-primary-600",
      "bg-green-100 text-green-600",
      "bg-yellow-100 text-yellow-600",
      "bg-red-100 text-red-600",
      "bg-purple-100 text-purple-600",
      "bg-blue-100 text-blue-600",
    ];
    return colors[index % colors.length];
  };

  return (
    <div data-testid="investors-table">
      <Card className="border shadow-sm">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">All Investors</h3>
            <div className="flex gap-3">
              <Input
                type="text"
                placeholder="Search investors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
                data-testid="input-search-investors"
              />
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger className="w-48" data-testid="select-plan-filter">
                  <SelectValue placeholder="Filter by plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  {investmentPlans?.map((plan: any) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {filteredInvestors.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="table-investors">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Investor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Investor ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Identity Proof
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInvestors.map((investor: Investor, index: number) => (
                    <tr key={investor.id} className="hover:bg-gray-50" data-testid={`investor-row-${investor.id}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className={getRandomColor(index)}>
                              {getInitials(investor.firstName, investor.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {investor.firstName} {investor.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{investor.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                        {investor.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{investor.primaryMobile}</div>
                        {investor.secondaryMobile && (
                          <div className="text-gray-500">{investor.secondaryMobile}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="capitalize">{investor.identityProofType}</div>
                        <div className="text-gray-500 font-mono">{investor.identityProofNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(investor.createdAt!)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary-600 hover:text-primary-900"
                            data-testid={`button-view-${investor.id}`}
                          >
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-600 hover:text-gray-900"
                            data-testid={`button-edit-${investor.id}`}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-900"
                            data-testid={`button-delete-${investor.id}`}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t bg-gray-50">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">
                  Showing {filteredInvestors.length} of {investors?.length || 0} investors
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" className="bg-primary text-white">
                    1
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <CardContent className="p-6">
            <div className="text-center py-8 text-gray-500">
              <div className="text-lg font-medium mb-2">No investors found</div>
              <p>
                {searchTerm ? "No investors match your search criteria." : "No investors have been added yet."}
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
