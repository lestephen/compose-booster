// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// Output Formatter Utility
// Converts AI output to different formats for clipboard

import { marked } from 'marked';
import { OutputFormat } from '../../../shared/types';

/**
 * Configure marked for email-friendly HTML output
 */
marked.setOptions({
  gfm: true,
  breaks: true, // Convert \n to <br> for email readability
});

/**
 * Convert markdown text to plain text by stripping formatting
 */
function markdownToPlainText(markdown: string): string {
  return markdown
    // Remove bold/italic markers
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    // Remove headers (keep text)
    .replace(/^#{1,6}\s+(.+)$/gm, '$1')
    // Remove horizontal rules
    .replace(/^[-*_]{3,}$/gm, '')
    // Convert links to just text
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    // Remove images
    .replace(/!\[.*?\]\(.+?\)/g, '')
    // Remove inline code backticks
    .replace(/`(.+?)`/g, '$1')
    // Remove code blocks (keep content)
    .replace(/```[\s\S]*?```/g, (match) => {
      return match.replace(/```\w*\n?/g, '').replace(/```/g, '');
    })
    // Remove blockquotes
    .replace(/^>\s?/gm, '')
    // Convert bullet lists to simple dashes
    .replace(/^[\*\-\+]\s+/gm, '- ')
    // Convert numbered lists to simple numbers
    .replace(/^\d+\.\s+/gm, (match) => match)
    // Clean up extra whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Convert markdown to HTML suitable for email clients
 */
function markdownToHtml(markdown: string): string {
  // Parse markdown to HTML
  const html = marked.parse(markdown) as string;

  // Wrap in a div with basic email-friendly styling
  return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #333;">${html}</div>`;
}

/**
 * Format output according to user preference
 */
export function formatOutput(content: string, format: OutputFormat): string {
  switch (format) {
    case 'plain':
      return markdownToPlainText(content);
    case 'markdown':
      return content; // Return as-is
    case 'html':
      return markdownToHtml(content);
    default:
      return content;
  }
}

/**
 * Get clipboard write options based on format
 * For HTML format, we write both HTML and plain text versions
 */
export function getClipboardContent(content: string, format: OutputFormat): { text: string; html?: string } {
  switch (format) {
    case 'plain':
      return { text: markdownToPlainText(content) };
    case 'markdown':
      return { text: content };
    case 'html':
      return {
        text: markdownToPlainText(content), // Fallback plain text
        html: markdownToHtml(content),
      };
    default:
      return { text: content };
  }
}
