import { GoogleGenerativeAI } from '@google/generative-ai';
import { validateAndNormalizeAiResponse } from '../utils/aiResponseValidator.js';

const DEFAULT_MODEL = 'gemini-2.5-flash';
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds timeout limit

/**
 * Builds the strict system prompt for resume entity extraction
 * @param {string} resumeText - Sanitized plain text of resume
 * @returns {string} Formatted prompt
 */
const buildExtractionPrompt = (resumeText) => {
  return `You are a resume information extraction system.
Extract ONLY information explicitly present in the supplied resume text.
Do not invent skills, technologies, education, experience, projects, certifications, or other information.
Return valid JSON only.
If a category is not present, return an empty array.

The output MUST strictly match this JSON structure:
{
  "skills": ["general skill", "methodology", "concept"],
  "programmingLanguages": ["JavaScript", "Python", "SQL"],
  "frameworks": ["React", "Express", "Node.js"],
  "databases": ["MongoDB", "PostgreSQL"],
  "tools": ["Git", "Docker", "VS Code"],
  "projects": [
    {
      "name": "Project Name",
      "description": "Brief description of the project and achievements",
      "technologies": ["React", "Node.js"]
    }
  ],
  "education": [
    {
      "degree": "B.Tech / B.S. / High School",
      "institution": "University / College / School Name",
      "field": "Computer Science / Field of Study",
      "startYear": "2022",
      "endYear": "2026"
    }
  ],
  "experience": [
    {
      "role": "Job / Internship Title",
      "company": "Company / Organization Name",
      "description": "Responsibilities and key deliverables",
      "technologies": ["technology used"]
    }
  ],
  "certifications": [
    {
      "name": "Certification Title",
      "issuer": "Issuing Authority / Organization",
      "year": "2024"
    }
  ]
}

RESUME TEXT TO ANALYZE:
"""
${resumeText}
"""`;
};

/**
 * Extract structured resume entities using Google Gemini API
 * @param {string} resumeText - Plain extracted text from resume
 * @returns {Promise<{ extractedData: Object, modelUsed: string }>}
 */
export const extractResumeEntitiesWithAi = async (resumeText) => {
  // 1. Validate text presence
  if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length === 0) {
    throw new Error('Resume text is empty. Cannot perform AI extraction on empty content.');
  }

  // 2. Validate API key configuration
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is not configured in the server environment.');
  }

  const modelName = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1, // Near-zero temperature for factual, deterministic extraction
      },
    });

    const prompt = buildExtractionPrompt(resumeText);

    // Timeout guard to prevent hanging network calls
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error('AI extraction request timed out after 30 seconds.')),
        REQUEST_TIMEOUT_MS
      )
    );

    const apiCallPromise = model.generateContent(prompt);
    const result = await Promise.race([apiCallPromise, timeoutPromise]);

    const responseText = result.response.text();
    if (!responseText || responseText.trim().length === 0) {
      throw new Error('Gemini API returned an empty response.');
    }

    // 3. Validate and normalize the response structure
    const validatedData = validateAndNormalizeAiResponse(responseText);

    return {
      extractedData: validatedData,
      modelUsed: modelName,
    };
  } catch (error) {
    // Sanitize and handle specific Gemini errors safely
    if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('ResourceExhausted')) {
      throw new Error('AI extraction service quota exceeded or rate limited. Please try again shortly.');
    }
    if (error.message?.includes('401') || error.message?.includes('API_KEY_INVALID')) {
      throw new Error('Gemini API key is invalid or unauthorized. Please verify server configuration.');
    }
    if (error.message?.includes('timed out')) {
      throw new Error('AI extraction service timed out. Please try again.');
    }

    // Re-throw validation or general operational errors safely
    throw new Error(`AI extraction failed: ${error.message}`);
  }
};
