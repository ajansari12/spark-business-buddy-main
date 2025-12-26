import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { 
  CreditCard, 
  ExternalLink, 
  Receipt, 
  Package, 
  Clock,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";

interface Order {
  id: string;
  tier: string;
  tier_name: string | null;
  amount_cents: number;
  currency: string;
  status: "pending" | "paid" | "failed";
  created_at: string;
  stripe_checkout_session_id: string | null;
}

const TIER_DISPLAY_NAMES: Record<string, string> = {
  tier1: "Starter",
  tier2: "Complete",
  tier3: "VIP",
  starter: "Starter",
  complete: "Complete",
  vip: "VIP",
};

const statusConfig = {
  pending: { 
    label: "Pending", 
    variant: "outline" as const, 
    icon: Clock,
    className: "border-yellow-500 text-yellow-600"
  },
  paid: { 
    label: "Paid", 
    variant: "default" as const, 
    icon: CheckCircle,
    className: "bg-green-600 hover:bg-green-600"
  },
  failed: { 
    label: "Failed", 
    variant: "destructive" as const, 
    icon: XCircle,
    className: ""
  },
};

export default function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("ft_orders")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast({
          title: "Error",
          description: "Failed to load order history",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const handleOpenPortal = async () => {
    setIsPortalLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.functions.invoke("ft_customer_portal", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      toast({
        title: "Error",
        description: "Failed to open customer portal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPortalLoading(false);
    }
  };

  const formatAmount = (cents: number, currency: string) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  const getTierDisplayName = (tier: string, tierName: string | null) => {
    if (tierName) return tierName.charAt(0).toUpperCase() + tierName.slice(1);
    return TIER_DISPLAY_NAMES[tier] || tier;
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Order History</h1>
          <p className="text-muted-foreground">
            View your purchases and manage billing
          </p>
        </div>
        <Button onClick={handleOpenPortal} disabled={isPortalLoading}>
          {isPortalLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CreditCard className="mr-2 h-4 w-4" />
          )}
          Manage Billing
          <ExternalLink className="ml-2 h-3 w-3" />
        </Button>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No orders yet</h3>
            <p className="text-muted-foreground mt-1 mb-4">
              Your purchase history will appear here
            </p>
            <Button onClick={() => navigate("/pricing")}>
              View Pricing
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = statusConfig[order.status];
            const StatusIcon = status.icon;

            return (
              <Card key={order.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="rounded-lg bg-primary/10 p-3">
                        <Package className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {getTierDisplayName(order.tier, order.tier_name)} Package
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(order.created_at), "MMMM d, yyyy 'at' h:mm a")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 font-mono">
                          Order ID: {order.id.slice(0, 8)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 sm:text-right">
                      <div>
                        <p className="text-xl font-bold">
                          {formatAmount(order.amount_cents, order.currency)}
                        </p>
                        <Badge 
                          variant={status.variant} 
                          className={`mt-1 ${status.className}`}
                        >
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {status.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Help Section */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">Need help with an order?</CardTitle>
          <CardDescription>
            Contact our support team at{" "}
            <a 
              href="mailto:support@fasttrack.app" 
              className="text-primary hover:underline"
            >
              support@fasttrack.app
            </a>
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
