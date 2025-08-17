import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { Trash2, AlertTriangle } from "lucide-react";

interface DeleteInvestorDialogProps {
  investor: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    totalInvestment?: number;
  };
}

export default function DeleteInvestorDialog({ investor }: DeleteInvestorDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteInvestorMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/admin/investors/${investor.id}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Investor Deleted",
        description: `${investor.firstName} ${investor.lastName} has been permanently deleted from the system.`,
      });
      setIsOpen(false);
      setConfirmationText("");
      // Invalidate relevant queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/investors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard-stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed", 
        description: error.message || "Failed to delete investor",
        variant: "destructive",
      });
    },
  });

  const fullName = `${investor.firstName} ${investor.lastName}`;
  const expectedConfirmation = `DELETE ${fullName.toUpperCase()}`;
  const isConfirmationValid = confirmationText === expectedConfirmation;

  const handleDelete = () => {
    if (!isConfirmationValid) {
      toast({
        title: "Confirmation Required",
        description: `Please type "${expectedConfirmation}" to confirm deletion`,
        variant: "destructive",
      });
      return;
    }
    deleteInvestorMutation.mutate();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          data-testid={`button-delete-investor-${investor.id}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      
      <AlertDialogContent className="sm:max-w-md" data-testid="delete-investor-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Investor Account
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="font-medium text-red-800">⚠️ This action cannot be undone!</p>
              <p className="text-sm text-red-600 mt-1">
                This will permanently delete the investor and all related investment data.
              </p>
            </div>
            
            <div className="space-y-2">
              <p><strong>Investor:</strong> {fullName}</p>
              <p><strong>Email:</strong> {investor.email}</p>
              <p><strong>ID:</strong> {investor.id}</p>
              {investor.totalInvestment && (
                <p><strong>Total Investment:</strong> ₹{investor.totalInvestment.toLocaleString()}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmation" className="text-sm font-medium">
                Type <code className="bg-gray-100 px-1 rounded text-red-600">{expectedConfirmation}</code> to confirm:
              </Label>
              <Input
                id="confirmation"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder={`Type: ${expectedConfirmation}`}
                className="font-mono text-sm"
                data-testid="input-delete-confirmation"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={() => {
              setConfirmationText("");
              setIsOpen(false);
            }}
            data-testid="button-cancel-delete"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={!isConfirmationValid || deleteInvestorMutation.isPending}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            data-testid="button-confirm-delete"
          >
            {deleteInvestorMutation.isPending ? "Deleting..." : "Delete Permanently"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}