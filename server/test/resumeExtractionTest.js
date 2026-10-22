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
import StudentProfile from '../src/models/StudentProfile.js';
import { generateToken } from '../src/utils/tokenUtils.js';
import {
  createValidPdfBuffer,
  createEmptyPdfBuffer,
  createCorruptedPdfBuffer,
  createValidDocxBuffer,
  createCorruptedDocxBuffer,
  createOversizedBuffer,
  createUnsupportedBuffer,
} from './helpers/resumeFixtures.js';

const TEST_PORT = 5075;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

const testResults = [];

function recordResult(testName, passed, details = '') {
  testResults.push({ testName, passed, details });
  const mark = passed ? '✓ PASS' : '✗ FAIL';
  console.log(`  [${mark}] ${testName} ${details ? '(' + details + ')' : ''}`);
}

async function runResumeTests() {
  console.log('\n=============================================================');
  console.log('   PHASE 4 VERIFICATION: RESUME INGESTION & TEXT EXTRACTION  ');
  console.log('=============================================================\n');

  await connectDB();
  const server = app.listen(TEST_PORT);
  console.log(`[Test Runner] Test server listening on ${BASE_URL}\n`);

  // Setup test users
  const timestamp = Date.now();
  const user1Email = `student_resume_${timestamp}@btech.edu`;
  const user2Email = `student_other_${timestamp}@btech.edu`;

  let user1, user2;
  let token1, token2;
  let uploadedPdfResumeId = '';
  let uploadedDocxResumeId = '';

  try {
    user1 = await User.create({
      name: 'Alex Morgan',
      email: user1Email,
      passwordHash: 'dummy_hash_for_testing',
      role: 'student',
    });

    user2 = await User.create({
      name: 'Bob Other',
      email: user2Email,
      passwordHash: 'dummy_hash_for_testing',
      role: 'student',
    });

    await StudentProfile.create({ userId: user1._id, headline: 'Student 1' });
    await StudentProfile.create({ userId: user2._id, headline: 'Student 2' });

    token1 = generateToken({ id: user1._id, email: user1.email, role: user1.role });
    token2 = generateToken({ id: user2._id, email: user2.email, role: user2.role });

    // 1. Valid PDF Resume Upload & Extraction
    {
      const pdfBuffer = createValidPdfBuffer();
      const formData = new FormData();
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      formData.append('resume', blob, 'alex_morgan_resume.pdf');

      const res = await fetch(`${BASE_URL}/resumes/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token1}` },
        body: formData,
      });

      const data = await res.json();
      uploadedPdfResumeId = data.resume?.id;

      // Verify in MongoDB
      const dbResume = await Resume.findById(uploadedPdfResumeId);

      const passed =
        res.status === 201 &&
        data.success === true &&
        Boolean(uploadedPdfResumeId) &&
        data.resume?.charCount > 50 &&
        data.resume?.textSnippet.includes('Alex Morgan') &&
        dbResume !== null &&
        dbResume.userId.toString() === user1._id.toString() &&
        dbResume.rawText.includes('JavaScript') &&
        dbResume.status === 'parsed';

      recordResult(
        '1. Valid PDF upload and text extraction',
        passed,
        `HTTP ${res.status}, extracted ${data.resume?.wordCount} words`
      );
    }

    // 2. Valid DOCX Resume Upload & Extraction
    {
      const docxBuffer = await createValidDocxBuffer();
      const formData = new FormData();
      const blob = new Blob([docxBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      formData.append('resume', blob, 'samantha_reed_resume.docx');

      const res = await fetch(`${BASE_URL}/resumes/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token1}` },
        body: formData,
      });

      const data = await res.json();
      uploadedDocxResumeId = data.resume?.id;

      const dbResume = await Resume.findById(uploadedDocxResumeId);

      const passed =
        res.status === 201 &&
        data.success === true &&
        Boolean(uploadedDocxResumeId) &&
        data.resume?.charCount > 50 &&
        data.resume?.textSnippet.includes('Samantha Reed') &&
        dbResume !== null &&
        dbResume.userId.toString() === user1._id.toString() &&
        dbResume.rawText.includes('TypeScript') &&
        dbResume.status === 'parsed';

      recordResult(
        '2. Valid DOCX upload and text extraction',
        passed,
        `HTTP ${res.status}, extracted ${data.resume?.wordCount} words`
      );
    }

    // 3. Empty PDF (Valid PDF without text streams)
    {
      const emptyPdfBuffer = createEmptyPdfBuffer();
      const formData = new FormData();
      const blob = new Blob([emptyPdfBuffer], { type: 'application/pdf' });
      formData.append('resume', blob, 'empty_resume.pdf');

      const res = await fetch(`${BASE_URL}/resumes/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token1}` },
        body: formData,
      });

      const data = await res.json();
      const passed =
        res.status === 422 &&
        data.success === false &&
        data.message.includes('empty');

      recordResult(
        '3. Empty PDF rejected gracefully',
        passed,
        `HTTP ${res.status}, message: "${data.message}"`
      );
    }

    // 4. Corrupted PDF
    {
      const corruptedPdfBuffer = createCorruptedPdfBuffer();
      const formData = new FormData();
      const blob = new Blob([corruptedPdfBuffer], { type: 'application/pdf' });
      formData.append('resume', blob, 'corrupted_resume.pdf');

      const res = await fetch(`${BASE_URL}/resumes/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token1}` },
        body: formData,
      });

      const data = await res.json();
      const passed =
        res.status === 422 &&
        data.success === false &&
        data.message.includes('valid or readable PDF');

      recordResult(
        '4. Corrupted PDF rejected without server crash',
        passed,
        `HTTP ${res.status}, message: "${data.message}"`
      );
    }

    // 5. Corrupted DOCX
    {
      const corruptedDocxBuffer = createCorruptedDocxBuffer();
      const formData = new FormData();
      const blob = new Blob([corruptedDocxBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      formData.append('resume', blob, 'corrupted_resume.docx');

      const res = await fetch(`${BASE_URL}/resumes/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token1}` },
        body: formData,
      });

      const data = await res.json();
      const passed =
        res.status === 422 &&
        data.success === false &&
        data.message.includes('valid or readable Word document');

      recordResult(
        '5. Corrupted DOCX rejected without server crash',
        passed,
        `HTTP ${res.status}, message: "${data.message}"`
      );
    }

    // 6. Unsupported File Type (.txt or .png)
    {
      const unsupportedBuffer = createUnsupportedBuffer();
      const formData = new FormData();
      const blob = new Blob([unsupportedBuffer], { type: 'text/plain' });
      formData.append('resume', blob, 'resume.txt');

      const res = await fetch(`${BASE_URL}/resumes/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token1}` },
        body: formData,
      });

      const data = await res.json();
      const passed =
        res.status === 400 &&
        data.success === false &&
        data.message.includes('Unsupported file type');

      recordResult(
        '6. Unsupported file extension (.txt) rejected',
        passed,
        `HTTP ${res.status}, message: "${data.message}"`
      );
    }

    // 7. Oversized File (> 5 MB)
    {
      const oversizedBuffer = createOversizedBuffer();
      const formData = new FormData();
      const blob = new Blob([oversizedBuffer], { type: 'application/pdf' });
      formData.append('resume', blob, 'huge_resume.pdf');

      const res = await fetch(`${BASE_URL}/resumes/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token1}` },
        body: formData,
      });

      const data = await res.json();
      const passed =
        res.status === 400 &&
        data.success === false &&
        data.message.includes('5 MB');

      recordResult(
        '7. Oversized file (> 5MB limit) rejected',
        passed,
        `HTTP ${res.status}, message: "${data.message}"`
      );
    }

    // 8. Missing File in Request
    {
      const formData = new FormData(); // No file appended

      const res = await fetch(`${BASE_URL}/resumes/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token1}` },
        body: formData,
      });

      const data = await res.json();
      const passed =
        res.status === 400 &&
        data.success === false &&
        data.message.includes('No resume file provided');

      recordResult(
        '8. Missing file rejected with 400 Bad Request',
        passed,
        `HTTP ${res.status}`
      );
    }

    // 9. Unauthorized Upload Request (No JWT)
    {
      const pdfBuffer = createValidPdfBuffer();
      const formData = new FormData();
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      formData.append('resume', blob, 'unauth_resume.pdf');

      const res = await fetch(`${BASE_URL}/resumes/upload`, {
        method: 'POST',
        // No Authorization header
        body: formData,
      });

      const data = await res.json();
      const passed = res.status === 401 && data.success === false;

      recordResult(
        '9. Unauthorized upload request rejected with 401',
        passed,
        `HTTP ${res.status}`
      );
    }

    // 10. Accessing Another User's Resume (Tenant Isolation)
    {
      // User 2 attempts to fetch User 1's resume
      const res = await fetch(`${BASE_URL}/resumes/${uploadedPdfResumeId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token2}` },
      });

      const data = await res.json();
      const passed = res.status === 404 && data.success === false;

      recordResult(
        '10. Cross-user resume access blocked (Tenant Isolation)',
        passed,
        `HTTP ${res.status}, User 2 cannot access User 1 resume`
      );
    }

    // 11. Resume Listing
    {
      const res = await fetch(`${BASE_URL}/resumes`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token1}` },
      });

      const data = await res.json();
      const passed =
        res.status === 200 &&
        data.success === true &&
        data.count >= 2 &&
        Array.isArray(data.resumes);

      recordResult(
        '11. Resume listing for authenticated student',
        passed,
        `HTTP ${res.status}, retrieved ${data.count} resumes`
      );
    }

    // 12. Resume Retrieval by ID
    {
      const res = await fetch(`${BASE_URL}/resumes/${uploadedPdfResumeId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token1}` },
      });

      const data = await res.json();
      const passed =
        res.status === 200 &&
        data.success === true &&
        data.resume?.id === uploadedPdfResumeId &&
        data.resume?.rawText.includes('Alex Morgan');

      recordResult(
        '12. Resume retrieval by ID with full extracted text',
        passed,
        `HTTP ${res.status}, verified text content`
      );
    }

    // 13. Resume Deletion
    {
      const res = await fetch(`${BASE_URL}/resumes/${uploadedDocxResumeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token1}` },
      });

      const data = await res.json();
      const verifyInDb = await Resume.findById(uploadedDocxResumeId);

      const passed =
        res.status === 200 &&
        data.success === true &&
        verifyInDb === null;

      recordResult(
        '13. Resume deletion by authenticated owner',
        passed,
        `HTTP ${res.status}, verified deleted from MongoDB`
      );
    }

    // 14. Verification of Active Resume Pointer Management on StudentProfile
    {
      const profile = await StudentProfile.findOne({ userId: user1._id });
      // Since the active resume (uploadedDocxResumeId) was deleted in Test 13, activeResumeId must be cleanly un-linked to null
      const passed = profile !== null && profile.activeResumeId === null;

      recordResult(
        '14. StudentProfile activeResumeId cleanly unlinked upon resume deletion',
        passed,
        `activeResumeId safely reset to null in StudentProfile`
      );
    }

    // Cleanup test data
    await Resume.deleteMany({ userId: { $in: [user1._id, user2._id] } });
    await StudentProfile.deleteMany({ userId: { $in: [user1._id, user2._id] } });
    await User.deleteMany({ _id: { $in: [user1._id, user2._id] } });
    console.log('\n[Test Runner] Cleaned up temporary test users and resumes from MongoDB.');
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

runResumeTests();
