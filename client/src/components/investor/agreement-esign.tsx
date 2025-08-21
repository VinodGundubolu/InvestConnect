import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FileText, PenTool, Check, Clock, Download, X } from "lucide-react";
import { InvestorWithInvestments } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

interface AgreementESignProps {
  investor: InvestorWithInvestments;
}

interface Agreement {
  id: string;
  agreementId: string;
  title: string;
  status: "pending" | "signed" | "expired";
  content: string;
  createdAt: string;
  signedAt?: string;
  signatureData?: string;
  signatureType?: string;
}

export default function AgreementESign({ investor }: AgreementESignProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null);
  const [signatureText, setSignatureText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureDrawn, setSignatureDrawn] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate agreement from investor data
  const currentDate = new Date().toLocaleDateString('en-GB');
  const maturityDate = new Date();
  maturityDate.setFullYear(maturityDate.getFullYear() + 10);
  const maturityDateStr = maturityDate.toLocaleDateString('en-GB');
  
  const totalInvestment = investor.investments?.reduce((sum, inv) => 
    sum + (parseFloat(inv.investedAmount) || 0), 0) || 2000000;
  
  const agreementId = `test-agreement-${Date.now()}`;

  // Load real agreements from database
  const { data: agreements = [], isLoading } = useQuery({
    queryKey: ["/api/investor/agreements", investor.id],
  });

  // Canvas signature functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    setSignatureDrawn(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureDrawn(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  }, []);

  const handleSign = async () => {
    if (!selectedAgreement || (!signatureText.trim() && !signatureDrawn)) {
      toast({
        title: "Invalid Signature",
        description: "Please enter your full name or draw your signature.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Simulate API call to sign document
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real implementation, this would call the API to record the signature
      if (selectedAgreement) {
        selectedAgreement.status = "signed";
        selectedAgreement.signedDate = new Date().toISOString().split('T')[0];
      }
      
      toast({
        title: "Agreement Signed Successfully",
        description: `${selectedAgreement?.title} has been digitally signed.`,
      });
      
      setIsDialogOpen(false);
      setSignatureText("");
      setSelectedAgreement(null);
      clearSignature();
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

  // Get agreement content from selected agreement
  const getAgreementContent = () => {
    return selectedAgreement?.content || '';
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
          {isLoading ? (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">Loading agreements...</p>
            </div>
          ) : agreements.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">No agreements available yet.</p>
              <p className="text-sm text-gray-400">Your investment agreements will appear here once generated.</p>
            </div>
          ) : (
            agreements.map((agreement) => (
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
                  <p>Agreement ID: {agreement.agreementId}</p>
                  <p>Created: {new Date(agreement.createdAt).toLocaleDateString()}</p>
                  {agreement.signedAt && (
                    <p>Signed: {new Date(agreement.signedAt).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {getStatusText(agreement.status)}
                </span>
                
                {agreement.status === "signed" && (
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
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Sign Agreement: {selectedAgreement?.title}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6">
                        {/* Agreement Content */}
                        <div className="bg-white border-2 border-gray-300 p-6 rounded-lg font-mono text-sm leading-relaxed">
                          <pre className="whitespace-pre-wrap">
                            {getAgreementContent()}
                          </pre>
                        </div>
                        
                        {/* Signature Section */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-lg">Digital Signature</h4>
                          
                          {/* Text Signature */}
                          <div>
                            <Label htmlFor="signature" className="text-sm font-medium">
                              Type Signature
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

                          {/* OR Divider */}
                          <div className="flex items-center gap-4">
                            <div className="flex-1 h-px bg-gray-300"></div>
                            <span className="text-sm text-gray-500 bg-white px-2">OR</span>
                            <div className="flex-1 h-px bg-gray-300"></div>
                          </div>

                          {/* Canvas Signature */}
                          <div>
                            <Label className="text-sm font-medium">Draw Signature</Label>
                            <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-2">
                              <canvas
                                ref={canvasRef}
                                width={400}
                                height={120}
                                className="border border-gray-200 rounded cursor-crosshair w-full"
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                style={{ touchAction: 'none' }}
                              />
                              <div className="flex justify-between items-center mt-2">
                                <p className="text-xs text-gray-500">
                                  Draw your signature in the box above
                                </p>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={clearSignature}
                                  className="text-xs"
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Clear
                                </Button>
                              </div>
                            </div>
                          </div>
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
                            disabled={isProcessing || (!signatureText.trim() && !signatureDrawn)}
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
                              clearSignature();
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
            ))
          )}
          
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