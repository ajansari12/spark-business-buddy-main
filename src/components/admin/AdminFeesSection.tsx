import { useState } from "react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  Clock,
  DollarSign,
} from "lucide-react";
import { useAdminFees, type AdminFee } from "@/hooks/useAdminFees";

const PROVINCE_NAMES: Record<string, string> = {
  ON: "Ontario",
  BC: "British Columbia",
  AB: "Alberta",
  QC: "Quebec",
  SK: "Saskatchewan",
  MB: "Manitoba",
};

const STRUCTURE_NAMES: Record<string, string> = {
  sole_proprietorship: "Sole Proprietorship",
  partnership: "Partnership",
  corporation: "Corporation",
};

function formatVerificationDate(dateString: string | null): string {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-CA", { 
    month: "short", 
    day: "numeric",
    year: "numeric" 
  });
}

export function AdminFeesSection() {
  const {
    fees,
    isLoading,
    isVerifying,
    getDaysSinceVerification,
    isStale,
    batchVerifyFees,
    stats,
  } = useAdminFees();

  const [provinceFilter, setProvinceFilter] = useState<string>("all");

  // Filter fees by province
  const filteredFees = fees?.filter((fee) => {
    return provinceFilter === "all" || fee.province_code === provinceFilter;
  });

  const getVerificationBadge = (fee: AdminFee) => {
    const days = getDaysSinceVerification(fee.last_verified);
    
    if (days === null) {
      return (
        <Badge variant="outline" className="text-yellow-600">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Never verified
        </Badge>
      );
    }
    
    if (days >= 30) {
      return (
        <Badge variant="outline" className="text-orange-600">
          <Clock className="h-3 w-3 mr-1" />
          {days}d ago
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="text-green-600">
        <ShieldCheck className="h-3 w-3 mr-1" />
        {days}d ago
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Business Structure Fees
            </CardTitle>
            <CardDescription>
              {stats.totalFees} fees across {stats.provincesWithFees} provinces
              {stats.staleFees > 0 && ` • ${stats.staleFees} stale`}
              {stats.neverVerified > 0 && ` • ${stats.neverVerified} never verified`}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={provinceFilter} onValueChange={setProvinceFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Province" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Provinces</SelectItem>
                {Object.entries(PROVINCE_NAMES).map(([code, name]) => (
                  <SelectItem key={code} value={code}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => batchVerifyFees()}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Verify All Provinces
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!fees || fees.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium mb-2">No fees verified yet</p>
            <p className="text-sm mb-4">Click "Verify All Provinces" to fetch current government fees</p>
            <Button onClick={() => batchVerifyFees()} disabled={isVerifying}>
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Verify All Provinces
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Province</TableHead>
                  <TableHead>Business Structure</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Last Verified</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFees?.map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell className="font-medium">
                      {PROVINCE_NAMES[fee.province_code] || fee.province_code}
                    </TableCell>
                    <TableCell>
                      {STRUCTURE_NAMES[fee.structure_type] || fee.structure_type}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono">
                        {fee.verified_fee}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {fee.fee_notes || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {getVerificationBadge(fee)}
                        <span className="text-xs text-muted-foreground">
                          {formatVerificationDate(fee.last_verified)}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
