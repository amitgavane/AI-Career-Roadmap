/**
 * Utility to sanitize and normalize extracted text from resumes.
 * Prepares clean, structured text for downstream AI/NLP extraction in Phase 5.
 */

/**
 * Sanitize raw extracted resume text
 * @param {string} rawText - Text extracted from PDF or DOCX
 * @returns {string} Sanitized, normalized plain text
 */
export const sanitizeResumeText = (rawText) => {
  if (!rawText || typeof rawText !== 'string') {
    return '';
  }

  let text = rawText;

  // 1. Normalize line breaks to standard \n
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 2. Replace non-breaking spaces and exotic Unicode space variants with standard ASCII space
  text = text.replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000\uFEFF]/g, ' ');

  // 3. Remove non-printable / control characters (preserve standard \n, \t, and printable ASCII/Unicode)
  // Keep characters from space (\x20) upwards, plus \n (\x0A) and \t (\x09)
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // 4. Normalize multiple horizontal spaces and tabs into a single space, while preserving newlines
  text = text
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n');

  // 5. Collapse excessive blank lines (3 or more newlines become at most 2 newlines)
  text = text.replace(/\n{3,}/g, '\n\n');

  // 6. Trim leading/trailing whitespace
  return text.trim();
};

/**
 * Validates whether the extracted text contains meaningful content
 * @param {string} text - Sanitized text string
 * @param {number} minChars - Minimum required characters (default: 30)
 * @returns {boolean} True if meaningful text is present
 */
export const isMeaningfulText = (text, minChars = 30) => {
  if (!text || typeof text !== 'string') {
    return false;
  }

  // Count alphanumeric characters
  const alphanumericCount = (text.match(/[a-zA-Z0-9]/g) || []).length;
  return alphanumericCount >= minChars;
};
