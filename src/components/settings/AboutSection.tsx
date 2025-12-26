import { Link } from "react-router-dom";
import { ExternalLink, FileText, Shield, AlertTriangle, Mail } from "lucide-react";

const APP_VERSION = "1.0.0";

const AboutSection = () => {
  const links = [
    { to: "/legal/terms", label: "Terms of Service", icon: FileText },
    { to: "/legal/privacy", label: "Privacy Policy", icon: Shield },
    { to: "/legal/disclaimer", label: "Disclaimer", icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between py-2">
        <span className="text-muted-foreground">App Version</span>
        <span className="font-mono text-sm">{APP_VERSION}</span>
      </div>

      <div className="space-y-2">
        {links.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center justify-between py-3 px-1 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span>{label}</span>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
      </div>

      <a
        href="mailto:support@fasttrack.business"
        className="flex items-center justify-between py-3 px-1 rounded-lg hover:bg-muted/50 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span>Contact Support</span>
        </div>
        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </a>
    </div>
  );
};

export default AboutSection;
