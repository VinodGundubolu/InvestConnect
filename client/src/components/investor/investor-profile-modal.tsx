import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { User, Mail, Phone, MapPin, FileText, Calendar, DollarSign } from "lucide-react";
import type { Investor } from "@shared/schema";

interface InvestorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  investorId?: string;
  investor?: Investor;
  editMode?: boolean;
}

export default function InvestorProfileModal({ isOpen, onClose, investorId, investor, editMode = false }: InvestorProfileModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Editable fields state
  const [isEditMode, setIsEditMode] = useState(editMode);
  const [formData, setFormData] = useState({
    email: investor?.email || "",
    primaryMobile: investor?.primaryMobile || "",
    secondaryMobile: investor?.secondaryMobile || "",
    primaryAddress: investor?.primaryAddress || "",
    secondaryAddress: investor?.secondaryAddress || "",
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updateData: typeof formData) => {
      return await apiRequest(`/api/investor/profile/update`, "PATCH", {
        investorId: investor?.id || investorId,
        ...updateData
      });
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully. Admin has been notified.",
      });
      setIsEditMode(false);
      queryClient.invalidateQueries({ queryKey: ["/api/investor/profile"] });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    // Validate required fields
    if (!formData.email || !formData.primaryMobile || !formData.primaryAddress) {
      toast({
        title: "Validation Error",
        description: "Email, primary mobile, and primary address are required.",
        variant: "destructive",
      });
      return;
    }

    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      email: investor?.email || "",
      primaryMobile: investor?.primaryMobile || "",
      secondaryMobile: investor?.secondaryMobile || "",
      primaryAddress: investor?.primaryAddress || "",
      secondaryAddress: investor?.secondaryAddress || "",
    });
    setIsEditMode(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-2 border-gray-200 shadow-2xl"
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          zIndex: 50,
          position: "fixed"
        }}
        data-testid="investor-profile-modal"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Investor Profile Details
          </DialogTitle>
          <DialogDescription>
            View your investor information. You can edit contact details and address information.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information (Read-only) */}
          <Card>
            <div className="p-4 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Personal Information
              </h3>
              <p className="text-sm text-gray-600">These details cannot be changed</p>
            </div>
            <CardContent className="p-4 space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Full Name</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border text-sm">
                  {`${investor?.firstName || ''} ${investor?.middleName || ''} ${investor?.lastName || ''}`.trim()}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Investor ID</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border text-sm font-mono">
                  {investor?.id || 'N/A'}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Identity Proof</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>{investor?.identityProofType || 'N/A'}: {investor?.identityProofNumber || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Registration Date</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{investor?.createdAt ? new Date(investor.createdAt).toLocaleDateString() : "N/A"}</span>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Status</Label>
                <div className="mt-1">
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Active Investor
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information (Editable) */}
          <Card>
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Contact Information
                </h3>
                <p className="text-sm text-gray-600">You can update these details</p>
              </div>
              {!isEditMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditMode(true)}
                  data-testid="button-edit-profile"
                >
                  Edit Details
                </Button>
              )}
            </div>
            <CardContent className="p-4 space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address *
                </Label>
                {isEditMode ? (
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1"
                    data-testid="input-email"
                  />
                ) : (
                  <div className="mt-1 p-2 bg-gray-50 rounded border text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{investor?.email}</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="primaryMobile" className="text-sm font-medium text-gray-700">
                  Primary Mobile *
                </Label>
                {isEditMode ? (
                  <Input
                    id="primaryMobile"
                    type="tel"
                    value={formData.primaryMobile}
                    onChange={(e) => setFormData({ ...formData, primaryMobile: e.target.value })}
                    className="mt-1"
                    data-testid="input-primary-mobile"
                  />
                ) : (
                  <div className="mt-1 p-2 bg-gray-50 rounded border text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{investor?.primaryMobile}</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="secondaryMobile" className="text-sm font-medium text-gray-700">
                  Secondary Mobile
                </Label>
                {isEditMode ? (
                  <Input
                    id="secondaryMobile"
                    type="tel"
                    value={formData.secondaryMobile}
                    onChange={(e) => setFormData({ ...formData, secondaryMobile: e.target.value })}
                    className="mt-1"
                    placeholder="Optional"
                    data-testid="input-secondary-mobile"
                  />
                ) : (
                  <div className="mt-1 p-2 bg-gray-50 rounded border text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{investor?.secondaryMobile || "Not provided"}</span>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <Label htmlFor="primaryAddress" className="text-sm font-medium text-gray-700">
                  Primary Address *
                </Label>
                {isEditMode ? (
                  <Input
                    id="primaryAddress"
                    value={formData.primaryAddress}
                    onChange={(e) => setFormData({ ...formData, primaryAddress: e.target.value })}
                    className="mt-1"
                    data-testid="input-primary-address"
                  />
                ) : (
                  <div className="mt-1 p-2 bg-gray-50 rounded border text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{investor?.primaryAddress}</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="secondaryAddress" className="text-sm font-medium text-gray-700">
                  Secondary Address
                </Label>
                {isEditMode ? (
                  <Input
                    id="secondaryAddress"
                    value={formData.secondaryAddress}
                    onChange={(e) => setFormData({ ...formData, secondaryAddress: e.target.value })}
                    className="mt-1"
                    placeholder="Optional"
                    data-testid="input-secondary-address"
                  />
                ) : (
                  <div className="mt-1 p-2 bg-gray-50 rounded border text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{investor?.secondaryAddress || "Not provided"}</span>
                    </div>
                  </div>
                )}
              </div>

              {isEditMode && (
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={updateProfileMutation.isPending}
                    className="flex-1"
                    data-testid="button-save-changes"
                  >
                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={updateProfileMutation.isPending}
                    className="flex-1"
                    data-testid="button-cancel-changes"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Investment Summary (Read-only) */}
        <Card>
          <div className="p-4 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Investment Summary
            </h3>
            <p className="text-sm text-gray-600">Your current investment details</p>
          </div>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">₹20,00,000</div>
                <div className="text-sm text-gray-600">Total Investment</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">1</div>
                <div className="text-sm text-gray-600">Bond Units</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">3 Years</div>
                <div className="text-sm text-gray-600">Lock-in Period</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={onClose} data-testid="button-close-modal">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}