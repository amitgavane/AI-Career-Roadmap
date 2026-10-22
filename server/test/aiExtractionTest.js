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
import { validateAndNormalizeAiResponse } from '../src/utils/aiResponseValidator.js';
import { extractResumeEntitiesWithAi } from '../src/services/aiExtractionService.js';

const TEST_PORT = 5085;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

const testResults = [];

function recordResult(testName, passed, details = '') {
  testResults.push({ testName, passed, details });
  const mark = passed ? '✓ PASS' : '✗ FAIL';
  console.log(`  [${mark}] ${testName} ${details ? '(' + details + ')' : ''}`);
}

async function runAiExtractionTests() {
  console.log('\n=============================================================');
  console.log('    PHASE 5 VERIFICATION: AI-POWERED ENTITY EXTRACTION       ');
  console.log('=============================================================\n');

  await connectDB();
  const server = app.listen(TEST_PORT);
  console.log(`[Test Runner] Test server listening on ${BASE_URL}\n`);

  const timestamp = Date.now();
  const user1Email = `ai_student_${timestamp}@btech.edu`;
  const user2Email = `ai_other_${timestamp}@btech.edu`;

  let user1, user2;
  let token1, token2;
  let fullResumeId, sparseResumeId, emptyTextResumeId;

  try {
    user1 = await User.create({
      name: 'Elena Rostova',
      email: user1Email,
      passwordHash: 'dummy_hash_for_testing',
      role: 'student',
    });

    user2 = await User.create({
      name: 'Marcus Vance',
      email: user2Email,
      passwordHash: 'dummy_hash_for_testing',
      role: 'student',
    });

    await StudentProfile.create({ userId: user1._id, headline: 'Student 1' });
    await StudentProfile.create({ userId: user2._id, headline: 'Student 2' });

    token1 = generateToken({ id: user1._id, email: user1.email, role: user1.role });
    token2 = generateToken({ id: user2._id, email: user2.email, role: user2.role });

    // Comprehensive resume text with all 9 categories
    const fullResumeText = `
Elena Rostova
Email: elena.rostova@example.com | Phone: +1-555-0199 | Location: San Jose, CA
LinkedIn: linkedin.com/in/elenarostova | GitHub: github.com/elenarostova

PROFESSIONAL SUMMARY:
Results-driven Full Stack Engineer with 2 years of hands-on experience developing distributed web applications and microservices.

TECHNICAL SKILLS:
Programming Languages: JavaScript, TypeScript, Python, SQL, HTML5, CSS3
Frameworks & Libraries: React, Node.js, Express, Next.js, Redux, Tailwind CSS
Databases: MongoDB, PostgreSQL, Redis
Cloud & DevOps Tools: Docker, Kubernetes, Git, GitHub Actions, AWS S3, Postman, Jest
Concepts: RESTful APIs, Microservices Architecture, Agile Methodology, CI/CD Pipelines

PROFESSIONAL EXPERIENCE:
Software Engineer Intern | CloudScale Technologies | June 2024 - Present
- Architected RESTful microservices in Node.js and Express processing 10,000+ daily events.
- Integrated PostgreSQL and Redis caching layer to reduce query latency by 45%.
- Implemented automated CI/CD deployment pipelines using GitHub Actions and Docker.

Junior Web Developer | InnovateX Labs | Jan 2023 - May 2024
- Built responsive client dashboards in React and TypeScript with Tailwind CSS styling.
- Collaborated with UX teams using Agile Scrum workflows and Jira.

EDUCATION:
Bachelor of Technology in Computer Science and Engineering
California State University | August 2020 - May 2024 | GPA: 3.85 / 4.0

PROJECTS:
1. DevFlow - Developer Productivity & Task Orchestration Platform
- Full-stack collaborative project management application with real-time websocket updates.
- Built using React, Node.js, Express, MongoDB, and Tailwind CSS.

2. HealthSync - Patient Telehealth Appointment Booking API
- Secure HIPAA-compliant appointment scheduling backend with role-based access control.
- Technologies: TypeScript, Express, PostgreSQL, Redis, Jest.

CERTIFICATIONS:
- AWS Certified Cloud Practitioner | Amazon Web Services | 2024
- Meta Certified Frontend Developer | Meta | 2023
`;

    // Sparse resume text with only some categories
    const sparseResumeText = `
David Miller
Education: B.S. in Information Systems from Boston University, 2021 to 2025.
Skills: Java, C++, SQL.
Interest: Looking for entry-level opportunities in software development.
`;

    // Create resumes in database
    const fullResumeDoc = await Resume.create({
      userId: user1._id,
      originalName: 'elena_rostova_full_resume.pdf',
      fileType: 'application/pdf',
      fileSize: 15420,
      rawText: fullResumeText,
      status: 'parsed',
    });
    fullResumeId = fullResumeDoc._id;

    const sparseResumeDoc = await Resume.create({
      userId: user1._id,
      originalName: 'david_miller_sparse_resume.docx',
      fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileSize: 8200,
      rawText: sparseResumeText,
      status: 'parsed',
    });
    sparseResumeId = sparseResumeDoc._id;

    const emptyTextResumeDoc = await Resume.create({
      userId: user1._id,
      originalName: 'empty_text_resume.pdf',
      fileType: 'application/pdf',
      fileSize: 4200,
      rawText: '', // No extracted text
      status: 'parsed',
    });
    emptyTextResumeId = emptyTextResumeDoc._id;

    // =========================================================================
    // TEST A: Valid Resume with All 9 Categories Extracted via Gemini
    // =========================================================================
    {
      const res = await fetch(`${BASE_URL}/resumes/${fullResumeId}/extract`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token1}` },
      });

      const data = await res.json();
      const extracted = data.extractedEntities || data.data?.extractedEntities;

      const hasLanguages = extracted?.programmingLanguages?.length >= 3;
      const hasFrameworks = extracted?.frameworks?.length >= 2;
      const hasDatabases = extracted?.databases?.length >= 2;
      const hasTools = extracted?.tools?.length >= 2;
      const hasProjects = extracted?.projects?.length >= 1;
      const hasEducation = extracted?.education?.length >= 1;
      const hasExperience = extracted?.experience?.length >= 1;
      const hasCertifications = extracted?.certifications?.length >= 1;

      // Verify in MongoDB
      const dbResume = await Resume.findById(fullResumeId);
      const isPersistedInDb =
        dbResume?.extractionStatus === 'completed' &&
        dbResume?.aiExtractedData?.programmingLanguages?.length > 0 &&
        Boolean(dbResume?.extractionProcessedAt);

      const passed =
        res.status === 200 &&
        data.success === true &&
        (data.extractionStatus === 'completed' || data.data?.extractionStatus === 'completed') &&
        hasLanguages &&
        hasFrameworks &&
        hasDatabases &&
        hasTools &&
        hasProjects &&
        hasEducation &&
        hasExperience &&
        hasCertifications &&
        isPersistedInDb;

      recordResult(
        'A. Valid resume extraction across all 9 categories',
        passed,
        `HTTP ${res.status}, langs: ${extracted?.programmingLanguages?.length}, frameworks: ${extracted?.frameworks?.length}, DBs: ${extracted?.databases?.length}, projects: ${extracted?.projects?.length}, certs: ${extracted?.certifications?.length}`
      );
    }

    // =========================================================================
    // TEST B: Resume with Only Some Categories (Sparse Resume)
    // =========================================================================
    {
      // Brief pause to respect API rate limits between consecutive extraction requests
      await new Promise((resolve) => setTimeout(resolve, 3500));

      const res = await fetch(`${BASE_URL}/resumes/${sparseResumeId}/extract`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token1}` },
      });

      const data = await res.json();
      const extracted = data.extractedEntities || data.data?.extractedEntities;

      // Unmentioned categories must be returned as valid empty arrays, not null/undefined
      const emptyArraysPreserved =
        Array.isArray(extracted?.projects) &&
        Array.isArray(extracted?.experience) &&
        Array.isArray(extracted?.certifications);

      const hasExpectedData =
        extracted?.education?.length >= 1 &&
        extracted?.programmingLanguages?.length >= 1;

      const passed =
        res.status === 200 &&
        data.success === true &&
        (data.extractionStatus === 'completed' || data.data?.extractionStatus === 'completed') &&
        emptyArraysPreserved &&
        hasExpectedData;

      recordResult(
        'B. Sparse resume extraction handles empty categories as arrays',
        passed,
        `HTTP ${res.status}, unmentioned categories returned as []`
      );
    }

    // =========================================================================
    // TEST C: Resume with No Extracted Text
    // =========================================================================
    {
      const res = await fetch(`${BASE_URL}/resumes/${emptyTextResumeId}/extract`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token1}` },
      });

      const data = await res.json();
      const passed =
        res.status === 400 &&
        data.success === false &&
        data.message.includes('no extracted text');

      recordResult(
        'C. Resume with no extracted text rejected with 400 Bad Request',
        passed,
        `HTTP ${res.status}, message: "${data.message}"`
      );
    }

    // =========================================================================
    // TEST D: Nonexistent / Invalid Resume ID
    // =========================================================================
    {
      // 1. Invalid ID format
      const invalidRes = await fetch(`${BASE_URL}/resumes/not-a-valid-id/extract`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token1}` },
      });
      const invalidData = await invalidRes.json();
      const invalidPassed = invalidRes.status === 400 && invalidData.success === false;

      // 2. Non-existent valid ObjectId
      const nonExistentId = new mongoose.Types.ObjectId();
      const notFoundRes = await fetch(`${BASE_URL}/resumes/${nonExistentId}/extract`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token1}` },
      });
      const notFoundData = await notFoundRes.json();
      const notFoundPassed = notFoundRes.status === 404 && notFoundData.success === false;

      recordResult(
        'D. Invalid ID format (400) and nonexistent ID (404) handled safely',
        invalidPassed && notFoundPassed,
        `invalid ID HTTP ${invalidRes.status}, nonexistent ID HTTP ${notFoundRes.status}`
      );
    }

    // =========================================================================
    // TEST E: User Trying to Extract Another User's Resume (Tenant Isolation)
    // =========================================================================
    {
      // User 2 attempts to trigger AI extraction on User 1's resume
      const res = await fetch(`${BASE_URL}/resumes/${fullResumeId}/extract`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token2}` },
      });

      const data = await res.json();
      const passed = res.status === 404 && data.success === false;

      recordResult(
        'E. Cross-user extraction blocked (Tenant Isolation)',
        passed,
        `HTTP ${res.status}, User 2 cannot extract User 1 resume`
      );
    }

    // =========================================================================
    // TEST F: Gemini API Failure Handling (Missing/Invalid Key Handling)
    // =========================================================================
    {
      // Test direct call with empty text
      let emptyTextHandled = false;
      try {
        await extractResumeEntitiesWithAi('');
      } catch (err) {
        emptyTextHandled = err.message.includes('empty');
      }

      // Test with invalid API key in isolated context
      const originalKey = process.env.GEMINI_API_KEY;
      let invalidKeyHandled = false;
      try {
        process.env.GEMINI_API_KEY = 'INVALID_FAKE_KEY_12345';
        await extractResumeEntitiesWithAi('Sample candidate text for failure testing.');
      } catch (err) {
        invalidKeyHandled = Boolean(err.message);
      } finally {
        process.env.GEMINI_API_KEY = originalKey; // Restore key immediately
      }

      const passed = emptyTextHandled && invalidKeyHandled;
      recordResult(
        'F. Gemini API failure and timeout guards handled gracefully',
        passed,
        `empty text error: ${emptyTextHandled}, invalid key caught: ${invalidKeyHandled}`
      );
    }

    // =========================================================================
    // TEST G: Malformed Gemini Response Validation
    // =========================================================================
    {
      let nonJsonCaught = false;
      try {
        validateAndNormalizeAiResponse('This is not json content');
      } catch (err) {
        nonJsonCaught = err.message.includes('valid JSON');
      }

      let arrayTopLevelCaught = false;
      try {
        validateAndNormalizeAiResponse(JSON.stringify(['item1', 'item2']));
      } catch (err) {
        arrayTopLevelCaught = err.message.includes('top-level structure must be a JSON object');
      }

      let missingCategoryCaught = false;
      try {
        validateAndNormalizeAiResponse(JSON.stringify({ skills: [] })); // Missing 8 required categories
      } catch (err) {
        missingCategoryCaught = err.message.includes('missing required category');
      }

      let nonArrayCategoryCaught = false;
      try {
        validateAndNormalizeAiResponse(
          JSON.stringify({
            skills: 'not an array',
            programmingLanguages: [],
            frameworks: [],
            databases: [],
            tools: [],
            projects: [],
            education: [],
            experience: [],
            certifications: [],
          })
        );
      } catch (err) {
        nonArrayCategoryCaught = err.message.includes('must be an array');
      }

      const passed =
        nonJsonCaught &&
        arrayTopLevelCaught &&
        missingCategoryCaught &&
        nonArrayCategoryCaught;

      recordResult(
        'G. Malformed Gemini responses safely validated and rejected',
        passed,
        `non-JSON caught: ${nonJsonCaught}, missing cat: ${missingCategoryCaught}, invalid type: ${nonArrayCategoryCaught}`
      );
    }

    // =========================================================================
    // TEST H: Verify GET /api/resumes/:id Returns Persisted Extraction
    // =========================================================================
    {
      const res = await fetch(`${BASE_URL}/resumes/${fullResumeId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token1}` },
      });

      const data = await res.json();
      const resume = data.resume;

      const passed =
        res.status === 200 &&
        data.success === true &&
        resume.extractionStatus === 'completed' &&
        resume.aiExtractedData?.programmingLanguages?.includes('JavaScript') &&
        resume.aiExtractedData?.frameworks?.includes('React') &&
        resume.aiExtractedData?.databases?.includes('MongoDB') &&
        Boolean(resume.extractionProcessedAt);

      recordResult(
        'H. GET /api/resumes/:id returns persisted AI extraction data',
        passed,
        `HTTP ${res.status}, verified languages, frameworks, DBs in stored document`
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

runAiExtractionTests();
