import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function Landing() {
  const [portalType, setPortalType] = useState("investor");

  const handleLogin = () => {
    // Redirect to Replit auth with portal type as state
    const params = new URLSearchParams({ portal: portalType });
    window.location.href = `/api/login?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="landing-page">
      {/* Header */}
      <div className="bg-primary text-white py-6">
        <div className="container mx-auto px-6">
          <h1 className="text-3xl font-bold" data-testid="text-header-title">
            Investment Relationship Management
          </h1>
          <p className="text-primary-100 mt-2" data-testid="text-header-subtitle">
            Secure access to your investment portfolio
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-md mx-auto">
          {/* Portal Selection */}
          <Card className="mb-6" data-testid="card-portal-selection">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4" data-testid="text-portal-selection-title">
                Select Portal
              </h2>
              <RadioGroup
                value={portalType}
                onValueChange={setPortalType}
                className="space-y-3"
                data-testid="radio-group-portal-type"
              >
                <div className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <RadioGroupItem value="investor" id="investor" data-testid="radio-investor" />
                  <div className="ml-3">
                    <Label htmlFor="investor" className="font-medium cursor-pointer">
                      Investor Portal
                    </Label>
                    <div className="text-sm text-gray-500">
                      View your personal investment details
                    </div>
                  </div>
                </div>
                <div className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <RadioGroupItem value="admin" id="admin" data-testid="radio-admin" />
                  <div className="ml-3">
                    <Label htmlFor="admin" className="font-medium cursor-pointer">
                      Admin Portal
                    </Label>
                    <div className="text-sm text-gray-500">
                      Manage all investors and investments
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Login Form */}
          <Card data-testid="card-login-form">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-6" data-testid="text-login-form-title">
                Secure Login
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="credentials" className="text-sm font-medium text-gray-700">
                    Email / Investor ID
                  </Label>
                  <Input
                    id="credentials"
                    type="text"
                    placeholder="Enter your credentials"
                    className="mt-2"
                    data-testid="input-credentials"
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="mt-2"
                    data-testid="input-password"
                  />
                </div>
                <Button
                  onClick={handleLogin}
                  className="w-full bg-primary hover:bg-primary-600 transition-colors"
                  data-testid="button-login"
                >
                  Sign In Securely
                </Button>
              </div>
              <div className="mt-4 text-center">
                <a href="#" className="text-primary text-sm hover:underline" data-testid="link-forgot-password">
                  Forgot Password?
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
