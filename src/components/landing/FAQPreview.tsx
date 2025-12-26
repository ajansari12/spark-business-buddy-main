import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { faqs } from "@/data/faqs";

export const FAQPreview = () => {
  const previewFaqs = faqs.slice(0, 4);

  return (
    <section className="py-16 px-4">
      <div className="container max-w-lg lg:max-w-2xl mx-auto">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-center text-foreground mb-8">
          Common Questions
        </h2>

        <Accordion type="single" collapsible className="space-y-3">
          {previewFaqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-card border border-border rounded-lg px-4"
            >
              <AccordionTrigger className="text-left text-foreground hover:no-underline py-4">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="text-center mt-8">
          <Link
            to="/faq"
            className="text-sm text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline font-medium"
          >
            See all FAQs →
          </Link>
        </div>
      </div>
    </section>
  );
};
