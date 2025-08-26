import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Eye, EyeOff, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InvestorCredentialsDisplayProps {
  investor: {
    firstName?: string;
    lastName?: string;
    email?: string;
    investmentAmount?: number;
    bondsCount?: number;
    username?: string;
    password?: string;
    investor?: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

export default function InvestorCredentialsDisplay({ investor }: InvestorCredentialsDisplayProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${label} has been copied to clipboard`,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const investorLoginUrl = `${window.location.origin}/login`;

  // Debug: Check what data we're receiving
  console.log("Credentials Display Data:", investor);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="bg-green-50 border-b">
        <CardTitle className="text-green-800 flex items-center">
          ✅ Investor Account Created Successfully
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Investor Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Investor Information</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Name:</span> {investor?.investor?.firstName || investor?.firstName || 'N/A'} {investor?.investor?.lastName || investor?.lastName || ''}</p>
              <p><span className="font-medium">Email:</span> {investor?.investor?.email || investor?.email || 'N/A'}</p>
              <p><span className="font-medium">Investment:</span> {formatCurrency(investor?.investmentAmount || 0)}</p>
              <p><span className="font-medium">Debentures:</span> {investor?.bondsCount || 0} units</p>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Account Status</h3>
            <div className="space-y-2">
              <Badge variant="secondary" className="bg-green-50 text-green-700">
                Active Account
              </Badge>
              <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                KYC Verified
              </Badge>
              <Badge variant="secondary" className="bg-purple-50 text-purple-700">
                Investment Recorded
              </Badge>
            </div>
          </div>
        </div>

        {/* Universal Login Credentials */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
            🔐 Universal Login Credentials
          </h3>
          
          {/* Login Methods */}
          <div className="mb-4 p-3 bg-white rounded border">
            <h4 className="font-medium text-gray-700 mb-2">Investor can login using any of these:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-green-600 border-green-300">Email</Badge>
                <span className="font-mono">{investor?.investor?.email || investor?.email || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-blue-600 border-blue-300">Phone</Badge>
                <span className="font-mono">{investor?.investor?.primaryMobile || investor?.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-purple-600 border-purple-300">Investor ID</Badge>
                <span className="font-mono">{investor?.investor?.id || investor?.investorId || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-orange-600 border-orange-300">Username</Badge>
                <span className="font-mono">{investor?.username || 'N/A'}</span>
              </div>
            </div>
          </div>
          
          {/* Password */}
          <div className="flex items-center justify-between bg-white rounded p-3 border">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-600">Password (Same for all login methods)</label>
              <p className="font-mono text-lg">
                {showPassword ? (investor?.password || 'N/A') : "••••••••"}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
                data-testid="toggle-password"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(investor?.password || '', "Password")}
                data-testid="copy-password"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Universal Portal Access */}
        <div className="bg-gray-50 rounded-lg p-4 border">
          <h3 className="font-semibold text-gray-800 mb-3">🌐 Universal Investor Portal Access</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Universal Login URL</p>
                <p className="font-mono text-sm bg-white px-2 py-1 rounded border">
                  {investorLoginUrl}
                </p>
              </div>
              <Button
                onClick={() => window.open(investorLoginUrl, '_blank')}
                className="bg-blue-500 hover:bg-blue-600"
                data-testid="open-investor-portal"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Portal
              </Button>
            </div>
            
            {/* Copy URL Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(investorLoginUrl, "Portal URL")}
              className="w-full"
              data-testid="copy-portal-url"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Login URL
            </Button>
          </div>
        </div>

        {/* Enhanced Instructions */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-medium text-amber-800 mb-2">📋 Universal Login Instructions</h4>
          <div className="text-sm text-amber-700 space-y-2">
            <p><strong>Share these details with the investor:</strong></p>
            <ul className="space-y-1 ml-4">
              <li>• <strong>Login URL:</strong> {investorLoginUrl}</li>
              <li>• <strong>Login Options:</strong> Email, Phone, Investor ID, or Username</li>
              <li>• <strong>Password:</strong> {investor?.password || 'N/A'} (can be changed after first login)</li>
            </ul>
            
            <p className="mt-3"><strong>Investor Portal Features:</strong></p>
            <ul className="space-y-1 ml-4">
              <li>• Complete investment portfolio overview</li>
              <li>• Real-time interest calculations and disbursement tracking</li>
              <li>• Transaction history with export options (PDF/Excel)</li>
              <li>• Early exit value calculator (after 3-year lock-in)</li>
              <li>• Secure password change functionality</li>
              <li>• Milestone bonus tracking for Year 5 and 10 completions</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}