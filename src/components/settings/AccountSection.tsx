import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import DeleteAccountDialog from "./DeleteAccountDialog";

const AccountSection = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        onClick={handleSignOut}
        className="w-full h-12 gap-2"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>

      <div className="pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground mb-4">
          Permanently delete your account and all associated data.
        </p>
        <DeleteAccountDialog />
      </div>
    </div>
  );
};

export default AccountSection;
