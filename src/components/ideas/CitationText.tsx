import { ExternalLink } from "lucide-react";

interface CitationTextProps {
  text: string;
  citations?: string[];
}

/**
 * Parses text with [1], [2], etc. markers and renders them as clickable superscript links
 */
export const CitationText = ({ text, citations = [] }: CitationTextProps) => {
  // Split text by citation markers like [1], [2], etc.
  const parts = text.split(/(\[\d+\])/g);

  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/\[(\d+)\]/);
        if (match) {
          const index = parseInt(match[1]) - 1; // Citations are 1-indexed
          const url = citations[index];
          if (url) {
            return (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-[10px] align-super font-medium"
                title={url}
              >
                [{match[1]}]
              </a>
            );
          }
          // If no URL for this citation, render the marker as-is
          return <span key={i} className="text-[10px] align-super text-muted-foreground">{part}</span>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

interface SourcesListProps {
  citations: string[];
  maxSources?: number;
}

/**
 * Renders a list of source links with domain names
 */
export const SourcesList = ({ citations, maxSources = 5 }: SourcesListProps) => {
  if (!citations || citations.length === 0) return null;

  const getHostname = (url: string): string => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <div className="pt-2 border-t border-border/50">
      <p className="text-xs font-medium text-muted-foreground mb-1">Sources:</p>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {citations.slice(0, maxSources).map((url, i) => (
          <a
            key={i}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline inline-flex items-center gap-0.5"
          >
            [{i + 1}] {getHostname(url)}
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        ))}
        {citations.length > maxSources && (
          <span className="text-xs text-muted-foreground">
            +{citations.length - maxSources} more
          </span>
        )}
      </div>
    </div>
  );
};
