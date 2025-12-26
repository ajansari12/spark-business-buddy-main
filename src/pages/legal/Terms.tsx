const Terms = () => {
  return (
    <div className="container max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-display font-bold text-foreground mb-6">
        Terms of Service
      </h1>

      <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            Acceptance of Terms
          </h2>
          <p>
            By accessing or using FastTrack.Business, you agree to be bound by these Terms of 
            Service and all applicable laws and regulations. If you do not agree with any part 
            of these terms, you may not use our services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            Description of Service
          </h2>
          <p>
            FastTrack.Business provides AI-powered business idea generation services for 
            Canadian entrepreneurs. Our platform analyzes user-provided information to generate 
            personalized business recommendations and reports.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            Payment and Refunds
          </h2>
          <p>
            All prices are listed in Canadian Dollars (CAD). Payment is required before accessing 
            personalized business ideas.
          </p>
          <div className="bg-muted/50 p-4 rounded-lg mt-3">
            <p className="font-semibold text-foreground mb-2">Refund Policy</p>
            <p className="text-sm">
              Due to the digital nature of our AI-generated content, refunds are available only 
              if you have not yet viewed your personalized business ideas. Once ideas are 
              generated and accessed, the purchase is final. To request a refund, contact us 
              within 24 hours of purchase at{" "}
              <a href="mailto:refunds@fasttrack.business" className="text-primary hover:underline">
                refunds@fasttrack.business
              </a>
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            User Responsibilities
          </h2>
          <p>
            You agree to:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Provide accurate information during the questionnaire</li>
            <li>Use the service for lawful purposes only</li>
            <li>Not share your account credentials</li>
            <li>Not attempt to reverse-engineer or exploit our systems</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            Intellectual Property
          </h2>
          <p>
            The AI-generated business ideas provided to you are for your personal use. You may 
            use these ideas to start or develop your business. However, the underlying technology, 
            algorithms, and platform remain the exclusive property of FastTrack.Business.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            Limitation of Liability
          </h2>
          <p>
            FastTrack.Business provides information and suggestions only. We are not liable for 
            any business decisions, losses, or damages arising from the use of our platform. 
            Our maximum liability is limited to the amount you paid for the service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            Governing Law
          </h2>
          <p>
            These Terms are governed by the laws of the Province of Ontario, Canada, and the 
            federal laws of Canada applicable therein. Any disputes shall be resolved in the 
            courts of Ontario.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            Changes to Terms
          </h2>
          <p>
            We reserve the right to modify these Terms at any time. Continued use of the service 
            after changes constitutes acceptance of the new terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            Contact Information
          </h2>
          <p>
            For questions about these Terms, contact us at:{" "}
            <a href="mailto:legal@fasttrack.business" className="text-primary hover:underline">
              legal@fasttrack.business
            </a>
          </p>
        </section>
      </div>

      <p className="text-sm text-muted-foreground mt-8 pt-6 border-t border-border">
        Last updated: {new Date().toLocaleDateString("en-CA")}
      </p>
    </div>
  );
};

export default Terms;
