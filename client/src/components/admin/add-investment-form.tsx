import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

const investmentSchema = z.object({
  investorId: z.string().min(1, "Please select an investor"),
  planId: z.string().min(1, "Please select an investment plan"),
  investmentDate: z.string().min(1, "Investment date is required"),
  investedAmount: z.string().min(1, "Investment amount is required"),
  bondsPurchased: z.coerce.number().min(1, "At least 1 bond must be purchased"),
});

type InvestmentFormData = z.infer<typeof investmentSchema>;

export default function AddInvestmentForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showFullForm, setShowFullForm] = useState(false);

  const form = useForm<InvestmentFormData>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      investorId: "",
      planId: "",
      investmentDate: new Date().toISOString().split('T')[0],
      investedAmount: "",
      bondsPurchased: 1,
    },
  });

  const { data: investors } = useQuery({
    queryKey: ["/api/admin/investors"],
  });

  const { data: investmentPlans } = useQuery({
    queryKey: ["/api/investment-plans"],
  });

  const createInvestmentMutation = useMutation({
    mutationFn: async (data: InvestmentFormData) => {
      // Calculate lock-in expiry and maturity date based on plan
      const selectedPlan = investmentPlans?.find((p: any) => p.id === data.planId);
      const investmentDate = new Date(data.investmentDate);
      
      const lockInExpiry = new Date(investmentDate);
      lockInExpiry.setFullYear(lockInExpiry.getFullYear() + (selectedPlan?.lockInPeriodYears || 5));
      
      const maturityDate = new Date(investmentDate);
      maturityDate.setFullYear(maturityDate.getFullYear() + (selectedPlan?.maturityEligibilityYears || 10));

      const investmentData = {
        ...data,
        investedAmount: data.investedAmount,
        lockInExpiry: lockInExpiry.toISOString().split('T')[0],
        maturityDate: maturityDate.toISOString().split('T')[0],
        bonusEarned: "0.00",
        isActive: true,
      };

      const response = await apiRequest("POST", "/api/investments", investmentData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Investment created successfully",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/investments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/portfolio-overview"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
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
      toast({
        title: "Error",
        description: "Failed to create investment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InvestmentFormData) => {
    createInvestmentMutation.mutate(data);
  };

  const handleQuickAdd = () => {
    if (form.formState.isValid) {
      onSubmit(form.getValues());
    } else {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
    }
  };

  return (
    <div data-testid="add-investment-form">
      <Card className="border shadow-sm">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Add New Investment</h3>
        </div>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="investorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Investor</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-investor">
                            <SelectValue placeholder="Select Investor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {investors?.map((investor: any) => (
                            <SelectItem key={investor.id} value={investor.id}>
                              {investor.firstName} {investor.lastName} ({investor.id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="planId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Investment Plan</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-plan">
                            <SelectValue placeholder="Select Plan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {investmentPlans?.map((plan: any) => (
                            <SelectItem key={plan.id} value={plan.id}>
                              {plan.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="investedAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Investment Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Enter amount"
                          {...field}
                          data-testid="input-investment-amount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="investmentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Investment Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          data-testid="input-investment-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bondsPurchased"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Bonds</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          data-testid="input-bonds-purchased"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={createInvestmentMutation.isPending}
                  className="bg-primary hover:bg-primary-600"
                  data-testid="button-create-investment"
                >
                  {createInvestmentMutation.isPending ? "Creating..." : "Create Investment"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFullForm(!showFullForm)}
                  data-testid="button-toggle-full-form"
                >
                  {showFullForm ? "Simple Form" : "Full Investment Form"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
