import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Eye, EyeOff, TrendingUp, Shield, Users, BarChart3 } from "lucide-react";

interface ModernLoginProps {
  title: string;
  subtitle: string;
  onSubmit: (username: string, password: string) => void;
  isLoading?: boolean;
  error?: string;
}

export default function ModernLogin({ 
  title, 
  subtitle, 
  onSubmit, 
  isLoading = false, 
  error 
}: ModernLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(username, password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex items-center justify-center">
        {/* Left Panel - Brand/Features */}
        <div className="hidden lg:block w-1/2 pr-12">
          <div className="modern-card-elevated p-8 text-center">
            <div className="mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h1 className="modern-heading text-3xl mb-2">Investment Relationship Management</h1>
              <p className="modern-body text-lg">Secure, Professional, Efficient</p>
            </div>
            
            <div className="grid grid-2 gap-6 mb-8">
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl mx-auto mb-3 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">Bank-Level Security</h3>
                <p className="text-sm text-gray-600">Advanced encryption and secure authentication</p>
              </div>
              
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl mx-auto mb-3 flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">Investor Management</h3>
                <p className="text-sm text-gray-600">Comprehensive investor relationship tools</p>
              </div>
              
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl mx-auto mb-3 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">Real-time Analytics</h3>
                <p className="text-sm text-gray-600">Live portfolio tracking and performance metrics</p>
              </div>
              
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl mx-auto mb-3 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">Growth Tracking</h3>
                <p className="text-sm text-gray-600">Monitor returns and investment growth</p>
              </div>
            </div>
            
            <div className="text-xs text-gray-500">
              Trusted by investors • Secure platform • Professional service
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="w-full lg:w-1/2 max-w-md mx-auto">
          <Card className="modern-card-elevated p-8">
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h2 className="modern-heading text-2xl mb-2">{title}</h2>
              <p className="modern-body">{subtitle}</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                  Username
                </label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-modern h-12 text-base"
                  placeholder="Enter your username"
                  required
                  data-testid="input-username"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-modern h-12 text-base pr-12"
                    placeholder="Enter your password"
                    required
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading || !username || !password}
                className="btn-modern-primary w-full h-12 text-base font-semibold"
                data-testid="button-login"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  "Sign In to Portal"
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-xs text-gray-500">
                Secure login powered by advanced encryption
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}