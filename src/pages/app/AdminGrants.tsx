import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  Search,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  ExternalLink,
  AlertTriangle,
  Clock,
  Sparkles,
  ShieldCheck,
  Zap,
  Link2,
  Link2Off,
  HelpCircle,
  Wrench,
  X,
} from "lucide-react";
import { useAdminGrants, type Grant } from "@/hooks/useAdminGrants";
import { GrantVerificationModal } from "@/components/admin/GrantVerificationModal";
import { EditGrantModal } from "@/components/admin/EditGrantModal";
import { BulkEditUrlsModal } from "@/components/admin/BulkEditUrlsModal";
import { AdminFeesSection } from "@/components/admin/AdminFeesSection";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminGrants() {
  const { profile, loading: authLoading, profileLoading } = useAuth();
  const {
    grants,
    isLoading,
    verifyingGrants,
    getDaysSinceVerification,
    getDaysSinceAutoVerification,
    isUnverifiedByPerplexity,
    verifySingleGrant,
    verifyStaleGrants,
    verifyAllGrants,
    verifySelectedGrants,
    updateGrant,
    addGrant,
    deleteGrant,
    bulkUpdateUrls,
  } = useAdminGrants();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [provinceFilter, setProvinceFilter] = useState<string>("all");
  const [urlStatusFilter, setUrlStatusFilter] = useState<string>("all");
  const [verifyModalGrant, setVerifyModalGrant] = useState<Grant | null>(null);
  const [editModalGrant, setEditModalGrant] = useState<Grant | null>(null);
  const [isNewGrant, setIsNewGrant] = useState(false);
  const [deleteConfirmGrant, setDeleteConfirmGrant] = useState<Grant | null>(null);
  const [isBatchVerifying, setIsBatchVerifying] = useState(false);
  const [isVerifyingAll, setIsVerifyingAll] = useState(false);
  const [isRegeneratingIdeas, setIsRegeneratingIdeas] = useState(false);
  const [selectedGrants, setSelectedGrants] = useState<Set<string>>(new Set());
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [isVerifyingSelected, setIsVerifyingSelected] = useState(false);

  const queryClient = useQueryClient();

  // Auto-refresh grants list every 30 seconds while verifying all
  useEffect(() => {
    if (!isVerifyingAll) return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["admin-grants"] });
    }, 30000);
    return () => clearInterval(interval);
  }, [isVerifyingAll, queryClient]);

  // Wait for both auth and profile to load before checking admin status
  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect non-admins - check roles array from user_roles table
  const isAdmin = profile?.roles?.includes('admin');
  if (!profile || !isAdmin) {
    return <Navigate to="/app/dashboard" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filter grants
  const filteredGrants = grants?.filter((grant) => {
    const matchesSearch =
      grant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grant.organization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || grant.status === statusFilter;
    const matchesProvince =
      provinceFilter === "all" ||
      (provinceFilter === "federal" && !grant.province) ||
      grant.province === provinceFilter;
    const matchesUrlStatus =
      urlStatusFilter === "all" ||
      (urlStatusFilter === "unchecked" && (!grant.url_status || grant.url_status === "unchecked")) ||
      grant.url_status === urlStatusFilter;
    return matchesSearch && matchesStatus && matchesProvince && matchesUrlStatus;
  });

  // FIXED: Count stale grants using auto_verified_at (Perplexity AI verification)
  const staleCount = grants?.filter((g) => isUnverifiedByPerplexity(g, 30)).length || 0;
  
  // NEW: Count never-verified grants (auto_verified_at is null)
  const neverVerifiedCount = grants?.filter((g) => !g.auto_verified_at).length || 0;

  // Count broken/timeout URLs
  const brokenUrlCount = grants?.filter((g) => g.url_status === "broken" || g.url_status === "timeout").length || 0;

  // Multi-select handlers
  const toggleGrantSelection = (grantId: string) => {
    setSelectedGrants((prev) => {
      const next = new Set(prev);
      if (next.has(grantId)) {
        next.delete(grantId);
      } else {
        next.add(grantId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedGrants.size === filteredGrants?.length) {
      setSelectedGrants(new Set());
    } else {
      setSelectedGrants(new Set(filteredGrants?.map((g) => g.id) || []));
    }
  };

  const selectAllBrokenUrls = () => {
    const brokenIds = grants?.filter((g) => g.url_status === "broken" || g.url_status === "timeout").map((g) => g.id) || [];
    setSelectedGrants(new Set(brokenIds));
  };

  const clearSelection = () => {
    setSelectedGrants(new Set());
  };

  const handleBulkSave = async (updates: { id: string; application_url: string }[]) => {
    await bulkUpdateUrls.mutateAsync(updates);
  };

  const handleVerifySelected = async () => {
    setIsVerifyingSelected(true);
    await verifySelectedGrants(Array.from(selectedGrants));
    setIsVerifyingSelected(false);
    clearSelection();
  };

  const handleBatchVerify = async () => {
    setIsBatchVerifying(true);
    await verifyStaleGrants(30);
    setIsBatchVerifying(false);
  };

  // Handle verify ALL grants
  const handleVerifyAll = async () => {
    setIsVerifyingAll(true);
    await verifyAllGrants();
    setIsVerifyingAll(false);
  };

  const handleRegenerateIdeas = async () => {
    setIsRegeneratingIdeas(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) {
        toast.error("Not authenticated");
        return;
      }

      const response = await supabase.functions.invoke("ft_regenerate_ideas", {
        body: {},
      });

      if (response.error) {
        toast.error(`Regeneration failed: ${response.error.message}`);
        return;
      }

      const result = response.data;
      toast.success(
        `Regenerated ${result.regenerated} sessions. Skipped: ${result.skipped}. Errors: ${result.errors?.length || 0}`
      );
      console.log("[AdminGrants] Regeneration result:", result);
    } catch (err) {
      console.error("[AdminGrants] Regeneration error:", err);
      toast.error("Failed to regenerate ideas");
    } finally {
      setIsRegeneratingIdeas(false);
    }
  };

  const handleAddNew = () => {
    setIsNewGrant(true);
    setEditModalGrant(null);
  };

  const handleEdit = (grant: Grant) => {
    setIsNewGrant(false);
    setEditModalGrant(grant);
  };

  const handleSaveGrant = (grantData: Partial<Grant> & { id: string }) => {
    if (isNewGrant) {
      addGrant.mutate(grantData as Omit<Grant, "id" | "created_at" | "updated_at">);
    } else {
      updateGrant.mutate(grantData);
    }
  };

  const handleDelete = (grant: Grant) => {
    setDeleteConfirmGrant(grant);
  };

  const confirmDelete = () => {
    if (deleteConfirmGrant) {
      deleteGrant.mutate(deleteConfirmGrant.id);
      setDeleteConfirmGrant(null);
    }
  };

  const getStatusBadge = (status: string | null, autoVerifiedAt: string | null) => {
    const isAIVerified = !!autoVerifiedAt;
    
    switch (status) {
      case "open":
        if (isAIVerified) {
          return (
            <Badge className="bg-green-500/20 text-green-700 dark:text-green-400">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Verified Open
            </Badge>
          );
        }
        return (
          <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Listed as Open
          </Badge>
        );
      case "closed":
        return (
          <Badge variant="destructive">
            Closed
          </Badge>
        );
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  // URL status badge helper
  const getUrlStatusBadge = (urlStatus: string | null) => {
    switch (urlStatus) {
      case "accessible":
        return (
          <Badge className="bg-green-500/20 text-green-700 dark:text-green-400">
            <Link2 className="h-3 w-3 mr-1" />
            OK
          </Badge>
        );
      case "broken":
        return (
          <Badge variant="destructive">
            <Link2Off className="h-3 w-3 mr-1" />
            Broken
          </Badge>
        );
      case "timeout":
        return (
          <Badge className="bg-orange-500/20 text-orange-700 dark:text-orange-400">
            <Clock className="h-3 w-3 mr-1" />
            Timeout
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <HelpCircle className="h-3 w-3 mr-1" />
            Unchecked
          </Badge>
        );
    }
  };

  // FIXED: Show AI verification status based on auto_verified_at
  const getVerificationBadge = (grant: Grant) => {
    const autoVerifiedDays = getDaysSinceAutoVerification(grant.auto_verified_at);
    const lastVerifiedDays = getDaysSinceVerification(grant.last_verified);
    
    // Never verified by AI
    if (autoVerifiedDays === null) {
      return (
        <Badge variant="outline" className="text-yellow-600">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Never AI-verified
        </Badge>
      );
    }
    
    // AI verified but stale (30+ days)
    if (autoVerifiedDays >= 30) {
      return (
        <Badge variant="outline" className="text-orange-600">
          <Clock className="h-3 w-3 mr-1" />
          AI: {autoVerifiedDays}d ago
        </Badge>
      );
    }
    
    // Recently AI verified
    return (
      <Badge variant="outline" className="text-green-600">
        <ShieldCheck className="h-3 w-3 mr-1" />
        AI: {autoVerifiedDays}d ago
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Progress Alert during verification */}
      {isVerifyingAll && (
        <Alert className="border-primary/50 bg-primary/5">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Verifying ALL Grants with Perplexity AI</AlertTitle>
          <AlertDescription>
            This may take 3-4 minutes for {grants?.length || 0} grants. The list will auto-refresh every 30 seconds.
            You can also manually refresh by clicking the "Verify ALL" button again after completion.
          </AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Canadian Grants Administration</CardTitle>
              <CardDescription>
                Manage and verify Canadian funding programs ({grants?.length || 0} total, {neverVerifiedCount} never AI-verified, {staleCount} need verification, {brokenUrlCount} broken URLs)
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={handleRegenerateIdeas}
                disabled={isRegeneratingIdeas}
              >
                {isRegeneratingIdeas ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Regenerate All Ideas
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleBatchVerify}
                disabled={isBatchVerifying || staleCount === 0}
              >
                {isBatchVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Verify Stale ({staleCount})
                  </>
                )}
              </Button>
              {/* NEW: Verify ALL button */}
              <Button
                variant="default"
                onClick={handleVerifyAll}
                disabled={isVerifyingAll || !grants?.length}
              >
                {isVerifyingAll ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying ALL...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Verify ALL ({grants?.length || 0})
                  </>
                )}
              </Button>
              <Button onClick={handleAddNew}>
                <Plus className="mr-2 h-4 w-4" />
                Add Grant
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search grants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={provinceFilter} onValueChange={setProvinceFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Province" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Provinces</SelectItem>
                <SelectItem value="federal">Federal</SelectItem>
                <SelectItem value="ON">Ontario</SelectItem>
                <SelectItem value="BC">British Columbia</SelectItem>
                <SelectItem value="AB">Alberta</SelectItem>
                <SelectItem value="QC">Quebec</SelectItem>
              </SelectContent>
            </Select>
            <Select value={urlStatusFilter} onValueChange={setUrlStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="URL Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All URLs</SelectItem>
                <SelectItem value="accessible">OK</SelectItem>
                <SelectItem value="broken">Broken</SelectItem>
                <SelectItem value="timeout">Timeout</SelectItem>
                <SelectItem value="unchecked">Unchecked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions Bar */}
          {selectedGrants.size > 0 && (
            <div className="flex items-center gap-4 mb-4 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                {selectedGrants.size} grant(s) selected
              </span>
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsBulkEditOpen(true)}
              >
                <Wrench className="mr-2 h-4 w-4" />
                Fix URLs
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleVerifySelected}
                disabled={isVerifyingSelected}
              >
                {isVerifyingSelected ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Verify Selected ({selectedGrants.size})
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllBrokenUrls}
                disabled={brokenUrlCount === 0}
              >
                <Link2Off className="mr-2 h-4 w-4" />
                Select All Broken ({brokenUrlCount})
              </Button>
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                <X className="mr-2 h-4 w-4" />
                Clear Selection
              </Button>
            </div>
          )}

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={filteredGrants?.length > 0 && selectedGrants.size === filteredGrants?.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-[280px]">Program</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Province</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>AI Verified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGrants?.map((grant) => (
                  <TableRow key={grant.id} className={selectedGrants.has(grant.id) ? "bg-muted/50" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={selectedGrants.has(grant.id)}
                        onCheckedChange={() => toggleGrantSelection(grant.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{grant.name}</div>
                        <div className="text-sm text-muted-foreground">{grant.organization}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {grant.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{grant.province || "Federal"}</TableCell>
                    <TableCell>{getStatusBadge(grant.status, grant.auto_verified_at)}</TableCell>
                    <TableCell>{getUrlStatusBadge(grant.url_status)}</TableCell>
                    <TableCell>{getVerificationBadge(grant)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setVerifyModalGrant(grant)}
                          disabled={verifyingGrants.has(grant.id)}
                        >
                          {verifyingGrants.has(grant.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                        >
                          <a href={grant.application_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(grant)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDelete(grant)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredGrants?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No grants found matching your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Verification Modal */}
      <GrantVerificationModal
        grant={verifyModalGrant}
        isOpen={!!verifyModalGrant}
        onClose={() => setVerifyModalGrant(null)}
        onVerify={verifySingleGrant}
        isVerifying={verifyModalGrant ? verifyingGrants.has(verifyModalGrant.id) : false}
      />

      {/* Edit Modal */}
      <EditGrantModal
        grant={editModalGrant}
        isOpen={!!editModalGrant || isNewGrant}
        onClose={() => {
          setEditModalGrant(null);
          setIsNewGrant(false);
        }}
        onSave={handleSaveGrant}
        isNew={isNewGrant}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmGrant} onOpenChange={() => setDeleteConfirmGrant(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Grant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirmGrant?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Edit URLs Modal */}
      <BulkEditUrlsModal
        grants={grants?.filter((g) => selectedGrants.has(g.id)) || []}
        isOpen={isBulkEditOpen}
        onClose={() => setIsBulkEditOpen(false)}
        onSave={handleBulkSave}
        isSaving={bulkUpdateUrls.isPending}
      />

      {/* Business Structure Fees Section */}
      <AdminFeesSection />
    </div>
  );
}
