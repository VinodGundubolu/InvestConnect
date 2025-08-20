import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink,
  Download
} from 'lucide-react';

export default function AgreementsTab() {
  const { data: agreements, isLoading } = useQuery({
    queryKey: ['/api/investor/agreements'],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const agreementsList = agreements || [];

  const getStatusBadge = (status: string, isExpired: boolean) => {
    if (isExpired) {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Expired</Badge>;
    }
    
    switch (status) {
      case 'signed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Signed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string, isExpired: boolean) => {
    if (isExpired) {
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
    
    switch (status) {
      case 'signed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'rejected':
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
      default:
        return <FileText className="h-5 w-5 text-blue-500" />;
    }
  };

  const openAgreement = (agreementId: string) => {
    window.open(`/agreement-sign/${agreementId}`, '_blank');
  };

  const downloadAgreement = (agreement: any) => {
    const element = document.createElement('a');
    const file = new Blob([agreement.agreementContent], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = `Investment_Agreement_${agreement.id}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (agreementsList.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Agreements Found</h3>
            <p className="text-gray-500">
              No investment agreements have been generated for your account yet. 
              Our team will send you an agreement when you're ready to proceed with your investment.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Investment Agreements</h3>
          <p className="text-gray-500">Review and manage your investment partnership agreements</p>
        </div>
      </div>

      <div className="space-y-4">
        {agreementsList.map((agreement: any) => {
          const isExpired = agreement.expiresAt && new Date() > new Date(agreement.expiresAt);
          const canSign = agreement.status === 'pending' && !isExpired;
          
          return (
            <Card key={agreement.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(agreement.status, isExpired)}
                    <div>
                      <CardTitle className="text-base">Investment Partnership Agreement</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        Agreement ID: {agreement.id}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(agreement.status, isExpired)}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <span className="text-gray-500">Sent:</span>
                      <span className="ml-1 font-medium" data-testid={`text-sent-date-${agreement.id}`}>
                        {agreement.sentAt ? new Date(agreement.sentAt).toLocaleDateString('en-IN') : 'Not sent'}
                      </span>
                    </div>
                  </div>
                  
                  {agreement.expiresAt && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <div>
                        <span className="text-gray-500">Expires:</span>
                        <span className={`ml-1 font-medium ${isExpired ? 'text-red-600' : ''}`} data-testid={`text-expiry-date-${agreement.id}`}>
                          {new Date(agreement.expiresAt).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {agreement.signedAt && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <div>
                        <span className="text-gray-500">Signed:</span>
                        <span className="ml-1 font-medium text-green-600" data-testid={`text-signed-date-${agreement.id}`}>
                          {new Date(agreement.signedAt).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {agreement.signatoryName && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Signed by:</strong> {agreement.signatoryName}
                      {agreement.signatoryEmail && ` (${agreement.signatoryEmail})`}
                    </p>
                  </div>
                )}

                {isExpired && agreement.status === 'pending' && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                    <p className="text-sm text-red-800">
                      This agreement has expired. Please contact our team to request a new agreement.
                    </p>
                  </div>
                )}

                {canSign && (
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                    <p className="text-sm text-blue-800">
                      This agreement is ready for your signature. Please review the terms and sign at your earliest convenience.
                    </p>
                  </div>
                )}

                <Separator />

                <div className="flex gap-3">
                  <Button
                    size="sm"
                    onClick={() => openAgreement(agreement.id)}
                    className="flex items-center gap-2"
                    data-testid={`button-view-agreement-${agreement.id}`}
                  >
                    <ExternalLink className="h-4 w-4" />
                    {canSign ? 'Review & Sign' : 'View Agreement'}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadAgreement(agreement)}
                    className="flex items-center gap-2"
                    data-testid={`button-download-agreement-${agreement.id}`}
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}