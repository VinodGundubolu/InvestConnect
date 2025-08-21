import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FileText, PenTool, Check, Clock, Download } from "lucide-react";
import { InvestorWithInvestments } from "@shared/schema";

interface AgreementESignProps {
  investor: InvestorWithInvestments;
}

interface Agreement {
  id: string;
  title: string;
  status: "pending" | "signed" | "expired";
  createdDate: string;
  signedDate?: string;
  documentUrl?: string;
}

export default function AgreementESign({ investor }: AgreementESignProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null);
  const [signatureText, setSignatureText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock agreements data - in real app this would come from API
  const agreements: Agreement[] = [
    {
      id: "AGR-001",
      title: "Investment Agreement - 20 Lakhs Bond",
      status: "signed",
      createdDate: "2024-01-01",
      signedDate: "2024-01-01",
      documentUrl: "/documents/agreement-001.pdf"
    },
    {
      id: "AGR-002", 
      title: "Additional Terms & Conditions",
      status: "pending",
      createdDate: "2025-08-21"
    },
    {
      id: "AGR-003",
      title: "Annual Disclosure Agreement", 
      status: "pending",
      createdDate: "2025-08-21"
    }
  ];

  const handleSign = async () => {
    if (!selectedAgreement || !signatureText.trim()) {
      toast({
        title: "Invalid Signature",
        description: "Please enter your full name to sign the agreement.",
        variant: "destructive",
      });
      return;
    }

    const expectedName = `${investor.firstName} ${investor.lastName}`.toLowerCase();
    const enteredName = signatureText.toLowerCase();
    
    if (!enteredName.includes(investor.firstName.toLowerCase()) || 
        !enteredName.includes(investor.lastName.toLowerCase())) {
      toast({
        title: "Name Mismatch",
        description: "Please enter your full name as registered in the system.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Simulate API call to sign document
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real implementation, this would call the API to record the signature
      selectedAgreement.status = "signed";
      selectedAgreement.signedDate = new Date().toISOString().split('T')[0];
      
      toast({
        title: "Agreement Signed Successfully",
        description: `${selectedAgreement.title} has been digitally signed.`,
      });
      
      setIsDialogOpen(false);
      setSignatureText("");
      setSelectedAgreement(null);
    } catch (error) {
      toast({
        title: "Signing Failed",
        description: "There was an error signing the agreement. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "signed":
        return <Check className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "expired":
        return <Clock className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "signed":
        return "Signed";
      case "pending":
        return "Pending Signature";
      case "expired":
        return "Expired";
      default:
        return "Unknown";
    }
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Digital Agreement & E-Signature
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {agreements.map((agreement) => (
            <div
              key={agreement.id}
              className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900">{agreement.title}</h4>
                  {getStatusIcon(agreement.status)}
                </div>
                <div className="text-sm text-gray-600">
                  <p>Agreement ID: {agreement.id}</p>
                  <p>Created: {new Date(agreement.createdDate).toLocaleDateString()}</p>
                  {agreement.signedDate && (
                    <p>Signed: {new Date(agreement.signedDate).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {getStatusText(agreement.status)}
                </span>
                
                {agreement.status === "signed" && agreement.documentUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // In real implementation, this would download the signed document
                      toast({
                        title: "Download Started",
                        description: "Your signed agreement is being downloaded.",
                      });
                    }}
                    data-testid={`button-download-${agreement.id}`}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                )}
                
                {agreement.status === "pending" && (
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        onClick={() => setSelectedAgreement(agreement)}
                        data-testid={`button-sign-${agreement.id}`}
                      >
                        <PenTool className="h-4 w-4 mr-1" />
                        Sign Now
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Digital Signature</DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-1">
                            {selectedAgreement?.title}
                          </h4>
                          <p className="text-sm text-blue-700">
                            Agreement ID: {selectedAgreement?.id}
                          </p>
                        </div>
                        
                        <div>
                          <Label htmlFor="signature" className="text-sm font-medium">
                            Digital Signature *
                          </Label>
                          <Input
                            id="signature"
                            value={signatureText}
                            onChange={(e) => setSignatureText(e.target.value)}
                            placeholder="Type your full name as signature"
                            className="mt-1"
                            data-testid="input-signature"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Please type your full name: {investor.firstName} {investor.lastName}
                          </p>
                        </div>
                        
                        <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
                          <p className="font-medium mb-1">Legal Notice:</p>
                          <p>
                            By signing this document digitally, you agree that your electronic 
                            signature has the same legal effect as a handwritten signature and 
                            you consent to be bound by the terms of this agreement.
                          </p>
                        </div>
                        
                        <div className="flex gap-3 pt-4">
                          <Button
                            onClick={handleSign}
                            disabled={isProcessing || !signatureText.trim()}
                            className="flex-1"
                            data-testid="button-confirm-sign"
                          >
                            {isProcessing ? (
                              <>
                                <Clock className="h-4 w-4 mr-2 animate-spin" />
                                Signing...
                              </>
                            ) : (
                              <>
                                <PenTool className="h-4 w-4 mr-2" />
                                Sign Agreement
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsDialogOpen(false);
                              setSignatureText("");
                            }}
                            disabled={isProcessing}
                            data-testid="button-cancel-sign"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          ))}
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> All agreements must be digitally signed to complete 
              your investment onboarding process. Your digital signature carries the same 
              legal weight as a handwritten signature.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}