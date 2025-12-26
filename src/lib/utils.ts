import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Strip common markdown syntax from text
 * Use for titles/taglines where plain text is preferred
 */
export function stripMarkdown(text: string): string {
  if (!text) return text;
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')  // **bold** → bold
    .replace(/\*(.+?)\*/g, '$1')       // *italic* → italic
    .replace(/__(.+?)__/g, '$1')       // __bold__ → bold
    .replace(/_(.+?)_/g, '$1')         // _italic_ → italic
    .replace(/~~(.+?)~~/g, '$1')       // ~~strikethrough~~ → strikethrough
    .replace(/`(.+?)`/g, '$1')         // `code` → code
    .replace(/^#+\s*/gm, '')           // # headers → text
    .trim();
}
