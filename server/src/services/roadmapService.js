import mongoose from 'mongoose';
import Roadmap from '../models/Roadmap.js';
import JobRole from '../models/JobRole.js';
import SkillTaxonomy from '../models/SkillTaxonomy.js';
import SkillGapAnalysis from '../models/SkillGapAnalysis.js';
import {
  getSkillCurriculum,
  buildMilestoneProject,
  FALLBACK_PREREQUISITES,
} from './roadmapKnowledgeCatalog.js';

const IMPORTANCE_WEIGHT_ORDER = {
  critical: 3,
  important: 2,
  good_to_have: 1,
};

/**
 * Deterministically prioritizes skills needing learning from a SkillGapAnalysis.
 * High-importance and high-weight missing skills receive higher priority.
 * Partial skills are also included to bridge knowledge gaps.
 * 
 * Score Formula:
 * (weight * 10) + (importanceWeight * 2) + (isMissing ? 1 : 0)
 * 
 * @param {Object} analysis - SkillGapAnalysis document or object
 * @returns {Array<Object>} Prioritized skills list
 */
export const prioritizeSkills = (analysis) => {
  if (!analysis) return [];

  const candidates = [];

  // 1. Missing skills (highest priority need)
  const missingSkills = Array.isArray(analysis.missingSkills) ? analysis.missingSkills : [];
  for (const item of missingSkills) {
    const skillName = item.skillName || item.skill || '';
    if (!skillName) continue;

    const weight = typeof item.weight === 'number' && item.weight >= 1 ? item.weight : 3;
    const importance = item.importance || 'important';
    const importanceWeight = IMPORTANCE_WEIGHT_ORDER[importance] || 2;
    const category = item.category || 'Other';

    // Base score prioritizes weight (50 max), importance (6 max), missing gap bonus (1)
    const priorityScore = weight * 10 + importanceWeight * 2 + 1;

    candidates.push({
      skill: skillName,
      weight,
      importance,
      importanceWeight,
      category,
      matchType: 'missing',
      priorityScore,
      reason: item.reasoning || item.reason || `Required missing skill (${importance} priority, weight ${weight}/5).`,
    });
  }

  // 2. Partially matched skills (refinement and bridging)
  const partialSkills = Array.isArray(analysis.partiallyMatchedSkills)
    ? analysis.partiallyMatchedSkills
    : Array.isArray(analysis.partialSkills)
    ? analysis.partialSkills
    : [];

  for (const item of partialSkills) {
    const skillName = item.targetSkill || item.skill || '';
    if (!skillName) continue;

    // Skip if already in candidates
    if (candidates.some((c) => c.skill.toLowerCase() === skillName.toLowerCase())) {
      continue;
    }

    const weight = typeof item.weight === 'number' && item.weight >= 1 ? item.weight : 3;
    const importance = item.importance || 'important';
    const importanceWeight = IMPORTANCE_WEIGHT_ORDER[importance] || 2;
    const category = item.category || 'Other';

    // Partial skills have foundational familiarity, slightly lower base than missing
    const priorityScore = weight * 10 + importanceWeight * 2 + 0;

    candidates.push({
      skill: skillName,
      weight,
      importance,
      importanceWeight,
      category,
      matchType: 'partial',
      priorityScore,
      reason: item.recommendationNote || item.reason || `Partially matched skill (${importance} priority, weight ${weight}/5).`,
    });
  }

  // Deterministic multi-tier sort:
  // 1. priorityScore descending
  // 2. weight descending
  // 3. importanceWeight descending
  // 4. alphabetical skill name as tie-breaker
  candidates.sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }
    if (b.weight !== a.weight) {
      return b.weight - a.weight;
    }
    if (b.importanceWeight !== a.importanceWeight) {
      return b.importanceWeight - a.importanceWeight;
    }
    return a.skill.localeCompare(b.skill);
  });

  // Assign priorityRank (1-based index)
  return candidates.map((item, index) => ({
    skill: item.skill,
    priorityRank: index + 1,
    importance: item.importance,
    weight: item.weight,
    matchType: item.matchType,
    category: item.category,
    reason: item.reason,
    priorityScore: item.priorityScore,
  }));
};

/**
 * Builds a lookup of prerequisites for skills using SkillTaxonomy and fallback catalog.
 */
const resolvePrerequisitesForSkill = (skillName, taxonomyList = []) => {
  const prereqSet = new Set();

  // Check database taxonomy
  if (Array.isArray(taxonomyList)) {
    const taxMatch = taxonomyList.find(
      (t) => t.canonicalName && t.canonicalName.toLowerCase() === skillName.toLowerCase()
    );
    if (taxMatch && Array.isArray(taxMatch.prerequisites)) {
      for (const p of taxMatch.prerequisites) {
        if (typeof p === 'string' && p.trim()) {
          prereqSet.add(p.trim());
        }
      }
    }
  }

  // Check fallback catalog
  const fallback = FALLBACK_PREREQUISITES[skillName];
  if (Array.isArray(fallback)) {
    for (const p of fallback) {
      if (typeof p === 'string' && p.trim()) {
        prereqSet.add(p.trim());
      }
    }
  }

  return Array.from(prereqSet);
};

/**
 * Orders prioritized skills using a topological sort aware of prerequisites.
 * Handles prerequisite cycles safely without crashing or dropping skills.
 * 
 * @param {Array<Object>} prioritizedSkills - Skills needing learning
 * @param {Array<Object>} matchedSkills - Skills the student already knows
 * @param {Array<Object>} taxonomyList - Active SkillTaxonomy documents
 * @returns {Object} { orderedSkills, externalPrerequisites }
 */
export const orderSkillsWithPrerequisites = (
  prioritizedSkills = [],
  matchedSkills = [],
  taxonomyList = []
) => {
  if (!Array.isArray(prioritizedSkills) || prioritizedSkills.length === 0) {
    return { orderedSkills: [], externalPrerequisites: [] };
  }

  // Set of skills already mastered by the student (lowercased)
  const masteredSkillNames = new Set(
    (matchedSkills || [])
      .map((s) => (s.skillName || s.skill || s.canonicalName || '').toLowerCase())
      .filter(Boolean)
  );

  // Map of skills in the learning set (lowercased -> prioritizedSkill item)
  const learningSkillMap = new Map();
  for (const item of prioritizedSkills) {
    learningSkillMap.set(item.skill.toLowerCase(), item);
  }

  // Build dependency graph for skills in the learning list
  // inDegree: number of unsatisfied prerequisites in learning list
  // dependents: which skills depend on this skill
  const inDegree = new Map();
  const dependents = new Map(); // lowercase skill -> Set of dependent lowercase skills
  const externalPrereqsSet = new Set();
  const skillPrereqMap = new Map(); // lowercase skill -> array of resolved prereq names

  for (const item of prioritizedSkills) {
    const sLower = item.skill.toLowerCase();
    inDegree.set(sLower, 0);
    dependents.set(sLower, new Set());
  }

  for (const item of prioritizedSkills) {
    const sLower = item.skill.toLowerCase();
    const allPrereqs = resolvePrerequisitesForSkill(item.skill, taxonomyList);
    skillPrereqMap.set(sLower, allPrereqs);

    for (const prereq of allPrereqs) {
      const pLower = prereq.toLowerCase();

      // If student already knows this prerequisite, it is satisfied!
      if (masteredSkillNames.has(pLower)) {
        continue;
      }

      // If prerequisite is also in the learning list, create a dependency edge
      if (learningSkillMap.has(pLower) && pLower !== sLower) {
        // pLower must be learned BEFORE sLower
        if (!dependents.has(pLower)) {
          dependents.set(pLower, new Set());
        }
        if (!dependents.get(pLower).has(sLower)) {
          dependents.get(pLower).add(sLower);
          inDegree.set(sLower, (inDegree.get(sLower) || 0) + 1);
        }
      } else if (!masteredSkillNames.has(pLower)) {
        // Prerequisite is not possessed and not in learning list (e.g. foundational prep)
        externalPrereqsSet.add(`${prereq} (Foundational for ${item.skill})`);
      }
    }
  }

  // Kahn's algorithm with priority selection
  const remaining = new Set(learningSkillMap.keys());
  const orderedSkills = [];

  while (remaining.size > 0) {
    // Find all nodes in remaining with inDegree === 0
    const available = [];
    for (const sLower of remaining) {
      if (inDegree.get(sLower) === 0) {
        available.push(learningSkillMap.get(sLower));
      }
    }

    if (available.length > 0) {
      // Pick the node with the highest priority (lowest priorityRank)
      available.sort((a, b) => {
        if (a.priorityRank !== b.priorityRank) {
          return a.priorityRank - b.priorityRank;
        }
        return a.skill.localeCompare(b.skill);
      });

      const selected = available[0];
      const selectedLower = selected.skill.toLowerCase();

      orderedSkills.push(selected);
      remaining.delete(selectedLower);

      // Decrement in-degree of its dependents
      for (const depLower of dependents.get(selectedLower)) {
        if (remaining.has(depLower)) {
          inDegree.set(depLower, Math.max(0, inDegree.get(depLower) - 1));
        }
      }
    } else {
      // Cycle detected among remaining nodes!
      // Gracefully break cycle by picking the highest-priority node among remaining
      const cycleCandidates = Array.from(remaining).map((sLower) => learningSkillMap.get(sLower));
      cycleCandidates.sort((a, b) => a.priorityRank - b.priorityRank);

      const forceSelected = cycleCandidates[0];
      const forceLower = forceSelected.skill.toLowerCase();

      console.warn(
        `[Roadmap Prerequisite Cycle Handled]: Cycle detected in prerequisite graph. Forcing selection of '${forceSelected.skill}' to preserve roadmap continuity.`
      );

      orderedSkills.push(forceSelected);
      remaining.delete(forceLower);

      // Decrement in-degree of its dependents
      for (const depLower of dependents.get(forceLower)) {
        if (remaining.has(depLower)) {
          inDegree.set(depLower, Math.max(0, inDegree.get(depLower) - 1));
        }
      }
    }
  }

  return {
    orderedSkills,
    externalPrerequisites: Array.from(externalPrereqsSet),
  };
};

/**
 * Generates a complete, personalized learning roadmap from a persisted SkillGapAnalysis.
 * 
 * @param {Object} analysis - SkillGapAnalysis document
 * @param {Object} options - Configuration options (e.g. weeklyHoursCommitment)
 * @returns {Object} Unpersisted roadmap object ready to save
 */
export const generateRoadmapFromAnalysis = async (analysis, options = {}) => {
  if (!analysis) {
    throw new Error('SkillGapAnalysis document is required to generate a roadmap');
  }

  // Resolve target JobRole
  let jobRole = analysis.targetRoleId;
  if (!jobRole || !jobRole.title) {
    jobRole = await JobRole.findById(analysis.targetRoleId).lean();
  }

  if (!jobRole) {
    throw new Error('Target job role associated with this skill gap analysis could not be found');
  }

  const weeklyHoursCommitment = options.weeklyHoursCommitment || 15;

  // Case C: Student has NO skill gaps (100% match)
  const missingCount = Array.isArray(analysis.missingSkills) ? analysis.missingSkills.length : 0;
  const partialCount = Array.isArray(analysis.partiallyMatchedSkills)
    ? analysis.partiallyMatchedSkills.length
    : Array.isArray(analysis.partialSkills)
    ? analysis.partialSkills.length
    : 0;

  if (missingCount === 0 && partialCount === 0) {
    return {
      userId: analysis.userId,
      targetRoleId: jobRole._id || jobRole.id,
      analysisId: analysis._id || analysis.id,
      skillGapAnalysisId: analysis._id || analysis.id,
      title: `Career Roadmap: ${jobRole.title} (Fully Qualified)`,
      description: `Student matches 100% of required skills for ${jobRole.title}. All foundational and advanced competencies are satisfied.`,
      estimatedDurationWeeks: 1,
      weeklyHoursCommitment: 5,
      totalEstimatedHours: 0,
      prerequisitesSummary: ['All job role prerequisites already satisfied and verified.'],
      prioritizedSkills: [],
      modules: [],
      milestones: [],
      milestoneProjects: [],
      status: 'COMPLETED',
      overallProgress: 100,
      progressPercentage: 100,
      completedMilestonesCount: 0,
    };
  }

  // Load SkillTaxonomy
  const taxonomyList = await SkillTaxonomy.find({ isActive: true }).lean();

  // 1. Prioritize learning skills
  const prioritizedSkills = prioritizeSkills(analysis);

  // 2. Order skills with topological prerequisite sorting
  const { orderedSkills, externalPrerequisites } = orderSkillsWithPrerequisites(
    prioritizedSkills,
    analysis.matchedSkills,
    taxonomyList
  );

  // 3. Build learning modules
  const modules = [];
  let totalModuleHours = 0;

  for (const item of orderedSkills) {
    const isPartial = item.matchType === 'partial';
    const curriculum = getSkillCurriculum(item.skill, item.category, item.weight, isPartial);

    const learningModule = {
      skill: item.skill,
      title: curriculum.title,
      objective: curriculum.objective,
      description: curriculum.description,
      prerequisites: curriculum.prerequisites,
      topics: curriculum.topics,
      practiceTasks: curriculum.practiceTasks,
      resources: curriculum.resources,
      estimatedHours: curriculum.estimatedHours,
      status: 'NOT_STARTED',
      progress: 0,
      // Backward compatibility fields
      resourceTitle: curriculum.resources[0]?.title || '',
      resourceType: curriculum.resources[0]?.type || 'documentation',
      resourcePlatform: curriculum.resources[0]?.platform || '',
      resourceUrl: curriculum.resources[0]?.url || '',
      isFree: curriculum.resources[0]?.isFree ?? true,
    };

    modules.push(learningModule);
    totalModuleHours += curriculum.estimatedHours;
  }

  // 4. Distribute modules across milestone stages
  const totalSkills = modules.length;
  let numMilestones = 1;
  if (totalSkills > 6) {
    numMilestones = 3;
  } else if (totalSkills > 2) {
    numMilestones = 2;
  }

  const modulesPerMilestone = Math.ceil(totalSkills / numMilestones);
  const milestones = [];
  const milestoneProjects = [];
  let currentModuleIdx = 0;
  let totalProjectHours = 0;

  for (let m = 0; m < numMilestones; m++) {
    const startIdx = currentModuleIdx;
    const endIdx = Math.min(totalSkills, startIdx + modulesPerMilestone);
    const milestoneModules = modules.slice(startIdx, endIdx);
    currentModuleIdx = endIdx;

    if (milestoneModules.length === 0) continue;

    const milestoneNumber = m + 1;
    const skillsCovered = milestoneModules.map((mod) => mod.skill);

    const weekStart = m * 3 + 1;
    const weekEnd = weekStart + 2;
    const targetWeeks = `Weeks ${weekStart}-${weekEnd}`;

    const project = buildMilestoneProject(milestoneNumber, skillsCovered, jobRole.title);
    milestoneProjects.push(project);
    totalProjectHours += project.estimatedHours;

    const milestoneObjective =
      milestoneNumber === 1
        ? `Establish core foundations and master primary prerequisites in ${skillsCovered.join(', ')}.`
        : milestoneNumber === 2
        ? `Develop intermediate systems and integrate full-stack workflows in ${skillsCovered.join(', ')}.`
        : `Achieve production-grade proficiency and deploy capstone systems utilizing ${skillsCovered.join(', ')}.`;

    milestones.push({
      milestoneNumber,
      title: `Milestone ${milestoneNumber}: ${milestoneNumber === 1 ? 'Foundations & Core Services' : milestoneNumber === 2 ? 'Advanced Integration' : 'Production Readiness'}`,
      targetWeeks,
      objective: milestoneObjective,
      skillsCovered,
      learningModules: milestoneModules,
      milestoneProject: project,
      practicalProject: project,
      status: 'NOT_STARTED',
      progress: 0,
      isCompleted: false,
      completedAt: null,
    });
  }

  // 5. Compute overall durations and totals
  const totalEstimatedHours = totalModuleHours + totalProjectHours;
  const estimatedDurationWeeks = Math.max(
    2,
    Math.ceil(totalEstimatedHours / weeklyHoursCommitment)
  );

  // 6. Build prerequisites summary list
  const prerequisitesSummary = [];
  if (externalPrerequisites.length > 0) {
    prerequisitesSummary.push(...externalPrerequisites);
  }

  // Add dependency flows observed
  for (let i = 0; i < orderedSkills.length - 1; i++) {
    const curr = orderedSkills[i].skill;
    const next = orderedSkills[i + 1].skill;
    prerequisitesSummary.push(`Recommended learning path: ${curr} → ${next}`);
  }

  if (prerequisitesSummary.length === 0) {
    prerequisitesSummary.push('All direct prerequisites mapped to milestone modules.');
  }

  return {
    userId: analysis.userId,
    targetRoleId: jobRole._id || jobRole.id,
    analysisId: analysis._id || analysis.id,
    skillGapAnalysisId: analysis._id || analysis.id,
    title: `Personalized Career Roadmap: ${jobRole.title}`,
    description: `Personalized learning roadmap generated from skill gap analysis for ${jobRole.title}. Targets ${prioritizedSkills.length} identified skill gaps ordered by importance and prerequisites.`,
    estimatedDurationWeeks,
    weeklyHoursCommitment,
    totalEstimatedHours,
    prerequisitesSummary: prerequisitesSummary.slice(0, 5), // Keep top concise entries
    prioritizedSkills,
    modules,
    milestones,
    milestoneProjects,
    status: 'NOT_STARTED',
    overallProgress: 0,
    progressPercentage: 0,
    completedMilestonesCount: 0,
  };
};

/**
 * Creates and persists a new Roadmap document to MongoDB.
 */
export const persistRoadmap = async (roadmapData) => {
  return await Roadmap.create(roadmapData);
};

export default {
  prioritizeSkills,
  orderSkillsWithPrerequisites,
  generateRoadmapFromAnalysis,
  persistRoadmap,
};
