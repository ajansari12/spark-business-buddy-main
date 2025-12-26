import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { User, Bell, Palette, UserX, Info } from "lucide-react";
import ProfileSection from "@/components/settings/ProfileSection";
import PreferencesSection from "@/components/settings/PreferencesSection";
import AppSection from "@/components/settings/AppSection";
import AccountSection from "@/components/settings/AccountSection";
import AboutSection from "@/components/settings/AboutSection";

const Settings = () => {
  const sections = [
    {
      id: "profile",
      title: "Profile",
      icon: User,
      content: <ProfileSection />,
    },
    {
      id: "preferences",
      title: "Preferences",
      icon: Bell,
      content: <PreferencesSection />,
    },
    {
      id: "app",
      title: "App",
      icon: Palette,
      content: <AppSection />,
    },
    {
      id: "account",
      title: "Account",
      icon: UserX,
      content: <AccountSection />,
    },
    {
      id: "about",
      title: "About",
      icon: Info,
      content: <AboutSection />,
    },
  ];

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1">
          Settings
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your account and preferences
        </p>
      </div>

      <Accordion type="single" collapsible defaultValue="profile" className="space-y-3">
        {sections.map(({ id, title, icon: Icon, content }) => (
          <AccordionItem
            key={id}
            value={id}
            className="border rounded-lg px-4 bg-card"
          >
            <AccordionTrigger className="py-4 hover:no-underline">
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              {content}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default Settings;
