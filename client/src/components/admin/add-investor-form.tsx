import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import InvestorCredentialsDisplay from "./investor-credentials-display";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

const investorSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  middleName: z.string().optional(),
  email: z.string().email("Invalid email address"),
  mobileNumber: z.string().min(10, "Mobile number must be at least 10 digits"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.string().min(2, "State must be at least 2 characters"),
  zipcode: z.string().min(5, "Zipcode must be at least 5 characters"),
  proofType: z.enum(["aadhar", "pan", "passport", "voter_id"], {
    required_error: "Please select a proof type",
  }),
  proofNumber: z.string().min(5, "Proof number is required"),
  startDate: z.string().min(1, "Start date is required"),
  investmentAmount: z.string().min(1, "Investment amount is required"),
  bondsCount: z.string().min(1, "Number of bonds is required"),
  investmentPlan: z.enum(["5", "10"], {
    required_error: "Please select an investment plan",
  }),
});

type InvestorFormData = z.infer<typeof investorSchema>;

interface AddInvestorFormProps {
  trigger?: React.ReactNode;
}

export default function AddInvestorForm({ trigger }: AddInvestorFormProps) {
  const [open, setOpen] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentialsData, setCredentialsData] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InvestorFormData>({
    resolver: zodResolver(investorSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      middleName: "",
      email: "",
      mobileNumber: "",
      address: "",
      city: "",
      state: "",
      zipcode: "",
      proofType: undefined,
      proofNumber: "",
      startDate: "",
      investmentAmount: "",
      bondsCount: "",
      investmentPlan: undefined,
    },
  });

  const createInvestorMutation = useMutation({
    mutationFn: async (data: InvestorFormData) => {
      const payload = {
        ...data,
        investmentAmount: parseInt(data.investmentAmount),
        bondsCount: parseInt(data.bondsCount),
        investmentPlan: data.investmentPlan,
      };
      return await apiRequest("/api/admin/investors", "POST", payload);
    },
    onSuccess: (response: any) => {
      console.log("Full API Response:", response);
      
      // Backend returns exactly what we need, just extract it properly
      const credentialsData = {
        firstName: response.investor?.firstName,
        lastName: response.investor?.lastName,
        email: response.investor?.email,
        investmentAmount: response.investmentAmount,
        bondsCount: response.bondsCount,
        username: response.username,
        password: response.password
      };
      
      console.log("Setting Credentials Data:", credentialsData);
      
      // Show success toast first
      toast({
        title: "✅ Investor Created Successfully!",
        description: `${credentialsData.firstName} ${credentialsData.lastName} has been added with login credentials.`,
        variant: "default",
      });
      
      // Set credentials and show modal
      setCredentialsData(credentialsData);
      setShowCredentials(true);
      
      // Refresh the investor list
      queryClient.invalidateQueries({ queryKey: ["/api/admin/investors"] });
      
      // Reset form and close creation dialog
      form.reset();
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Investor",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InvestorFormData) => {
    createInvestorMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-blue-500 hover:bg-blue-600">
            <Plus className="h-4 w-4 mr-2" />
            Add New Investor
          </Button>
        )}
      </DialogTrigger>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-2 border-gray-200 shadow-2xl"
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          zIndex: 50,
          position: "fixed"
        }}
      >
        <div className="bg-white p-1 rounded-lg">
          <DialogHeader className="bg-gray-50 p-4 rounded-t-lg border-b">
            <DialogTitle className="text-xl font-bold text-gray-800">Add New Investor</DialogTitle>
            <DialogDescription className="text-gray-600">
              Create a new investor profile with login credentials and investment details.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 bg-white">
            <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} data-testid="input-first-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="middleName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Middle Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Michael" {...field} data-testid="input-middle-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} data-testid="input-last-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="john.doe@example.com" 
                            {...field} 
                            data-testid="input-email" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mobileNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile Number *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="+91 98765 43210" 
                            {...field} 
                            data-testid="input-mobile" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Address Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="123 Main Street, Apartment 4B" 
                          {...field} 
                          data-testid="input-address" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City *</FormLabel>
                        <FormControl>
                          <Input placeholder="Mumbai" {...field} data-testid="input-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State *</FormLabel>
                        <FormControl>
                          <Input placeholder="Maharashtra" {...field} data-testid="input-state" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="zipcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zipcode *</FormLabel>
                        <FormControl>
                          <Input placeholder="400001" {...field} data-testid="input-zipcode" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Proof Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Identity Proof</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="proofType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proof Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-proof-type">
                              <SelectValue placeholder="Select proof type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="aadhar">Aadhar Card</SelectItem>
                            <SelectItem value="pan">PAN Card</SelectItem>
                            <SelectItem value="passport">Passport</SelectItem>
                            <SelectItem value="voter_id">Voter ID</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="proofNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proof Number *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="ABCD1234E" 
                            {...field} 
                            data-testid="input-proof-number" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Investment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Investment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Investment Start Date *</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            data-testid="input-start-date" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="investmentPlan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Investment Plan *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-investment-plan">
                              <SelectValue placeholder="Select investment plan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="5">5 Years</SelectItem>
                            <SelectItem value="10">10 Years</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="investmentAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Investment Amount (₹) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="2000000" 
                            {...field} 
                            data-testid="input-investment-amount" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bondsCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Debentures *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="1" 
                            min="1" 
                            max="3" 
                            {...field} 
                            data-testid="input-bonds-count" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                  <p><strong>Note:</strong> Each debenture unit is ₹20,00,000. Maximum 3 units per investor (₹60,00,000 total).</p>
                  <p><strong>Investment Plan:</strong> Choose 5 years for early exit or 10 years for full term with maximum returns.</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createInvestorMutation.isPending}
                className="bg-blue-500 hover:bg-blue-600"
                data-testid="button-create-investor"
              >
                {createInvestorMutation.isPending ? "Creating..." : "Create Investor"}
              </Button>
            </div>
          </form>
        </Form>
          </div>
        </div>
      </DialogContent>

      {/* Credentials Display Dialog */}
      <Dialog open={showCredentials} onOpenChange={setShowCredentials}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Investor Account Created</DialogTitle>
            <DialogDescription>
              The investor account has been successfully created with login credentials.
            </DialogDescription>
          </DialogHeader>
          {credentialsData && (
            <InvestorCredentialsDisplay investor={credentialsData} />
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}