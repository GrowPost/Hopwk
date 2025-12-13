import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Product, User } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Shield, 
  Package, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Ban, 
  DollarSign,
  Loader2,
  Check,
  X
} from "lucide-react";
import { format } from "date-fns";

export default function AdminPage() {
  const { toast } = useToast();
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [addBalanceUser, setAddBalanceUser] = useState<User | null>(null);
  const [balanceAmount, setBalanceAmount] = useState("");
  
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
    stockData: "",
    category: "general"
  });

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const addProductMutation = useMutation({
    mutationFn: async (product: typeof newProduct) => {
      const stockArray = product.stockData.split("\n").filter(s => s.trim());
      const response = await apiRequest("POST", "/api/admin/products", {
        name: product.name,
        description: product.description || null,
        price: parseFloat(product.price),
        image: product.image || null,
        stockData: stockArray,
        category: product.category
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Product added successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setShowAddProduct(false);
      setNewProduct({ name: "", description: "", price: "", image: "", stockData: "", category: "general" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to add product", description: error.message, variant: "destructive" });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, product }: { id: string; product: typeof newProduct }) => {
      const stockArray = product.stockData.split("\n").filter(s => s.trim());
      const response = await apiRequest("PATCH", `/api/admin/products/${id}`, {
        name: product.name,
        description: product.description || null,
        price: parseFloat(product.price),
        image: product.image || null,
        stockData: stockArray,
        category: product.category
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Product updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setEditingProduct(null);
    },
    onError: (error: any) => {
      toast({ title: "Failed to update product", description: error.message, variant: "destructive" });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/products/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Product deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setDeletingProduct(null);
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete product", description: error.message, variant: "destructive" });
    },
  });

  const banUserMutation = useMutation({
    mutationFn: async ({ userId, ban }: { userId: string; ban: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}/ban`, { banned: ban });
      return response.json();
    },
    onSuccess: (_, { ban }) => {
      toast({ title: ban ? "User banned successfully" : "User unbanned successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update user", description: error.message, variant: "destructive" });
    },
  });

  const addBalanceMutation = useMutation({
    mutationFn: async ({ userId, amount }: { userId: string; amount: number }) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/balance`, { amount });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Balance added successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setAddBalanceUser(null);
      setBalanceAmount("");
    },
    onError: (error: any) => {
      toast({ title: "Failed to add balance", description: error.message, variant: "destructive" });
    },
  });

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      description: product.description || "",
      price: String(product.price),
      image: product.image || "",
      stockData: (product.stockData || []).join("\n"),
      category: product.category
    });
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage products and users
          </p>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="products" className="gap-2" data-testid="tab-products">
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2" data-testid="tab-users">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Products ({products?.length || 0})</h2>
              <Button onClick={() => setShowAddProduct(true)} data-testid="button-add-product">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>

            {productsLoading ? (
              <div className="grid gap-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-20 w-20 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-1/3" />
                          <Skeleton className="h-4 w-1/4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : products && products.length > 0 ? (
              <div className="grid gap-4">
                {products.map((product) => (
                  <Card key={product.id} data-testid={`admin-product-${product.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <Package className="h-10 w-10 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">{product.name}</h3>
                            <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{product.description}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="font-bold text-primary">${product.price.toFixed(2)}</span>
                            <Badge variant={product.stockData?.length ? "secondary" : "destructive"}>
                              Stock: {product.stockData?.length || 0}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" onClick={() => openEditProduct(product)} data-testid={`button-edit-${product.id}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => setDeletingProduct(product)} data-testid={`button-delete-${product.id}`}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No products yet</h3>
                  <p className="text-muted-foreground mb-4">Add your first product to get started</p>
                  <Button onClick={() => setShowAddProduct(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <h2 className="text-xl font-semibold">Users ({users?.length || 0})</h2>

            {usersLoading ? (
              <div className="grid gap-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-1/3" />
                          <Skeleton className="h-4 w-1/4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : users && users.length > 0 ? (
              <div className="grid gap-4">
                {users.map((user) => (
                  <Card key={user.id} data-testid={`admin-user-${user.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold">
                          {user.email[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold truncate">{user.email}</h3>
                            {user.isAdmin && <Badge variant="default" className="text-xs">Admin</Badge>}
                            {user.isBanned && <Badge variant="destructive" className="text-xs">Banned</Badge>}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span>Balance: <span className="font-semibold text-foreground">${user.balance.toFixed(2)}</span></span>
                            <span>Joined: {format(new Date(user.createdAt), "MMM d, yyyy")}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setAddBalanceUser(user)} data-testid={`button-add-balance-${user.id}`}>
                            <DollarSign className="h-4 w-4 mr-1" />
                            Add Balance
                          </Button>
                          {!user.isAdmin && (
                            <Button
                              variant={user.isBanned ? "default" : "outline"}
                              size="sm"
                              onClick={() => banUserMutation.mutate({ userId: user.id, ban: !user.isBanned })}
                              disabled={banUserMutation.isPending}
                              data-testid={`button-ban-${user.id}`}
                            >
                              {user.isBanned ? (
                                <>
                                  <Check className="h-4 w-4 mr-1" />
                                  Unban
                                </>
                              ) : (
                                <>
                                  <Ban className="h-4 w-4 mr-1" />
                                  Ban
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold">No users yet</h3>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Product Dialog */}
      <Dialog open={showAddProduct || !!editingProduct} onOpenChange={(open) => {
        if (!open) {
          setShowAddProduct(false);
          setEditingProduct(null);
          setNewProduct({ name: "", description: "", price: "", image: "", stockData: "", category: "general" });
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            <DialogDescription>
              {editingProduct ? "Update the product details" : "Fill in the product details"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <Input
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                placeholder="Product name"
                data-testid="input-product-name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                placeholder="Product description"
                rows={2}
                data-testid="input-product-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Price *</label>
                <Input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  data-testid="input-product-price"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Input
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  placeholder="general"
                  data-testid="input-product-category"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Image URL</label>
              <Input
                value={newProduct.image}
                onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                placeholder="https://example.com/image.png"
                data-testid="input-product-image"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Stock Data (one per line)</label>
              <Textarea
                value={newProduct.stockData}
                onChange={(e) => setNewProduct({ ...newProduct, stockData: e.target.value })}
                placeholder="account1:password1&#10;account2:password2&#10;license-key-123"
                rows={4}
                className="font-mono text-sm"
                data-testid="input-product-stock"
              />
              <p className="text-xs text-muted-foreground">
                Enter each stock item on a new line. These will be given to customers upon purchase.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setShowAddProduct(false);
              setEditingProduct(null);
              setNewProduct({ name: "", description: "", price: "", image: "", stockData: "", category: "general" });
            }}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingProduct) {
                  updateProductMutation.mutate({ id: editingProduct.id, product: newProduct });
                } else {
                  addProductMutation.mutate(newProduct);
                }
              }}
              disabled={!newProduct.name || !newProduct.price || addProductMutation.isPending || updateProductMutation.isPending}
              data-testid="button-save-product"
            >
              {(addProductMutation.isPending || updateProductMutation.isPending) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingProduct ? (
                "Update Product"
              ) : (
                "Add Product"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingProduct} onOpenChange={() => setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingProduct?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingProduct && deleteProductMutation.mutate(deletingProduct.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProductMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Balance Dialog */}
      <Dialog open={!!addBalanceUser} onOpenChange={() => {
        setAddBalanceUser(null);
        setBalanceAmount("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Balance</DialogTitle>
            <DialogDescription>
              Add funds to {addBalanceUser?.email}'s wallet
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Balance:</span>
                <span className="font-semibold">${addBalanceUser?.balance.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Amount to Add</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-8"
                  min="0.01"
                  step="0.01"
                  data-testid="input-admin-balance"
                />
              </div>
            </div>

            {balanceAmount && parseFloat(balanceAmount) > 0 && (
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex justify-between font-semibold">
                  <span>New Balance:</span>
                  <span className="text-primary">
                    ${((addBalanceUser?.balance || 0) + parseFloat(balanceAmount)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setAddBalanceUser(null);
              setBalanceAmount("");
            }}>
              Cancel
            </Button>
            <Button
              onClick={() => addBalanceUser && addBalanceMutation.mutate({ 
                userId: addBalanceUser.id, 
                amount: parseFloat(balanceAmount) 
              })}
              disabled={!balanceAmount || parseFloat(balanceAmount) <= 0 || addBalanceMutation.isPending}
              data-testid="button-confirm-add-balance"
            >
              {addBalanceMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                `Add $${balanceAmount || "0"}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
