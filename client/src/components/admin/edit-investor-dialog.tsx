import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface EditInvestorProps {
  investor: any; // Using any to handle the actual data structure from API
}

export default function EditInvestorDialog({ investor }: EditInvestorProps) {
  const [open, setOpen] = useState(false);
  // Parse the investor name into first and last name
  const nameParts = (investor.name || '').split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const [formData, setFormData] = useState({
    firstName: firstName,
    lastName: lastName,
    email: investor.email || '',
    primaryMobile: investor.primaryMobile || '',
    city: investor.city || '',
    state: investor.state || ''
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateInvestorMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest(`/api/admin/investors/${investor.id}`, "PUT", data);
    },
    onSuccess: () => {
      toast({
        title: "Investor Updated",
        description: `${formData.firstName} ${formData.lastName} has been updated successfully.`,
      });
      setOpen(false);
      // Invalidate relevant queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/investors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/investor-portfolio"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed", 
        description: error.message || "Failed to update investor",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateInvestorMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" data-testid={`button-edit-investor-${investor.id}`}>
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto bg-white">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-xl font-semibold">Edit Investor Details</DialogTitle>
          <p className="text-sm text-gray-600">Update investor information</p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <Card className="border-0 shadow-none">
            <CardHeader className="px-0 pb-4">
              <CardTitle className="text-lg">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="px-0 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange('firstName')}
                    placeholder="Enter first name"
                    className="h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange('lastName')}
                    placeholder="Enter last name"
                    className="h-11"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  placeholder="Enter email address"
                  className="h-11"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="primaryMobile" className="text-sm font-medium text-gray-700">
                  Phone Number
                </Label>
                <Input
                  id="primaryMobile"
                  value={formData.primaryMobile}
                  onChange={handleInputChange('primaryMobile')}
                  placeholder="Enter phone number"
                  className="h-11"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                    City
                  </Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={handleInputChange('city')}
                    placeholder="Enter city"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-sm font-medium text-gray-700">
                    State
                  </Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={handleInputChange('state')}
                    placeholder="Enter state"
                    className="h-11"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-3 pt-4 border-t bg-gray-50 -mx-6 px-6 pb-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={updateInvestorMutation.isPending}
              className="h-11 px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateInvestorMutation.isPending}
              className="h-11 px-6 bg-blue-600 hover:bg-blue-700"
            >
              {updateInvestorMutation.isPending ? "Updating..." : "Update Investor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}