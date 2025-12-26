import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Copy,
  Mail,
  MessageCircle,
  Linkedin,
  Twitter,
  Gift,
  Users,
  DollarSign,
  Target,
  Check,
  Trophy,
  Send,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useReferrals } from "@/hooks/useReferrals";
import { toast } from "sonner";
import { format } from "date-fns";

const Referrals = () => {
  const {
    referralCode,
    referralLink,
    referrals,
    stats,
    rewardTiers,
    isLoading,
    error,
    refetch,
    sendInvite,
    isSending,
  } = useReferrals();
  
  const [inviteEmail, setInviteEmail] = useState("");

  const handleCopyLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleShare = (platform: string) => {
    if (!referralLink) return;
    
    const message = encodeURIComponent(
      `I've been using FastTrack to discover amazing business ideas. Use my link to get started: ${referralLink}`
    );
    
    const urls: Record<string, string> = {
      email: `mailto:?subject=${encodeURIComponent("Check out FastTrack!")}&body=${message}`,
      whatsapp: `https://wa.me/?text=${message}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`,
      twitter: `https://twitter.com/intent/tweet?text=${message}`,
    };
    
    window.open(urls[platform], "_blank");
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteEmail) {
      sendInvite(inviteEmail);
      setInviteEmail("");
    }
  };

  const maskEmail = (email: string) => {
    const [name, domain] = email.split("@");
    return `${name.charAt(0)}${"*".repeat(Math.min(name.length - 1, 3))}@${domain}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "converted":
        return <Badge className="bg-green-500 hover:bg-green-600">Signed Up</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const convertedCount = referrals.filter((r) => r.status === "converted").length;
  const progressPercent = Math.min((convertedCount / 10) * 100, 100);

  // Error state
  if (error && !isLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription className="mt-2">
            We couldn't load your referral data. Please try again.
          </AlertDescription>
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            className="mt-3"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Gift className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
          Give $10, Get $10
        </h1>
        <p className="text-muted-foreground">
          Share FastTrack with friends and earn rewards
        </p>
      </div>

      {/* Referral Link Card */}
      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          {isLoading ? (
            <Skeleton className="h-12 w-full mb-4" />
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-2">Your unique referral link</p>
              <div className="flex gap-2 mb-4">
                <Input
                  value={referralLink || ""}
                  readOnly
                  className="font-mono text-sm bg-background"
                />
                <Button onClick={handleCopyLink} size="lg" className="shrink-0">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
              </div>
              
              {/* Share Buttons */}
              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare("email")}
                  className="gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare("whatsapp")}
                  className="gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare("linkedin")}
                  className="gap-2"
                >
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare("twitter")}
                  className="gap-2"
                >
                  <Twitter className="w-4 h-4" />
                  Twitter
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <>
                <Send className="w-5 h-5 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold text-foreground">{stats.invitesSent}</p>
                <p className="text-xs text-muted-foreground">Invites Sent</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <>
                <Users className="w-5 h-5 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold text-foreground">{stats.signups}</p>
                <p className="text-xs text-muted-foreground">Signups</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <>
                <DollarSign className="w-5 h-5 mx-auto mb-2 text-amber-500" />
                <p className="text-2xl font-bold text-foreground">${stats.creditsEarned}</p>
                <p className="text-xs text-muted-foreground">Credits Earned</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <>
                <Target className="w-5 h-5 mx-auto mb-2 text-purple-500" />
                <p className="text-2xl font-bold text-foreground">
                  {stats.nextRewardAt > 0 ? stats.nextRewardAt : "🎉"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.nextRewardAt > 0 ? "To Next Reward" : "All Unlocked!"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reward Tiers */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Reward Tiers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercent} className="h-2 mb-4" />
          <div className="space-y-3">
            {rewardTiers.map((tier, index) => {
              const isUnlocked = convertedCount >= tier.referrals;
              const isNext = !isUnlocked && (index === 0 || convertedCount >= rewardTiers[index - 1].referrals);
              
              return (
                <div
                  key={tier.referrals}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isUnlocked
                      ? "bg-green-500/10 border-green-500/30"
                      : isNext
                      ? "bg-primary/5 border-primary/20"
                      : "bg-muted/30 border-muted"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isUnlocked ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isUnlocked ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <span className="text-sm font-bold">{tier.referrals}</span>
                      )}
                    </div>
                    <div>
                      <p className={`font-medium ${isUnlocked ? "text-foreground" : "text-muted-foreground"}`}>
                        {tier.referrals} referral{tier.referrals > 1 ? "s" : ""}
                      </p>
                      <p className="text-sm text-muted-foreground">{tier.reward}</p>
                    </div>
                  </div>
                  {tier.referrals === 10 && (
                    <Trophy className="w-5 h-5 text-amber-500" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Send Invite Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Send Direct Invite</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendInvite} className="flex gap-2">
            <Input
              type="email"
              placeholder="friend@email.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={!inviteEmail || isSending}>
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Referral History */}
      <Card>
        <CardHeader>
          <CardTitle>Referral History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : referrals.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground">No referrals yet</p>
              <p className="text-sm text-muted-foreground">
                Share your link to start earning rewards!
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Reward</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map((referral) => (
                  <TableRow key={referral.id}>
                    <TableCell className="font-mono text-sm">
                      {maskEmail(referral.referred_email)}
                    </TableCell>
                    <TableCell>{getStatusBadge(referral.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(referral.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      {referral.reward_amount ? (
                        <span className="text-green-600 font-medium">
                          ${referral.reward_amount}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Referrals;
