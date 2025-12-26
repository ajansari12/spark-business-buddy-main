/**
 * Global Keyboard Shortcuts
 * Provides command palette and keyboard navigation
 */

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Home,
  Lightbulb,
  FileText,
  Settings,
  TrendingUp,
  Calendar,
  DollarSign,
  Users,
  BarChart,
  MessageSquare,
  HelpCircle,
  Search,
  Keyboard,
  BookOpen,
} from 'lucide-react';

interface ShortcutCommand {
  id: string;
  label: string;
  keywords: string[];
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
  category: 'navigation' | 'actions' | 'help';
}

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const navigate = useNavigate();

  // Define all available commands
  const commands: ShortcutCommand[] = [
    // Navigation
    {
      id: 'nav-home',
      label: 'Go to Home',
      keywords: ['home', 'dashboard'],
      icon: <Home className="h-4 w-4" />,
      action: () => navigate('/'),
      category: 'navigation',
    },
    {
      id: 'nav-dashboard',
      label: 'Go to Dashboard',
      keywords: ['dashboard', 'app'],
      icon: <BarChart className="h-4 w-4" />,
      action: () => navigate('/app/dashboard'),
      category: 'navigation',
    },
    {
      id: 'nav-wizard',
      label: 'Start Business Wizard',
      keywords: ['wizard', 'start', 'new', 'business'],
      icon: <Lightbulb className="h-4 w-4" />,
      action: () => navigate('/wizard'),
      category: 'navigation',
    },
    {
      id: 'nav-ideas',
      label: 'View Ideas',
      keywords: ['ideas', 'brainstorm'],
      icon: <Lightbulb className="h-4 w-4" />,
      action: () => navigate('/app/ideas'),
      category: 'navigation',
    },
    {
      id: 'nav-documents',
      label: 'View Documents',
      keywords: ['documents', 'files'],
      icon: <FileText className="h-4 w-4" />,
      action: () => navigate('/app/documents'),
      category: 'navigation',
    },
    {
      id: 'nav-trends',
      label: 'View Trends',
      keywords: ['trends', 'analytics'],
      icon: <TrendingUp className="h-4 w-4" />,
      action: () => navigate('/app/trends'),
      category: 'navigation',
    },
    {
      id: 'nav-sessions',
      label: 'View Sessions',
      keywords: ['sessions', 'history'],
      icon: <Calendar className="h-4 w-4" />,
      action: () => navigate('/app/sessions'),
      category: 'navigation',
    },
    {
      id: 'nav-settings',
      label: 'Settings',
      keywords: ['settings', 'preferences', 'account'],
      icon: <Settings className="h-4 w-4" />,
      action: () => navigate('/app/settings'),
      category: 'navigation',
    },
    {
      id: 'nav-pricing',
      label: 'View Pricing',
      keywords: ['pricing', 'plans', 'upgrade'],
      icon: <DollarSign className="h-4 w-4" />,
      action: () => navigate('/pricing'),
      category: 'navigation',
    },
    {
      id: 'nav-referrals',
      label: 'Referral Program',
      keywords: ['referrals', 'invite', 'rewards'],
      icon: <Users className="h-4 w-4" />,
      action: () => navigate('/app/referrals'),
      category: 'navigation',
    },
    {
      id: 'nav-blog',
      label: 'Read Blog',
      keywords: ['blog', 'articles', 'guides'],
      icon: <BookOpen className="h-4 w-4" />,
      action: () => navigate('/blog'),
      category: 'navigation',
    },
    {
      id: 'nav-faq',
      label: 'View FAQ',
      keywords: ['faq', 'help', 'questions'],
      icon: <HelpCircle className="h-4 w-4" />,
      action: () => navigate('/faq'),
      category: 'navigation',
    },

    // Actions
    {
      id: 'action-chat',
      label: 'Open Chat',
      keywords: ['chat', 'talk', 'assistant'],
      icon: <MessageSquare className="h-4 w-4" />,
      action: () => navigate('/chat'),
      category: 'actions',
    },
    {
      id: 'action-search',
      label: 'Search Everything',
      keywords: ['search', 'find'],
      icon: <Search className="h-4 w-4" />,
      action: () => {
        // This is the command palette itself
        setOpen(true);
      },
      shortcut: '⌘K',
      category: 'actions',
    },

    // Help
    {
      id: 'help-shortcuts',
      label: 'View Keyboard Shortcuts',
      keywords: ['shortcuts', 'hotkeys', 'keyboard'],
      icon: <Keyboard className="h-4 w-4" />,
      action: () => {
        setOpen(false);
        setShowHelp(true);
      },
      shortcut: '?',
      category: 'help',
    },
  ];

  // Handle command palette toggle (Cmd/Ctrl + K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault();
        setShowHelp(true);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = useCallback((command: ShortcutCommand) => {
    setOpen(false);
    setTimeout(() => command.action(), 100);
  }, []);

  const navigationCommands = commands.filter((c) => c.category === 'navigation');
  const actionCommands = commands.filter((c) => c.category === 'actions');
  const helpCommands = commands.filter((c) => c.category === 'help');

  return (
    <>
      {/* Command Palette */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Navigation">
            {navigationCommands.map((command) => (
              <CommandItem key={command.id} onSelect={() => handleSelect(command)} keywords={command.keywords}>
                {command.icon}
                <span className="ml-2">{command.label}</span>
                {command.shortcut && <kbd className="ml-auto text-xs">{command.shortcut}</kbd>}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Actions">
            {actionCommands.map((command) => (
              <CommandItem key={command.id} onSelect={() => handleSelect(command)} keywords={command.keywords}>
                {command.icon}
                <span className="ml-2">{command.label}</span>
                {command.shortcut && <kbd className="ml-auto text-xs">{command.shortcut}</kbd>}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Help">
            {helpCommands.map((command) => (
              <CommandItem key={command.id} onSelect={() => handleSelect(command)} keywords={command.keywords}>
                {command.icon}
                <span className="ml-2">{command.label}</span>
                {command.shortcut && <kbd className="ml-auto text-xs">{command.shortcut}</kbd>}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* Keyboard Shortcuts Help Modal */}
      {showHelp && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowHelp(false)}
        >
          <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Keyboard Shortcuts</h2>
                <button
                  onClick={() => setShowHelp(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Global Shortcuts</h3>
                  <div className="space-y-2">
                    <ShortcutRow shortcut="⌘K or Ctrl+K" description="Open command palette" />
                    <ShortcutRow shortcut="?" description="Show keyboard shortcuts" />
                    <ShortcutRow shortcut="Esc" description="Close dialogs" />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Navigation</h3>
                  <div className="space-y-2">
                    <ShortcutRow shortcut="G then H" description="Go to home" />
                    <ShortcutRow shortcut="G then D" description="Go to dashboard" />
                    <ShortcutRow shortcut="G then I" description="Go to ideas" />
                    <ShortcutRow shortcut="G then S" description="Go to settings" />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Actions</h3>
                  <div className="space-y-2">
                    <ShortcutRow shortcut="C" description="Open chat" />
                    <ShortcutRow shortcut="N" description="New business wizard" />
                    <ShortcutRow shortcut="/" description="Focus search" />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    <strong>Tip:</strong> Press <kbd className="px-2 py-1 bg-muted rounded text-xs">⌘K</kbd> to quickly navigate anywhere in the app
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ShortcutRow({ shortcut, description }: { shortcut: string; description: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm">{description}</span>
      <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">{shortcut}</kbd>
    </div>
  );
}
