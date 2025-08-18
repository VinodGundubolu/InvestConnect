import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AdminSidebar from "@/components/admin/admin-sidebar";
import EmailManagement from "@/components/admin/email-management";
import { Mail, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function EmailManagementPage() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: investorsData, isLoading: investorsLoading } = useQuery({
    queryKey: ['/api/admin/investors'],
    enabled: isAuthenticated,
  });

  if (isLoading || investorsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const investors = investorsData || [];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="nav-modern px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="flex items-center gap-2" data-testid="link-back-to-dashboard">
                  <ArrowLeft className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <div className="page-header">
                <h1 className="page-title flex items-center gap-2">
                  <Mail className="h-6 w-6" />
                  Email Management
                </h1>
                <p className="page-subtitle">Automated email notifications and investor communications</p>
              </div>
            </div>
          </div>
        </header>

        {/* Email Management Content */}
        <main className="flex-1 container-modern">
          <div className="max-w-7xl mx-auto">
            <EmailManagement investors={investors} />
          </div>
        </main>
      </div>
    </div>
  );
}