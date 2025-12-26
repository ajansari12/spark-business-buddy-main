const Privacy = () => {
  return (
    <div className="container max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-display font-bold text-foreground mb-6">
        Privacy Policy
      </h1>

      <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            Our Commitment to Privacy
          </h2>
          <p>
            FastTrack.Business is committed to protecting your privacy. This policy explains 
            how we collect, use, and safeguard your personal information in accordance with 
            Canadian privacy laws, including the Personal Information Protection and Electronic 
            Documents Act (PIPEDA).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            Information We Collect
          </h2>
          <p>
            We collect information you provide directly, including:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Account information (email, name)</li>
            <li>Responses to our AI questionnaire (skills, interests, budget, location)</li>
            <li>Payment information (processed securely via Stripe)</li>
            <li>Communication preferences</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            How We Use Your Information
          </h2>
          <p>
            Your information is used to:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Generate personalized business ideas</li>
            <li>Process payments and deliver your reports</li>
            <li>Communicate with you about your account</li>
            <li>Improve our AI and services</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            Data Storage and Security
          </h2>
          <p>
            Your data is stored securely on servers located in Canada. We use industry-standard 
            encryption and security measures to protect your information. We do not sell, rent, 
            or share your personal information with third parties for marketing purposes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            Data Retention
          </h2>
          <p>
            We retain your personal information only as long as necessary to provide our services 
            and fulfill legal obligations. You may request deletion of your data at any time by 
            contacting us.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            Your Rights
          </h2>
          <p>
            Under PIPEDA, you have the right to:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Access your personal information</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your data</li>
            <li>Withdraw consent for data processing</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            Cookies and Analytics
          </h2>
          <p>
            We use essential cookies to maintain your session and optional analytics to improve 
            our services. You can control cookie preferences through your browser settings.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            Contact Us
          </h2>
          <p>
            For privacy-related inquiries or to exercise your rights, contact our Privacy Officer at:{" "}
            <a href="mailto:privacy@fasttrack.business" className="text-primary hover:underline">
              privacy@fasttrack.business
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

export default Privacy;
