export interface FAQ {
  question: string;
  answer: string;
  category?: string;
}

export const faqs: FAQ[] = [
  {
    question: "What is FastTrack.Business?",
    answer: "FastTrack.Business is an AI-powered platform that helps aspiring Canadian entrepreneurs discover personalized business ideas based on their unique skills, budget, and location.",
    category: "general",
  },
  {
    question: "How does the AI generate my business ideas?",
    answer: "Our AI analyzes your skills, interests, budget, and Canadian city to match you with business opportunities that have proven demand in your area. We consider local market trends, competition, and startup costs.",
    category: "general",
  },
  {
    question: "Is this legal or accounting advice?",
    answer: "No. FastTrack.Business provides educational information and AI-generated suggestions only. We strongly recommend consulting with qualified legal and accounting professionals before starting any business.",
    category: "legal",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, Mastercard, American Express) and debit cards. All payments are processed securely through Stripe in Canadian dollars (CAD).",
    category: "payment",
  },
  {
    question: "Can I get a refund?",
    answer: "Due to the nature of digital AI-generated content, we offer refunds only if you haven't accessed your personalized business ideas yet. Once ideas are generated and viewed, refunds are not available.",
    category: "payment",
  },
  {
    question: "How long does it take to get my ideas?",
    answer: "After completing the AI conversation and payment, your personalized business ideas are generated instantly. You'll receive your PDF report within minutes.",
    category: "general",
  },
  {
    question: "Is FastTrack available outside Canada?",
    answer: "Currently, FastTrack.Business is optimized for Canadian entrepreneurs with market data specific to Canadian cities and provinces. We plan to expand to other countries in the future.",
    category: "general",
  },
  {
    question: "How long are my ideas valid?",
    answer: "Your purchased ideas and PDF report are yours to keep forever. However, market conditions change, so we recommend acting on your ideas within 6-12 months for best results.",
    category: "general",
  },
  {
    question: "Can I regenerate my ideas?",
    answer: "Each purchase includes one set of personalized ideas. If you'd like new ideas based on different criteria, you would need to make a new purchase.",
    category: "general",
  },
  {
    question: "How do I download my PDF report?",
    answer: "After your ideas are generated, you'll see a download button on your results page. You can also access your report anytime by logging into your account.",
    category: "general",
  },
  {
    question: "Do you offer team or bulk pricing?",
    answer: "Yes! If you're an organization, incubator, or educational institution interested in bulk pricing, please contact us at hello@fasttrack.business for custom arrangements.",
    category: "payment",
  },
  {
    question: "How is my data protected?",
    answer: "We take privacy seriously. Your data is encrypted, stored securely in Canada, and never sold to third parties. We comply with PIPEDA (Canadian privacy law). See our Privacy Policy for details.",
    category: "legal",
  },
];
