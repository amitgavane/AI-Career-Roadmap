import SkillTaxonomy from '../models/SkillTaxonomy.js';

/**
 * Utility to strip punctuation, spaces, dashes, dots, and underscores
 * for robust string matching (e.g. "Node.js", "NodeJS", "node js" -> "nodejs")
 */
export const stripPunctuation = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.toLowerCase().replace(/[\s\-_.]+/g, '');
};

/**
 * Utility to clean and normalize raw string spacing
 */
export const cleanSkillString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.trim().toLowerCase().replace(/\s+/g, ' ');
};

/**
 * Builds fast in-memory lookup indexes from active SkillTaxonomy documents
 * 
 * @param {Array} taxonomyList - Array of SkillTaxonomy Mongoose documents or plain objects
 * @returns {Object} Lookup maps for canonical, alias, and stripped matches
 */
export const buildTaxonomyLookup = (taxonomyList) => {
  const canonicalMap = new Map(); // exact lowercase canonicalName -> skill
  const aliasMap = new Map();     // exact lowercase alias -> skill
  const strippedMap = new Map();  // punctuation-stripped -> skill
  const idMap = new Map();        // skill._id string -> skill

  for (const skill of taxonomyList) {
    if (!skill || !skill.canonicalName) continue;

    const canonicalLower = skill.canonicalName.toLowerCase().trim();
    const canonicalStripped = stripPunctuation(skill.canonicalName);
    const skillIdStr = skill._id ? skill._id.toString() : '';

    canonicalMap.set(canonicalLower, skill);
    if (canonicalStripped) {
      strippedMap.set(canonicalStripped, skill);
    }
    if (skillIdStr) {
      idMap.set(skillIdStr, skill);
    }

    if (Array.isArray(skill.aliases)) {
      for (const alias of skill.aliases) {
        if (!alias || typeof alias !== 'string') continue;
        const aliasLower = alias.toLowerCase().trim();
        const aliasStripped = stripPunctuation(alias);

        if (!aliasMap.has(aliasLower)) {
          aliasMap.set(aliasLower, skill);
        }
        if (aliasStripped && !strippedMap.has(aliasStripped)) {
          strippedMap.set(aliasStripped, skill);
        }
      }
    }
  }

  return { canonicalMap, aliasMap, strippedMap, idMap };
};

/**
 * Normalizes an array of raw candidate skill strings against the skill taxonomy.
 * Resolves aliases, removes duplicates, and preserves canonical taxonomy metadata.
 * 
 * @param {Array<string>} rawSkills - Array of skill strings extracted from candidate resume
 * @param {Array} taxonomyList - Optional pre-loaded taxonomy list (queries DB if not provided)
 * @returns {Promise<{
 *   normalizedSkills: Array<{
 *     skillId: string|null,
 *     canonicalName: string,
 *     category: string,
 *     matchedFrom: string,
 *     matchType: 'exact'|'alias'|'unmapped'
 *   }>,
 *   canonicalSkillsMap: Map<string, Object>,
 *   unmappedSkills: Array<string>
 * }>}
 */
export const normalizeSkills = async (rawSkills = [], taxonomyList = null) => {
  if (!Array.isArray(rawSkills)) {
    rawSkills = [];
  }

  // Load active taxonomy if not provided
  if (!taxonomyList) {
    taxonomyList = await SkillTaxonomy.find({ isActive: true }).lean();
  }

  const { canonicalMap, aliasMap, strippedMap } = buildTaxonomyLookup(taxonomyList);

  const canonicalSkillsMap = new Map(); // lowercase canonicalName -> normalized skill object
  const unmappedSkillsMap = new Map();  // lowercase raw name -> raw skill object

  for (const raw of rawSkills) {
    if (!raw || typeof raw !== 'string') continue;
    const trimmedRaw = raw.trim();
    if (!trimmedRaw) continue;

    const lowerRaw = trimmedRaw.toLowerCase();
    const strippedRaw = stripPunctuation(trimmedRaw);

    let matchedTaxonomySkill = null;
    let matchType = 'exact';

    // 1. Exact canonical name match (case-insensitive)
    if (canonicalMap.has(lowerRaw)) {
      matchedTaxonomySkill = canonicalMap.get(lowerRaw);
      matchType = 'exact';
    }
    // 2. Exact alias match (case-insensitive)
    else if (aliasMap.has(lowerRaw)) {
      matchedTaxonomySkill = aliasMap.get(lowerRaw);
      matchType = 'alias';
    }
    // 3. Punctuation/spacing stripped match (e.g. "nodejs" -> "Node.js", "mongodb" -> "MongoDB")
    else if (strippedRaw && strippedMap.has(strippedRaw)) {
      matchedTaxonomySkill = strippedMap.get(strippedRaw);
      const isExactCanonical = lowerRaw === matchedTaxonomySkill.canonicalName.toLowerCase();
      matchType = isExactCanonical ? 'exact' : 'alias';
    }

    if (matchedTaxonomySkill) {
      const canonicalKey = matchedTaxonomySkill.canonicalName.toLowerCase();

      if (!canonicalSkillsMap.has(canonicalKey)) {
        canonicalSkillsMap.set(canonicalKey, {
          skillId: matchedTaxonomySkill._id,
          canonicalName: matchedTaxonomySkill.canonicalName,
          category: matchedTaxonomySkill.category,
          matchedFrom: trimmedRaw,
          matchType,
          relatedSkills: matchedTaxonomySkill.relatedSkills || [],
          prerequisites: matchedTaxonomySkill.prerequisites || [],
        });
      }
    } else {
      // Unmapped skill - preserved without modification
      if (!unmappedSkillsMap.has(lowerRaw)) {
        unmappedSkillsMap.set(lowerRaw, {
          skillId: null,
          canonicalName: trimmedRaw,
          category: 'Other',
          matchedFrom: trimmedRaw,
          matchType: 'unmapped',
          relatedSkills: [],
          prerequisites: [],
        });
      }
    }
  }

  const normalizedSkills = [
    ...canonicalSkillsMap.values(),
    ...unmappedSkillsMap.values(),
  ];

  return {
    normalizedSkills,
    canonicalSkillsMap,
    unmappedSkills: Array.from(unmappedSkillsMap.keys()),
  };
};

export default {
  stripPunctuation,
  cleanSkillString,
  buildTaxonomyLookup,
  normalizeSkills,
};
