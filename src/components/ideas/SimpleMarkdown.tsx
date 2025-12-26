import React from "react";

interface SimpleMarkdownProps {
  text: string;
  className?: string;
}

/**
 * Lightweight markdown renderer for descriptions and notes
 * Supports: **bold**, *italic*, - bullet lists
 */
export const SimpleMarkdown = ({ text, className = "" }: SimpleMarkdownProps) => {
  if (!text) return null;

  // Split by lines to handle bullet points
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 my-2">
          {currentList.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  const renderInline = (content: string): React.ReactNode => {
    // Replace markdown patterns with HTML
    const parts: React.ReactNode[] = [];
    let remaining = content;
    let keyIndex = 0;

    // Process bold (**text**) and italic (*text*)
    const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(content)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index));
      }

      if (match[2]) {
        // Bold match
        parts.push(<strong key={keyIndex++}>{match[2]}</strong>);
      } else if (match[3]) {
        // Italic match
        parts.push(<em key={keyIndex++}>{match[3]}</em>);
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Check for bullet points
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      currentList.push(trimmed.slice(2));
    } else if (trimmed.startsWith('* ') && !trimmed.startsWith('**')) {
      currentList.push(trimmed.slice(2));
    } else {
      flushList();
      if (trimmed) {
        elements.push(
          <span key={`line-${index}`}>
            {renderInline(trimmed)}
            {index < lines.length - 1 && <br />}
          </span>
        );
      }
    }
  });

  flushList();

  return <div className={className}>{elements}</div>;
};
