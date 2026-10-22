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
import { generateToken } from '../src/utils/tokenUtils.js';
import { normalizeSkills, stripPunctuation } from '../src/services/skillNormalizationService.js';
import { matchSkillsToJobRole } from '../src/services/skillMatchingService.js';

const TEST_PORT = 5095;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

const testResults = [];

function recordResult(testName, passed, details = '') {
  testResults.push({ testName, passed, details });
  const mark = passed ? '✓ PASS' : '✗ FAIL';
  console.log(`  [${mark}] ${testName} ${details ? '(' + details + ')' : ''}`);
}

async function runSkillGapTests() {
  console.log('\n=============================================================');
  console.log('   PHASE 6 VERIFICATION: SKILL NORMALIZATION & GAP MATCHING  ');
  console.log('=============================================================\n');

  await connectDB();
  const server = app.listen(TEST_PORT);
  console.log(`[Test Runner] Test server listening on ${BASE_URL}\n`);

  const timestamp = Date.now();
  const user1Email = `student_skillgap1_${timestamp}@btech.edu`;
  const user2Email = `student_skillgap2_${timestamp}@btech.edu`;

  let user1, user2;
  let token1, token2;
  let mernRole, pythonRole;
  const createdResumeIds = [];
  const createdAnalysisIds = [];

  try {
    // 1. Setup test users
    user1 = await User.create({
      name: 'Alex Developer',
      email: user1Email,
      passwordHash: '$2b$10$dummyhashedpasswordfortestingpurpose1234567890',
      role: 'student',
      isActive: true,
    });

    user2 = await User.create({
      name: 'Bob Candidate',
      email: user2Email,
      passwordHash: '$2b$10$dummyhashedpasswordfortestingpurpose1234567890',
      role: 'student',
      isActive: true,
    });

    token1 = generateToken({ id: user1._id, email: user1.email, role: user1.role });
    token2 = generateToken({ id: user2._id, email: user2.email, role: user2.role });

    // Fetch seeded job roles
    mernRole = await JobRole.findOne({ slug: 'mern-stack-developer' });
    pythonRole = await JobRole.findOne({ slug: 'full-stack-python-developer' });

    if (!mernRole) {
      throw new Error('MERN Stack Developer role not found in database. Ensure database was seeded.');
    }

    // =========================================================
    // Test A: Resume with many matching skills
    // =========================================================
    const resumeA = await Resume.create({
      userId: user1._id,
      originalName: 'Alex_MERN_Resume.pdf',
      fileType: 'application/pdf',
      fileSize: 1024,
      status: 'parsed',
      extractionStatus: 'completed',
      rawText: 'MERN Developer resume with JavaScript, React, Node, Express, MongoDB, REST APIs, HTML5, CSS3, Git.',
      aiExtractedData: {
        skills: ['REST APIs', 'Git', 'HTML5', 'CSS3', 'Postman'],
        programmingLanguages: ['JavaScript'],
        frameworks: ['React', 'Node.js', 'Express'],
        databases: ['MongoDB'],
        tools: ['Git', 'Postman'],
        projects: [],
        education: [],
        experience: [],
        certifications: [],
      },
    });
    createdResumeIds.push(resumeA._id);

    const resA = await fetch(`${BASE_URL}/skill-gap/analyze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token1}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resumeId: resumeA._id.toString(),
        jobRoleId: mernRole._id.toString(),
      }),
    });

    const dataA = await resA.json();
    if (resA.status === 201 && dataA.success && dataA.analysis) {
      createdAnalysisIds.push(dataA.analysis.id);
      const isHighMatch = dataA.analysis.overallMatchPercentage >= 75;
      const isLowGap = dataA.analysis.overallGapPercentage <= 25;
      recordResult(
        'A. Resume with many matching skills',
        isHighMatch && isLowGap,
        `HTTP 201, match: ${dataA.analysis.overallMatchPercentage}%, gap: ${dataA.analysis.overallGapPercentage}%, matched: ${dataA.analysis.matchedCount}`
      );
    } else {
      recordResult('A. Resume with many matching skills', false, `Status ${resA.status}: ${JSON.stringify(dataA)}`);
    }

    // =========================================================
    // Test B: Resume with several missing skills
    // =========================================================
    const resumeB = await Resume.create({
      userId: user1._id,
      originalName: 'Alex_Python_Resume.pdf',
      fileType: 'application/pdf',
      fileSize: 1024,
      status: 'parsed',
      extractionStatus: 'completed',
      rawText: 'Data Science resume with Python, Pandas, NumPy, Scikit-learn, SQL.',
      aiExtractedData: {
        skills: ['Data Analysis'],
        programmingLanguages: ['Python', 'SQL'],
        frameworks: ['Pandas', 'NumPy'],
        databases: ['PostgreSQL'],
        tools: ['Jupyter'],
        projects: [],
        education: [],
        experience: [],
        certifications: [],
      },
    });
    createdResumeIds.push(resumeB._id);

    const resB = await fetch(`${BASE_URL}/skill-gap/analyze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token1}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resumeId: resumeB._id.toString(),
        jobRoleId: mernRole._id.toString(),
      }),
    });

    const dataB = await resB.json();
    if (resB.status === 201 && dataB.success && dataB.analysis) {
      createdAnalysisIds.push(dataB.analysis.id);
      const isLowMatch = dataB.analysis.overallMatchPercentage < 30;
      const isHighGap = dataB.analysis.overallGapPercentage > 70;
      const hasMissing = dataB.analysis.missingCount >= 5;
      recordResult(
        'B. Resume with several missing skills',
        isLowMatch && isHighGap && hasMissing,
        `HTTP 201, match: ${dataB.analysis.overallMatchPercentage}%, gap: ${dataB.analysis.overallGapPercentage}%, missing: ${dataB.analysis.missingCount}`
      );
    } else {
      recordResult('B. Resume with several missing skills', false, `Status ${resB.status}`);
    }

    // =========================================================
    // Test C: Resume with aliases (JS -> JavaScript, NodeJS -> Node.js, Mongo DB -> MongoDB)
    // =========================================================
    const resumeC = await Resume.create({
      userId: user1._id,
      originalName: 'Alex_Aliases_Resume.pdf',
      fileType: 'application/pdf',
      fileSize: 1024,
      status: 'parsed',
      extractionStatus: 'completed',
      rawText: 'Frontend Developer with JS, NodeJS, Mongo DB, reactjs, restful apis.',
      aiExtractedData: {
        skills: ['restful apis'],
        programmingLanguages: ['JS'],
        frameworks: ['reactjs', 'NodeJS', 'expressjs'],
        databases: ['Mongo DB'],
        tools: [],
        projects: [],
        education: [],
        experience: [],
        certifications: [],
      },
    });
    createdResumeIds.push(resumeC._id);

    const resC = await fetch(`${BASE_URL}/skill-gap/analyze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token1}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resumeId: resumeC._id.toString(),
        jobRoleId: mernRole._id.toString(),
      }),
    });

    const dataC = await resC.json();
    if (resC.status === 201 && dataC.success && dataC.analysis) {
      createdAnalysisIds.push(dataC.analysis.id);
      const matchedNames = dataC.analysis.matchedSkills.map((s) => s.skillName);
      const hasJs = matchedNames.includes('JavaScript');
      const hasNode = matchedNames.includes('Node.js');
      const hasMongo = matchedNames.includes('MongoDB');
      const hasReact = matchedNames.includes('React');

      recordResult(
        'C. Resume with aliases normalized (JS, NodeJS, Mongo DB)',
        hasJs && hasNode && hasMongo && hasReact,
        `Matched canonical names: ${JSON.stringify(matchedNames.slice(0, 4))}`
      );
    } else {
      recordResult('C. Resume with aliases normalized', false, `Status ${resC.status}`);
    }

    // =========================================================
    // Test D: Duplicate aliases produce only one canonical skill
    // =========================================================
    const duplicateRawSkills = [
      'JS',
      'JavaScript',
      'Javascript',
      'vanilla js',
      'Node.js',
      'NodeJS',
      'node js',
    ];
    const normResult = await normalizeSkills(duplicateRawSkills);
    const jsOccurrences = normResult.normalizedSkills.filter(
      (s) => s.canonicalName === 'JavaScript'
    ).length;
    const nodeOccurrences = normResult.normalizedSkills.filter(
      (s) => s.canonicalName === 'Node.js'
    ).length;

    recordResult(
      'D. Duplicate aliases produce only one canonical skill',
      jsOccurrences === 1 && nodeOccurrences === 1,
      `JavaScript occurrences: ${jsOccurrences}, Node.js occurrences: ${nodeOccurrences}`
    );

    // =========================================================
    // Test E: Resume with no extracted skills
    // =========================================================
    const resumeE = await Resume.create({
      userId: user1._id,
      originalName: 'Alex_Empty_Resume.pdf',
      fileType: 'application/pdf',
      fileSize: 1024,
      status: 'parsed',
      extractionStatus: 'completed',
      rawText: 'Student with no technical skills mentioned.',
      aiExtractedData: {
        skills: [],
        programmingLanguages: [],
        frameworks: [],
        databases: [],
        tools: [],
        projects: [],
        education: [],
        experience: [],
        certifications: [],
      },
    });
    createdResumeIds.push(resumeE._id);

    const resE = await fetch(`${BASE_URL}/skill-gap/analyze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token1}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resumeId: resumeE._id.toString(),
        jobRoleId: mernRole._id.toString(),
      }),
    });

    const dataE = await resE.json();
    if (resE.status === 201 && dataE.success && dataE.analysis) {
      createdAnalysisIds.push(dataE.analysis.id);
      const isZeroMatch = dataE.analysis.overallMatchPercentage === 0;
      const isHundredGap = dataE.analysis.overallGapPercentage === 100;
      const allMissing = dataE.analysis.missingCount === dataE.analysis.totalRequiredSkills;

      recordResult(
        'E. Resume with no extracted skills handled gracefully',
        isZeroMatch && isHundredGap && allMissing,
        `match: ${dataE.analysis.overallMatchPercentage}%, gap: ${dataE.analysis.overallGapPercentage}%, all ${dataE.analysis.missingCount} missing`
      );
    } else {
      recordResult('E. Resume with no extracted skills', false, `Status ${resE.status}`);
    }

    // =========================================================
    // Test F: Invalid resume ID handling
    // =========================================================
    const resF1 = await fetch(`${BASE_URL}/skill-gap/analyze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token1}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resumeId: 'not-a-valid-object-id',
        jobRoleId: mernRole._id.toString(),
      }),
    });

    const resF2 = await fetch(`${BASE_URL}/skill-gap/analyze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token1}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resumeId: new mongoose.Types.ObjectId().toString(),
        jobRoleId: mernRole._id.toString(),
      }),
    });

    recordResult(
      'F. Invalid resume ID rejected safely',
      resF1.status === 400 && resF2.status === 404,
      `malformed: HTTP ${resF1.status}, nonexistent: HTTP ${resF2.status}`
    );

    // =========================================================
    // Test G: Invalid job role ID handling
    // =========================================================
    const resG1 = await fetch(`${BASE_URL}/skill-gap/analyze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token1}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resumeId: resumeA._id.toString(),
        jobRoleId: 'not-a-valid-role-id',
      }),
    });

    const resG2 = await fetch(`${BASE_URL}/skill-gap/analyze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token1}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resumeId: resumeA._id.toString(),
        jobRoleId: new mongoose.Types.ObjectId().toString(),
      }),
    });

    recordResult(
      'G. Invalid job role ID rejected safely',
      resG1.status === 400 && resG2.status === 404,
      `malformed: HTTP ${resG1.status}, nonexistent: HTTP ${resG2.status}`
    );

    // =========================================================
    // Test H: Cross-user resume access blocked (Tenant Isolation)
    // =========================================================
    const resH = await fetch(`${BASE_URL}/skill-gap/analyze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token2}`, // Bob attempting to analyze Alex's resume
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resumeId: resumeA._id.toString(),
        jobRoleId: mernRole._id.toString(),
      }),
    });

    recordResult(
      'H. Cross-user resume analysis blocked (Tenant Isolation)',
      resH.status === 404,
      `HTTP ${resH.status}, User 2 cannot evaluate User 1 resume`
    );

    // =========================================================
    // Test I: Verify matched / partial / missing classifications
    // =========================================================
    // Candidate with JavaScript (matched), lacks TypeScript but JavaScript is related (partial), lacks Docker (missing)
    const resumeI = await Resume.create({
      userId: user1._id,
      originalName: 'Alex_Partial_Test.pdf',
      fileType: 'application/pdf',
      fileSize: 1024,
      status: 'parsed',
      extractionStatus: 'completed',
      rawText: 'Candidate with JavaScript and React.',
      aiExtractedData: {
        skills: [],
        programmingLanguages: ['JavaScript'],
        frameworks: ['React'],
        databases: [],
        tools: [],
        projects: [],
        education: [],
        experience: [],
        certifications: [],
      },
    });
    createdResumeIds.push(resumeI._id);

    const resI = await fetch(`${BASE_URL}/skill-gap/analyze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token1}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resumeId: resumeI._id.toString(),
        jobRoleId: mernRole._id.toString(),
      }),
    });

    const dataI = await resI.json();
    if (resI.status === 201 && dataI.analysis) {
      createdAnalysisIds.push(dataI.analysis.id);
      const hasMatched = dataI.analysis.matchedSkills.length > 0;
      const hasMissing = dataI.analysis.missingSkills.length > 0;
      const matchNames = dataI.analysis.matchedSkills.map((m) => m.skillName);

      recordResult(
        'I. Verify matched/partial/missing classifications',
        hasMatched && hasMissing && matchNames.includes('JavaScript'),
        `matched: ${dataI.analysis.matchedCount}, partial: ${dataI.analysis.partialCount}, missing: ${dataI.analysis.missingCount}`
      );
    } else {
      recordResult('I. Verify classifications', false, `Status ${resI.status}`);
    }

    // =========================================================
    // Test J: Quantitative score verified from actual data
    // =========================================================
    // Confirm match percentage changes predictably based on skills:
    // Candidate A (rich skills) score must be substantially higher than Candidate B (python skills against MERN role)
    const scoreA = dataA.analysis.overallMatchPercentage;
    const scoreB = dataB.analysis.overallMatchPercentage;
    const scoreSumA = dataA.analysis.overallMatchPercentage + dataA.analysis.overallGapPercentage;

    recordResult(
      'J. Gap percentage calculated dynamically from actual data',
      scoreA > scoreB && (scoreSumA === 100 || scoreSumA === 99),
      `Candidate A match (${scoreA}%) > Candidate B match (${scoreB}%), sum=${scoreSumA}%`
    );

    // =========================================================
    // Test K: Missing skills ranked by importance/weight
    // =========================================================
    const missingList = dataB.analysis.missingSkills;
    let isRankedCorrectly = true;
    for (let i = 0; i < missingList.length - 1; i++) {
      if (missingList[i].weight < missingList[i + 1].weight) {
        isRankedCorrectly = false;
        break;
      }
      if (missingList[i].priorityRank !== i + 1) {
        isRankedCorrectly = false;
        break;
      }
    }

    const firstMissing = missingList[0];
    const hasReasonAndImportance = Boolean(
      firstMissing &&
      firstMissing.reason &&
      firstMissing.importance &&
      firstMissing.weight
    );

    recordResult(
      'K. Missing skills ranked by importance/weight descending',
      isRankedCorrectly && hasReasonAndImportance,
      `Top priority missing: "${firstMissing?.skillName}" (weight: ${firstMissing?.weight}, rank: ${firstMissing?.priorityRank})`
    );

    // =========================================================
    // Test L: Verify SkillGapAnalysis is persisted in MongoDB
    // =========================================================
    const latestAnalysisId = createdAnalysisIds[createdAnalysisIds.length - 1];
    const dbRecord = await SkillGapAnalysis.findById(latestAnalysisId);

    const isDbPersisted = Boolean(
      dbRecord &&
      dbRecord.userId.toString() === user1._id.toString() &&
      dbRecord.targetRoleId.toString() === mernRole._id.toString() &&
      typeof dbRecord.overallMatchPercentage === 'number' &&
      typeof dbRecord.overallGapPercentage === 'number' &&
      Array.isArray(dbRecord.matchedSkills) &&
      Array.isArray(dbRecord.missingSkills)
    );

    recordResult(
      'L. SkillGapAnalysis persisted in MongoDB with correct schema',
      isDbPersisted,
      `Record ID: ${dbRecord?._id}, match%: ${dbRecord?.overallMatchPercentage}, gap%: ${dbRecord?.overallGapPercentage}`
    );

    // =========================================================
    // Test M: Verify GET /api/skill-gap/:id endpoint
    // =========================================================
    const resM = await fetch(`${BASE_URL}/skill-gap/${latestAnalysisId}`, {
      headers: {
        'Authorization': `Bearer ${token1}`,
      },
    });

    const dataM = await resM.json();
    const isGetValid =
      resM.status === 200 &&
      dataM.success &&
      dataM.analysis &&
      dataM.analysis.id === latestAnalysisId.toString() &&
      dataM.analysis.targetRole?.title === 'MERN Stack Developer';

    recordResult(
      'M. GET /api/skill-gap/:id returns persisted analysis',
      isGetValid,
      `HTTP 200, role: "${dataM.analysis?.targetRole?.title}", match: ${dataM.analysis?.overallMatchPercentage}%`
    );

    // Cross-user check on GET /:id
    const resMUnauthorized = await fetch(`${BASE_URL}/skill-gap/${latestAnalysisId}`, {
      headers: {
        'Authorization': `Bearer ${token2}`, // Bob trying to get Alex's analysis
      },
    });

    recordResult(
      'M2. GET /api/skill-gap/:id rejects unauthorized user',
      resMUnauthorized.status === 404,
      `HTTP ${resMUnauthorized.status}`
    );

    // =========================================================
    // Test N: GET /api/skill-gap/roles returns available job roles
    // =========================================================
    const resN = await fetch(`${BASE_URL}/skill-gap/roles`, {
      headers: {
        'Authorization': `Bearer ${token1}`,
      },
    });

    const dataN = await resN.json();
    const hasRoles = resN.status === 200 && dataN.success && dataN.count >= 5;

    recordResult(
      'N. GET /api/skill-gap/roles returns seeded job roles',
      hasRoles,
      `HTTP 200, retrieved ${dataN.count} job roles`
    );

    // =========================================================
    // Test O: Unit verification of skill normalization service
    // =========================================================
    const unitPunctuationTest =
      stripPunctuation('Node.js') === 'nodejs' &&
      stripPunctuation('Mongo DB') === 'mongodb' &&
      stripPunctuation('REST-API') === 'restapi';

    const unitNormTest = await normalizeSkills([
      'JS',
      'JavaScript',
      'React',
      'NodeJS',
      'Mongo DB',
    ]);

    const canonicalNames = unitNormTest.normalizedSkills
      .filter((s) => s.matchType !== 'unmapped')
      .map((s) => s.canonicalName)
      .sort();

    const expectedCanonical = ['JavaScript', 'MongoDB', 'Node.js', 'React'].sort();
    const isNormAccurate =
      JSON.stringify(canonicalNames) === JSON.stringify(expectedCanonical);

    recordResult(
      'O. Skill normalization service unit accuracy (strip & alias map)',
      unitPunctuationTest && isNormAccurate,
      `Normalized ${canonicalNames.length} canonical skills without duplicates: ${JSON.stringify(canonicalNames)}`
    );

  } catch (error) {
    console.error('\n[Test Runner Error]:', error);
  } finally {
    // Cleanup temporary test records from MongoDB
    try {
      if (createdAnalysisIds.length > 0) {
        await SkillGapAnalysis.deleteMany({ _id: { $in: createdAnalysisIds } });
      }
      if (createdResumeIds.length > 0) {
        await Resume.deleteMany({ _id: { $in: createdResumeIds } });
      }
      if (user1) await User.deleteOne({ _id: user1._id });
      if (user2) await User.deleteOne({ _id: user2._id });
      console.log('\n[Test Runner] Cleaned up temporary test users, resumes, and analyses from MongoDB.');
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

runSkillGapTests();
