import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Purchase } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  ShoppingBag, 
  Package, 
  ChevronDown, 
  Copy, 
  Check,
  Eye,
  EyeOff,
  Clock
} from "lucide-react";
import { format } from "date-fns";

export default function PurchasesPage() {
  const { toast } = useToast();
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visibleStockIds, setVisibleStockIds] = useState<Set<string>>(new Set());

  const { data: purchases, isLoading } = useQuery<Purchase[]>({
    queryKey: ["/api/purchases"],
  });

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast({
        title: "Copied!",
        description: "Stock data copied to clipboard",
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        variant: "destructive",
      });
    }
  };

  const toggleStockVisibility = (purchaseId: string) => {
    setVisibleStockIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(purchaseId)) {
        newSet.delete(purchaseId);
      } else {
        newSet.add(purchaseId);
      }
      return newSet;
    });
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShoppingBag className="h-8 w-8 text-primary" />
            My Purchases
          </h1>
          <p className="text-muted-foreground mt-2">
            View your purchase history and access your items
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : purchases && purchases.length > 0 ? (
          <div className="space-y-4">
            {purchases.map((purchase) => (
              <Card key={purchase.id} className="overflow-hidden" data-testid={`purchase-card-${purchase.id}`}>
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <div className="p-6 cursor-pointer hover-elevate transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                          <Package className="h-8 w-8 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{purchase.productName}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(purchase.purchaseDate), "MMM d, yyyy • h:mm a")}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="text-lg font-bold">
                            ${purchase.price.toFixed(2)}
                          </Badge>
                          <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="px-6 pb-6 border-t pt-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-muted-foreground">Stock Data / Credentials</h4>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleStockVisibility(purchase.id)}
                              data-testid={`button-toggle-visibility-${purchase.id}`}
                            >
                              {visibleStockIds.has(purchase.id) ? (
                                <>
                                  <EyeOff className="h-4 w-4 mr-2" />
                                  Hide
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Show
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(purchase.stockData, purchase.id)}
                              data-testid={`button-copy-${purchase.id}`}
                            >
                              {copiedId === purchase.id ? (
                                <>
                                  <Check className="h-4 w-4 mr-2 text-emerald-500" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50 font-mono text-sm break-all">
                          {visibleStockIds.has(purchase.id) ? (
                            purchase.stockData
                          ) : (
                            <span className="text-muted-foreground">
                              ••••••••••••••••••••
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No purchases yet</h3>
              <p className="text-muted-foreground mb-6">
                Browse our shop and make your first purchase!
              </p>
              <Button asChild>
                <a href="/">Browse Products</a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
