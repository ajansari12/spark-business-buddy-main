import { useState } from "react";
import { Share2, Copy, RefreshCw, Loader2, Check, ChevronDown, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SocialPostsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ideaId: string;
  ideaName: string;
}

type Platform = 'linkedin' | 'twitter' | 'instagram' | 'facebook';
type Tone = 'professional' | 'casual' | 'excited';

interface PlatformPost {
  content: string;
  hashtags: string[];
}

interface SocialContent {
  posts: Record<Platform, PlatformPost>;
  settings: {
    tone: Tone;
    includeEmojis: boolean;
    includeHashtags: boolean;
  };
  generated_at: string;
}

const platformConfig: Record<Platform, { label: string; icon: string; maxChars: number | null; color: string }> = {
  linkedin: { label: 'LinkedIn', icon: 'in', maxChars: 1300, color: 'bg-[#0077b5]' },
  twitter: { label: 'Twitter/X', icon: '𝕏', maxChars: 280, color: 'bg-foreground' },
  instagram: { label: 'Instagram', icon: '📷', maxChars: 2200, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  facebook: { label: 'Facebook', icon: 'f', maxChars: null, color: 'bg-[#1877f2]' },
};

export function SocialPostsModal({ open, onOpenChange, ideaId, ideaName }: SocialPostsModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Platform>('linkedin');
  const [copiedPlatform, setCopiedPlatform] = useState<Platform | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Settings state
  const [tone, setTone] = useState<Tone>('professional');
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [includeHashtags, setIncludeHashtags] = useState(true);

  const [regeneratingPlatform, setRegeneratingPlatform] = useState<Platform | null>(null);

  // Fetch existing content
  const { data: existingContent, isLoading: isLoadingExisting } = useQuery({
    queryKey: ['social-content', ideaId],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('ft_generated_content')
        .select('content, created_at, updated_at')
        .eq('idea_id', ideaId)
        .eq('user_id', user.id)
        .eq('content_type', 'social')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user && open,
  });

  const socialContent = existingContent?.content as unknown as SocialContent | undefined;

  // Generate mutation
  const generateMutation = useMutation({
    mutationFn: async (regenerate: boolean) => {
      const { data, error } = await supabase.functions.invoke('ft_generate_social_posts', {
        body: { 
          idea_id: ideaId, 
          regenerate,
          settings: { tone, includeEmojis, includeHashtags }
        }
      });
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-content', ideaId] });
      queryClient.invalidateQueries({ queryKey: ['generated-content', ideaId] });
      toast.success("Social posts generated!");
    },
    onError: (error: Error) => {
      console.error('Social posts generation error:', error);
      toast.error(error.message || "Failed to generate posts");
    },
  });

  const handleGenerate = (regenerate = false) => {
    generateMutation.mutate(regenerate);
  };

  // Per-platform regeneration
  const regeneratePlatformMutation = useMutation({
    mutationFn: async (platform: Platform) => {
      setRegeneratingPlatform(platform);
      const { data, error } = await supabase.functions.invoke('ft_generate_social_posts', {
        body: { 
          idea_id: ideaId, 
          regenerate: true,
          platforms: [platform],
          settings: { tone, includeEmojis, includeHashtags }
        }
      });
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-content', ideaId] });
      queryClient.invalidateQueries({ queryKey: ['generated-content', ideaId] });
      toast.success(`${platformConfig[regeneratingPlatform!].label} post regenerated!`);
      setRegeneratingPlatform(null);
    },
    onError: (error: Error) => {
      console.error('Platform regeneration error:', error);
      toast.error(error.message || "Failed to regenerate post");
      setRegeneratingPlatform(null);
    },
  });

  const handleRegeneratePlatform = (platform: Platform) => {
    regeneratePlatformMutation.mutate(platform);
  };

  const handleCopy = async (platform: Platform) => {
    const post = socialContent?.posts[platform];
    if (!post) return;

    const fullContent = includeHashtags && post.hashtags?.length 
      ? `${post.content}\n\n${post.hashtags.map(h => `#${h}`).join(' ')}`
      : post.content;

    try {
      await navigator.clipboard.writeText(fullContent);
      setCopiedPlatform(platform);
      toast.success(`${platformConfig[platform].label} post copied!`);
      setTimeout(() => setCopiedPlatform(null), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const getCharCount = (platform: Platform) => {
    const post = socialContent?.posts[platform];
    if (!post) return 0;
    const hashtags = post.hashtags?.map(h => `#${h}`).join(' ') || '';
    return post.content.length + (hashtags ? hashtags.length + 2 : 0);
  };

  const isOverLimit = (platform: Platform) => {
    const config = platformConfig[platform];
    if (!config.maxChars) return false;
    return getCharCount(platform) > config.maxChars;
  };

  const isGenerating = generateMutation.isPending;
  const hasPosts = !!socialContent?.posts;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Social Media Posts Generator
          </DialogTitle>
          <DialogDescription>
            {hasPosts 
              ? `Generated posts for "${ideaName}"`
              : `Generate launch posts for "${ideaName}"`
            }
          </DialogDescription>
        </DialogHeader>

        {/* Settings Collapsible */}
        <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </span>
              <ChevronDown className={cn("w-4 h-4 transition-transform", settingsOpen && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 pb-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Tone Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tone</Label>
                <div className="flex flex-wrap gap-2">
                  {(['professional', 'casual', 'excited'] as Tone[]).map((t) => (
                    <Button
                      key={t}
                      size="sm"
                      variant={tone === t ? "default" : "outline"}
                      onClick={() => setTone(t)}
                      className="capitalize text-xs"
                    >
                      {t}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Emoji Toggle */}
              <div className="flex items-center justify-between sm:flex-col sm:items-start gap-2">
                <Label htmlFor="emojis" className="text-sm font-medium">Include Emojis</Label>
                <Switch
                  id="emojis"
                  checked={includeEmojis}
                  onCheckedChange={setIncludeEmojis}
                />
              </div>

              {/* Hashtags Toggle */}
              <div className="flex items-center justify-between sm:flex-col sm:items-start gap-2">
                <Label htmlFor="hashtags" className="text-sm font-medium">Include Hashtags</Label>
                <Switch
                  id="hashtags"
                  checked={includeHashtags}
                  onCheckedChange={setIncludeHashtags}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Platform Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Platform)} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-4">
            {(Object.keys(platformConfig) as Platform[]).map((platform) => (
              <TabsTrigger key={platform} value={platform} className="text-xs sm:text-sm">
                <span className="hidden sm:inline">{platformConfig[platform].label}</span>
                <span className="sm:hidden">{platformConfig[platform].icon}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {isLoadingExisting ? (
            <div className="space-y-4 mt-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-8 w-24" />
            </div>
          ) : isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-lg font-medium text-foreground">Generating your posts...</p>
              <p className="text-sm text-muted-foreground">Creating platform-optimized content</p>
              <div className="space-y-2 w-full max-w-md">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>
          ) : hasPosts ? (
            <>
              {(Object.keys(platformConfig) as Platform[]).map((platform) => (
                <TabsContent key={platform} value={platform} className="flex-1 mt-4 min-h-0">
                  <ScrollArea className="h-[40vh]">
                    <PostCard
                      platform={platform}
                      post={socialContent.posts[platform]}
                      charCount={getCharCount(platform)}
                      maxChars={platformConfig[platform].maxChars}
                      isOverLimit={isOverLimit(platform)}
                      isCopied={copiedPlatform === platform}
                      onCopy={() => handleCopy(platform)}
                      onRegenerate={() => handleRegeneratePlatform(platform)}
                      isRegenerating={regeneratingPlatform === platform}
                      includeHashtags={includeHashtags}
                    />
                  </ScrollArea>
                </TabsContent>
              ))}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Share2 className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Posts Generated Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Click "Generate Posts" to create launch announcements for all platforms.
              </p>
            </div>
          )}
        </Tabs>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-4 border-t mt-4">
          {hasPosts ? (
            <>
              <Button 
                onClick={() => handleGenerate(true)} 
                disabled={isGenerating}
                className="flex-1 sm:flex-none"
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", isGenerating && "animate-spin")} />
                Regenerate All
              </Button>
            </>
          ) : (
            <Button 
              onClick={() => handleGenerate(false)} 
              disabled={isGenerating}
              className="w-full sm:w-auto"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-2" />
                  Generate Posts
                </>
              )}
            </Button>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="ml-auto">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface PostCardProps {
  platform: Platform;
  post: PlatformPost;
  charCount: number;
  maxChars: number | null;
  isOverLimit: boolean;
  isCopied: boolean;
  onCopy: () => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
  includeHashtags: boolean;
}

function PostCard({ platform, post, charCount, maxChars, isOverLimit, isCopied, onCopy, onRegenerate, isRegenerating, includeHashtags }: PostCardProps) {
  if (!post) return null;

  return (
    <div className="space-y-4">
      {/* Platform Badge */}
      <div className="flex items-center justify-between">
        <Badge className={cn("text-primary-foreground", platformConfig[platform].color)}>
          {platformConfig[platform].label}
        </Badge>
        {maxChars && (
          <span className={cn(
            "text-xs font-medium",
            isOverLimit ? "text-destructive" : "text-muted-foreground"
          )}>
            {charCount}/{maxChars} chars
            {isOverLimit && " ⚠️"}
          </span>
        )}
      </div>

      {/* Post Content */}
      <div className="bg-muted/50 rounded-lg p-4 border">
        <p className="whitespace-pre-wrap text-foreground">{post.content}</p>
        
        {includeHashtags && post.hashtags?.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border/50">
            <p className="text-primary text-sm">
              {post.hashtags.map(h => `#${h}`).join(' ')}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onCopy} className="flex-1 sm:flex-none">
          {isCopied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
          {isCopied ? "Copied!" : "Copy Post"}
        </Button>
        <Button size="sm" variant="outline" onClick={onRegenerate} disabled={isRegenerating} className="flex-1 sm:flex-none">
          <RefreshCw className={cn("w-4 h-4 mr-2", isRegenerating && "animate-spin")} />
          {isRegenerating ? "Regenerating..." : "Regenerate"}
        </Button>
      </div>
    </div>
  );
}
