import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";

const investorSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  primaryMobile: z.string().min(10, "Valid mobile number is required"),
  secondaryMobile: z.string().optional(),
  email: z.string().email("Valid email is required"),
  primaryAddress: z.string().min(1, "Primary address is required"),
  primaryAddressPin: z.string().min(6, "Valid PIN code is required"),
  secondaryAddress: z.string().optional(),
  secondaryAddressPin: z.string().optional(),
  identityProofType: z.string().min(1, "Identity proof type is required"),
  identityProofNumber: z.string().min(1, "Identity proof number is required"),
});

type InvestorFormData = z.infer<typeof investorSchema>;

export default function AddInvestorForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<InvestorFormData>({
    resolver: zodResolver(investorSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      primaryMobile: "",
      secondaryMobile: "",
      email: "",
      primaryAddress: "",
      primaryAddressPin: "",
      secondaryAddress: "",
      secondaryAddressPin: "",
      identityProofType: "",
      identityProofNumber: "",
    },
  });

  const createInvestorMutation = useMutation({
    mutationFn: async (data: InvestorFormData) => {
      // Generate investor ID
      const currentYear = new Date().getFullYear();
      const investorId = `${currentYear}-V1-B5-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      
      return await apiRequest('/api/admin/investors', 'POST', {
        id: investorId,
        ...data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Investor created successfully",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/investors'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
        description: "Failed to create investor",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InvestorFormData) => {
    createInvestorMutation.mutate(data);
  };

  return (
    <Card data-testid="card-add-investor-form">
      <CardHeader>
        <CardTitle>Add New Investor</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-first-name" />
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
                      <Input {...field} data-testid="input-middle-name" />
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
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-last-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" data-testid="input-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="primaryMobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Mobile</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-primary-mobile" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="secondaryMobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Secondary Mobile (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-secondary-mobile" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address Information */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3">
                <FormField
                  control={form.control}
                  name="primaryAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Address</FormLabel>
                      <FormControl>
                        <Textarea {...field} data-testid="input-primary-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="primaryAddressPin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PIN Code</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-primary-pin" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3">
                <FormField
                  control={form.control}
                  name="secondaryAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secondary Address (Optional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} data-testid="input-secondary-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="secondaryAddressPin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PIN Code</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-secondary-pin" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Identity Proof */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="identityProofType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Identity Proof Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-identity-type">
                          <SelectValue placeholder="Select ID type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="aadhaar">Aadhaar Card</SelectItem>
                        <SelectItem value="pan">PAN Card</SelectItem>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="voter_id">Voter ID</SelectItem>
                        <SelectItem value="driving_license">Driving License</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="identityProofNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Identity Proof Number</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-identity-number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button 
              type="submit" 
              disabled={createInvestorMutation.isPending}
              className="w-full"
              data-testid="button-create-investor"
            >
              {createInvestorMutation.isPending ? "Creating..." : "Create Investor"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}