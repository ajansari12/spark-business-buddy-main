export const Footer = () => {
  return (
    <footer className="py-8 px-4 border-t border-border safe-bottom">
      <div className="container max-w-lg mx-auto">
        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center mb-6 leading-relaxed">
          FastTrack provides information and assistance, not legal or accounting advice. 
          Always consult with qualified professionals before making business decisions.
        </p>
        
        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground mb-4">
          <a href="#" className="hover:text-foreground transition-colors touch-target inline-flex items-center justify-center">
            Privacy Policy
          </a>
          <span className="text-border">•</span>
          <a href="#" className="hover:text-foreground transition-colors touch-target inline-flex items-center justify-center">
            Terms of Service
          </a>
          <span className="text-border">•</span>
          <a href="#" className="hover:text-foreground transition-colors touch-target inline-flex items-center justify-center">
            Contact
          </a>
        </div>
        
        {/* Copyright */}
        <p className="text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()} FastTrack.Business. Made in Canada 🍁
        </p>
      </div>
    </footer>
  );
};
