import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import { User, Mail, Phone, MapPin, FileText, Calendar, DollarSign, Download, Eye, CheckCircle } from "lucide-react";
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
  
  // Fetch signed agreements for this investor
  const { data: agreements, isLoading: agreementsLoading } = useQuery({
    queryKey: ["/api/investor/agreements", investor?.id || investorId],
    queryFn: async () => {
      const response = await apiRequest(`/api/investor/agreements/${investor?.id || investorId}`, "GET");
      return await response.json();
    },
    enabled: !!investor?.id || !!investorId
  });
  
  // Editable fields state
  const [isEditMode, setIsEditMode] = useState(editMode);
  const [formData, setFormData] = useState({
    email: investor?.email || "",
    primaryMobile: investor?.primaryMobile || "",
    secondaryMobile: investor?.secondaryMobile || "",
    primaryAddress: investor?.primaryAddress || "",
    secondaryAddress: investor?.secondaryAddress || "",
    city: investor?.city || "",
    state: investor?.state || "",
    zipcode: investor?.zipcode || "",
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
      city: investor?.city || "",
      state: investor?.state || "",
      zipcode: investor?.zipcode || "",
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

              {/* City, State, Zipcode Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                    City
                  </Label>
                  {isEditMode ? (
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="mt-1"
                      placeholder="City"
                      data-testid="input-city"
                    />
                  ) : (
                    <div className="mt-1 p-2 bg-gray-50 rounded border text-sm">
                      <span>{investor?.city || "Not provided"}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="state" className="text-sm font-medium text-gray-700">
                    State
                  </Label>
                  {isEditMode ? (
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="mt-1"
                      placeholder="State"
                      data-testid="input-state"
                    />
                  ) : (
                    <div className="mt-1 p-2 bg-gray-50 rounded border text-sm">
                      <span>{investor?.state || "Not provided"}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="zipcode" className="text-sm font-medium text-gray-700">
                    Zipcode
                  </Label>
                  {isEditMode ? (
                    <Input
                      id="zipcode"
                      value={formData.zipcode}
                      onChange={(e) => setFormData({ ...formData, zipcode: e.target.value })}
                      className="mt-1"
                      placeholder="Zipcode"
                      data-testid="input-zipcode"
                    />
                  ) : (
                    <div className="mt-1 p-2 bg-gray-50 rounded border text-sm">
                      <span>{investor?.zipcode || "Not provided"}</span>
                    </div>
                  )}
                </div>
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
                <div className="text-sm text-gray-600">Debentures</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">3 Years</div>
                <div className="text-sm text-gray-600">Lock-in Period</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Signed Agreements Section */}
        <Card>
          <div className="p-4 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Investment Agreements
            </h3>
            <p className="text-sm text-gray-600">View and download signed investment agreements</p>
          </div>
          <CardContent className="p-4">
            {agreementsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading agreements...</span>
              </div>
            ) : agreements && agreements.length > 0 ? (
              <div className="space-y-4">
                {agreements.map((agreement: any) => (
                  <div key={agreement.id} className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium text-gray-900">{agreement.title}</h4>
                          {agreement.status === "signed" ? (
                            <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Signed
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              {agreement.status === "pending" ? "Pending Signature" : "Draft"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Agreement ID: {agreement.agreementId}
                        </p>
                        <p className="text-sm text-gray-500">
                          Created: {new Date(agreement.createdAt).toLocaleDateString()}
                          {agreement.signedAt && (
                            <span className="ml-4">
                              Signed: {new Date(agreement.signedAt).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Preview agreement content
                            const newWindow = window.open("", "_blank");
                            if (newWindow) {
                              newWindow.document.write(`
                                <html>
                                  <head><title>Agreement Preview - ${agreement.title}</title></head>
                                  <body style="font-family: Arial, sans-serif; margin: 40px; line-height: 1.6;">
                                    <h1>${agreement.title}</h1>
                                    <pre style="white-space: pre-wrap; font-family: inherit;">${agreement.content}</pre>
                                  </body>
                                </html>
                              `);
                              newWindow.document.close();
                            }
                          }}
                          data-testid={`button-preview-agreement-${agreement.id}`}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {agreement.status === "signed" && (
                          <Button
                            size="sm"
                            onClick={() => {
                              // Download signed agreement
                              const element = document.createElement("a");
                              const file = new Blob([agreement.content], { type: "text/plain" });
                              element.href = URL.createObjectURL(file);
                              element.download = `${agreement.title.replace(/\s+/g, "_")}_${agreement.agreementId}.txt`;
                              document.body.appendChild(element);
                              element.click();
                              document.body.removeChild(element);
                              
                              toast({
                                title: "Download Started",
                                description: "Your signed agreement is being downloaded.",
                              });
                            }}
                            data-testid={`button-download-agreement-${agreement.id}`}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No Agreements Found</p>
                <p className="text-sm">Investment agreements will appear here once generated</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between mt-6">
          {!isEditMode && (
            <Button 
              variant="outline" 
              onClick={() => setIsEditMode(true)}
              data-testid="button-edit-profile"
            >
              Edit Profile
            </Button>
          )}
          <Button variant="outline" onClick={onClose} data-testid="button-close-modal">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}