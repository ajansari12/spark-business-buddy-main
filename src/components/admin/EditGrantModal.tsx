import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Grant } from "@/hooks/useAdminGrants";

interface EditGrantModalProps {
  grant: Grant | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (grant: Partial<Grant> & { id: string }) => void;
  isNew?: boolean;
}

const PROVINCES = [
  { value: "", label: "Federal (All Provinces)" },
  { value: "ON", label: "Ontario" },
  { value: "BC", label: "British Columbia" },
  { value: "AB", label: "Alberta" },
  { value: "QC", label: "Quebec" },
  { value: "MB", label: "Manitoba" },
  { value: "SK", label: "Saskatchewan" },
  { value: "NS", label: "Nova Scotia" },
  { value: "NB", label: "New Brunswick" },
  { value: "NL", label: "Newfoundland & Labrador" },
  { value: "PE", label: "Prince Edward Island" },
  { value: "NT", label: "Northwest Territories" },
  { value: "YT", label: "Yukon" },
  { value: "NU", label: "Nunavut" },
];

const GRANT_TYPES = [
  { value: "grant", label: "Grant" },
  { value: "loan", label: "Loan" },
  { value: "program", label: "Program" },
];

const STATUSES = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];

export function EditGrantModal({
  grant,
  isOpen,
  onClose,
  onSave,
  isNew = false,
}: EditGrantModalProps) {
  const [formData, setFormData] = useState<Partial<Grant>>({});

  useEffect(() => {
    if (grant) {
      setFormData(grant);
    } else if (isNew) {
      setFormData({
        name: "",
        organization: "",
        type: "grant",
        province: null,
        status: "open",
        description: "",
        why_apply: "",
        application_url: "",
        amount_min: null,
        amount_max: null,
        eligibility_notes: "",
        eligibility_age_min: 18,
        eligibility_age_max: 99,
        eligibility_citizen_required: false,
        eligibility_pr_eligible: true,
        eligibility_indigenous_only: false,
      });
    }
  }, [grant, isNew]);

  const handleSubmit = () => {
    if (!formData.name || !formData.organization || !formData.application_url) {
      return;
    }

    if (isNew) {
      // For new grants, we need to let the DB generate the ID
      onSave({ ...formData, id: crypto.randomUUID() } as Grant);
    } else if (grant) {
      onSave({ ...formData, id: grant.id } as Grant);
    }
    onClose();
  };

  const updateField = (field: keyof Grant, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{isNew ? "Add New Grant" : "Edit Grant"}</DialogTitle>
          <DialogDescription>
            {isNew
              ? "Add a new Canadian funding program to the database."
              : "Update the grant information below."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Basic Information</h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Program Name *</Label>
                  <Input
                    id="name"
                    value={formData.name || ""}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="e.g., Futurpreneur Canada"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization *</Label>
                  <Input
                    id="organization"
                    value={formData.organization || ""}
                    onChange={(e) => updateField("organization", e.target.value)}
                    placeholder="e.g., Government of Canada"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type || "grant"}
                    onValueChange={(v) => updateField("type", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GRANT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="province">Province</Label>
                  <Select
                    value={formData.province || ""}
                    onValueChange={(v) => updateField("province", v || null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVINCES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status || "open"}
                    onValueChange={(v) => updateField("status", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="application_url">Application URL *</Label>
                <Input
                  id="application_url"
                  type="url"
                  value={formData.application_url || ""}
                  onChange={(e) => updateField("application_url", e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Descriptions */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium text-sm text-muted-foreground">Descriptions</h4>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={3}
                  placeholder="What is this program about?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="why_apply">Why Apply</Label>
                <Textarea
                  id="why_apply"
                  value={formData.why_apply || ""}
                  onChange={(e) => updateField("why_apply", e.target.value)}
                  rows={2}
                  placeholder="Key benefits for applicants"
                />
              </div>
            </div>

            {/* Funding Amounts */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium text-sm text-muted-foreground">Funding Amounts</h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount_min">Minimum Amount ($CAD)</Label>
                  <Input
                    id="amount_min"
                    type="number"
                    value={formData.amount_min || ""}
                    onChange={(e) =>
                      updateField("amount_min", e.target.value ? parseInt(e.target.value) : null)
                    }
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount_max">Maximum Amount ($CAD)</Label>
                  <Input
                    id="amount_max"
                    type="number"
                    value={formData.amount_max || ""}
                    onChange={(e) =>
                      updateField("amount_max", e.target.value ? parseInt(e.target.value) : null)
                    }
                    placeholder="100000"
                  />
                </div>
              </div>
            </div>

            {/* Eligibility */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium text-sm text-muted-foreground">Eligibility Requirements</h4>

              <div className="space-y-2">
                <Label htmlFor="eligibility_notes">Eligibility Notes</Label>
                <Textarea
                  id="eligibility_notes"
                  value={formData.eligibility_notes || ""}
                  onChange={(e) => updateField("eligibility_notes", e.target.value)}
                  rows={2}
                  placeholder="Who can apply for this program?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eligibility_age_min">Minimum Age</Label>
                  <Input
                    id="eligibility_age_min"
                    type="number"
                    value={formData.eligibility_age_min || ""}
                    onChange={(e) =>
                      updateField("eligibility_age_min", e.target.value ? parseInt(e.target.value) : null)
                    }
                    placeholder="18"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eligibility_age_max">Maximum Age</Label>
                  <Input
                    id="eligibility_age_max"
                    type="number"
                    value={formData.eligibility_age_max || ""}
                    onChange={(e) =>
                      updateField("eligibility_age_max", e.target.value ? parseInt(e.target.value) : null)
                    }
                    placeholder="99"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="citizen_required">Citizenship Required</Label>
                  <Switch
                    id="citizen_required"
                    checked={formData.eligibility_citizen_required || false}
                    onCheckedChange={(v) => updateField("eligibility_citizen_required", v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="pr_eligible">Permanent Residents Eligible</Label>
                  <Switch
                    id="pr_eligible"
                    checked={formData.eligibility_pr_eligible !== false}
                    onCheckedChange={(v) => updateField("eligibility_pr_eligible", v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="indigenous_only">Indigenous Only</Label>
                  <Switch
                    id="indigenous_only"
                    checked={formData.eligibility_indigenous_only || false}
                    onCheckedChange={(v) => updateField("eligibility_indigenous_only", v)}
                  />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.name || !formData.organization || !formData.application_url}
          >
            {isNew ? "Add Grant" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
