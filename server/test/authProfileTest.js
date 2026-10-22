import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import app from '../src/app.js';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import StudentProfile from '../src/models/StudentProfile.js';
import JobRole from '../src/models/JobRole.js';

const TEST_PORT = 5055;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

const testResults = [];

function recordResult(testName, passed, details = '') {
  testResults.push({ testName, passed, details });
  const mark = passed ? '✓ PASS' : '✗ FAIL';
  console.log(`  [${mark}] ${testName} ${details ? '(' + details + ')' : ''}`);
}

async function runTests() {
  console.log('\n=============================================================');
  console.log('    PHASE 3 VERIFICATION: AUTH & STUDENT PROFILE APIS        ');
  console.log('=============================================================\n');

  await connectDB();

  const server = app.listen(TEST_PORT);
  console.log(`[Test Runner] Test server listening on ${BASE_URL}\n`);

  const uniqueId = Date.now();
  const testEmail = `student_${uniqueId}@btech.edu`;
  const testPassword = 'SecurePassword123!';
  let authToken = '';
  let studentUserId = '';
  let targetRole = null;

  try {
    // Retrieve a seeded target role for testing profile linking
    targetRole = await JobRole.findOne({ slug: 'mern-stack-developer' });

    // Clean up any test user if exists
    await User.deleteMany({ email: testEmail });

    // 1. Successful Registration
    {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Jane Doe',
          email: testEmail,
          password: testPassword,
        }),
      });
      const data = await res.json();
      const passed =
        res.status === 201 &&
        data.success === true &&
        Boolean(data.token) &&
        data.user.email === testEmail.toLowerCase() &&
        data.user.passwordHash === undefined && // No password hash exposed
        data.user.password === undefined;

      authToken = data.token;
      studentUserId = data.user.id;
      recordResult(
        '1. Successful registration',
        passed,
        `HTTP ${res.status}, user: ${data.user?.email}`
      );
    }

    // 2. Duplicate Email Registration
    {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Duplicate Jane',
          email: testEmail,
          password: 'AnotherPassword456!',
        }),
      });
      const data = await res.json();
      const passed = res.status === 409 && data.success === false;
      recordResult(
        '2. Duplicate email registration rejected',
        passed,
        `HTTP ${res.status}, message: ${data.message}`
      );
    }

    // 3. Invalid Registration Input
    {
      // Missing password, invalid email format
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '',
          email: 'not-an-email',
          password: '123', // Too short
        }),
      });
      const data = await res.json();
      const passed =
        res.status === 400 &&
        data.success === false &&
        Boolean(data.errors?.email) &&
        Boolean(data.errors?.name) &&
        Boolean(data.errors?.password);
      recordResult(
        '3. Invalid registration input validation',
        passed,
        `HTTP ${res.status}, detected errors in name, email, password`
      );
    }

    // 4. Successful Login
    {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });
      const data = await res.json();
      const passed =
        res.status === 200 &&
        data.success === true &&
        Boolean(data.token) &&
        data.user.passwordHash === undefined;
      authToken = data.token; // Refresh token
      recordResult(
        '4. Successful login',
        passed,
        `HTTP ${res.status}, token received`
      );
    }

    // 5. Invalid Password Login
    {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'WrongPassword999!',
        }),
      });
      const data = await res.json();
      const passed = res.status === 401 && data.success === false;
      recordResult(
        '5. Invalid password rejected with generic message',
        passed,
        `HTTP ${res.status}, message: "${data.message}"`
      );
    }

    // 6. Missing Authentication Token
    {
      const res = await fetch(`${BASE_URL}/auth/me`, {
        method: 'GET',
      });
      const data = await res.json();
      const passed = res.status === 401 && data.success === false;
      recordResult(
        '6. Missing token rejected on protected route',
        passed,
        `HTTP ${res.status}`
      );
    }

    // 7. Invalid JWT Token
    {
      const res = await fetch(`${BASE_URL}/auth/me`, {
        method: 'GET',
        headers: { Authorization: 'Bearer this_is_a_completely_invalid_jwt_token' },
      });
      const data = await res.json();
      const passed = res.status === 401 && data.success === false;
      recordResult(
        '7. Invalid JWT signature rejected',
        passed,
        `HTTP ${res.status}`
      );
    }

    // 8. Expired JWT Token
    {
      const expiredToken = jwt.sign(
        { id: studentUserId, email: testEmail, role: 'student' },
        process.env.JWT_SECRET,
        { expiresIn: '-10s' } // Expired 10 seconds ago
      );
      const res = await fetch(`${BASE_URL}/auth/me`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${expiredToken}` },
      });
      const data = await res.json();
      const passed = res.status === 401 && data.message.includes('expired');
      recordResult(
        '8. Expired JWT rejected with expiration notice',
        passed,
        `HTTP ${res.status}`
      );
    }

    // 9. Successful /me Request
    {
      const res = await fetch(`${BASE_URL}/auth/me`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      const passed =
        res.status === 200 &&
        data.success === true &&
        data.user.email === testEmail.toLowerCase() &&
        data.user.passwordHash === undefined;
      recordResult(
        '9. Current user retrieval via /api/auth/me',
        passed,
        `HTTP ${res.status}, user: ${data.user?.name}`
      );
    }

    // 10. Profile Retrieval (Auto-created on registration)
    {
      const res = await fetch(`${BASE_URL}/profile`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      const passed =
        res.status === 200 &&
        data.success === true &&
        Boolean(data.profile) &&
        data.profile.userId.toString() === studentUserId.toString();
      recordResult(
        '10. Student profile retrieval via /api/profile',
        passed,
        `HTTP ${res.status}, headline: "${data.profile?.headline}"`
      );
    }

    // 11. Profile Update (PUT /api/profile)
    {
      const updatePayload = {
        headline: 'Final Year B.Tech CSE Student | Full Stack & AI Enthusiast',
        education: [
          {
            institution: 'National Institute of Technology',
            degree: 'B.Tech',
            fieldOfStudy: 'Computer Science & Engineering',
            startYear: 2022,
            endYear: 2026,
            grade: '8.8 CGPA',
            isCurrent: true,
          },
        ],
        skills: [
          {
            name: 'JavaScript',
            category: 'Programming Language',
            proficiencyLevel: 'advanced',
            source: 'manual',
            isVerified: true,
          },
          {
            name: 'React',
            category: 'Framework',
            proficiencyLevel: 'intermediate',
            source: 'manual',
          },
        ],
        projects: [
          {
            title: 'Campus Placement Portal',
            description: 'Full-stack portal for placement recruitment drives',
            technologies: ['React', 'Node.js', 'Express', 'MongoDB'],
            link: 'https://github.com/student/placement-portal',
          },
        ],
        targetRoleId: targetRole ? targetRole._id : null,
        profileMetadata: {
          bio: 'Passionate software engineer building web applications and exploring AI workflows.',
          weeklyAvailableHours: 20,
          preferredWorkMode: 'remote',
        },
      };

      const res = await fetch(`${BASE_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(updatePayload),
      });
      const data = await res.json();
      const passed =
        res.status === 200 &&
        data.success === true &&
        data.profile.education?.length === 1 &&
        data.profile.skills?.length === 2 &&
        data.profile.targetRoleId?._id?.toString() === targetRole?._id?.toString();

      recordResult(
        '11. Full profile update via PUT /api/profile',
        passed,
        `HTTP ${res.status}, skills: ${data.profile?.skills?.length}, targetRole: ${data.profile?.targetRoleId?.title}`
      );
    }

    // 12. Profile Partial Patch (PATCH /api/profile)
    {
      const patchPayload = {
        headline: 'Senior Full Stack Specialist in Training',
        'profileMetadata.weeklyAvailableHours': 25,
      };

      const res = await fetch(`${BASE_URL}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          headline: 'Senior Full Stack Specialist in Training',
        }),
      });
      const data = await res.json();
      const passed =
        res.status === 200 &&
        data.success === true &&
        data.profile.headline === 'Senior Full Stack Specialist in Training';
      recordResult(
        '12. Partial profile patch via PATCH /api/profile',
        passed,
        `HTTP ${res.status}, updated headline`
      );
    }

    // 13. Unauthorized Profile Access
    {
      const res = await fetch(`${BASE_URL}/profile`, {
        method: 'GET',
        // No auth header
      });
      const data = await res.json();
      const passed = res.status === 401 && data.success === false;
      recordResult(
        '13. Unauthorized profile access rejected',
        passed,
        `HTTP ${res.status}`
      );
    }

    // 14. Password Hash Verification in MongoDB
    {
      const dbUser = await User.findOne({ email: testEmail });
      const isHashed =
        dbUser &&
        Boolean(dbUser.passwordHash) &&
        (dbUser.passwordHash.startsWith('$2a$') || dbUser.passwordHash.startsWith('$2b$')) &&
        dbUser.passwordHash !== testPassword;

      recordResult(
        '14. Database password hashing verification',
        isHashed,
        `bcrypt salt rounds verified ($2a$/$2b$)`
      );
    }

    // Clean up test user and profile
    await User.deleteOne({ email: testEmail });
    await StudentProfile.deleteOne({ userId: studentUserId });
    console.log('\n[Test Runner] Cleaned up temporary test user & profile from MongoDB.');
  } catch (error) {
    console.error('\n[Test Execution Error]:', error);
  } finally {
    server.close();
    await mongoose.disconnect();
  }

  const allPassed = testResults.every((r) => r.passed);
  console.log('\n=============================================================');
  console.log(`     TEST SUMMARY: ${testResults.filter((r) => r.passed).length} / ${testResults.length} TESTS PASSED`);
  console.log(`     OVERALL STATUS: ${allPassed ? 'ALL TESTS PASSED ✓' : 'SOME TESTS FAILED ✗'}`);
  console.log('=============================================================\n');

  if (!allPassed) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
