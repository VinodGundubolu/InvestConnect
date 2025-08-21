import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, LogIn, User, Mail, Phone, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Universal login schema - accepts email, phone, or investor ID
const loginSchema = z.object({
  identifier: z.string().min(1, "Please enter your Email, Phone, or Investor ID"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function InvestorLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [identifierType, setIdentifierType] = useState<"email" | "phone" | "investorId" | null>(null);
  const { toast } = useToast();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  // Detect identifier type as user types
  const detectIdentifierType = (value: string) => {
    if (!value) {
      setIdentifierType(null);
      return;
    }
    
    // Email pattern
    if (value.includes("@") && value.includes(".")) {
      setIdentifierType("email");
    }
    // Phone pattern (starts with + or contains only digits and spaces/hyphens)
    else if (/^[\+]?[0-9\s\-\(\)]+$/.test(value) && value.replace(/[\s\-\(\)\+]/g, "").length >= 10) {
      setIdentifierType("phone");
    }
    // Investor ID pattern (simple sequential numbers: 1, 2, 3, etc.)
    else if (/^[0-9]+$/.test(value) && parseInt(value) > 0) {
      setIdentifierType("investorId");
    }
    else {
      setIdentifierType(null);
    }
  };

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await apiRequest("/api/investor/universal-login", "POST", data);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Login Successful",
        description: `Welcome back, ${data.investor.firstName}!`,
      });
      // Redirect to investor portal
      window.location.href = "/investor";
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials. Please check your details and try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  const getIdentifierIcon = () => {
    switch (identifierType) {
      case "email":
        return <Mail className="w-4 h-4" />;
      case "phone":
        return <Phone className="w-4 h-4" />;
      case "investorId":
        return <CreditCard className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getIdentifierLabel = () => {
    switch (identifierType) {
      case "email":
        return "Email Address";
      case "phone":
        return "Phone Number";
      case "investorId":
        return "Investor ID";
      default:
        return "Email / Phone / Investor ID";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            Investor Portal
          </CardTitle>
          <CardDescription className="text-gray-600">
            Login with your Email, Phone Number, or Investor ID
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Universal Identifier Field */}
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-sm font-medium text-gray-700">
                {getIdentifierLabel()}
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  {getIdentifierIcon()}
                </div>
                <Input
                  id="identifier"
                  data-testid="input-identifier"
                  placeholder="Enter your email, phone, or investor ID"
                  className="pl-10 pr-4 py-3 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  {...form.register("identifier")}
                  onChange={(e) => {
                    form.register("identifier").onChange(e);
                    detectIdentifierType(e.target.value);
                  }}
                />
              </div>
              {form.formState.errors.identifier && (
                <p className="text-sm text-red-600">{form.formState.errors.identifier.message}</p>
              )}
              {identifierType && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  {getIdentifierIcon()}
                  Detected: {getIdentifierLabel()}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  data-testid="input-password"
                  placeholder="Enter your password"
                  className="pr-12 py-3 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
              )}
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              data-testid="button-login"
            >
              {loginMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing In...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Sign In
                </div>
              )}
            </Button>
          </form>

          {/* Help Text */}
          <div className="mt-6 space-y-2 text-center">
            <p className="text-sm text-gray-600">
              Need help accessing your account?
            </p>
            <p className="text-xs text-gray-500">
              Contact support or use the password reset option after login
            </p>
          </div>

          {/* Demo Credentials */}
          <Alert className="mt-4 bg-blue-50 border-blue-200">
            <AlertDescription className="text-sm text-blue-800">
              <strong>Working Demo Accounts:</strong><br />
              <div className="mt-2 space-y-2">
                <div className="bg-white/50 p-2 rounded border-l-2 border-blue-400">
                  <strong>Account 1:</strong> krishna_john / KR2025
                </div>
                <div className="bg-white/50 p-2 rounded border-l-2 border-green-400">
                  <strong>Account 2:</strong> sid_vid / SI2025
                </div>
                <div className="bg-white/50 p-2 rounded border-l-2 border-purple-400">
                  <strong>Account 3:</strong> vinod_kumar / VI2025
                </div>
              </div>
              <div className="mt-2 text-xs">
                <em>Also supports: Email ID, Phone Number, and Investor ID login</em>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}