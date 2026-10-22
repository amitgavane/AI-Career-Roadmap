import path from 'path';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import { sanitizeResumeText, isMeaningfulText } from '../utils/textSanitizer.js';

/**
 * Extract plain text from PDF buffer
 * @param {Buffer} buffer - File buffer
 * @returns {Promise<string>} Extracted plain text
 */
export const extractTextFromPdf = async (buffer) => {
  let parser = null;
  try {
    if (!buffer || buffer.length === 0) {
      throw new Error('PDF file buffer is empty.');
    }

    parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result?.text || '';
  } catch (error) {
    if (error.name === 'PasswordException' || error.message?.includes('password')) {
      throw new Error('PDF is password protected and cannot be extracted.');
    }
    if (error.name === 'InvalidPDFException' || error.message?.includes('Invalid PDF')) {
      throw new Error('The uploaded file is not a valid or readable PDF document.');
    }
    throw new Error(`PDF text extraction failed: ${error.message}`);
  } finally {
    if (parser && typeof parser.destroy === 'function') {
      try {
        await parser.destroy();
      } catch (cleanupErr) {
        // Ignore parser cleanup errors
      }
    }
  }
};

/**
 * Extract plain text from DOCX buffer
 * @param {Buffer} buffer - File buffer
 * @returns {Promise<string>} Extracted plain text
 */
export const extractTextFromDocx = async (buffer) => {
  try {
    if (!buffer || buffer.length === 0) {
      throw new Error('DOCX file buffer is empty.');
    }

    const mammothExtractor = mammoth.extractRawText || mammoth.default?.extractRawText;
    const result = await mammothExtractor({ buffer });
    return result?.value || '';
  } catch (error) {
    if (error.message?.includes('Can\'t find end of central directory') || error.message?.includes('zip')) {
      throw new Error('The uploaded file is not a valid or readable Word document (.docx).');
    }
    throw new Error(`DOCX text extraction failed: ${error.message}`);
  }
};

/**
 * Dispatcher to extract and sanitize text from any supported resume file
 * @param {Object} file - Multer file object ({ buffer, mimetype, originalname })
 * @returns {Promise<{ rawText: string, sanitizedText: string, charCount: number, wordCount: number }>}
 */
export const extractTextFromResume = async (file) => {
  if (!file || !file.buffer) {
    throw new Error('No resume file buffer provided for extraction.');
  }

  const extension = path.extname(file.originalname || '').toLowerCase();
  const mimeType = (file.mimetype || '').toLowerCase();

  let rawExtractedText = '';

  if (
    extension === '.pdf' ||
    mimeType === 'application/pdf'
  ) {
    rawExtractedText = await extractTextFromPdf(file.buffer);
  } else if (
    extension === '.docx' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    rawExtractedText = await extractTextFromDocx(file.buffer);
  } else {
    throw new Error(`Unsupported resume format '${extension}'. Only PDF and DOCX files are supported.`);
  }

  // Normalize and clean text
  const sanitizedText = sanitizeResumeText(rawExtractedText);

  // Validate that meaningful content was extracted
  if (!isMeaningfulText(sanitizedText, 25)) {
    throw new Error(
      'Unable to extract readable text from the resume. The document appears empty, scanned as an image, or non-textual.'
    );
  }

  const charCount = sanitizedText.length;
  const wordCount = sanitizedText.split(/\s+/).filter(Boolean).length;

  return {
    rawText: rawExtractedText,
    sanitizedText,
    charCount,
    wordCount,
  };
};
