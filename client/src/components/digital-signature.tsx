import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  PenTool, 
  RotateCcw, 
  Check, 
  FileText, 
  Calendar,
  User,
  Mail,
  AlertTriangle,
  Download
} from 'lucide-react';

interface DigitalSignatureProps {
  agreementData: {
    id: string;
    agreementContent: string;
    status: string;
    expiresAt: string;
    isExpired: boolean;
    canSign: boolean;
    investorId: string;
  };
  onSign: (signature: string, signatoryName: string, signatoryEmail: string) => Promise<void>;
  onClose?: () => void;
}

export default function DigitalSignature({ agreementData, onSign, onClose }: DigitalSignatureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatoryName, setSignatoryName] = useState('');
  const [signatoryEmail, setSignatoryEmail] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const [hasStartedDrawing, setHasStartedDrawing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 400;
    canvas.height = 150;

    // Set canvas styles
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Clear canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Add placeholder text
    ctx.fillStyle = '#9ca3af';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Sign here', canvas.width / 2, canvas.height / 2);

    // Reset stroke style for drawing
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!agreementData.canSign) return;
    
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Only clear placeholder text on the very first stroke
    if (!hasStartedDrawing) {
      // Clear placeholder text only once
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
      setHasStartedDrawing(true);
    }

    // Set drawing styles and start path
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  // Touch event handlers for mobile devices
  const startTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!agreementData.canSign) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas || !touch) return;

    const rect = canvas.getBoundingClientRect();
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
    
    startDrawing(mouseEvent as any);
  };

  const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !agreementData.canSign) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas || !touch) return;

    const rect = canvas.getBoundingClientRect();
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
    
    draw(mouseEvent as any);
  };

  const endTouch = () => {
    stopDrawing();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !agreementData.canSign) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    if (!agreementData.canSign) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and reset canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Add placeholder text back
    ctx.fillStyle = '#9ca3af';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Sign here', canvas.width / 2, canvas.height / 2);
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    
    // Reset drawing flag so placeholder gets cleared on next draw
    setHasStartedDrawing(false);
  };

  const handleSign = async () => {
    if (!signatoryName.trim() || !signatoryEmail.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your name and email address",
        variant: "destructive",
      });
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Convert canvas to base64 image
    const signatureDataURL = canvas.toDataURL('image/png');
    
    // Check if signature is empty (just the placeholder)
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let hasSignature = false;
    
    // Check if there are any non-white/non-border pixels
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      
      // If pixel is not white or light gray (border/placeholder)
      if (!(r > 220 && g > 220 && b > 220)) {
        hasSignature = true;
        break;
      }
    }

    if (!hasSignature) {
      toast({
        title: "Signature Required",
        description: "Please provide your digital signature in the box above",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSigning(true);
      await onSign(signatureDataURL, signatoryName, signatoryEmail);
      
      toast({
        title: "Agreement Signed Successfully!",
        description: "Your investment agreement has been signed and submitted",
      });
    } catch (error) {
      toast({
        title: "Signature Failed",
        description: "Failed to sign agreement. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSigning(false);
    }
  };

  const downloadAgreement = () => {
    const element = document.createElement('a');
    const file = new Blob([agreementData.agreementContent], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = `Investment_Agreement_${agreementData.id}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const getStatusBadge = () => {
    switch (agreementData.status) {
      case 'signed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Signed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending Signature</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Expired</Badge>;
      case 'rejected':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{agreementData.status}</Badge>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            Investment Agreement
          </h1>
          <p className="text-gray-600">Review and sign your investment partnership agreement</p>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge()}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={downloadAgreement}
            data-testid="button-download-agreement"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* Agreement Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Agreement Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm font-medium">Agreement ID</p>
              <p className="text-sm text-gray-600" data-testid="text-agreement-id">{agreementData.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm font-medium">Expires On</p>
              <p className="text-sm text-gray-600" data-testid="text-expiry-date">
                {new Date(agreementData.expiresAt).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm font-medium">Status</p>
              <p className="text-sm text-gray-600" data-testid="text-agreement-status">{agreementData.status}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expiration Warning */}
      {agreementData.isExpired && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900">Agreement Expired</h4>
                <p className="text-sm text-red-700 mt-1">
                  This agreement expired on {new Date(agreementData.expiresAt).toLocaleDateString('en-IN')}. 
                  Please contact our team to request a new agreement.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agreement Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Agreement Terms</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: agreementData.agreementContent }}
            data-testid="agreement-content"
          />
        </CardContent>
      </Card>

      {/* Digital Signature Section */}
      {agreementData.canSign && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PenTool className="h-5 w-5" />
              Digital Signature
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="signatoryName">Full Name</Label>
                <Input
                  id="signatoryName"
                  value={signatoryName}
                  onChange={(e) => setSignatoryName(e.target.value)}
                  placeholder="Enter your full legal name"
                  data-testid="input-signatory-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signatoryEmail">Email Address</Label>
                <Input
                  id="signatoryEmail"
                  type="email"
                  value={signatoryEmail}
                  onChange={(e) => setSignatoryEmail(e.target.value)}
                  placeholder="Enter your email address"
                  data-testid="input-signatory-email"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Your Signature</Label>
                <p className="text-sm text-gray-600 mb-3">
                  Draw your signature in the box below using your mouse or touch screen
                </p>
              </div>

              <div className="flex flex-col items-center space-y-4">
                <canvas
                  ref={canvasRef}
                  className="border-2 border-gray-300 rounded-lg cursor-crosshair bg-white"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startTouch}
                  onTouchMove={drawTouch}
                  onTouchEnd={endTouch}
                  data-testid="signature-canvas"
                />

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearSignature}
                    className="flex items-center gap-2"
                    data-testid="button-clear-signature"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Clear
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Legal Declaration</p>
                  <p>
                    By signing this agreement, I acknowledge that I have read, understood, and agree to all terms and conditions. 
                    I confirm that this digital signature is legally binding and represents my consent to enter into this investment partnership.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              {onClose && (
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
              )}
              <Button
                onClick={handleSign}
                disabled={isSigning || !agreementData.canSign}
                className="flex items-center gap-2"
                data-testid="button-sign-agreement"
              >
                {isSigning ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {isSigning ? 'Signing...' : 'Sign Agreement'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Already Signed Message */}
      {agreementData.status === 'signed' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="font-medium text-green-900">Agreement Successfully Signed</h4>
                <p className="text-sm text-green-700 mt-1">
                  This agreement has been digitally signed and is now legally binding. 
                  You can download a copy for your records using the download button above.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}