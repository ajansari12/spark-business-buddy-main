import { Link } from "react-router-dom";

export const PublicFooter = () => {
  return (
    <footer className="py-8 px-4 border-t border-border safe-bottom">
      <div className="container max-w-6xl mx-auto">
        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center mb-6 leading-relaxed">
          FastTrack provides information and assistance, not legal or accounting advice.
          Always consult with qualified professionals before making business decisions.
        </p>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground mb-4">
          <Link
            to="/legal/privacy"
            className="hover:text-foreground transition-colors touch-target inline-flex items-center justify-center"
          >
            Privacy Policy
          </Link>
          <span className="text-border">•</span>
          <Link
            to="/legal/terms"
            className="hover:text-foreground transition-colors touch-target inline-flex items-center justify-center"
          >
            Terms of Service
          </Link>
          <span className="text-border">•</span>
          <Link
            to="/legal/disclaimer"
            className="hover:text-foreground transition-colors touch-target inline-flex items-center justify-center"
          >
            Disclaimer
          </Link>
        </div>

        {/* Copyright */}
        <p className="text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()} FastTrack.Business. Made in Canada 🍁
        </p>
      </div>
    </footer>
  );
};
