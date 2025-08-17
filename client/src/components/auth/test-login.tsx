import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface TestLoginProps {
  portalType: "investor" | "admin";
  onSuccess?: () => void;
}

export default function TestLogin({ portalType, onSuccess }: TestLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string; portalType: string }) => {
      return await apiRequest("/api/test-login", {
        method: "POST",
        body: credentials,
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Login Successful",
        description: `Welcome to the ${portalType} portal!`,
      });
      if (onSuccess) onSuccess();
      // Redirect to appropriate portal
      window.location.href = portalType === "admin" ? "/admin" : "/investor";
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({
        title: "Missing Fields",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate({ username, password, portalType });
  };

  const testCredentials = {
    investor: {
      username: "Suresh",
      password: "Test@1234",
      description: "Test investor account with sample portfolio data"
    },
    admin: {
      username: "Admin",
      password: "Admin@123", 
      description: "Administrative access to full system"
    }
  };

  const creds = testCredentials[portalType];

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          {portalType === "admin" ? "Admin" : "Investor"} Portal Login
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <AlertDescription>
            <div className="text-sm">
              <p className="font-medium mb-2">Test Credentials:</p>
              <p><strong>Username:</strong> {creds.username}</p>
              <p><strong>Password:</strong> {creds.password}</p>
              <p className="text-gray-600 mt-2 text-xs">{creds.description}</p>
            </div>
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              data-testid="input-username"
            />
          </div>
          
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              data-testid="input-password"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loginMutation.isPending}
            data-testid="button-login"
          >
            {loginMutation.isPending ? "Logging in..." : "Login"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Button
            variant="outline"
            onClick={() => {
              setUsername(creds.username);
              setPassword(creds.password);
            }}
            className="text-sm"
            data-testid="button-fill-test-credentials"
          >
            Fill Test Credentials
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}