import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Mail, 
  Send, 
  Users, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Clock
} from 'lucide-react';

interface EmailManagementProps {
  investors: Array<{
    id: string;
    name: string;
    email: string;
    totalInvestment: number;
  }>;
}

export default function EmailManagement({ investors }: EmailManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lastSentReports, setLastSentReports] = useState<string | null>(null);

  const sendWelcomeEmailMutation = useMutation({
    mutationFn: async (investorId: string) => {
      const response = await apiRequest(`/api/email/welcome/${investorId}`, 'POST');
      return await response.json();
    },
    onSuccess: (data, investorId) => {
      const investor = investors.find(inv => inv.id === investorId);
      toast({
        title: "Welcome Email Sent",
        description: `Welcome email sent successfully to ${investor?.name}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Email Failed",
        description: "Failed to send welcome email",
        variant: "destructive",
      });
    },
  });

  const sendMonthlyReportMutation = useMutation({
    mutationFn: async (investorId: string) => {
      const response = await apiRequest(`/api/email/monthly-report/${investorId}`, 'POST');
      return await response.json();
    },
    onSuccess: (data, investorId) => {
      const investor = investors.find(inv => inv.id === investorId);
      toast({
        title: "Monthly Report Sent",
        description: `Monthly report sent successfully to ${investor?.name}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Email Failed",
        description: "Failed to send monthly report",
        variant: "destructive",
      });
    },
  });

  const sendAllMonthlyReportsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/email/monthly-reports-all', 'POST');
      return await response.json();
    },
    onSuccess: (data: any) => {
      setLastSentReports(new Date().toLocaleString());
      toast({
        title: "Monthly Reports Sent",
        description: `${data.results.sent} reports sent successfully, ${data.results.failed} failed`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/investors'] });
    },
    onError: (error) => {
      toast({
        title: "Bulk Email Failed",
        description: "Failed to send monthly reports to all investors",
        variant: "destructive",
      });
    },
  });

  const triggerSchedulerTestMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/email/test-scheduler', 'POST');
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Scheduler Test Completed",
        description: "Monthly report scheduler test executed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Scheduler Test Failed",
        description: "Failed to test email scheduler",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Email Statistics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Investors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{investors.length}</div>
            <p className="text-xs text-muted-foreground">
              Total registered investors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Status</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
            <p className="text-xs text-muted-foreground">
              Automated system running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Sent</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {lastSentReports || 'Never'}
            </div>
            <p className="text-xs text-muted-foreground">
              Last bulk report sent
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Email Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Bulk Email Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => sendAllMonthlyReportsMutation.mutate()}
              disabled={sendAllMonthlyReportsMutation.isPending}
              className="flex items-center gap-2"
              data-testid="button-send-all-monthly-reports"
            >
              {sendAllMonthlyReportsMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              Send Monthly Reports to All Investors
            </Button>

            <Button
              variant="outline"
              onClick={() => triggerSchedulerTestMutation.mutate()}
              disabled={triggerSchedulerTestMutation.isPending}
              className="flex items-center gap-2"
              data-testid="button-test-scheduler"
            >
              {triggerSchedulerTestMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Calendar className="h-4 w-4" />
              )}
              Test Scheduler
            </Button>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Automated Monthly Reports
                </p>
                <p className="text-blue-700 dark:text-blue-300 mt-1">
                  Monthly progress reports are automatically sent to all investors on the 1st of each month at 9:00 AM. 
                  Each email includes personalized investment details, interest calculations, and upcoming disbursement information.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Investor Email Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Individual Email Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {investors.slice(0, 5).map((investor) => (
              <div 
                key={investor.id} 
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium" data-testid={`text-investor-name-${investor.id}`}>
                        {investor.name}
                      </p>
                      <p className="text-sm text-muted-foreground" data-testid={`text-investor-email-${investor.id}`}>
                        {investor.email}
                      </p>
                    </div>
                    <Badge variant="secondary" data-testid={`badge-investment-amount-${investor.id}`}>
                      ₹{(investor.totalInvestment / 100000).toFixed(1)}L
                    </Badge>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => sendWelcomeEmailMutation.mutate(investor.id)}
                    disabled={sendWelcomeEmailMutation.isPending}
                    data-testid={`button-send-welcome-${investor.id}`}
                  >
                    {sendWelcomeEmailMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCircle className="h-3 w-3" />
                    )}
                    Welcome
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={() => sendMonthlyReportMutation.mutate(investor.id)}
                    disabled={sendMonthlyReportMutation.isPending}
                    data-testid={`button-send-monthly-${investor.id}`}
                  >
                    {sendMonthlyReportMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Mail className="h-3 w-3" />
                    )}
                    Monthly Report
                  </Button>
                </div>
              </div>
            ))}
            
            {investors.length > 5 && (
              <p className="text-sm text-muted-foreground text-center py-2">
                Showing first 5 investors. Use bulk actions above for all investors.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Email Schedule Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Email Schedule Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Welcome Emails</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Sent automatically when new investor is created</li>
                  <li>• Includes login credentials and platform overview</li>
                  <li>• Contains investment opportunities information</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Monthly Reports</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Sent automatically on 1st of each month at 9:00 AM</li>
                  <li>• Personalized investment portfolio summary</li>
                  <li>• Interest calculations and disbursement schedule</li>
                  <li>• Investment progress and milestone tracking</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}