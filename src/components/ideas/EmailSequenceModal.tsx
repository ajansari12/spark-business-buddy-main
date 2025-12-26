import { useState } from "react";
import { Mail, Copy, RefreshCw, Loader2, Check, ChevronDown, Settings, Download, Eye, EyeOff, Code } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EmailSequenceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ideaId: string;
  ideaName: string;
}

type Tone = 'professional' | 'friendly' | 'urgent';

interface Email {
  type: string;
  subject: string;
  previewText: string;
  body: string;
  ctaText: string;
}

interface EmailContent {
  emails: Email[];
  settings: {
    tone: Tone;
    emojisInSubject: boolean;
    businessName: string;
    offerDetails: string;
  };
  businessName: string;
  generated_at: string;
}

const emailLabels: Record<string, { title: string; description: string; icon: string }> = {
  launch: { 
    title: "Email 1: Launch Announcement", 
    description: "Introduce your business and build excitement",
    icon: "🚀"
  },
  early_bird: { 
    title: "Email 2: Early Bird Offer", 
    description: "Highlight special offers for early adopters",
    icon: "🐦"
  },
  last_chance: { 
    title: "Email 3: Last Chance", 
    description: "Create urgency with final reminder",
    icon: "⏰"
  },
};

export function EmailSequenceModal({ open, onOpenChange, ideaId, ideaName }: EmailSequenceModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<Record<string, boolean>>({});
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  
  // Settings state
  const [tone, setTone] = useState<Tone>('professional');
  const [emojisInSubject, setEmojisInSubject] = useState(false);
  const [businessName, setBusinessName] = useState(ideaName);
  const [offerDetails, setOfferDetails] = useState('');

  // Editable email state
  const [editedEmails, setEditedEmails] = useState<Record<string, Partial<Email>>>({});
  const [regeneratingEmail, setRegeneratingEmail] = useState<string | null>(null);

  // Fetch existing content
  const { data: existingContent, isLoading: isLoadingExisting } = useQuery({
    queryKey: ['emails-content', ideaId],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('ft_generated_content')
        .select('content, created_at, updated_at')
        .eq('idea_id', ideaId)
        .eq('user_id', user.id)
        .eq('content_type', 'emails')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user && open,
  });

  const emailContent = existingContent?.content as unknown as EmailContent | undefined;

  // Generate all mutation
  const generateMutation = useMutation({
    mutationFn: async (regenerate: boolean) => {
      const { data, error } = await supabase.functions.invoke('ft_generate_email_sequence', {
        body: { 
          idea_id: ideaId, 
          regenerate,
          settings: { tone, emojisInSubject, businessName, offerDetails }
        }
      });
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails-content', ideaId] });
      queryClient.invalidateQueries({ queryKey: ['generated-content', ideaId] });
      setEditedEmails({});
      toast.success("Email sequence generated!");
    },
    onError: (error: Error) => {
      console.error('Email generation error:', error);
      toast.error(error.message || "Failed to generate emails");
    },
  });

  // Regenerate single email mutation
  const regenerateEmailMutation = useMutation({
    mutationFn: async (emailType: string) => {
      const { data, error } = await supabase.functions.invoke('ft_generate_email_sequence', {
        body: { 
          idea_id: ideaId, 
          regenerate: true,
          email_type: emailType,
          settings: { tone, emojisInSubject, businessName, offerDetails }
        }
      });
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return { emailType, data };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['emails-content', ideaId] });
      setRegeneratingEmail(null);
      // Clear edits for this email type
      setEditedEmails(prev => {
        const updated = { ...prev };
        delete updated[result.emailType];
        return updated;
      });
      toast.success(`${emailLabels[result.emailType]?.title || 'Email'} regenerated!`);
    },
    onError: (error: Error) => {
      console.error('Email regeneration error:', error);
      setRegeneratingEmail(null);
      toast.error(error.message || "Failed to regenerate email");
    },
  });

  const handleGenerate = (regenerate = false) => {
    generateMutation.mutate(regenerate);
  };

  const handleRegenerateEmail = (emailType: string) => {
    setRegeneratingEmail(emailType);
    regenerateEmailMutation.mutate(emailType);
  };

  const togglePreview = (emailType: string) => {
    setPreviewMode(prev => ({ ...prev, [emailType]: !prev[emailType] }));
  };

  // Helper to get email value (edited or original)
  const getEmailValue = (emailType: string, field: keyof Email, originalValue: string): string => {
    return (editedEmails[emailType]?.[field] as string) ?? originalValue;
  };

  // Helper to update email field
  const updateEmailField = (emailType: string, field: keyof Email, value: string) => {
    setEditedEmails(prev => ({
      ...prev,
      [emailType]: { ...(prev[emailType] || {}), [field]: value }
    }));
  };

  // Get email with any edits applied
  const getEmailWithEdits = (email: Email): Email => ({
    ...email,
    subject: getEmailValue(email.type, 'subject', email.subject),
    previewText: getEmailValue(email.type, 'previewText', email.previewText),
    body: getEmailValue(email.type, 'body', email.body),
    ctaText: getEmailValue(email.type, 'ctaText', email.ctaText),
  });

  const copyPlainText = async (email: Email) => {
    const edited = getEmailWithEdits(email);
    const text = `Subject: ${edited.subject}\n\nPreview: ${edited.previewText}\n\n${edited.body}\n\n[${edited.ctaText}]`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedEmail(`${email.type}-plain`);
      toast.success("Plain text copied!");
      setTimeout(() => setCopiedEmail(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const copyHtml = async (email: Email) => {
    const edited = getEmailWithEdits(email);
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${edited.subject}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p style="color: #666; font-size: 14px;">${edited.previewText}</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  ${edited.body.split('\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('\n  ')}
  <p style="margin-top: 30px;">
    <a href="{{cta_link}}" style="display: inline-block; background-color: #1E3A5F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
      ${edited.ctaText}
    </a>
  </p>
</body>
</html>`;
    try {
      await navigator.clipboard.writeText(html);
      setCopiedEmail(`${email.type}-html`);
      toast.success("HTML copied!");
      setTimeout(() => setCopiedEmail(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const exportAll = () => {
    if (!emailContent?.emails) return;

    emailContent.emails.forEach((email, index) => {
      const edited = getEmailWithEdits(email);
      const text = `Subject: ${edited.subject}\n\nPreview Text: ${edited.previewText}\n\n---\n\n${edited.body}\n\n---\n\nCTA Button: ${edited.ctaText}`;
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `email-${index + 1}-${email.type}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    });
    toast.success("All emails exported!");
  };

  const isGenerating = generateMutation.isPending;
  const hasEmails = !!emailContent?.emails?.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Launch Emails: {ideaName}
          </DialogTitle>
          <DialogDescription>
            {hasEmails 
              ? `3-email launch sequence ready to customize`
              : `Generate a 3-email launch sequence for your business`
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tone Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tone</Label>
                <div className="flex flex-wrap gap-2">
                  {(['professional', 'friendly', 'urgent'] as Tone[]).map((t) => (
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
                <Label htmlFor="emojis-subject" className="text-sm font-medium">Emojis in Subject</Label>
                <Switch
                  id="emojis-subject"
                  checked={emojisInSubject}
                  onCheckedChange={setEmojisInSubject}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Business Name */}
              <div className="space-y-2">
                <Label htmlFor="business-name" className="text-sm font-medium">Business Name</Label>
                <Input
                  id="business-name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Your business name"
                />
              </div>

              {/* Offer Details */}
              <div className="space-y-2">
                <Label htmlFor="offer-details" className="text-sm font-medium">Offer Details (optional)</Label>
                <Input
                  id="offer-details"
                  value={offerDetails}
                  onChange={(e) => setOfferDetails(e.target.value)}
                  placeholder="e.g., 20% off first month"
                />
              </div>
            </div>

            {/* Placeholders Info */}
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Available Placeholders:</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs font-mono">{"{{first_name}}"}</Badge>
                <Badge variant="outline" className="text-xs font-mono">{"{{cta_link}}"}</Badge>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Email Content */}
        <ScrollArea className="flex-1 min-h-0">
          {isLoadingExisting ? (
            <div className="space-y-4 p-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-lg font-medium text-foreground">Generating your emails...</p>
              <p className="text-sm text-muted-foreground">Creating a 3-email sequence</p>
              <div className="space-y-2 w-full max-w-md">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>
          ) : hasEmails ? (
            <Accordion type="single" collapsible defaultValue="launch" className="p-1">
              {emailContent.emails.map((email) => {
                const isRegenerating = regeneratingEmail === email.type;
                return (
                  <AccordionItem key={email.type} value={email.type} className="border rounded-lg mb-3 px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 text-left">
                        <span className="text-xl">{emailLabels[email.type]?.icon || '📧'}</span>
                        <div>
                          <p className="font-medium text-foreground">{emailLabels[email.type]?.title || email.type}</p>
                          <p className="text-xs text-muted-foreground">{emailLabels[email.type]?.description}</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 space-y-4">
                      {isRegenerating ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-3">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                          <p className="text-sm text-muted-foreground">Regenerating email...</p>
                        </div>
                      ) : (
                        <>
                          {/* Subject Line - Editable */}
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-muted-foreground">SUBJECT LINE</Label>
                            <Input 
                              value={getEmailValue(email.type, 'subject', email.subject)}
                              onChange={(e) => updateEmailField(email.type, 'subject', e.target.value)}
                              className="font-medium" 
                            />
                          </div>

                          {/* Preview Text - Editable */}
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-muted-foreground">PREVIEW TEXT</Label>
                            <Input 
                              value={getEmailValue(email.type, 'previewText', email.previewText)}
                              onChange={(e) => updateEmailField(email.type, 'previewText', e.target.value)}
                              className="text-sm" 
                            />
                          </div>

                          {/* Body - Editable */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-medium text-muted-foreground">EMAIL BODY</Label>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => togglePreview(email.type)}
                                className="h-7 text-xs"
                              >
                                {previewMode[email.type] ? (
                                  <><EyeOff className="w-3 h-3 mr-1" /> Raw</>
                                ) : (
                                  <><Eye className="w-3 h-3 mr-1" /> Preview</>
                                )}
                              </Button>
                            </div>
                            {previewMode[email.type] ? (
                              <div className="bg-background border rounded-lg p-4 prose prose-sm dark:prose-invert max-w-none">
                                {getEmailValue(email.type, 'body', email.body).split('\n').map((p, i) => (
                                  <p key={i} className="mb-2">{p || <br />}</p>
                                ))}
                                <Button className="mt-4">{getEmailValue(email.type, 'ctaText', email.ctaText)}</Button>
                              </div>
                            ) : (
                              <Textarea 
                                value={getEmailValue(email.type, 'body', email.body)}
                                onChange={(e) => updateEmailField(email.type, 'body', e.target.value)}
                                className="min-h-[150px] font-mono text-sm"
                              />
                            )}
                          </div>

                          {/* CTA Button Text - Editable */}
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-muted-foreground">CTA BUTTON TEXT</Label>
                            <Input 
                              value={getEmailValue(email.type, 'ctaText', email.ctaText)}
                              onChange={(e) => updateEmailField(email.type, 'ctaText', e.target.value)}
                            />
                          </div>

                          {/* Actions */}
                          <div className="flex flex-wrap gap-2 pt-2 border-t">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => copyPlainText(email)}
                            >
                              {copiedEmail === `${email.type}-plain` ? (
                                <><Check className="w-3 h-3 mr-1" /> Copied!</>
                              ) : (
                                <><Copy className="w-3 h-3 mr-1" /> Copy Plain Text</>
                              )}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => copyHtml(email)}
                            >
                              {copiedEmail === `${email.type}-html` ? (
                                <><Check className="w-3 h-3 mr-1" /> Copied!</>
                              ) : (
                                <><Code className="w-3 h-3 mr-1" /> Copy HTML</>
                              )}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleRegenerateEmail(email.type)}
                              disabled={isRegenerating}
                            >
                              <RefreshCw className={cn("w-3 h-3 mr-1", isRegenerating && "animate-spin")} />
                              Regenerate
                            </Button>
                          </div>
                        </>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Mail className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Emails Generated Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Click "Generate Emails" to create a 3-email launch sequence.
              </p>
            </div>
          )}
        </ScrollArea>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-4 border-t mt-4">
          {hasEmails ? (
            <>
              <Button onClick={exportAll} variant="outline" className="flex-1 sm:flex-none">
                <Download className="w-4 h-4 mr-2" />
                Export All
              </Button>
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
                  <Mail className="w-4 h-4 mr-2" />
                  Generate Emails
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
