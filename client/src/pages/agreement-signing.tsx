import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import DigitalSignature from "@/components/digital-signature";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function AgreementSigning() {
  const [match, params] = useRoute('/agreement-sign/:agreementId');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: agreementData, isLoading, error } = useQuery({
    queryKey: ['/api/agreement', params?.agreementId],
    enabled: !!params?.agreementId,
    retry: false,
  });

  const signAgreementMutation = useMutation({
    mutationFn: async ({ signature, signatoryName, signatoryEmail }: {
      signature: string;
      signatoryName: string;
      signatoryEmail: string;
    }) => {
      return await apiRequest(`/api/agreement/${params?.agreementId}/sign`, {
        method: 'POST',
        body: JSON.stringify({ signature, signatoryName, signatoryEmail }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agreement', params?.agreementId] });
      toast({
        title: "Agreement Signed Successfully!",
        description: "Your investment agreement has been digitally signed and submitted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Signature Failed",
        description: error.message || "Failed to sign agreement. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSign = async (signature: string, signatoryName: string, signatoryEmail: string) => {
    await signAgreementMutation.mutateAsync({ signature, signatoryName, signatoryEmail });
  };

  if (!params?.agreementId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-900 mb-2">Invalid Agreement Link</h2>
              <p className="text-red-700">The agreement link is invalid or missing required parameters.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading agreement...</p>
        </div>
      </div>
    );
  }

  if (error || !agreementData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-900 mb-2">Agreement Not Found</h2>
              <p className="text-red-700 mb-4">
                The requested agreement could not be found or may have expired.
              </p>
              <p className="text-sm text-gray-600">
                Please contact our support team if you believe this is an error.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <DigitalSignature 
        agreementData={agreementData}
        onSign={handleSign}
        onClose={() => window.history.back()}
      />
    </div>
  );
}