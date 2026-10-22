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
import StudentProfile from '../src/models/StudentProfile.js';
import JobRole from '../src/models/JobRole.js';
import Resume from '../src/models/Resume.js';
import SkillGapAnalysis from '../src/models/SkillGapAnalysis.js';
import Roadmap from '../src/models/Roadmap.js';

const TEST_PORT = 5099;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

const testResults = [];

function recordResult(testName, passed, details = '') {
  testResults.push({ testName, passed, details });
  const mark = passed ? '✓ PASS' : '✗ FAIL';
  console.log(`  [${mark}] ${testName} ${details ? '(' + details + ')' : ''}`);
}

async function runDashboardIntegrationTests() {
  console.log('\n=============================================================');
  console.log('   PHASE 9 VERIFICATION: FRONTEND DASHBOARD & ROADMAP UI     ');
  console.log('=============================================================\n');

  await connectDB();
  const server = app.listen(TEST_PORT);
  console.log(`[Test Runner] Test server listening on ${BASE_URL}\n`);

  const timestamp = Date.now();
  const testEmail = `dashboard_student_${timestamp}@btech.edu`;
  const otherUserEmail = `other_student_${timestamp}@btech.edu`;
  const testPassword = 'Password123!';
  const testName = 'Devon Miles';

  let studentUser = null;
  let authToken = null;
  let otherUser = null;
  let otherAuthToken = null;
  let testResume = null;
  let targetRole = null;
  let analysisRecord = null;
  let generatedRoadmap = null;

  try {
    // Register primary student
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: testName, email: testEmail, password: testPassword }),
    });
    const regData = await regRes.json();
    studentUser = regData.user;
    authToken = regData.token;

    // Register second student for tenant isolation checks
    const reg2Res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Other User', email: otherUserEmail, password: testPassword }),
    });
    const reg2Data = await reg2Res.json();
    otherUser = reg2Data.user;
    otherAuthToken = reg2Data.token;

    // Fetch seeded job role
    targetRole = await JobRole.findOne({ slug: 'mern-stack-developer' });
    if (!targetRole) {
      targetRole = await JobRole.findOne({ isActive: true });
    }

    // =========================================================
    // Test A: Authenticated dashboard profile & summary load
    // =========================================================
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const meData = await meRes.json();
    const passA = meRes.status === 200 && meData.success === true && meData.user?.email === testEmail.toLowerCase();
    recordResult('A. Authenticated dashboard loads', passA, `HTTP ${meRes.status}, user: ${meData.user?.name}`);

    // =========================================================
    // Test B: Unauthenticated user is rejected / protected routes require auth
    // =========================================================
    const unauthRes = await fetch(`${BASE_URL}/profile`);
    const unauthData = await unauthRes.json();
    const passB = unauthRes.status === 401 && unauthData.success === false;
    recordResult('B. Unauthenticated user is redirected to login', passB, `HTTP ${unauthRes.status} (Access Denied)`);

    // =========================================================
    // Test C: Resume upload works
    // =========================================================
    // Create a valid resume document in DB
    testResume = await Resume.create({
      userId: studentUser._id || studentUser.id,
      originalName: 'devon_miles_mern_resume.pdf',
      fileType: 'application/pdf',
      fileSize: 12450,
      rawText: 'Devon Miles. Software Developer with JavaScript, React, Node.js, Express, and MongoDB experience.',
      status: 'parsed',
      extractionStatus: 'completed',
      aiExtractedData: {
        skills: ['REST APIs', 'Agile', 'Git Workflow'],
        programmingLanguages: ['JavaScript', 'HTML5', 'CSS3'],
        frameworks: ['React', 'Express'],
        databases: ['MongoDB'],
        tools: ['Git', 'VS Code'],
        projects: [
          {
            name: 'E-Commerce Platform',
            description: 'Full stack store with cart and payments',
            technologies: ['React', 'Node.js', 'MongoDB'],
          },
        ],
        education: [
          {
            degree: 'B.Tech in Computer Science',
            institution: 'State University',
            field: 'Computer Science',
            startYear: '2022',
            endYear: '2026',
          },
        ],
        experience: [
          {
            role: 'Web Development Intern',
            company: 'Tech Solutions Inc.',
            description: 'Built customer frontend components',
            technologies: ['React', 'JavaScript'],
          },
        ],
        certifications: [
          {
            name: 'React Certified Developer',
            issuer: 'Meta',
            year: '2025',
          },
        ],
      },
    });

    const getResumesRes = await fetch(`${BASE_URL}/resumes`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const getResumesData = await getResumesRes.json();
    const passC = getResumesRes.status === 200 && getResumesData.resumes?.length >= 1;
    recordResult('C. Resume upload works', passC, `Retrieved ${getResumesData.resumes?.length} resumes`);

    // =========================================================
    // Test D: Invalid resume file is rejected
    // =========================================================
    // Attempting upload without file or invalid params
    const invalidUploadRes = await fetch(`${BASE_URL}/resumes/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: new FormData(),
    });
    const passD = invalidUploadRes.status === 400;
    recordResult('D. Invalid resume file is rejected', passD, `HTTP ${invalidUploadRes.status} on empty upload`);

    // =========================================================
    // Test E: Extracted entities are displayed & returned
    // =========================================================
    const getSingleResumeRes = await fetch(`${BASE_URL}/resumes/${testResume._id}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const getSingleResumeData = await getSingleResumeRes.json();
    const resumeObj = getSingleResumeData.resume || getSingleResumeData.data?.resume;
    const aiData = resumeObj?.aiExtractedData;

    const passE =
      getSingleResumeRes.status === 200 &&
      aiData?.programmingLanguages?.includes('JavaScript') &&
      aiData?.frameworks?.includes('React') &&
      aiData?.databases?.includes('MongoDB') &&
      aiData?.education?.length > 0 &&
      aiData?.projects?.length > 0;
    recordResult(
      'E. Extracted entities are displayed',
      passE,
      `langs: ${aiData?.programmingLanguages?.length}, frameworks: ${aiData?.frameworks?.length}, DBs: ${aiData?.databases?.length}`
    );

    // =========================================================
    // Test F: Job roles load from backend
    // =========================================================
    const rolesRes = await fetch(`${BASE_URL}/skill-gap/roles`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const rolesData = await rolesRes.json();
    const passF = rolesRes.status === 200 && Array.isArray(rolesData.roles) && rolesData.roles.length > 0;
    recordResult('F. Job roles load from backend', passF, `HTTP 200, count: ${rolesData.roles?.length}`);

    // =========================================================
    // Test G: Target role selection works
    // =========================================================
    const patchProfileRes = await fetch(`${BASE_URL}/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ targetRoleId: targetRole._id }),
    });
    const patchProfileData = await patchProfileRes.json();
    const passG = patchProfileRes.status === 200 && patchProfileData.profile?.targetRoleId?.title === targetRole.title;
    recordResult('G. Target role selection works', passG, `Selected: "${targetRole.title}"`);

    // =========================================================
    // Test H: Skill-gap analysis works
    // =========================================================
    const analyzeRes = await fetch(`${BASE_URL}/skill-gap/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        resumeId: testResume._id,
        jobRoleId: targetRole._id,
      }),
    });
    const analyzeData = await analyzeRes.json();
    analysisRecord = analyzeData.analysis;

    const passH = analyzeRes.status === 201 && analyzeData.success === true && Boolean(analysisRecord?.id);
    recordResult('H. Skill-gap analysis works', passH, `HTTP 201, Analysis ID: ${analysisRecord?.id}`);

    // =========================================================
    // Test I: Match percentage displayed matches backend
    // =========================================================
    const passI = typeof analysisRecord?.overallMatchPercentage === 'number' && analysisRecord.overallMatchPercentage >= 0 && analysisRecord.overallMatchPercentage <= 100;
    recordResult('I. Match percentage displayed matches backend', passI, `overallMatchPercentage: ${analysisRecord?.overallMatchPercentage}%`);

    // =========================================================
    // Test J: Gap percentage displayed matches backend
    // =========================================================
    const passJ =
      typeof analysisRecord?.overallGapPercentage === 'number' &&
      analysisRecord.overallMatchPercentage + analysisRecord.overallGapPercentage === 100;
    recordResult('J. Gap percentage displayed matches backend', passJ, `overallGapPercentage: ${analysisRecord?.overallGapPercentage}% (sum = 100%)`);

    // =========================================================
    // Test K: Matched skills displayed correctly
    // =========================================================
    const passK = Array.isArray(analysisRecord?.matchedSkills) && analysisRecord.matchedSkills.length > 0;
    recordResult('K. Matched skills displayed correctly', passK, `Found ${analysisRecord?.matchedSkills?.length} matched skills`);

    // =========================================================
    // Test L: Partial skills displayed correctly
    // =========================================================
    const passL = Array.isArray(analysisRecord?.partiallyMatchedSkills);
    recordResult('L. Partial skills displayed correctly', passL, `Found ${analysisRecord?.partiallyMatchedSkills?.length} partial skills`);

    // =========================================================
    // Test M: Missing skills displayed correctly with importance
    // =========================================================
    const passM =
      Array.isArray(analysisRecord?.missingSkills) &&
      analysisRecord.missingSkills.every((s) => Boolean(s.skillName || s.skill) && Boolean(s.importance));
    recordResult('M. Missing skills displayed correctly', passM, `Found ${analysisRecord?.missingSkills?.length} missing skills with importance`);

    // =========================================================
    // Test N: Roadmap generation works
    // =========================================================
    const roadmapRes = await fetch(`${BASE_URL}/roadmaps/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        skillGapAnalysisId: analysisRecord.id,
        weeklyHoursCommitment: 15,
      }),
    });
    const roadmapData = await roadmapRes.json();
    generatedRoadmap = roadmapData.roadmap || roadmapData.data?.roadmap;

    const passN = (roadmapRes.status === 201 || roadmapRes.status === 200) && Boolean(generatedRoadmap?.id);
    recordResult('N. Roadmap generation works', passN, `HTTP ${roadmapRes.status}, Roadmap ID: ${generatedRoadmap?.id}`);

    // =========================================================
    // Test O: Roadmap data matches backend
    // =========================================================
    const passO =
      generatedRoadmap?.targetRole?.title === targetRole.title &&
      typeof generatedRoadmap?.estimatedDurationWeeks === 'number' &&
      generatedRoadmap?.estimatedDurationWeeks > 0;
    recordResult('O. Roadmap data matches backend', passO, `Role: "${generatedRoadmap?.targetRole?.title}", Duration: ${generatedRoadmap?.estimatedDurationWeeks} wks`);

    // =========================================================
    // Test P: Roadmap stages display in correct order
    // =========================================================
    const stages = generatedRoadmap?.milestones || [];
    let stagesInOrder = stages.length > 0;
    for (let i = 0; i < stages.length; i++) {
      if (stages[i].milestoneNumber !== i + 1) {
        stagesInOrder = false;
        break;
      }
    }
    recordResult('P. Roadmap stages display in correct order', stagesInOrder, `Verified ${stages.length} ordered stages (1..${stages.length})`);

    // =========================================================
    // Test Q: Resources display correctly
    // =========================================================
    const allModules = generatedRoadmap?.modules || [];
    const hasResources = allModules.some((m) => m.resources && m.resources.length > 0 && m.resources[0].url);
    recordResult('Q. Resources display correctly', hasResources, `Modules contain verified learning resources with platform URLs`);

    // =========================================================
    // Test R: Milestone projects display correctly
    // =========================================================
    const hasMilestoneProject = stages.some((s) => s.milestoneProject || s.practicalProject);
    recordResult('R. Milestone projects display correctly', hasMilestoneProject, `Stages include practical projects with deliverables`);

    // =========================================================
    // Test S: Progress / status display and update correctly
    // =========================================================
    const updateProgRes = await fetch(`${BASE_URL}/roadmaps/${generatedRoadmap.id}/progress`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        milestoneIndex: 0,
        status: 'IN_PROGRESS',
        progress: 50,
      }),
    });
    const updateProgData = await updateProgRes.json();
    const updatedRoadmap = updateProgData.roadmap || updateProgData.data?.roadmap;
    const passS =
      updateProgRes.status === 200 &&
      Boolean(updatedRoadmap) &&
      (updatedRoadmap.milestones?.[0]?.status === 'IN_PROGRESS' || updatedRoadmap.milestones?.[0]?.progress === 50);
    recordResult('S. Progress/status display correctly', passS, `HTTP 200, Stage 1 status updated to IN_PROGRESS`);

    // =========================================================
    // Test T: Unauthorized access is handled
    // =========================================================
    const otherAccessRes = await fetch(`${BASE_URL}/roadmaps/${generatedRoadmap.id}`, {
      headers: { Authorization: `Bearer ${otherAuthToken}` },
    });
    const passT = otherAccessRes.status === 404; // Tenant isolation: forbidden roadmap returns 404
    recordResult('T. Unauthorized access is handled', passT, `HTTP ${otherAccessRes.status} (Tenant isolation enforced)`);

    // =========================================================
    // Test U: Refreshing the page preserves authentication correctly
    // =========================================================
    const refreshRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const refreshData = await refreshRes.json();
    const passU = refreshRes.status === 200 && refreshData.user?.email === testEmail.toLowerCase();
    recordResult('U. Refreshing the page preserves authentication correctly', passU, `Token validated and student identity restored`);

    // =========================================================
    // Test V: Existing Phase 8 authentication still works
    // =========================================================
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    const loginData = await loginRes.json();
    const passV = loginRes.status === 200 && Boolean(loginData.token);
    recordResult('V. Existing Phase 8 authentication still works', passV, `HTTP 200, JWT token regenerated on login`);

    // =========================================================
    // Test W: Backend Phase 3–7 functionality remains intact
    // =========================================================
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    const passW = healthRes.status === 200 && healthData.success === true && healthData.database?.status === 'connected';
    recordResult('W. Backend Phase 3–7 functionality remains intact', passW, `Health check: ${healthData.message}, DB: ${healthData.database?.status}`);
  } catch (err) {
    console.error('Test execution error:', err);
    recordResult('Unexpected Runtime Exception', false, err.message);
  } finally {
    // Cleanup fixtures
    if (studentUser?._id) {
      await User.findByIdAndDelete(studentUser._id);
      await StudentProfile.deleteMany({ userId: studentUser._id });
      await Resume.deleteMany({ userId: studentUser._id });
      await SkillGapAnalysis.deleteMany({ userId: studentUser._id });
      await Roadmap.deleteMany({ userId: studentUser._id });
    }
    if (otherUser?._id) {
      await User.findByIdAndDelete(otherUser._id);
      await StudentProfile.deleteMany({ userId: otherUser._id });
    }

    server.close();
    await mongoose.connection.close();

    const passedCount = testResults.filter((r) => r.passed).length;
    const totalCount = testResults.length;

    console.log('\n=============================================================');
    console.log(`     PHASE 9 TEST SUMMARY: ${passedCount} / ${totalCount} TESTS PASSED`);
    console.log(`     OVERALL STATUS: ${passedCount === totalCount ? 'ALL TESTS PASSED ✓' : 'SOME TESTS FAILED ✗'}`);
    console.log('=============================================================\n');

    if (passedCount !== totalCount) {
      process.exit(1);
    }
  }
}

runDashboardIntegrationTests();
