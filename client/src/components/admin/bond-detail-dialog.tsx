import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface BondDetailProps {
  bond: {
    id: string;
    investorName: string;
    bondType: string;
    amount: number;
    purchaseDate: string;
    maturityDate: string;
    currentRate: number;
    status: string;
    year: number;
    bondsPurchased: number;
  };
}

export default function BondDetailDialog({ bond }: BondDetailProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid={`button-view-bond-${bond.id}`}>
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bond Details - {bond.id}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Bond Information */}
          <Card>
            <CardHeader>
              <CardTitle>Bond Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Bond ID</p>
                <p className="font-medium">{bond.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Bond Type</p>
                <p className="font-medium">{bond.bondType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Investor</p>
                <p className="font-medium">{bond.investorName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge variant={bond.status === 'Active' ? 'default' : 'secondary'}>
                  {bond.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Financial Details */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Investment Amount</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(bond.amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Bonds Purchased</p>
                <p className="text-2xl font-bold text-blue-600">
                  {bond.bondsPurchased}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {bond.currentRate}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Investment Year</p>
                <p className="text-2xl font-bold text-orange-600">
                  Year {bond.year}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Purchase Date</p>
                <p className="font-medium">{new Date(bond.purchaseDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Maturity Date</p>
                <p className="font-medium">{new Date(bond.maturityDate).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}