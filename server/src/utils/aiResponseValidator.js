/**
 * Validates and normalizes structured JSON output from Gemini AI
 */

const REQUIRED_CATEGORIES = [
  'skills',
  'programmingLanguages',
  'frameworks',
  'databases',
  'tools',
  'projects',
  'education',
  'experience',
  'certifications',
];

/**
 * Clean potential markdown wrappers from LLM string output
 * @param {string} text - Raw model response
 * @returns {string} Stripped JSON string
 */
export const stripMarkdownJson = (text) => {
  if (typeof text !== 'string') return '';
  let cleaned = text.trim();
  // Strip ```json ... ``` or ``` ... ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/, '');
  }
  return cleaned.trim();
};

/**
 * Validates and normalizes the parsed JSON structure from Gemini
 * @param {string|Object} rawInput - Raw text from Gemini or pre-parsed object
 * @returns {Object} Validated and normalized structured resume entities
 */
export const validateAndNormalizeAiResponse = (rawInput) => {
  let parsed;

  if (typeof rawInput === 'string') {
    const stripped = stripMarkdownJson(rawInput);
    try {
      parsed = JSON.parse(stripped);
    } catch (parseErr) {
      throw new Error(`AI response is not valid JSON: ${parseErr.message}`);
    }
  } else if (typeof rawInput === 'object' && rawInput !== null) {
    parsed = rawInput;
  } else {
    throw new Error('AI response input must be a valid JSON string or object.');
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('AI response top-level structure must be a JSON object.');
  }

  // Verify presence of all 9 required top-level categories
  for (const category of REQUIRED_CATEGORIES) {
    if (!(category in parsed)) {
      throw new Error(`AI response missing required category: "${category}".`);
    }
    if (!Array.isArray(parsed[category])) {
      throw new Error(`AI response category "${category}" must be an array.`);
    }
  }

  // 1. Normalize simple string arrays (skills, languages, frameworks, databases, tools)
  const normalizeStringArray = (arr) => {
    return [
      ...new Set(
        arr
          .map((item) => (typeof item === 'string' ? item.trim() : ''))
          .filter((item) => item.length > 0)
      ),
    ];
  };

  const skills = normalizeStringArray(parsed.skills);
  const programmingLanguages = normalizeStringArray(parsed.programmingLanguages);
  const frameworks = normalizeStringArray(parsed.frameworks);
  const databases = normalizeStringArray(parsed.databases);
  const tools = normalizeStringArray(parsed.tools);

  // 2. Normalize projects
  const projects = parsed.projects
    .filter((proj) => proj && typeof proj === 'object' && !Array.isArray(proj))
    .map((proj) => ({
      name: typeof (proj.name || proj.title) === 'string' ? (proj.name || proj.title).trim() : '',
      description: typeof proj.description === 'string' ? proj.description.trim() : '',
      technologies: Array.isArray(proj.technologies)
        ? normalizeStringArray(proj.technologies)
        : [],
    }))
    .filter((proj) => proj.name.length > 0 || proj.description.length > 0);

  // 3. Normalize education
  const education = parsed.education
    .filter((edu) => edu && typeof edu === 'object' && !Array.isArray(edu))
    .map((edu) => ({
      degree: typeof edu.degree === 'string' ? edu.degree.trim() : '',
      institution: typeof edu.institution === 'string' ? edu.institution.trim() : '',
      field: typeof (edu.field || edu.fieldOfStudy) === 'string' ? (edu.field || edu.fieldOfStudy).trim() : '',
      startYear: edu.startYear ? String(edu.startYear).trim() : '',
      endYear: edu.endYear ? String(edu.endYear).trim() : '',
    }))
    .filter((edu) => edu.degree.length > 0 || edu.institution.length > 0);

  // 4. Normalize experience
  const experience = parsed.experience
    .filter((exp) => exp && typeof exp === 'object' && !Array.isArray(exp))
    .map((exp) => ({
      role: typeof (exp.role || exp.title) === 'string' ? (exp.role || exp.title).trim() : '',
      company: typeof exp.company === 'string' ? exp.company.trim() : '',
      description: typeof exp.description === 'string' ? exp.description.trim() : '',
      technologies: Array.isArray(exp.technologies)
        ? normalizeStringArray(exp.technologies)
        : [],
    }))
    .filter((exp) => exp.role.length > 0 || exp.company.length > 0);

  // 5. Normalize certifications
  const certifications = parsed.certifications
    .filter((cert) => cert && typeof cert === 'object' && !Array.isArray(cert))
    .map((cert) => ({
      name: typeof (cert.name || cert.title) === 'string' ? (cert.name || cert.title).trim() : '',
      issuer: typeof cert.issuer === 'string' ? cert.issuer.trim() : '',
      year: cert.year ? String(cert.year).trim() : '',
    }))
    .filter((cert) => cert.name.length > 0);

  return {
    skills,
    programmingLanguages,
    frameworks,
    databases,
    tools,
    projects,
    education,
    experience,
    certifications,
  };
};
