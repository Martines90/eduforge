# LaTeX Integration in TaskResult Component

## Overview
The TaskResult component now supports automatic LaTeX rendering for mathematical formulas in both task descriptions and solutions using the upmath.me service.

## How It Works

### 1. LaTeX Conversion
The `latex-converter.ts` utility converts LaTeX syntax from plain format to delimited format:

**Input (plain LaTeX):**
```
a_n = a_1 \cdot q^{n-1}
```

**Output (delimited LaTeX):**
```
$$a_n = a_1 \cdot q^{n-1}$$
```

### 2. Rendering Process
1. When TaskResult component mounts, it loads `latex.js` script via Next.js Script component
2. Task description and solution HTML are processed through `processLatexInHtml()` to wrap LaTeX formulas
3. The processed HTML is rendered with refs attached to the preview divs
4. Once latex.js is loaded (`latexReady` state), a useEffect hook calls `S2Latex.processTree()` on both preview divs
5. The latex.js library finds all `$$...$$` delimited formulas and replaces them with rendered images from upmath.me

## Files Modified

### `/frontend/lib/utils/latex-converter.ts` (NEW)
Contains helper functions for LaTeX conversion:
- `convertLatexToDelimited()` - Basic conversion for text content
- `convertLatexAdvanced()` - Advanced conversion that handles code blocks
- `processLatexInHtml()` - Main function for processing HTML content

### `/frontend/components/organisms/TaskResult/TaskResult.tsx`
Updated to integrate LaTeX rendering:
- Added Script component to load `/lib/utils/latex.js`
- Added `latexReady` state to track when latex.js is loaded
- Added refs (`descriptionPreviewRef`, `solutionPreviewRef`) for preview divs
- Process HTML through `processLatexInHtml()` before rendering
- useEffect hook triggers `S2Latex.processTree()` when content changes

## Usage Example

If a task solution contains:
```html
<p>A mértani sorozat általános tagja: a_n = a_1 \cdot q^{n-1}</p>
<p>A diszkrimináns képlete: \Delta = b^2 - 4ac</p>
```

The component will:
1. Convert it to: `$$a_n = a_1 \cdot q^{n-1}$$` and `$$\Delta = b^2 - 4ac$$`
2. Render these as beautiful mathematical formulas using upmath.me images

## Supported LaTeX Patterns

The converter detects and wraps:
- Backslash commands: `\cdot`, `\frac`, `\sum`, `\alpha`, etc.
- Subscripts with braces: `a_{n}`, `x_{i-1}`
- Superscripts with braces: `x^{2}`, `q^{n-1}`
- Combined expressions: `a_{n}^{2}`, `x_{i-1}^{k+1}`

## Important Notes

1. **Edit Mode**: LaTeX rendering is disabled when editing (ReactQuill editor is shown)
2. **Code Blocks**: Content inside `<code>` and `<pre>` tags is not processed
3. **Double-wrapping Prevention**: The converter avoids wrapping already wrapped formulas
4. **External Service**: Uses upmath.me (i.upmath.me) for rendering - requires internet connection
5. **Format**: Supports both SVG (modern browsers) and PNG (fallback) formats

## Testing

To test LaTeX rendering:
1. Generate a task with mathematical content
2. Include LaTeX formulas in the solution using standard LaTeX syntax
3. View the task result - formulas should render as images
4. Enter edit mode - raw HTML should be editable in ReactQuill
5. Exit edit mode - LaTeX should re-render

## Performance

- Script loads asynchronously (`afterInteractive` strategy)
- LaTeX processing happens client-side
- Small delay (100ms) ensures DOM is ready before processing
- Rendering only triggers when not in edit mode
