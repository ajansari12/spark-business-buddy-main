import { useState } from "react";
import { FileText, Share2, Mail, Megaphone, ChevronDown, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";
import { PitchGeneratorModal } from "./PitchGeneratorModal";
import { SocialPostsModal } from "./SocialPostsModal";
import { EmailSequenceModal } from "./EmailSequenceModal";

interface IdeaBuilderToolkitProps {
  ideaId: string;
  ideaName: string;
  ideaDescription: string;
}

type ContentType = 'pitch' | 'social' | 'emails';

interface ToolCard {
  id: ContentType | 'ads';
  icon: React.ElementType;
  title: string;
  description: string;
  comingSoon?: boolean;
}

const tools: ToolCard[] = [
  {
    id: 'pitch',
    icon: FileText,
    title: 'One-Page Pitch',
    description: 'Generate a professional pitch document',
  },
  {
    id: 'social',
    icon: Share2,
    title: 'Social Media Posts',
    description: 'LinkedIn, Twitter, Instagram posts',
  },
  {
    id: 'emails',
    icon: Mail,
    title: 'Launch Emails',
    description: '3-email announcement sequence',
  },
  {
    id: 'ads',
    icon: Megaphone,
    title: 'Ad Copy',
    description: 'Google and Facebook ads',
    comingSoon: true,
  },
];

export function IdeaBuilderToolkit({ ideaId, ideaName, ideaDescription }: IdeaBuilderToolkitProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [activeModal, setActiveModal] = useState<ContentType | null>(null);
  const [generating, setGenerating] = useState(false);
  const [pitchModalOpen, setPitchModalOpen] = useState(false);
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [emailsModalOpen, setEmailsModalOpen] = useState(false);

  // Fetch existing generated content
  const { data: generatedContent, refetch } = useQuery({
    queryKey: ['generated-content', ideaId],
    queryFn: async () => {
      if (!user) return {};
      
      const { data, error } = await supabase
        .from('ft_generated_content')
        .select('content_type, content, created_at')
        .eq('idea_id', ideaId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Convert to map for easy lookup
      const contentMap: Record<string, { content: unknown; created_at: string }> = {};
      data?.forEach(item => {
        contentMap[item.content_type] = { 
          content: item.content, 
          created_at: item.created_at 
        };
      });
      return contentMap;
    },
    enabled: !!user,
  });

  const hasContent = (type: ContentType) => {
    return !!generatedContent?.[type];
  };

  const handleGenerate = async (type: ContentType) => {
    if (!user) {
      toast.error("Please sign in to generate content");
      return;
    }

    setGenerating(true);
    
    try {
      // Generate content using Lovable AI (placeholder - would call edge function)
      const content = await generateContent(type, ideaName, ideaDescription);
      
      // Check if content already exists
      const existing = generatedContent?.[type];
      
      if (existing) {
      // Update existing
        const { error } = await supabase
          .from('ft_generated_content')
          .update({ 
            content: content as Json, 
            updated_at: new Date().toISOString() 
          })
          .eq('idea_id', ideaId)
          .eq('user_id', user.id)
          .eq('content_type', type);
        
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('ft_generated_content')
          .insert([{
            user_id: user.id,
            idea_id: ideaId,
            content_type: type,
            content: content as Json,
          }]);
        
        if (error) throw error;
      }
      
      await refetch();
      toast.success(`${tools.find(t => t.id === type)?.title} generated!`);
    } catch (error) {
      console.error('Failed to generate content:', error);
      toast.error("Failed to generate content. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleToolClick = (tool: ToolCard) => {
    if (tool.comingSoon) return;
    
    // Open dedicated modal for pitch
    if (tool.id === 'pitch') {
      setPitchModalOpen(true);
      return;
    }
    
    if (tool.id === 'social') {
      setSocialModalOpen(true);
      return;
    }
    
    if (tool.id === 'emails') {
      setEmailsModalOpen(true);
      return;
    }
    
    setActiveModal(tool.id as ContentType);
  };

  return (
    <>
      {/* Pitch Generator Modal */}
      <PitchGeneratorModal
        open={pitchModalOpen}
        onOpenChange={setPitchModalOpen}
        ideaId={ideaId}
        ideaName={ideaName}
      />
      
      {/* Social Posts Modal */}
      <SocialPostsModal
        open={socialModalOpen}
        onOpenChange={setSocialModalOpen}
        ideaId={ideaId}
        ideaName={ideaName}
      />
      
      {/* Email Sequence Modal */}
      <EmailSequenceModal
        open={emailsModalOpen}
        onOpenChange={setEmailsModalOpen}
        ideaId={ideaId}
        ideaName={ideaName}
      />
      
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-6">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl hover:from-primary/10 hover:to-accent/10 transition-colors border border-primary/10">
            <div className="flex items-center gap-2">
              <span className="text-lg">🛠️</span>
              <span className="font-semibold text-foreground">Idea Builder Toolkit</span>
              <Badge variant="secondary" className="text-xs">4 Tools</Badge>
            </div>
            <ChevronDown
              className={cn(
                "w-5 h-5 text-muted-foreground transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <p className="text-sm text-muted-foreground mb-4">
            Generate launch materials with AI
          </p>
          
          {/* 2x2 grid on desktop, single column on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tools.map((tool) => {
              const Icon = tool.icon;
              const hasExisting = tool.id !== 'ads' && hasContent(tool.id as ContentType);
              
              return (
                <Card 
                  key={tool.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    tool.comingSoon && "opacity-60 cursor-not-allowed",
                    hasExisting && "border-primary/30 bg-primary/5"
                  )}
                  onClick={() => handleToolClick(tool)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        tool.comingSoon ? "bg-muted" : "bg-primary/10"
                      )}>
                        <Icon className={cn(
                          "w-5 h-5",
                          tool.comingSoon ? "text-muted-foreground" : "text-primary"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-foreground text-sm">{tool.title}</h4>
                          {hasExisting && (
                            <Badge variant="outline" className="text-xs text-primary border-primary/30">
                              Ready
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{tool.description}</p>
                        
                        <Button
                          size="sm"
                          variant={tool.comingSoon ? "outline" : hasExisting ? "secondary" : "default"}
                          className="mt-2 w-full text-xs h-8"
                          disabled={tool.comingSoon}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!tool.comingSoon) {
                              handleToolClick(tool);
                            }
                          }}
                        >
                          {tool.comingSoon ? "Coming Soon" : hasExisting ? "View" : "Generate"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Content Modal */}
      <Dialog open={!!activeModal} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {activeModal && (
                <>
                  {(() => {
                    const tool = tools.find(t => t.id === activeModal);
                    const Icon = tool?.icon || FileText;
                    return <Icon className="w-5 h-5 text-primary" />;
                  })()}
                  {tools.find(t => t.id === activeModal)?.title}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {hasContent(activeModal!) 
                ? "Your generated content is ready. You can regenerate at any time."
                : "Click generate to create your content using AI."
              }
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {hasContent(activeModal!) ? (
              <ContentDisplay 
                type={activeModal!} 
                content={generatedContent?.[activeModal!]?.content} 
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Ready to generate {tools.find(t => t.id === activeModal)?.title.toLowerCase()}?
                </p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => activeModal && handleGenerate(activeModal)}
                disabled={generating}
                className="flex-1"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : hasContent(activeModal!) ? (
                  "Regenerate"
                ) : (
                  "Generate"
                )}
              </Button>
              <Button variant="outline" onClick={() => setActiveModal(null)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Content display component
function ContentDisplay({ type, content }: { type: ContentType; content: unknown }) {
  const data = content as Record<string, unknown>;
  
  if (type === 'pitch') {
    return (
      <div className="bg-muted/50 rounded-lg p-4 space-y-4">
        <h3 className="font-semibold text-lg">{data?.title as string || 'Your One-Page Pitch'}</h3>
        <div className="prose prose-sm dark:prose-invert">
          <p className="whitespace-pre-wrap">{data?.content as string}</p>
        </div>
      </div>
    );
  }
  
  if (type === 'social') {
    const posts = data?.posts as Array<{ platform: string; content: string }> || [];
    return (
      <div className="space-y-4">
        {posts.map((post, i) => (
          <div key={i} className="bg-muted/50 rounded-lg p-4">
            <Badge variant="secondary" className="mb-2">{post.platform}</Badge>
            <p className="text-sm whitespace-pre-wrap">{post.content}</p>
          </div>
        ))}
      </div>
    );
  }
  
  if (type === 'emails') {
    const emails = data?.emails as Array<{ subject: string; body: string }> || [];
    return (
      <div className="space-y-4">
        {emails.map((email, i) => (
          <div key={i} className="bg-muted/50 rounded-lg p-4">
            <p className="font-medium text-sm mb-2">Email {i + 1}: {email.subject}</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{email.body}</p>
          </div>
        ))}
      </div>
    );
  }
  
  return <p className="text-muted-foreground">Content not available</p>;
}

// Placeholder content generator (would be replaced with edge function call)
async function generateContent(type: ContentType, ideaName: string, ideaDescription: string): Promise<Record<string, unknown>> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  if (type === 'pitch') {
    return {
      title: ideaName,
      content: `# ${ideaName}

## The Problem
Many people face challenges that ${ideaName.toLowerCase()} solves.

## Our Solution
${ideaDescription}

## Market Opportunity
The market for this solution is growing rapidly in Canada.

## Business Model
Service-based revenue with potential for recurring customers.

## Call to Action
Let's discuss how we can bring this idea to life together.`
    };
  }
  
  if (type === 'social') {
    return {
      posts: [
        {
          platform: 'LinkedIn',
          content: `🚀 Exciting news! I'm launching ${ideaName}.\n\n${ideaDescription.slice(0, 150)}...\n\nStay tuned for more updates!\n\n#Entrepreneurship #CanadianBusiness #Startup`,
        },
        {
          platform: 'Twitter/X',
          content: `Just launched ${ideaName}! 🍁\n\n${ideaDescription.slice(0, 100)}...\n\nDM me if you're interested! #CanadianStartup`,
        },
        {
          platform: 'Instagram',
          content: `✨ New venture alert! ✨\n\nIntroducing ${ideaName}\n\n${ideaDescription.slice(0, 120)}...\n\nLink in bio to learn more!\n\n#SmallBusiness #CanadianEntrepreneur #NewBusiness`,
        },
      ],
    };
  }
  
  if (type === 'emails') {
    return {
      emails: [
        {
          subject: `Something exciting is coming: ${ideaName}`,
          body: `Hi [Name],\n\nI wanted to personally reach out because I'm launching something I think you'll love.\n\n${ideaName} is ${ideaDescription.slice(0, 200)}...\n\nI'd love to get your feedback. Would you be interested in being one of my first customers?\n\nBest,\n[Your Name]`,
        },
        {
          subject: `${ideaName} is now live!`,
          body: `Hi [Name],\n\nThe wait is over! ${ideaName} is officially launching today.\n\nAs a thank you for your early interest, I'm offering you an exclusive [discount/bonus].\n\n[Call to action]\n\nLooking forward to serving you!\n\nBest,\n[Your Name]`,
        },
        {
          subject: `Last chance: Special offer for ${ideaName}`,
          body: `Hi [Name],\n\nJust a quick reminder that the special launch offer for ${ideaName} ends tomorrow.\n\nDon't miss out on [special offer details].\n\n[Call to action]\n\nBest,\n[Your Name]`,
        },
      ],
    };
  }
  
  return {};
}
