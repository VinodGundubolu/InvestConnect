import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mail, 
  Send, 
  Calendar, 
  Users, 
  Settings, 
  Play, 
  Pause, 
  Edit, 
  Trash2,
  Plus,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default function EmailManagement() {
  const [activeTab, setActiveTab] = useState("templates");
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    subject: "",
    content: "",
    type: "Welcome"
  });
  const { toast } = useToast();

  // Sample data for email templates
  const emailTemplates = [
    {
      id: 1,
      name: "Welcome Email",
      subject: "Welcome to IRM Investment Portal",
      type: "Welcome",
      status: "Active",
      lastModified: "2024-08-15",
      usageCount: 45
    },
    {
      id: 2,
      name: "Annual Interest Notification",
      subject: "Your {{currentYear}} Interest Payment of {{interestAmount}} is Ready",
      type: "Interest",
      status: "Active",
      lastModified: "2024-08-10",
      usageCount: 120
    },
    {
      id: 3,
      name: "Milestone Bonus Alert",
      subject: "Congratulations! {{milestoneBonus}} Milestone Bonus Available",
      type: "Bonus",
      status: "Active",
      lastModified: "2024-08-05",
      usageCount: 8
    }
  ];

  // Sample data for scheduled campaigns
  const scheduledCampaigns = [
    {
      id: 1,
      name: "Year 2 Interest Notifications",
      template: "Annual Interest Notification",
      recipients: 25,
      scheduledDate: "2024-09-01",
      status: "Scheduled"
    },
    {
      id: 2,
      name: "Monthly Portfolio Updates",
      template: "Portfolio Summary",
      recipients: 45,
      scheduledDate: "2024-08-30",
      status: "Processing"
    }
  ];

  // Merge fields available for email templates
  const mergeFields = [
    { field: "{{investorName}}", description: "Full name of the investor" },
    { field: "{{investorId}}", description: "Unique investor ID" },
    { field: "{{email}}", description: "Investor's email address" },
    { field: "{{phoneNumber}}", description: "Primary contact number" },
    { field: "{{totalInvestment}}", description: "Total investment amount" },
    { field: "{{currentYear}}", description: "Current investment year (1-10)" },
    { field: "{{interestRate}}", description: "Current year interest rate" },
    { field: "{{interestAmount}}", description: "Interest amount for current year" },
    { field: "{{totalReturns}}", description: "Total returns received to date" },
    { field: "{{nextPaymentDate}}", description: "Next scheduled payment date" },
    { field: "{{milestoneBonus}}", description: "Milestone bonus amount (Year 5/10)" },
    { field: "{{investmentStartDate}}", description: "Date investment started" },
    { field: "{{maturityDate}}", description: "Investment maturity date" },
    { field: "{{earlyExitValue}}", description: "Current early exit value" }
  ];

  const getStatusBadge = (status: string) => {
    const statusColors = {
      Active: "bg-green-100 text-green-800",
      Scheduled: "bg-blue-100 text-blue-800",
      Processing: "bg-yellow-100 text-yellow-800",
      Completed: "bg-gray-100 text-gray-800",
      Draft: "bg-orange-100 text-orange-800"
    };
    return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800";
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({ name: "", subject: "", content: "", type: "Welcome" });
    setIsTemplateDialogOpen(true);
  };

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      subject: template.subject,
      content: template.content || "Dear {{investorName}},\n\nYour template content here...\n\nBest regards,\nIRM Investment Team",
      type: template.type
    });
    setIsTemplateDialogOpen(true);
  };

  const handleSaveTemplate = () => {
    if (!templateForm.name || !templateForm.subject) {
      toast({
        title: "Missing Information",
        description: "Please fill in template name and subject",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: editingTemplate ? "Template Updated" : "Template Created",
      description: `${templateForm.name} has been ${editingTemplate ? 'updated' : 'created'} successfully`,
    });
    setIsTemplateDialogOpen(false);
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = (template: any) => {
    if (confirm(`Are you sure you want to delete "${template.name}"?`)) {
      toast({
        title: "Template Deleted",
        description: `${template.name} has been deleted successfully`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Email Templates</p>
                <p className="text-2xl font-bold">{emailTemplates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Scheduled Campaigns</p>
                <p className="text-2xl font-bold">{scheduledCampaigns.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Recipients</p>
                <p className="text-2xl font-bold">45</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Send className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Emails Sent (This Month)</p>
                <p className="text-2xl font-bold">173</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Email Management Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="scheduler">Scheduler</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Email Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Email Templates</h3>
              <p className="text-gray-600">Manage automated email templates with merge fields</p>
            </div>
            <Button 
              className="bg-blue-600 hover:bg-blue-700" 
              data-testid="button-create-template"
              onClick={handleCreateTemplate}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Templates List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>All Templates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {emailTemplates.map((template) => (
                      <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="font-medium">{template.name}</h4>
                            <Badge className={getStatusBadge(template.status)}>
                              {template.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{template.subject}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>Type: {template.type}</span>
                            <span>Used: {template.usageCount} times</span>
                            <span>Modified: {template.lastModified}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline" data-testid={`button-preview-template-${template.id}`}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            data-testid={`button-edit-template-${template.id}`}
                            onClick={() => handleEditTemplate(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            data-testid={`button-delete-template-${template.id}`}
                            onClick={() => handleDeleteTemplate(template)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Merge Fields Reference */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Available Merge Fields</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {mergeFields.map((field, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <code className="text-sm font-mono text-blue-600">{field.field}</code>
                        <p className="text-xs text-gray-600 mt-1">{field.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Email Campaigns</h3>
              <p className="text-gray-600">View and manage scheduled email campaigns</p>
            </div>
            <Button className="bg-green-600 hover:bg-green-700" data-testid="button-create-campaign">
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {scheduledCampaigns.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium">{campaign.name}</h4>
                        <Badge className={getStatusBadge(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <span>Template: {campaign.template}</span>
                        <span>Recipients: {campaign.recipients}</span>
                        <span>Scheduled: {campaign.scheduledDate}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {campaign.status === "Scheduled" && (
                        <Button size="sm" variant="outline" data-testid={`button-pause-campaign-${campaign.id}`}>
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}
                      {campaign.status === "Processing" && (
                        <Button size="sm" variant="outline" data-testid={`button-play-campaign-${campaign.id}`}>
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" data-testid={`button-edit-campaign-${campaign.id}`}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduler Tab */}
        <TabsContent value="scheduler" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">Email Scheduler</h3>
            <p className="text-gray-600">Schedule automated emails based on investment milestones</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Schedule New Campaign</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="campaign-name">Campaign Name</Label>
                  <Input id="campaign-name" placeholder="Enter campaign name" />
                </div>
                
                <div>
                  <Label htmlFor="email-template">Email Template</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {emailTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.name}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="recipient-group">Recipient Group</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Investors</SelectItem>
                      <SelectItem value="year2">Year 2 Investors</SelectItem>
                      <SelectItem value="year5">Year 5 Milestone</SelectItem>
                      <SelectItem value="year10">Year 10 Milestone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="schedule-date">Schedule Date</Label>
                  <Input id="schedule-date" type="date" />
                </div>
                
                <Button className="w-full bg-blue-600 hover:bg-blue-700" data-testid="button-schedule-campaign">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Campaign
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Automated Triggers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Interest Payment Notifications</h4>
                        <p className="text-sm text-gray-600">Sent automatically on each anniversary</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm text-green-600">Active</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Milestone Bonus Alerts</h4>
                        <p className="text-sm text-gray-600">Triggered at Year 5 and Year 10</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm text-green-600">Active</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Monthly Statements</h4>
                        <p className="text-sm text-gray-600">Portfolio summary every month</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                        <span className="text-sm text-yellow-600">Paused</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">Email Settings</h3>
            <p className="text-gray-600">Configure email server and notification preferences</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>SMTP Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="smtp-server">SMTP Server</Label>
                  <Input id="smtp-server" placeholder="smtp.example.com" />
                </div>
                
                <div>
                  <Label htmlFor="smtp-port">Port</Label>
                  <Input id="smtp-port" placeholder="587" />
                </div>
                
                <div>
                  <Label htmlFor="smtp-username">Username</Label>
                  <Input id="smtp-username" placeholder="your-email@example.com" />
                </div>
                
                <div>
                  <Label htmlFor="smtp-password">Password</Label>
                  <Input id="smtp-password" type="password" placeholder="••••••••" />
                </div>
                
                <Button className="w-full" variant="outline" data-testid="button-test-smtp">
                  Test Connection
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Email Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="from-name">From Name</Label>
                  <Input id="from-name" placeholder="IRM Investment Portal" />
                </div>
                
                <div>
                  <Label htmlFor="from-email">From Email</Label>
                  <Input id="from-email" placeholder="noreply@irm-portal.com" />
                </div>
                
                <div>
                  <Label htmlFor="reply-to">Reply To</Label>
                  <Input id="reply-to" placeholder="support@irm-portal.com" />
                </div>
                
                <div>
                  <Label htmlFor="email-signature">Email Signature</Label>
                  <Textarea 
                    id="email-signature" 
                    placeholder="Best regards,&#10;IRM Investment Team&#10;Email: support@irm-portal.com&#10;Phone: +91 12345 67890"
                    rows={4}
                  />
                </div>
                
                <Button className="w-full bg-green-600 hover:bg-green-700" data-testid="button-save-settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Template Editor Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? `Edit Template: ${(editingTemplate as any).name}` : "Create New Template"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                  placeholder="Enter template name"
                  data-testid="input-template-name"
                />
              </div>
              <div>
                <Label htmlFor="template-type">Template Type</Label>
                <Select value={templateForm.type} onValueChange={(value) => setTemplateForm({...templateForm, type: value})}>
                  <SelectTrigger data-testid="select-template-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Welcome">Welcome</SelectItem>
                    <SelectItem value="Interest">Interest</SelectItem>
                    <SelectItem value="Bonus">Bonus</SelectItem>
                    <SelectItem value="Reminder">Reminder</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="template-subject">Email Subject</Label>
              <Input
                id="template-subject"
                value={templateForm.subject}
                onChange={(e) => setTemplateForm({...templateForm, subject: e.target.value})}
                placeholder="Enter email subject (use {{}} for merge fields)"
                data-testid="input-template-subject"
              />
            </div>
            
            <div>
              <Label htmlFor="template-content">Email Content</Label>
              <Textarea
                id="template-content"
                value={templateForm.content}
                onChange={(e) => setTemplateForm({...templateForm, content: e.target.value})}
                placeholder="Enter email content (use {{}} for merge fields)"
                className="min-h-[300px]"
                data-testid="textarea-template-content"
              />
            </div>
            
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setIsTemplateDialogOpen(false)}
                data-testid="button-cancel-template"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveTemplate}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-save-template"
              >
                {editingTemplate ? "Update Template" : "Create Template"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}