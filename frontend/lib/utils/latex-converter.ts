/**
 * LaTeX Converter Utility
 * Simple utility to unescape LaTeX from JSON
 * The backend now returns formulas already wrapped in $$\[...\]$$ format
 */

/**
 * Process HTML content - simply unescape backslashes from JSON
 * Backend returns formulas in correct $$\[...\]$$ format already
 */
export function processLatexInHtml(html: string): string {
  if (!html) return html;

  // Unescape double backslashes that come from JSON (e.g., "\\times" -> "\times")
  // This is the ONLY processing needed - backend handles the rest
  return html.replace(/\\\\/g, '\\');
}

/**
 * Process text content (non-HTML) - same simple unescape
 */
export function processLatexInText(text: string): string {
  return processLatexInHtml(text);
}
