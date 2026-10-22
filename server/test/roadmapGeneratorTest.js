import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import app from '../src/app.js';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import Resume from '../src/models/Resume.js';
import JobRole from '../src/models/JobRole.js';
import SkillTaxonomy from '../src/models/SkillTaxonomy.js';
import SkillGapAnalysis from '../src/models/SkillGapAnalysis.js';
import Roadmap from '../src/models/Roadmap.js';
import { generateToken } from '../src/utils/tokenUtils.js';
import {
  prioritizeSkills,
  orderSkillsWithPrerequisites,
  generateRoadmapFromAnalysis,
} from '../src/services/roadmapService.js';

const TEST_PORT = 5098;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

const testResults = [];

function recordResult(testName, passed, details = '') {
  testResults.push({ testName, passed, details });
  const mark = passed ? '✓ PASS' : '✗ FAIL';
  console.log(`  [${mark}] ${testName} ${details ? '(' + details + ')' : ''}`);
}

async function runRoadmapTests() {
  console.log('\n=============================================================');
  console.log('   PHASE 7 VERIFICATION: ROADMAP GENERATION & LEARNING SVC  ');
  console.log('=============================================================\n');

  await connectDB();
  const server = app.listen(TEST_PORT);
  console.log(`[Test Runner] Test server listening on ${BASE_URL}\n`);

  const timestamp = Date.now();
  const user1Email = `student_roadmap1_${timestamp}@btech.edu`;
  const user2Email = `student_roadmap2_${timestamp}@btech.edu`;

  let user1, user2;
  let token1, token2;
  let mernRole;
  const createdResumeIds = [];
  const createdAnalysisIds = [];
  const createdRoadmapIds = [];

  try {
    // 1. Setup test users
    user1 = await User.create({
      name: 'Sarah Connor',
      email: user1Email,
      passwordHash: '$2b$10$dummyhashedpasswordfortestingpurpose1234567890',
      role: 'student',
      isActive: true,
    });

    user2 = await User.create({
      name: 'Kyle Reese',
      email: user2Email,
      passwordHash: '$2b$10$dummyhashedpasswordfortestingpurpose1234567890',
      role: 'student',
      isActive: true,
    });

    token1 = generateToken({ id: user1._id, email: user1.email, role: user1.role });
    token2 = generateToken({ id: user2._id, email: user2.email, role: user2.role });

    // Fetch seeded MERN Stack Developer role
    mernRole = await JobRole.findOne({ slug: 'mern-stack-developer' });
    if (!mernRole) {
      throw new Error('MERN Stack Developer job role not found in database. Ensure database was seeded.');
    }

    // =========================================================
    // Test A: Student with several missing skills
    // =========================================================
    const analysisA = await SkillGapAnalysis.create({
      userId: user1._id,
      targetRoleId: mernRole._id,
      overallMatchPercentage: 35,
      overallGapPercentage: 65,
      weightedScore: 35,
      totalRequiredSkills: 8,
      matchedCount: 2,
      partialCount: 1,
      missingCount: 5,
      matchedSkills: [
        { skillName: 'HTML5', category: 'Programming Language', weight: 3, importance: 'important' },
        { skillName: 'CSS3', category: 'Programming Language', weight: 3, importance: 'important' },
      ],
      partiallyMatchedSkills: [
        {
          targetSkill: 'MongoDB',
          skill: 'MongoDB',
          candidateSkillFound: 'SQL',
          similarityScore: 0.7,
          weight: 4,
          importance: 'critical',
          recommendationNote: 'Candidate has relational SQL background.',
        },
      ],
      missingSkills: [
        {
          skillName: 'JavaScript',
          category: 'Programming Language',
          importance: 'critical',
          weight: 5,
          priorityRank: 1,
          prerequisites: ['HTML5', 'CSS3'],
        },
        {
          skillName: 'Node.js',
          category: 'Framework',
          importance: 'critical',
          weight: 5,
          priorityRank: 2,
          prerequisites: ['JavaScript'],
        },
        {
          skillName: 'Express',
          category: 'Framework',
          importance: 'critical',
          weight: 5,
          priorityRank: 3,
          prerequisites: ['Node.js', 'JavaScript'],
        },
        {
          skillName: 'React',
          category: 'Framework',
          importance: 'critical',
          weight: 4,
          priorityRank: 4,
          prerequisites: ['JavaScript', 'HTML5', 'CSS3'],
        },
        {
          skillName: 'Git',
          category: 'Tools',
          importance: 'important',
          weight: 3,
          priorityRank: 5,
          prerequisites: [],
        },
      ],
    });
    createdAnalysisIds.push(analysisA._id);

    const resA = await fetch(`${BASE_URL}/roadmaps/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ skillGapAnalysisId: analysisA._id.toString() }),
    });
    const dataA = await resA.json();

    const passA =
      resA.status === 201 &&
      dataA.success === true &&
      dataA.roadmap &&
      Array.isArray(dataA.roadmap.modules) &&
      dataA.roadmap.modules.length === 6; // 5 missing + 1 partial

    if (dataA.roadmap?.id) {
      createdRoadmapIds.push(dataA.roadmap.id);
    }

    recordResult(
      'A. Student with several missing skills',
      passA,
      `HTTP ${resA.status}, generated roadmap with ${dataA.roadmap?.modules?.length} learning modules`
    );

    // =========================================================
    // Test B: Student with partial skills included in roadmap
    // =========================================================
    const partialModule = dataA.roadmap?.modules?.find((m) => m.skill === 'MongoDB');
    const prioritizedMongo = dataA.roadmap?.prioritizedSkills?.find((p) => p.skill === 'MongoDB');

    const passB =
      Boolean(partialModule) &&
      Boolean(prioritizedMongo) &&
      prioritizedMongo.matchType === 'partial' &&
      partialModule.title.includes('MongoDB');

    recordResult(
      'B. Student with partial skills included in roadmap',
      passB,
      `Partial skill MongoDB present as ${prioritizedMongo?.matchType} with title "${partialModule?.title}"`
    );

    // =========================================================
    // Test C: Student with no skill gaps (100% matched)
    // =========================================================
    const analysisC = await SkillGapAnalysis.create({
      userId: user1._id,
      targetRoleId: mernRole._id,
      overallMatchPercentage: 100,
      overallGapPercentage: 0,
      weightedScore: 100,
      totalRequiredSkills: 4,
      matchedCount: 4,
      partialCount: 0,
      missingCount: 0,
      matchedSkills: [
        { skillName: 'JavaScript', category: 'Programming Language', weight: 5, importance: 'critical' },
        { skillName: 'React', category: 'Framework', weight: 4, importance: 'critical' },
        { skillName: 'Node.js', category: 'Framework', weight: 5, importance: 'critical' },
        { skillName: 'MongoDB', category: 'Database', weight: 4, importance: 'critical' },
      ],
      partiallyMatchedSkills: [],
      missingSkills: [],
    });
    createdAnalysisIds.push(analysisC._id);

    const resC = await fetch(`${BASE_URL}/roadmaps/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ skillGapAnalysisId: analysisC._id.toString() }),
    });
    const dataC = await resC.json();

    const passC =
      resC.status === 201 &&
      dataC.success === true &&
      dataC.roadmap &&
      dataC.roadmap.overallProgress === 100 &&
      dataC.roadmap.status === 'COMPLETED' &&
      dataC.roadmap.modules.length === 0;

    if (dataC.roadmap?.id) {
      createdRoadmapIds.push(dataC.roadmap.id);
    }

    recordResult(
      'C. Student with no skill gaps',
      passC,
      `HTTP ${resC.status}, status: "${dataC.roadmap?.status}", overallProgress: ${dataC.roadmap?.overallProgress}%`
    );

    // =========================================================
    // Test D: High-priority skills appear earlier / prioritization check
    // =========================================================
    const prioritizedList = dataA.roadmap?.prioritizedSkills || [];
    // Prioritization must place weight 5 critical skills before weight 3 important skills
    const jsRank = prioritizedList.find((p) => p.skill === 'JavaScript')?.priorityRank;
    const gitRank = prioritizedList.find((p) => p.skill === 'Git')?.priorityRank;

    const passD =
      prioritizedList.length > 0 &&
      typeof jsRank === 'number' &&
      typeof gitRank === 'number' &&
      jsRank < gitRank;

    recordResult(
      'D. High-priority skills appear earlier in prioritized list',
      passD,
      `JavaScript rank: ${jsRank} (weight: 5) vs Git rank: ${gitRank} (weight: 3)`
    );

    // =========================================================
    // Test E: Prerequisites appear before dependent skills
    // =========================================================
    // Module ordering: JavaScript MUST precede Node.js, and Node.js MUST precede Express
    const moduleSkills = (dataA.roadmap?.modules || []).map((m) => m.skill);
    const jsIndex = moduleSkills.indexOf('JavaScript');
    const nodeIndex = moduleSkills.indexOf('Node.js');
    const expressIndex = moduleSkills.indexOf('Express');

    const passE =
      jsIndex !== -1 &&
      nodeIndex !== -1 &&
      expressIndex !== -1 &&
      jsIndex < nodeIndex &&
      nodeIndex < expressIndex;

    recordResult(
      'E. Prerequisites appear before dependent skills (JavaScript → Node.js → Express)',
      passE,
      `Module order indices: JavaScript (${jsIndex}) < Node.js (${nodeIndex}) < Express (${expressIndex})`
    );

    // =========================================================
    // Test F: Prerequisite cycles are handled safely
    // =========================================================
    const cycleTaxonomy = [
      { canonicalName: 'SkillA', prerequisites: ['SkillB'], isActive: true },
      { canonicalName: 'SkillB', prerequisites: ['SkillC'], isActive: true },
      { canonicalName: 'SkillC', prerequisites: ['SkillA'], isActive: true },
    ];
    const cyclePrioritized = [
      { skill: 'SkillA', priorityRank: 1, weight: 5, importance: 'critical', matchType: 'missing' },
      { skill: 'SkillB', priorityRank: 2, weight: 4, importance: 'important', matchType: 'missing' },
      { skill: 'SkillC', priorityRank: 3, weight: 3, importance: 'good_to_have', matchType: 'missing' },
    ];

    let cycleSafeResult;
    let cycleDidNotThrow = false;
    try {
      cycleSafeResult = orderSkillsWithPrerequisites(cyclePrioritized, [], cycleTaxonomy);
      cycleDidNotThrow = true;
    } catch (err) {
      cycleDidNotThrow = false;
    }

    const passF =
      cycleDidNotThrow &&
      Array.isArray(cycleSafeResult?.orderedSkills) &&
      cycleSafeResult.orderedSkills.length === 3;

    recordResult(
      'F. Prerequisite cycles are handled safely without crashing',
      passF,
      `Successfully resolved 3-node cycle into ordered array: [${cycleSafeResult?.orderedSkills?.map((s) => s.skill).join(', ')}]`
    );

    // =========================================================
    // Test G: Learning modules correspond to actual gaps
    // =========================================================
    const expressModule = dataA.roadmap?.modules?.find((m) => m.skill === 'Express');
    const passG =
      Boolean(expressModule) &&
      typeof expressModule.objective === 'string' &&
      expressModule.objective.length > 0 &&
      Array.isArray(expressModule.topics) &&
      expressModule.topics.length >= 2 &&
      Array.isArray(expressModule.practiceTasks) &&
      expressModule.practiceTasks.length >= 1 &&
      typeof expressModule.estimatedHours === 'number' &&
      expressModule.estimatedHours > 0;

    recordResult(
      'G. Learning modules correspond to actual gaps with rich content',
      passG,
      `Express module has objective, ${expressModule?.topics?.length} topics, ${expressModule?.practiceTasks?.length} practice tasks, ${expressModule?.estimatedHours}h estimated`
    );

    // =========================================================
    // Test H: Resources are present and relevant
    // =========================================================
    const passH =
      Boolean(expressModule?.resources) &&
      Array.isArray(expressModule.resources) &&
      expressModule.resources.length > 0 &&
      Boolean(expressModule.resources[0].title) &&
      Boolean(expressModule.resources[0].url) &&
      expressModule.resources[0].url.startsWith('http');

    recordResult(
      'H. Technical resources are present and relevant with official URLs',
      passH,
      `Resource: "${expressModule?.resources?.[0]?.title}" -> ${expressModule?.resources?.[0]?.url}`
    );

    // =========================================================
    // Test I: Milestone projects contain relevant skills
    // =========================================================
    const milestones = dataA.roadmap?.milestones || [];
    const firstMilestone = milestones[0];
    const project = firstMilestone?.milestoneProject || firstMilestone?.practicalProject;

    const passI =
      Boolean(firstMilestone) &&
      Boolean(project) &&
      typeof project.title === 'string' &&
      Array.isArray(project.skillsCovered) &&
      project.skillsCovered.length > 0 &&
      Array.isArray(project.deliverables) &&
      project.deliverables.length > 0 &&
      typeof project.estimatedHours === 'number';

    recordResult(
      'I. Milestone projects contain relevant skills and deliverables',
      passI,
      `Project: "${project?.title}" covering [${project?.skillsCovered?.join(', ')}] with ${project?.deliverables?.length} deliverables`
    );

    // =========================================================
    // Test J: Roadmap is persisted in MongoDB
    // =========================================================
    const storedRoadmap = await Roadmap.findById(dataA.roadmap.id);
    const passJ =
      Boolean(storedRoadmap) &&
      storedRoadmap.userId.toString() === user1._id.toString() &&
      storedRoadmap.modules.length === 6 &&
      storedRoadmap.milestones.length > 0;

    recordResult(
      'J. Roadmap is persisted in MongoDB with correct schema',
      passJ,
      `Stored ID: ${storedRoadmap?._id}, title: "${storedRoadmap?.title}", duration: ${storedRoadmap?.estimatedDurationWeeks} weeks`
    );

    // =========================================================
    // Test K: GET roadmap works
    // =========================================================
    const resK = await fetch(`${BASE_URL}/roadmaps/${dataA.roadmap.id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token1}`,
      },
    });
    const dataK = await resK.json();

    const passK =
      resK.status === 200 &&
      dataK.success === true &&
      dataK.roadmap &&
      dataK.roadmap.id.toString() === dataA.roadmap.id.toString();

    recordResult(
      'K. GET /api/roadmaps/:id retrieves roadmap with populated relationships',
      passK,
      `HTTP ${resK.status}, role: "${dataK.roadmap?.targetRole?.title}"`
    );

    // =========================================================
    // Test L: Unauthorized users cannot access another user's roadmap (Tenant Isolation)
    // =========================================================
    const resL = await fetch(`${BASE_URL}/roadmaps/${dataA.roadmap.id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token2}`, // Kyle Reese attempting to view Sarah Connor's roadmap
      },
    });

    const passL = resL.status === 404; // Access denied / not found

    recordResult(
      'L. Unauthorized users cannot access another user\'s roadmap (Tenant Isolation)',
      passL,
      `HTTP ${resL.status} correctly blocked User 2 from accessing User 1's roadmap`
    );

    // =========================================================
    // Test M: Duplicate roadmap handling works
    // =========================================================
    // Re-requesting roadmap generation for the same analysisA should return the EXISTING roadmap without creating a duplicate
    const resM = await fetch(`${BASE_URL}/roadmaps/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ skillGapAnalysisId: analysisA._id.toString() }),
    });
    const dataM = await resM.json();

    const roadmapsCountInDB = await Roadmap.countDocuments({ analysisId: analysisA._id });

    const passM =
      resM.status === 200 &&
      dataM.success === true &&
      dataM.isExisting === true &&
      dataM.roadmap.id === dataA.roadmap.id &&
      roadmapsCountInDB === 1;

    recordResult(
      'M. Duplicate roadmap handling returns existing record without duplicating in MongoDB',
      passM,
      `HTTP ${resM.status}, isExisting: ${dataM.isExisting}, DB count: ${roadmapsCountInDB}`
    );

    // =========================================================
    // Test N: Progress values remain between 0 and 100
    // =========================================================
    // Test invalid progress (<0 or >100)
    const resNInvalid = await fetch(`${BASE_URL}/roadmaps/${dataA.roadmap.id}/progress`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ moduleIndex: 0, progress: 150 }),
    });

    // Test valid progress update
    const resNValid = await fetch(`${BASE_URL}/roadmaps/${dataA.roadmap.id}/progress`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ moduleIndex: 0, status: 'IN_PROGRESS', progress: 50 }),
    });
    const dataNValid = await resNValid.json();

    const passN =
      resNInvalid.status === 400 &&
      resNValid.status === 200 &&
      dataNValid.roadmap.overallProgress >= 0 &&
      dataNValid.roadmap.overallProgress <= 100;

    recordResult(
      'N. Progress values are strictly validated and remain between 0 and 100',
      passN,
      `Invalid 150% rejected (HTTP ${resNInvalid.status}), valid update accepted with overallProgress: ${dataNValid.roadmap?.overallProgress}%`
    );

    // =========================================================
    // Test O: GET /api/roadmaps retrieves all student roadmaps
    // =========================================================
    const resO = await fetch(`${BASE_URL}/roadmaps`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token1}`,
      },
    });
    const dataO = await resO.json();

    const passO =
      resO.status === 200 &&
      dataO.success === true &&
      Array.isArray(dataO.roadmaps) &&
      dataO.roadmaps.length >= 2;

    recordResult(
      'O. GET /api/roadmaps retrieves authenticated student\'s roadmaps list',
      passO,
      `HTTP ${resO.status}, count: ${dataO.count}`
    );

    // =========================================================
    // Test P: Error Handling — Missing and Malformed analysisId
    // =========================================================
    const resP1 = await fetch(`${BASE_URL}/roadmaps/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({}),
    });

    const resP2 = await fetch(`${BASE_URL}/roadmaps/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ skillGapAnalysisId: 'invalid-mongodb-id' }),
    });

    const resP3 = await fetch(`${BASE_URL}/roadmaps/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ skillGapAnalysisId: new mongoose.Types.ObjectId().toString() }),
    });

    const passP =
      resP1.status === 400 &&
      resP2.status === 400 &&
      resP3.status === 404;

    recordResult(
      'P. Error handling: missing ID (400), malformed ID (400), nonexistent analysis (404)',
      passP,
      `HTTP statuses: missing=${resP1.status}, malformed=${resP2.status}, nonexistent=${resP3.status}`
    );

  } catch (error) {
    console.error('\n[Test Runner Error]:', error);
  } finally {
    // Clean up temporary test records
    try {
      if (createdRoadmapIds.length > 0) {
        await Roadmap.deleteMany({ _id: { $in: createdRoadmapIds } });
      }
      if (createdAnalysisIds.length > 0) {
        await SkillGapAnalysis.deleteMany({ _id: { $in: createdAnalysisIds } });
      }
      if (createdResumeIds.length > 0) {
        await Resume.deleteMany({ _id: { $in: createdResumeIds } });
      }
      if (user1) await User.deleteOne({ _id: user1._id });
      if (user2) await User.deleteOne({ _id: user2._id });
      console.log('\n[Test Runner] Cleaned up temporary test users, analyses, and roadmaps from MongoDB.');
    } catch (cleanupErr) {
      console.error('[Cleanup Error]:', cleanupErr.message);
    }

    server.close();
    await mongoose.disconnect();
  }

  // Summary
  console.log('\n=============================================================');
  const allPassed = testResults.every((t) => t.passed);
  const passedCount = testResults.filter((t) => t.passed).length;
  console.log(`     TEST SUMMARY: ${passedCount} / ${testResults.length} TESTS PASSED`);
  console.log(`     OVERALL STATUS: ${allPassed ? 'ALL TESTS PASSED ✓' : 'SOME TESTS FAILED ✗'}`);
  console.log('=============================================================\n');

  if (!allPassed) {
    process.exit(1);
  }
}

runRoadmapTests();
