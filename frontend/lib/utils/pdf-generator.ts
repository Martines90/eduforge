/**
 * PDF Generation Utility
 * Generates PDF from task content and uploads to backend
 */

import { processLatexInHtml } from './latex-converter';

export interface TaskPDFData {
  id: string;
  title?: string;
  description: string;
  images?: Array<{ id: string; url: string } | string>;
}

/**
 * Generate a PDF from task content
 * @param taskData - The task data to convert to PDF
 * @returns Base64-encoded PDF data
 */
export async function generateTaskPDF(taskData: TaskPDFData): Promise<string> {
  console.log('[PDF Generator] Starting PDF generation for task:', taskData.id);

  // Dynamically import html2canvas and jsPDF
  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');

  // Helper to decode HTML entities
  const decodeHtmlEntities = (text: string): string => {
    if (typeof document === 'undefined') return text;
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  // Process image placeholders
  const processImagePlaceholders = (html: string, images: any[]): string => {
    if (!images || images.length === 0) return html;

    const validImages = images.filter((img: any) => {
      const url = typeof img === 'string' ? img : img?.url;
      return url && url.trim() !== '';
    });

    if (validImages.length === 0) return html;

    let processedHtml = html;
    validImages.forEach((image: any, index: number) => {
      const placeholder = `[IMAGE_${index + 1}]`;
      let imageUrl = typeof image === 'string' ? image : image.url;
      imageUrl = decodeHtmlEntities(imageUrl);

      const imgTag = `<img src="${imageUrl}" crossorigin="anonymous" alt="Task illustration ${index + 1}" style="display: block; width: 100%; max-width: 600px; height: auto; margin: 20px auto; border-radius: 8px;" class="task-image" />`;
      processedHtml = processedHtml.replace(placeholder, imgTag);
    });

    return processedHtml;
  };

  // Create temporary container
  const pdfContainer = document.createElement('div');
  pdfContainer.style.position = 'fixed';
  pdfContainer.style.top = '-10000px';
  pdfContainer.style.left = '0';
  pdfContainer.style.width = '210mm';
  pdfContainer.style.padding = '20mm';
  pdfContainer.style.backgroundColor = 'white';
  pdfContainer.style.fontFamily = 'Arial, sans-serif';
  pdfContainer.style.fontSize = '14px';
  pdfContainer.style.lineHeight = '1.6';
  pdfContainer.style.color = '#333';
  pdfContainer.style.visibility = 'visible';
  pdfContainer.style.opacity = '1';

  // Build HTML content
  const descriptionWithImages = processImagePlaceholders(
    taskData.description,
    taskData.images || []
  );

  pdfContainer.innerHTML = `
    <div style="padding: 10px;">
      <div style="font-size: 14px; line-height: 1.8;">
        ${processLatexInHtml(descriptionWithImages)}
      </div>
    </div>
  `;

  document.body.appendChild(pdfContainer);

  // Wait for images to load
  const images = pdfContainer.getElementsByTagName('img');
  const imagePromises = Array.from(images).map((img) => {
    return new Promise((resolve) => {
      if (img.complete && img.naturalHeight !== 0) {
        resolve(null);
      } else {
        const timeout = setTimeout(() => {
          console.warn(`[PDF Generator] Image load timeout: ${img.src}`);
          resolve(null);
        }, 15000);

        img.onload = () => {
          clearTimeout(timeout);
          resolve(null);
        };
        img.onerror = () => {
          clearTimeout(timeout);
          console.warn(`[PDF Generator] Failed to load image: ${img.src}`);
          resolve(null);
        };
      }
    });
  });

  console.log(`[PDF Generator] Waiting for ${images.length} image(s) to load...`);
  await Promise.all(imagePromises);

  // Render LaTeX if available
  if (typeof window !== 'undefined' && (window as any).S2Latex) {
    console.log('[PDF Generator] Processing LaTeX...');
    (window as any).S2Latex.processTree(pdfContainer);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Wait for final rendering
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('[PDF Generator] Capturing canvas...');

  // Capture canvas with optimized settings for smaller file size
  const canvas = await html2canvas(pdfContainer, {
    scale: 1.5, // Reduced from 2 to decrease file size
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: pdfContainer.scrollWidth,
    windowHeight: pdfContainer.scrollHeight,
  });

  console.log('[PDF Generator] Canvas captured:', {
    width: canvas.width,
    height: canvas.height
  });

  // Check if canvas is empty
  const context = canvas.getContext('2d');
  const imageData = context?.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData?.data || [];
  let nonWhitePixels = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    // Check if pixel is not white (255,255,255)
    if (pixels[i] !== 255 || pixels[i+1] !== 255 || pixels[i+2] !== 255) {
      nonWhitePixels++;
    }
  }
  console.log('[PDF Generator] Canvas analysis:', {
    totalPixels: pixels.length / 4,
    nonWhitePixels,
    percentageContent: ((nonWhitePixels / (pixels.length / 4)) * 100).toFixed(2) + '%'
  });

  if (nonWhitePixels === 0) {
    console.error('[PDF Generator] ERROR: Canvas is completely empty/white! PDF will be blank.');
    console.error('[PDF Generator] Container HTML length:', pdfContainer.innerHTML.length);
    console.error('[PDF Generator] Container text content:', pdfContainer.textContent?.substring(0, 200));
  }

  // Convert canvas to PDF with optimized compression
  const imgData = canvas.toDataURL('image/jpeg', 0.7); // Reduced quality from 0.95 to 0.7
  console.log('[PDF Generator] Image data length:', imgData.length);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pdfWidth - 20;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 10;

  pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
  heightLeft -= pdfHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + 10;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;
  }

  // Remove temporary container
  document.body.removeChild(pdfContainer);

  console.log('[PDF Generator] PDF generated successfully');

  // Return base64-encoded PDF
  const pdfOutput = pdf.output('datauristring');

  console.log('[PDF Generator] PDF output info:', {
    outputLength: pdfOutput.length,
    outputType: typeof pdfOutput,
    startsWithDataUri: pdfOutput.startsWith('data:application/pdf'),
    first100Chars: pdfOutput.substring(0, 100),
  });

  if (pdfOutput.length < 1000) {
    console.error('[PDF Generator] WARNING: PDF output is suspiciously small:', pdfOutput.length, 'bytes');
    console.error('[PDF Generator] Full output:', pdfOutput);
  }

  return pdfOutput;
}

/**
 * Upload PDF to backend
 * @param taskId - The task ID
 * @param pdfData - Base64-encoded PDF data
 * @returns PDF URL from Firebase Storage
 */
export async function uploadTaskPDF(taskId: string, pdfData: string): Promise<string | null> {
  try {
    console.log('[PDF Generator] Uploading PDF for task:', taskId);
    console.log('[PDF Generator] PDF data length:', pdfData.length);
    console.log('[PDF Generator] PDF data preview:', pdfData.substring(0, 100));

    const { buildApiUrl } = await import('@/lib/config/urls');
    const uploadUrl = buildApiUrl(`/tasks/${taskId}/upload-pdf`);

    console.log('[PDF Generator] Uploading to:', uploadUrl);

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pdfData }),
    });

    console.log('[PDF Generator] Upload response status:', response.status);

    const result = await response.json();

    if (!result.success) {
      console.error('[PDF Generator] Upload failed:', result.message);
      return null;
    }

    console.log('[PDF Generator] PDF uploaded successfully:', result.pdfUrl);
    return result.pdfUrl;
  } catch (error) {
    console.error('[PDF Generator] Error uploading PDF:', error);
    return null;
  }
}

/**
 * Generate and upload PDF for a task
 * @param taskData - The task data
 * @returns PDF URL or null if failed
 */
export async function generateAndUploadPDF(taskData: TaskPDFData): Promise<string | null> {
  try {
    const pdfData = await generateTaskPDF(taskData);
    const pdfUrl = await uploadTaskPDF(taskData.id, pdfData);
    return pdfUrl;
  } catch (error) {
    console.error('[PDF Generator] Error in generateAndUploadPDF:', error);
    return null;
  }
}

/**
 * Test PDF Data Interface
 */
export interface TestPDFData {
  id: string;
  name: string;
  subject?: string;
  gradeLevel?: string;
  description?: string;
  tasks: Array<{
    title?: string;
    description: string;
    images?: Array<{ id: string; url: string } | string>;
    questions?: Array<{ question: string; score?: number }>;
    score?: number;
    showImage?: boolean;
  }>;
}

/**
 * Generate a PDF from test content with all tasks
 * @param testData - The test data to convert to PDF
 * @returns Base64-encoded PDF data
 */
export async function generateTestPDF(testData: TestPDFData): Promise<string> {
  console.log('[PDF Generator] Starting PDF generation for test:', testData.id);

  // Dynamically import html2canvas and jsPDF
  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');

  // Helper to decode HTML entities
  const decodeHtmlEntities = (text: string): string => {
    if (typeof document === 'undefined') return text;
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  // Process image placeholders
  const processImagePlaceholders = (html: string, images: any[]): string => {
    if (!images || images.length === 0) return html;

    const validImages = images.filter((img: any) => {
      const url = typeof img === 'string' ? img : img?.url;
      return url && url.trim() !== '';
    });

    if (validImages.length === 0) return html;

    let processedHtml = html;
    validImages.forEach((image: any, index: number) => {
      const placeholder = `[IMAGE_${index + 1}]`;
      let imageUrl = typeof image === 'string' ? image : image.url;
      imageUrl = decodeHtmlEntities(imageUrl);

      const imgTag = `<img src="${imageUrl}" crossorigin="anonymous" alt="Task illustration ${index + 1}" style="display: block; width: 100%; max-width: 600px; height: auto; margin: 20px auto; border-radius: 8px;" class="task-image" />`;
      processedHtml = processedHtml.replace(placeholder, imgTag);
    });

    return processedHtml;
  };

  // Create temporary container
  const pdfContainer = document.createElement('div');
  pdfContainer.style.position = 'fixed';
  pdfContainer.style.top = '-10000px';
  pdfContainer.style.left = '0';
  pdfContainer.style.width = '210mm';
  pdfContainer.style.padding = '20mm';
  pdfContainer.style.backgroundColor = 'white';
  pdfContainer.style.fontFamily = 'Arial, sans-serif';
  pdfContainer.style.fontSize = '14px';
  pdfContainer.style.lineHeight = '1.6';
  pdfContainer.style.color = '#333';
  pdfContainer.style.visibility = 'visible';
  pdfContainer.style.opacity = '1';

  // Build HTML content with header and tasks
  let tasksHtml = '';
  testData.tasks.forEach((task, index) => {
    const descriptionWithImages = task.showImage !== false
      ? processImagePlaceholders(task.description, task.images || [])
      : task.description;

    let questionsHtml = '';
    if (task.questions && task.questions.length > 0) {
      questionsHtml = '<div style="margin-top: 15px; padding-left: 15px;">';
      task.questions.forEach((q, qIdx) => {
        questionsHtml += `
          <div style="margin-bottom: 10px;">
            <strong>${String.fromCharCode(97 + qIdx)}) ${q.question}</strong>
            ${q.score ? ` <span style="color: #666;">(${q.score} points)</span>` : ''}
          </div>
        `;
      });
      questionsHtml += '</div>';
    }

    tasksHtml += `
      <div style="margin-bottom: 30px; page-break-inside: avoid;">
        <h3 style="color: #1976d2; margin-bottom: 10px;">
          Task ${index + 1}${task.title ? `: ${task.title}` : ''}
          ${task.score ? ` <span style="color: #666; font-size: 0.9em;">(${task.score} points)</span>` : ''}
        </h3>
        <div style="font-size: 14px; line-height: 1.8;">
          ${processLatexInHtml(descriptionWithImages)}
        </div>
        ${questionsHtml}
      </div>
    `;
  });

  pdfContainer.innerHTML = `
    <div style="padding: 10px;">
      <h1 style="color: #1976d2; border-bottom: 2px solid #1976d2; padding-bottom: 10px; margin-bottom: 20px;">
        ${testData.name}
      </h1>
      ${testData.subject ? `<p style="margin-bottom: 5px;"><strong>Subject:</strong> ${testData.subject}</p>` : ''}
      ${testData.gradeLevel ? `<p style="margin-bottom: 5px;"><strong>Grade Level:</strong> ${testData.gradeLevel}</p>` : ''}
      ${testData.description ? `<p style="margin-bottom: 20px; color: #666;">${testData.description}</p>` : ''}
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;" />
      ${tasksHtml}
    </div>
  `;

  document.body.appendChild(pdfContainer);

  // Wait for images to load
  const images = pdfContainer.getElementsByTagName('img');
  const imagePromises = Array.from(images).map((img) => {
    return new Promise((resolve) => {
      if (img.complete && img.naturalHeight !== 0) {
        resolve(null);
      } else {
        const timeout = setTimeout(() => {
          console.warn(`[PDF Generator] Image load timeout: ${img.src}`);
          resolve(null);
        }, 15000);

        img.onload = () => {
          clearTimeout(timeout);
          resolve(null);
        };
        img.onerror = () => {
          clearTimeout(timeout);
          console.warn(`[PDF Generator] Failed to load image: ${img.src}`);
          resolve(null);
        };
      }
    });
  });

  console.log(`[PDF Generator] Waiting for ${images.length} image(s) to load...`);
  await Promise.all(imagePromises);

  // Render LaTeX if available
  if (typeof window !== 'undefined' && (window as any).S2Latex) {
    console.log('[PDF Generator] Processing LaTeX...');
    (window as any).S2Latex.processTree(pdfContainer);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Wait for final rendering
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('[PDF Generator] Capturing canvas...');

  // Capture canvas with optimized settings
  const canvas = await html2canvas(pdfContainer, {
    scale: 1.5,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: pdfContainer.scrollWidth,
    windowHeight: pdfContainer.scrollHeight,
  });

  console.log('[PDF Generator] Canvas captured:', {
    width: canvas.width,
    height: canvas.height
  });

  // Convert canvas to PDF with optimized compression
  const imgData = canvas.toDataURL('image/jpeg', 0.7);
  console.log('[PDF Generator] Image data length:', imgData.length);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pdfWidth - 20;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 10;

  pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
  heightLeft -= pdfHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + 10;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;
  }

  // Remove temporary container
  document.body.removeChild(pdfContainer);

  console.log('[PDF Generator] Test PDF generated successfully');

  // Return base64-encoded PDF
  const pdfOutput = pdf.output('datauristring');

  console.log('[PDF Generator] PDF output info:', {
    outputLength: pdfOutput.length,
    outputType: typeof pdfOutput,
    startsWithDataUri: pdfOutput.startsWith('data:application/pdf'),
  });

  return pdfOutput;
}
