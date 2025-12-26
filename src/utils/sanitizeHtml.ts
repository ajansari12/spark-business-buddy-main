/**
 * HTML Sanitization Utility
 * Prevents XSS attacks by sanitizing HTML content using DOMPurify
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param dirty - Untrusted HTML string
 * @param options - DOMPurify configuration options
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHtml(
  dirty: string,
  options?: DOMPurify.Config
): string {
  if (!dirty) return '';

  const defaultConfig: DOMPurify.Config = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre', 'span', 'div',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img'
    ],
    ALLOWED_ATTR: [
      'href', 'title', 'target', 'rel', 'class', 'id', 'src', 'alt', 'width', 'height'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  };

  const config = { ...defaultConfig, ...options };

  return DOMPurify.sanitize(dirty, config);
}

/**
 * Sanitize HTML for use in rich text editors (more permissive)
 * Allows more tags for content creation
 */
export function sanitizeRichText(dirty: string): string {
  return sanitizeHtml(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'strike', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre', 'span', 'div',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img', 'hr',
      'b', 'i', 's', 'del', 'ins', 'mark', 'small', 'sub', 'sup'
    ],
    ALLOWED_ATTR: [
      'href', 'title', 'target', 'rel', 'class', 'id', 'src', 'alt',
      'width', 'height', 'style', 'align', 'colspan', 'rowspan'
    ],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize HTML for plain text content (most restrictive)
 * Only allows basic formatting
 */
export function sanitizePlainText(dirty: string): string {
  return sanitizeHtml(dirty, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u'],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize user-generated markdown output
 * For content that comes from markdown parsers
 */
export function sanitizeMarkdown(dirty: string): string {
  return sanitizeHtml(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre', 'hr',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img'
    ],
    ALLOWED_ATTR: ['href', 'title', 'src', 'alt', 'class'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Strip all HTML tags and return plain text
 * Use this when you don't want any HTML at all
 */
export function stripHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
}

/**
 * React component helper for safe HTML rendering
 * Use this instead of dangerouslySetInnerHTML
 *
 * @example
 * <div {...createSafeHtml(userContent)} />
 */
export function createSafeHtml(
  dirty: string,
  options?: DOMPurify.Config
): { dangerouslySetInnerHTML: { __html: string } } {
  return {
    dangerouslySetInnerHTML: {
      __html: sanitizeHtml(dirty, options),
    },
  };
}

/**
 * Sanitize URL to prevent javascript: protocol and other XSS vectors
 */
export function sanitizeUrl(url: string): string {
  const sanitized = DOMPurify.sanitize(url, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });

  // Additional check for dangerous protocols
  const dangerous = /^(javascript|data|vbscript):/i;
  if (dangerous.test(sanitized)) {
    return 'about:blank';
  }

  return sanitized;
}

/**
 * Configure DOMPurify hooks for additional security
 */
export function configureDOMPurify(): void {
  // Add hook to add rel="noopener noreferrer" to external links
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if ('target' in node) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });
}

// Initialize DOMPurify configuration on module load
if (typeof window !== 'undefined') {
  configureDOMPurify();
}
