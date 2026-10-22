import SkillTaxonomy from '../models/SkillTaxonomy.js';
import { buildTaxonomyLookup, stripPunctuation } from './skillNormalizationService.js';

const IMPORTANCE_WEIGHT_ORDER = {
  critical: 3,
  important: 2,
  good_to_have: 1,
};

/**
 * Normalizes category string to standard categoryBreakdown key
 */
const mapCategoryToBreakdownKey = (category = '') => {
  const catLower = category.toLowerCase().trim();
  if (catLower.includes('programming') || catLower.includes('language')) {
    return 'programmingLanguages';
  }
  if (catLower.includes('framework') || catLower.includes('library')) {
    return 'frameworks';
  }
  if (catLower.includes('database')) {
    return 'databases';
  }
  if (catLower.includes('tool') || catLower.includes('testing')) {
    return 'tools';
  }
  if (catLower.includes('devops') || catLower.includes('cloud')) {
    return 'devops';
  }
  if (catLower.includes('soft')) {
    return 'softSkills';
  }
  return 'other';
};

/**
 * Deterministic Semantic & Alias Skill Matching Engine
 * 
 * Compares normalized candidate skills with JobRole required skills.
 * Classifies skills into Matched, Partial, and Missing.
 * Calculates weighted gap scores and ranks missing skills by priority.
 * 
 * @param {Array<Object>} normalizedCandidateSkills - Normalized skills from candidate resume
 * @param {Object} jobRole - Target JobRole document with requiredSkills
 * @param {Array} taxonomyList - Optional pre-loaded SkillTaxonomy list
 * @returns {Object} Gap analysis result
 */
export const matchSkillsToJobRole = async (
  normalizedCandidateSkills = [],
  jobRole = null,
  taxonomyList = null
) => {
  if (!jobRole) {
    throw new Error('Target JobRole is required for skill matching');
  }

  // Load active taxonomy if not provided
  if (!taxonomyList) {
    taxonomyList = await SkillTaxonomy.find({ isActive: true }).lean();
  }

  const { canonicalMap, strippedMap, idMap } = buildTaxonomyLookup(taxonomyList);

  // Build candidate skills index for fast lookup
  const candidateCanonicalMap = new Map(); // lowercase canonical name -> candidate skill
  const candidateStrippedMap = new Map();  // stripped string -> candidate skill
  const candidateIdMap = new Map();        // skillId string -> candidate skill

  for (const candSkill of normalizedCandidateSkills) {
    if (!candSkill || !candSkill.canonicalName) continue;

    const lowerName = candSkill.canonicalName.toLowerCase().trim();
    const strippedName = stripPunctuation(candSkill.canonicalName);

    candidateCanonicalMap.set(lowerName, candSkill);
    if (strippedName) {
      candidateStrippedMap.set(strippedName, candSkill);
    }
    if (candSkill.skillId) {
      candidateIdMap.set(candSkill.skillId.toString(), candSkill);
    }
  }

  const requiredSkills = Array.isArray(jobRole.requiredSkills) ? jobRole.requiredSkills : [];

  const matchedSkills = [];
  const partiallyMatchedSkills = [];
  const missingSkills = [];

  let totalPossibleWeight = 0;
  let earnedWeight = 0;

  // Breakdown accumulator
  const breakdownWeights = {
    programmingLanguages: { total: 0, earned: 0 },
    frameworks: { total: 0, earned: 0 },
    databases: { total: 0, earned: 0 },
    tools: { total: 0, earned: 0 },
    devops: { total: 0, earned: 0 },
    softSkills: { total: 0, earned: 0 },
    other: { total: 0, earned: 0 },
  };

  for (const req of requiredSkills) {
    const reqName = req.canonicalName ? req.canonicalName.trim() : '';
    if (!reqName) continue;

    const reqLower = reqName.toLowerCase();
    const reqStripped = stripPunctuation(reqName);
    const reqIdStr = req.skillId ? req.skillId.toString() : '';
    const weight = typeof req.weight === 'number' && req.weight >= 1 ? req.weight : 3;
    const importance = req.importance || 'important';
    const category = req.category || 'Other';
    const breakdownKey = mapCategoryToBreakdownKey(category);

    totalPossibleWeight += weight;
    breakdownWeights[breakdownKey].total += weight;

    // Resolve taxonomy metadata for the required skill
    let taxMeta = null;
    if (reqIdStr && idMap.has(reqIdStr)) {
      taxMeta = idMap.get(reqIdStr);
    } else if (canonicalMap.has(reqLower)) {
      taxMeta = canonicalMap.get(reqLower);
    } else if (reqStripped && strippedMap.has(reqStripped)) {
      taxMeta = strippedMap.get(reqStripped);
    }

    const canonicalSkillId = req.skillId || (taxMeta ? taxMeta._id : null);
    const prerequisites = taxMeta?.prerequisites || [];
    const relatedSkills = taxMeta?.relatedSkills || [];

    // 1. Check MATCHED: Candidate has exact canonical skill or recognized alias
    let matchedCandidate = null;
    if (candidateCanonicalMap.has(reqLower)) {
      matchedCandidate = candidateCanonicalMap.get(reqLower);
    } else if (reqStripped && candidateStrippedMap.has(reqStripped)) {
      matchedCandidate = candidateStrippedMap.get(reqStripped);
    } else if (reqIdStr && candidateIdMap.has(reqIdStr)) {
      matchedCandidate = candidateIdMap.get(reqIdStr);
    }

    if (matchedCandidate) {
      const matchType = matchedCandidate.matchType === 'alias' ? 'alias' : 'exact';
      const score = 1.0;
      const skillEarned = weight * score;
      earnedWeight += skillEarned;
      breakdownWeights[breakdownKey].earned += skillEarned;

      matchedSkills.push({
        skillName: reqName,
        skill: reqName,
        canonicalSkillId,
        category,
        importance,
        weight,
        matchType,
        similarityScore: score,
        candidateSkillFound: matchedCandidate.matchedFrom || matchedCandidate.canonicalName,
      });
      continue;
    }

    // 2. Check PARTIAL: Candidate lacks exact skill, but possesses a recognized related skill
    let relatedCandidateFound = null;

    if (Array.isArray(relatedSkills) && relatedSkills.length > 0) {
      for (const related of relatedSkills) {
        const relLower = related.toLowerCase().trim();
        const relStripped = stripPunctuation(related);

        if (candidateCanonicalMap.has(relLower)) {
          relatedCandidateFound = candidateCanonicalMap.get(relLower);
          break;
        } else if (relStripped && candidateStrippedMap.has(relStripped)) {
          relatedCandidateFound = candidateStrippedMap.get(relStripped);
          break;
        }
      }
    }

    // Reverse check: does candidate have any skill whose taxonomy relatedSkills list includes reqName?
    if (!relatedCandidateFound) {
      for (const candSkill of normalizedCandidateSkills) {
        if (!candSkill || !candSkill.canonicalName) continue;
        const candTax = canonicalMap.get(candSkill.canonicalName.toLowerCase());
        if (candTax && Array.isArray(candTax.relatedSkills)) {
          const hasRelation = candTax.relatedSkills.some(
            (rel) => rel.toLowerCase().trim() === reqLower || stripPunctuation(rel) === reqStripped
          );
          if (hasRelation) {
            relatedCandidateFound = candSkill;
            break;
          }
        }
      }
    }

    if (relatedCandidateFound) {
      const partialScore = 0.7; // 70% credit for transferable related foundational skill
      const skillEarned = weight * partialScore;
      earnedWeight += skillEarned;
      breakdownWeights[breakdownKey].earned += skillEarned;

      const candidateSkillName = relatedCandidateFound.canonicalName || relatedCandidateFound.matchedFrom;
      const note = `Candidate possesses related skill '${candidateSkillName}', which provides transferable foundational knowledge for '${reqName}'.`;

      partiallyMatchedSkills.push({
        targetSkill: reqName,
        skill: reqName,
        canonicalSkillId,
        candidateSkillFound: candidateSkillName,
        similarityScore: partialScore,
        weight,
        importance,
        recommendationNote: note,
        reason: note,
      });
      continue;
    }

    // 3. Classification: MISSING
    // Candidate has neither the skill nor any recognized equivalent/related skill
    const importanceScore = Math.round((weight / 5) * 100) / 100;
    const reasonText = `Required by ${jobRole.title} (${importance} priority, weight ${weight}/5) but not found in the student's extracted skills.`;

    missingSkills.push({
      skillName: reqName,
      skill: reqName,
      canonicalSkillId,
      category,
      importance,
      importanceScore,
      weight,
      priorityRank: 0, // Assigned after sorting
      prerequisites,
      reasoning: reasonText,
      reason: reasonText,
    });
  }

  // Rank missing skills by priority:
  // 1. weight descending (highest weight required skills first)
  // 2. importance descending (critical > important > good_to_have)
  // 3. alphabetical skillName as tie-breaker
  missingSkills.sort((a, b) => {
    if (b.weight !== a.weight) {
      return b.weight - a.weight;
    }
    const impDiff = (IMPORTANCE_WEIGHT_ORDER[b.importance] || 0) - (IMPORTANCE_WEIGHT_ORDER[a.importance] || 0);
    if (impDiff !== 0) {
      return impDiff;
    }
    return a.skillName.localeCompare(b.skillName);
  });

  // Assign priorityRank (1-based index)
  missingSkills.forEach((item, index) => {
    item.priorityRank = index + 1;
  });

  // Calculate quantitative scores
  let overallMatchPercentage = 0;
  let overallGapPercentage = 100;
  let weightedScore = 0;

  if (totalPossibleWeight > 0) {
    const rawScore = (earnedWeight / totalPossibleWeight) * 100;
    weightedScore = Math.round(rawScore * 100) / 100;
    overallMatchPercentage = Math.round(rawScore);
    overallGapPercentage = Math.max(0, 100 - overallMatchPercentage);
  }

  // Calculate category breakdown percentages
  const categoryBreakdown = {};
  for (const [key, counts] of Object.entries(breakdownWeights)) {
    if (counts.total > 0) {
      categoryBreakdown[key] = Math.round((counts.earned / counts.total) * 100);
    } else {
      categoryBreakdown[key] = 0;
    }
  }

  return {
    overallMatchPercentage,
    overallGapPercentage,
    weightedScore,
    totalRequiredSkills: requiredSkills.length,
    matchedCount: matchedSkills.length,
    partialCount: partiallyMatchedSkills.length,
    missingCount: missingSkills.length,
    matchedSkills,
    partiallyMatchedSkills,
    partialSkills: partiallyMatchedSkills, // convenience alias
    missingSkills,
    categoryBreakdown,
  };
};

export default {
  matchSkillsToJobRole,
};
