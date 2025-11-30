/**
 * Type declarations for latex.js library
 * Provides LaTeX to image rendering via upmath.me service
 */

interface S2LatexAPI {
  /**
   * Process a DOM tree to find and render LaTeX formulas
   * Formulas should be wrapped in $$...$$ delimiters
   */
  processTree: (element: HTMLElement) => void;
}

declare global {
  interface Window {
    S2Latex?: S2LatexAPI;
  }
}

export {};
