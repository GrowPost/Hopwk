import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { Product } from "@shared/schema";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, ShoppingCart, Package, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProductCardProps {
  product: Product;
  userBalance: number;
}

export function ProductCard({ product, userBalance }: ProductCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const { toast } = useToast();
  const { refetchUser } = useAuth();
  
  const stockCount = product.stockData?.length || 0;
  const isOutOfStock = stockCount === 0;
  const canAfford = userBalance >= product.price;

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/products/${product.id}/purchase`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Purchase successful!",
        description: `You purchased ${product.name}. Check your purchases for details.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases"] });
      refetchUser();
      setShowConfirm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Purchase failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const getStockBadge = () => {
    if (isOutOfStock) {
      return <Badge variant="destructive" className="text-xs">Out of Stock</Badge>;
    }
    if (stockCount <= 3) {
      return <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">Low Stock: {stockCount}</Badge>;
    }
    return <Badge variant="secondary" className="text-xs bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">In Stock: {stockCount}</Badge>;
  };

  return (
    <>
      <Card className="overflow-hidden group hover-elevate transition-all duration-200">
        <div className="aspect-video relative bg-gradient-to-br from-primary/20 via-primary/10 to-transparent">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className="h-16 w-16 text-muted-foreground/50" />
            </div>
          )}
          <div className="absolute top-3 right-3">
            {getStockBadge()}
          </div>
        </div>

        <CardHeader className="pb-2">
          <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {product.description}
            </p>
          )}
        </CardHeader>

        <CardContent className="pb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">
              ${product.price.toFixed(2)}
            </span>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            className="w-full"
            disabled={isOutOfStock || !canAfford || purchaseMutation.isPending}
            onClick={() => setShowConfirm(true)}
            data-testid={`button-purchase-${product.id}`}
          >
            {purchaseMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : isOutOfStock ? (
              "Out of Stock"
            ) : !canAfford ? (
              "Insufficient Balance"
            ) : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Purchase
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Purchase</DialogTitle>
            <DialogDescription>
              Are you sure you want to purchase this item?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <Package className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{product.name}</p>
                <p className="text-2xl font-bold text-primary">${product.price.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 rounded-lg border">
              <span className="text-muted-foreground">Current Balance:</span>
              <span className="font-semibold">${userBalance.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-lg border">
              <span className="text-muted-foreground">After Purchase:</span>
              <span className="font-semibold text-primary">${(userBalance - product.price).toFixed(2)}</span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => purchaseMutation.mutate()}
              disabled={purchaseMutation.isPending}
            >
              {purchaseMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Purchase"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
