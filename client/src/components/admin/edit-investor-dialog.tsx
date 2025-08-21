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
  investor: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    city?: string;
    state?: string;
    primaryMobile?: string;
  };
}

export default function EditInvestorDialog({ investor }: EditInvestorProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: investor.firstName || '',
    lastName: investor.lastName || '',
    email: investor.email || '',
    primaryMobile: investor.phone || investor.primaryMobile || '',
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
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Investor Details</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange('firstName')}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange('lastName')}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="primaryMobile">Phone Number</Label>
                <Input
                  id="primaryMobile"
                  value={formData.primaryMobile}
                  onChange={handleInputChange('primaryMobile')}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={handleInputChange('city')}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={handleInputChange('state')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={updateInvestorMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateInvestorMutation.isPending}
            >
              {updateInvestorMutation.isPending ? "Updating..." : "Update Investor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}