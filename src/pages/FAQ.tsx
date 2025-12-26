import { useState, useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { faqs } from "@/data/faqs";

const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return faqs;
    const query = searchQuery.toLowerCase();
    return faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  return (
    <div className="container max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-muted-foreground">
          Find answers to common questions about FastTrack.Business.
        </p>
      </div>

      {/* Search input */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search questions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12"
        />
      </div>

      {filteredFaqs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No questions found matching "{searchQuery}"
          </p>
        </div>
      ) : (
        <Accordion type="single" collapsible className="space-y-3">
          {filteredFaqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-card border border-border rounded-lg px-4"
            >
              <AccordionTrigger className="text-left text-foreground hover:no-underline py-4 touch-target">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Contact section */}
      <div className="text-center mt-12 p-6 bg-muted/30 rounded-2xl">
        <p className="font-semibold text-foreground mb-2">
          Still have questions?
        </p>
        <p className="text-sm text-muted-foreground">
          Contact us at{" "}
          <a
            href="mailto:hello@fasttrack.business"
            className="text-primary hover:underline"
          >
            hello@fasttrack.business
          </a>
        </p>
      </div>
    </div>
  );
};

export default FAQ;
