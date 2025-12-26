import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { canadianProvinces } from "@/data/provinces";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const profileSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(100),
  phone: z.string().max(20).optional().or(z.literal("")),
  province: z.string().optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const ProfileSection = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || "",
      phone: profile?.phone || "",
      province: profile?.province || "",
      city: profile?.city || "",
    },
  });

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setValue("full_name", profile.full_name || "");
      setValue("phone", profile.phone || "");
      setValue("province", profile.province || "");
      setValue("city", profile.city || "");
    }
  }, [profile, setValue]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: data.full_name,
          phone: data.phone || null,
          province: data.province || null,
          city: data.city || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      await refreshProfile();
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedProvince = watch("province");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">Full Name</Label>
        <Input
          id="full_name"
          {...register("full_name")}
          placeholder="Your full name"
          className="h-12"
        />
        {errors.full_name && (
          <p className="text-sm text-destructive">{errors.full_name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          value={user?.email || ""}
          disabled
          className="h-12 bg-muted"
        />
        <p className="text-xs text-muted-foreground">
          Email cannot be changed
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input
          id="phone"
          type="tel"
          {...register("phone")}
          placeholder="(555) 123-4567"
          className="h-12"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="province">Province</Label>
        <Select
          value={selectedProvince}
          onValueChange={(value) => setValue("province", value, { shouldDirty: true })}
        >
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Select province" />
          </SelectTrigger>
          <SelectContent>
            {canadianProvinces.map((province) => (
              <SelectItem key={province.value} value={province.value}>
                {province.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        <Input
          id="city"
          {...register("city")}
          placeholder="Your city"
          className="h-12"
        />
      </div>

      <Button
        type="submit"
        disabled={!isDirty || isSaving}
        className="w-full h-12"
      >
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Changes"
        )}
      </Button>
    </form>
  );
};

export default ProfileSection;
