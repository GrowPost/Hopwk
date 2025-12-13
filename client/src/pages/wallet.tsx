import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Transaction } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Wallet, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock,
  Loader2,
  DollarSign
} from "lucide-react";
import { format } from "date-fns";

export default function WalletPage() {
  const { user, refetchUser } = useAuth();
  const [showTopUp, setShowTopUp] = useState(false);
  const [amount, setAmount] = useState("");
  const { toast } = useToast();

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const topUpMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest("POST", "/api/wallet/topup", { amount });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Top-up successful!",
        description: `$${amount} has been added to your wallet.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      refetchUser();
      setShowTopUp(false);
      setAmount("");
    },
    onError: (error: any) => {
      toast({
        title: "Top-up failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "topup":
      case "admin_add":
        return <ArrowDownLeft className="h-4 w-4 text-emerald-500" />;
      case "purchase":
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      case "refund":
        return <ArrowDownLeft className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "topup":
      case "admin_add":
      case "refund":
        return "text-emerald-500";
      case "purchase":
        return "text-red-500";
      default:
        return "text-foreground";
    }
  };

  const quickAmounts = [5, 10, 25, 50, 100];

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          <CardHeader>
            <CardDescription>Available Balance</CardDescription>
            <CardTitle className="text-4xl font-bold flex items-center gap-3">
              <Wallet className="h-10 w-10 text-primary" />
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                ${user?.balance.toFixed(2) || "0.00"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowTopUp(true)} className="gap-2" data-testid="button-topup">
              <Plus className="h-4 w-4" />
              Add Funds
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Transaction History
            </CardTitle>
            <CardDescription>Your recent wallet activity</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </div>
            ) : transactions && transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover-elevate transition-all"
                    data-testid={`transaction-${transaction.id}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center border">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(transaction.createdAt), "MMM d, yyyy • h:mm a")}
                      </p>
                    </div>
                    <div className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                      {transaction.type === "purchase" ? "-" : "+"}${Math.abs(transaction.amount).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">No transactions yet</h3>
                <p className="text-muted-foreground text-sm">
                  Add funds to your wallet to get started
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showTopUp} onOpenChange={setShowTopUp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Add Funds
            </DialogTitle>
            <DialogDescription>
              Enter the amount you want to add to your wallet
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-6">
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant={amount === String(quickAmount) ? "default" : "outline"}
                  onClick={() => setAmount(String(quickAmount))}
                  className="flex-1 min-w-[60px]"
                  data-testid={`button-quick-${quickAmount}`}
                >
                  ${quickAmount}
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Custom Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-8"
                  min="1"
                  step="0.01"
                  data-testid="input-topup-amount"
                />
              </div>
            </div>

            {amount && parseFloat(amount) > 0 && (
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Balance:</span>
                  <span>${user?.balance.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>New Balance:</span>
                  <span className="text-primary">
                    ${((user?.balance || 0) + parseFloat(amount)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowTopUp(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => topUpMutation.mutate(parseFloat(amount))}
              disabled={!amount || parseFloat(amount) <= 0 || topUpMutation.isPending}
              data-testid="button-confirm-topup"
            >
              {topUpMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Add $${amount || "0"}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
