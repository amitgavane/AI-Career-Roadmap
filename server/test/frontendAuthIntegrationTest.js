import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
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

const TEST_PORT = 5092;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

const testResults = [];

function recordResult(testName, passed, details = '') {
  testResults.push({ testName, passed, details });
  const mark = passed ? '✓ PASS' : '✗ FAIL';
  console.log(`  [${mark}] ${testName} ${details ? '(' + details + ')' : ''}`);
}

async function runFrontendAuthTests() {
  console.log('\n=============================================================');
  console.log('   PHASE 8 VERIFICATION: FRONTEND CORE & AUTHENTICATION     ');
  console.log('=============================================================\n');

  await connectDB();
  const server = app.listen(TEST_PORT);
  console.log(`[Test Runner] Test server listening on ${BASE_URL}\n`);

  const timestamp = Date.now();
  const testEmail = `frontend_student_${timestamp}@btech.edu`;
  const testPassword = 'Password123!';
  const testName = 'Ada Lovelace';

  let registeredUser = null;
  let authToken = null;
  let mernRole = null;

  try {
    mernRole = await JobRole.findOne({ slug: 'mern-stack-developer' });

    // =========================================================
    // Test A: Registration with valid data
    // =========================================================
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: testName,
        email: testEmail,
        password: testPassword,
      }),
    });
    const regData = await regRes.json();

    const passA =
      regRes.status === 201 &&
      regData.success === true &&
      Boolean(regData.token) &&
      regData.user?.email === testEmail.toLowerCase();

    if (regData.user) {
      registeredUser = regData.user;
      authToken = regData.token;
    }

    recordResult(
      'A. Registration with valid data',
      passA,
      `HTTP ${regRes.status}, user: "${regData.user?.name}", token received`
    );

    // =========================================================
    // Test B: Registration validation errors (short name, invalid email, short password)
    // =========================================================
    const invalidRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'A', // too short (< 2)
        email: 'invalid-email',
        password: '123', // too short (< 6)
      }),
    });
    const invalidRegData = await invalidRegRes.json();

    const passB =
      invalidRegRes.status === 400 &&
      invalidRegData.success === false &&
      Boolean(invalidRegData.errors?.name) &&
      Boolean(invalidRegData.errors?.email) &&
      Boolean(invalidRegData.errors?.password);

    recordResult(
      'B. Registration validation errors correctly rejected',
      passB,
      `HTTP ${invalidRegRes.status}, errors: [${Object.keys(invalidRegData.errors || {}).join(', ')}]`
    );

    // =========================================================
    // Test C: Login with valid credentials
    // =========================================================
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    const loginData = await loginRes.json();

    const passC =
      loginRes.status === 200 &&
      loginData.success === true &&
      Boolean(loginData.token) &&
      loginData.user?.email === testEmail.toLowerCase();

    // Use refreshed login token
    if (loginData.token) {
      authToken = loginData.token;
    }

    recordResult(
      'C. Login with valid credentials',
      passC,
      `HTTP ${loginRes.status}, token successfully refreshed`
    );

    // =========================================================
    // Test D: Login with incorrect credentials
    // =========================================================
    const wrongLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword999!',
      }),
    });
    const wrongLoginData = await wrongLoginRes.json();

    const passD =
      wrongLoginRes.status === 401 &&
      wrongLoginData.success === false &&
      wrongLoginData.message.includes('Invalid');

    recordResult(
      'D. Login with incorrect credentials rejected securely',
      passD,
      `HTTP ${wrongLoginRes.status}, message: "${wrongLoginData.message}"`
    );

    // =========================================================
    // Test E: Authentication persistence / reload via /api/auth/me
    // =========================================================
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const meData = await meRes.json();

    const passE =
      meRes.status === 200 &&
      meData.success === true &&
      meData.user?.email === testEmail.toLowerCase() &&
      meData.user?.role === 'student';

    recordResult(
      'E. Authentication persistence/reload via /api/auth/me',
      passE,
      `HTTP ${meRes.status}, user: "${meData.user?.name}", role: "${meData.user?.role}"`
    );

    // =========================================================
    // Test F: GET /me integration returns profile summary
    // =========================================================
    const passF =
      passE &&
      meData.profile !== undefined &&
      typeof meData.profile?.headline === 'string';

    recordResult(
      'F. GET /api/auth/me integration returns initial student profile',
      passF,
      `Initial headline: "${meData.profile?.headline}"`
    );

    // =========================================================
    // Test G: Protected route without authentication rejected
    // =========================================================
    const unauthRes = await fetch(`${BASE_URL}/profile`, {
      method: 'GET',
    });

    const passG = unauthRes.status === 401;

    recordResult(
      'G. Protected route without authentication blocked with 401',
      passG,
      `HTTP ${unauthRes.status} (Access Denied)`
    );

    // =========================================================
    // Test H: Protected route with authentication succeeds
    // =========================================================
    const authProfileRes = await fetch(`${BASE_URL}/profile`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const authProfileData = await authProfileRes.json();

    const passH =
      authProfileRes.status === 200 &&
      authProfileData.success === true &&
      Boolean(authProfileData.profile);

    recordResult(
      'H. Protected route with authentication succeeds with 200',
      passH,
      `HTTP ${authProfileRes.status}, profile ID: ${authProfileData.profile?._id}`
    );

    // =========================================================
    // Test I: Logout endpoint integration
    // =========================================================
    const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const logoutData = await logoutRes.json();

    const passI = logoutRes.status === 200 && logoutData.success === true;

    recordResult(
      'I. Logout endpoint responds with 200 success',
      passI,
      `HTTP ${logoutRes.status}, message: "${logoutData.message}"`
    );

    // =========================================================
    // Test J: Profile retrieval via GET /api/profile
    // =========================================================
    const getProfileRes = await fetch(`${BASE_URL}/profile`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const getProfileData = await getProfileRes.json();

    const passJ =
      getProfileRes.status === 200 &&
      getProfileData.success === true &&
      getProfileData.profile.userId.toString() === registeredUser.id.toString();

    recordResult(
      'J. Profile retrieval via GET /api/profile',
      passJ,
      `HTTP ${getProfileRes.status}, userId matched: ${registeredUser.id}`
    );

    // =========================================================
    // Test K: Profile update via PATCH /api/profile
    // =========================================================
    const updatePayload = {
      headline: 'Full-Stack Developer & AI Enthusiast | Final Year',
      profileMetadata: {
        bio: 'Passionate about building scalable web applications and AI tools.',
        githubUrl: 'https://github.com/adalovelace',
        linkedinUrl: 'https://linkedin.com/in/adalovelace',
        portfolioUrl: 'https://adalovelace.dev',
      },
      skills: [
        { name: 'JavaScript', proficiencyLevel: 'advanced' },
        { name: 'React', proficiencyLevel: 'intermediate' },
      ],
      ...(mernRole ? { targetRoleId: mernRole._id.toString() } : {}),
    };

    const updateRes = await fetch(`${BASE_URL}/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(updatePayload),
    });
    const updateData = await updateRes.json();

    const passK =
      updateRes.status === 200 &&
      updateData.success === true &&
      updateData.profile?.headline === updatePayload.headline &&
      updateData.profile?.skills?.length === 2 &&
      updateData.profile?.profileMetadata?.githubUrl === updatePayload.profileMetadata.githubUrl;

    recordResult(
      'K. Profile update via PATCH /api/profile supported and verified',
      passK,
      `HTTP ${updateRes.status}, updated headline: "${updateData.profile?.headline}", skills: ${updateData.profile?.skills?.length}`
    );

    // =========================================================
    // Test L: Backend API error handling (409 Conflict duplicate email)
    // =========================================================
    const dupRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Another User',
        email: testEmail, // duplicate
        password: 'Password123!',
      }),
    });
    const dupData = await dupRes.json();

    const passL =
      dupRes.status === 409 &&
      dupData.success === false &&
      dupData.message.includes('already exists');

    recordResult(
      'L. Backend API error handling (409 Conflict on duplicate email)',
      passL,
      `HTTP ${dupRes.status}, message: "${dupData.message}"`
    );

    // =========================================================
    // Test M: Verify client does NOT contain GEMINI_API_KEY
    // =========================================================
    const clientPath = path.join(__dirname, '..', '..', 'client');
    const clientEnvPath = path.join(clientPath, '.env');
    const clientEnvContent = fs.existsSync(clientEnvPath) ? fs.readFileSync(clientEnvPath, 'utf8') : '';

    const hasGeminiInClientEnv =
      clientEnvContent.includes('GEMINI_API_KEY') ||
      clientEnvContent.includes('VITE_GEMINI');

    // Recursively check client/src for any GEMINI_API_KEY leak
    let hasGeminiInSrc = false;
    const scanDir = (dir) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.env')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes('GEMINI_API_KEY') && !fullPath.includes('test')) {
            hasGeminiInSrc = true;
          }
        }
      }
    };
    scanDir(path.join(clientPath, 'src'));

    const passM = !hasGeminiInClientEnv && !hasGeminiInSrc;

    recordResult(
      'M. Verify client (.env & src) does NOT expose GEMINI_API_KEY',
      passM,
      `Gemini in client/.env: ${hasGeminiInClientEnv}, Gemini in client/src: ${hasGeminiInSrc}`
    );

  } catch (error) {
    console.error('\n[Test Runner Error]:', error);
  } finally {
    // Cleanup temporary test data
    try {
      if (registeredUser) {
        await StudentProfile.deleteMany({ userId: registeredUser.id });
        await User.deleteOne({ _id: registeredUser.id });
        console.log('\n[Test Runner] Cleaned up temporary test user and profile from MongoDB.');
      }
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

runFrontendAuthTests();
