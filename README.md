# AI-Powered Skill Gap Analysis and Personalized Career Roadmap System

An enterprise-grade, student-centric career acceleration platform that evaluates student resumes against target industry job roles using LLM-powered extraction, semantic skill normalization, weighted gap analysis, and generates prerequisite-ordered learning roadmaps with curated resources and practical milestone projects.

---

## 1. Project Title
**AI-Powered Skill Gap Analysis and Personalized Career Roadmap System for Students**  
*Final-Year B.Tech Major Project • Fully Verified & End-to-End Integrated*

---

## 2. Project Objective
To bridge the critical gap between academic curriculum preparation and real-world industry requirements. The platform provides university students with:
1. Automated, sanitized resume text extraction from PDF and Word (.docx) documents.
2. AI-driven entity classification into 9 structured competencies via Google Gemini API.
3. Deterministic semantic normalization of technical aliases to canonical skill taxonomies.
4. Weighted gap analysis computing precise match and deficiency scores against target engineering roles.
5. Personalized, prerequisite-ordered weekly learning roadmaps with official documentation, course links, practice tasks, and portfolio-grade milestone projects.
6. Real-time student dashboard visualizations and persistent milestone progress tracking.

---

## 3. Key Features
- **Student Authentication & Tenant Isolation**: Secure bcrypt password hashing, JWT bearer tokens, and strict database query-level data isolation.
- **Multi-Format Resume Ingestion**: Client and server-side validation for `.pdf` and `.docx` formats up to 5 MB with corruption detection.
- **AI Entity Extraction Engine**: Zero-temperature Google Gemini AI extraction across 9 distinct categories:
  - General Skills & Methodologies
  - Programming Languages
  - Frameworks & Libraries
  - Databases & Storage
  - Developer Tools
  - Practical Projects
  - Academic Education
  - Professional Experience
  - Industry Certifications
- **Semantic Skill Normalization**: Alias resolution mapping non-standard terms (e.g., `JS` → `JavaScript`, `Mongo DB` → `MongoDB`) to canonical taxonomy IDs with deduplication.
- **Weighted Skill Gap Analysis**: Multi-attribute evaluation computing:
  - Exact & partial semantic skill matches
  - Importance-ranked missing skills (`critical`, `important`, `good_to_have`)
  - Normalized Role Match Percentage & Gap Percentage (summing to 100%)
  - Technology category competency breakdowns
- **Personalized Career Roadmap Engine**:
  - Topological sort respecting strict prerequisite dependencies (e.g., JavaScript → Node.js → Express)
  - Prerequisite cycle resolution preserving roadmap continuity
  - Weekly study hour commitment calculation
  - Curated learning resources with verified external URLs
  - Hands-on practical milestone projects with tangible deliverables
  - Interactive progress updates persisted via MongoDB
- **Responsive Student Dashboard**:
  - Circular SVG radial match gauges
  - Categorical competency progress meters
  - Skill priority distribution charts
  - Quick-action workflow buttons for seamless navigation

---

## 4. System Architecture

```
                    STUDENT
                       │
                       ▼
                REACT FRONTEND (Vite, React Router 6, Axios)
                       │
                    REST API (JSON / Multipart, JWT Bearer)
                       │
                       ▼
               NODE + EXPRESS SERVER
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   AUTHENTICATION   RESUME       SKILL ANALYSIS
        │              │              │
        │              ▼              ▼
        │         TEXT EXTRACTION   NORMALIZATION
        │         (pdf-parse/mammoth) (Taxonomy & Aliases)
        │              │              │
        │              ▼              ▼
        │         GEMINI AI API     GAP ANALYSIS
        │         (Entity Engine)   (Weighted Matching)
        │              │              │
        └──────────────┼──────────────┘
                       ▼
                ROADMAP ENGINE
            (Topological Graph / Cycles)
                       │
                       ▼
                  MONGODB
          (Users, Resumes, Analyses, Roadmaps)
                       │
                       ▼
              PERSONALIZED ROADMAP & DASHBOARD
```

---

## 5. Technology Stack

### Frontend:
- **Framework**: React 18.3 (Single Page Application)
- **Tooling & Bundler**: Vite 5.2
- **Routing**: React Router DOM 6.23
- **HTTP Client**: Axios 1.7 (with automatic JWT bearer token request interceptor and 401 session expiration listener)
- **Styling & Visualizations**: Responsive CSS3, SVG Radial Gauges, Animated HTML5 Progress Meters (zero external chart dependencies for maximum reliability)

### Backend:
- **Runtime**: Node.js (ES Modules)
- **Server Framework**: Express 4.19
- **Security**: Helmet 7.1, CORS, bcryptjs 3.0, jsonwebtoken 9.0
- **Document Parsing**: `pdf-parse` 2.4 (PDF extraction), `mammoth` 1.12 (DOCX extraction), `multer` 2.4 (multipart streaming)
- **Database ODM**: Mongoose 8.4
- **AI Integration**: `@google/generative-ai` 0.24 (Google Gemini 2.5 Flash)

### Database:
- **Database**: MongoDB Community Server / MongoDB Atlas

---

## 6. Project Structure

```
AI-Career-Roadmap/
├── client/                               # Frontend React Application
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js                 # Axios instance with JWT interceptors
│   │   ├── components/
│   │   │   ├── ProtectedRoute.jsx        # Auth guard for student routes
│   │   │   ├── PublicOnlyRoute.jsx       # Redirects authenticated students from login
│   │   │   └── SkillVisualizations.jsx   # SVG gauge, meters, and stat badges
│   │   ├── context/
│   │   │   └── AuthContext.jsx           # Global authentication state & session restoration
│   │   ├── layouts/
│   │   │   └── AppLayout.jsx             # Persistent navigation header & responsive shell
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx         # Central student control center
│   │   │   ├── HomePage.jsx              # Welcome banner & system health status
│   │   │   ├── LoginPage.jsx             # Secure student sign-in
│   │   │   ├── ProfilePage.jsx           # Student profile & target role configuration
│   │   │   ├── RegisterPage.jsx          # Student registration with validation
│   │   │   ├── ResumePage.jsx            # Resume ingestion, deletion & 9-category entity view
│   │   │   ├── RoadmapPage.jsx           # Roadmap studio, stages, modules & progress tracker
│   │   │   └── SkillGapPage.jsx          # Skill gap analysis engine & category visualizations
│   │   ├── App.jsx                       # Client route definitions
│   │   ├── index.css                     # Global design tokens and layout styling
│   │   └── main.jsx                      # React 18 DOM mount point
│   ├── .env.example                      # Template for frontend environment
│   ├── index.html                        # HTML5 document template
│   ├── package.json                      # Client dependencies & build scripts
│   └── vite.config.js                    # Vite bundler configuration
│
├── server/                               # Backend Node.js / Express Service
│   ├── seed/
│   │   ├── jobRolesData.js               # Seed definitions for engineering roles
│   │   ├── taxonomyData.js              # 100+ canonical technical skills with aliases
│   │   └── seeder.js                     # MongoDB database seeder script
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                     # MongoDB connection with retry & lifecycle handlers
│   │   ├── controllers/
│   │   │   ├── authController.js         # Register, login, session validation, logout
│   │   │   ├── profileController.js      # Student profile retrieval & patch operations
│   │   │   ├── resumeController.js       # Ingestion, parsing, AI extraction, deletion
│   │   │   ├── roadmapController.js      # Roadmap generation, retrieval, progress patching
│   │   │   └── skillGapController.js     # Role listings, gap evaluation, past analyses
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js         # JWT verification & tenant user attachment
│   │   │   ├── errorMiddleware.js        # Global error catcher with sanitized responses
│   │   │   ├── uploadMiddleware.js       # Multer memory buffer upload & MIME validation
│   │   │   └── validationMiddleware.js   # Request input sanitation & schema validators
│   │   ├── models/
│   │   │   ├── JobRole.js                # Target role definitions & skill requirements
│   │   │   ├── Resume.js                 # Resume metadata, sanitized text & extracted entities
│   │   │   ├── Roadmap.js                # Personalized roadmap stages, modules & milestones
│   │   │   ├── SkillGapAnalysis.js       # Evaluated matched, partial & missing skills
│   │   │   ├── SkillTaxonomy.js          # Canonical skills, aliases, and category mappings
│   │   │   ├── StudentProfile.js         # Student bio, career target & verified skills
│   │   │   ├── User.js                   # Authentication credentials & hashed passwords
│   │   │   └── index.js                  # Model registry
│   │   ├── routes/
│   │   │   ├── authRoutes.js             # /api/auth endpoints
│   │   │   ├── profileRoutes.js          # /api/profile endpoints
│   │   │   ├── resumeRoutes.js           # /api/resumes endpoints
│   │   │   ├── roadmapRoutes.js          # /api/roadmaps endpoints
│   │   │   └── skillGapRoutes.js         # /api/skill-gap endpoints
│   │   ├── services/
│   │   │   ├── aiExtractionService.js    # Gemini LLM prompt execution & timeout guards
│   │   │   ├── roadmapGenerationService.js # Prerequisite DAG ordering & duration logic
│   │   │   ├── roadmapService.js         # Module enrichment & roadmap persistence
│   │   │   ├── skillMatchingService.js   # Weighted scoring & gap categorization
│   │   │   ├── skillNormalizationService.js # Alias lookup & canonical deduplication
│   │   │   └── textExtractionService.js  # PDF & DOCX text sanitation & word count
│   │   ├── utils/
│   │   │   ├── aiResponseValidator.js    # Schema validation for raw LLM JSON outputs
│   │   │   ├── apiResponse.js            # Standardized API response formatters
│   │   │   ├── textSanitizer.js          # Unicode normalization & regex sanitation
│   │   │   └── tokenUtils.js             # JWT signing & secret verification
│   │   ├── app.js                        # Express application configuration & routing
│   │   └── server.js                     # HTTP listener & process signal handling
│   ├── test/                             # Automated Test Verification Suites
│   │   ├── helpers/
│   │   │   └── resumeFixtures.js         # PDF & DOCX buffer generators for test fixtures
│   │   ├── authProfileTest.js            # Phase 3 test suite (14 tests)
│   │   ├── resumeExtractionTest.js       # Phase 4 test suite (14 tests)
│   │   ├── aiExtractionTest.js           # Phase 5 test suite (8 tests)
│   │   ├── skillGapAnalysisTest.js       # Phase 6 test suite (16 tests)
│   │   ├── roadmapGeneratorTest.js       # Phase 7 test suite (16 tests)
│   │   ├── frontendAuthIntegrationTest.js # Phase 8 test suite (13 tests)
│   │   ├── frontendDashboardIntegrationTest.js # Phase 9 test suite (23 tests)
│   │   └── finalE2EIntegrationTest.js    # Phase 10 comprehensive E2E suite (40 tests)
│   ├── .env.example                      # Server environment template
│   └── package.json                      # Server dependencies & test runner scripts
├── .gitignore                            # Root Git ignore rules (protecting .env and node_modules)
├── package.json                          # Monorepo runner scripts
└── README.md                             # Comprehensive project documentation
```

---

## 7. Prerequisites
1. **Node.js**: `v18.x` or `v20.x` LTS.
2. **npm**: `v9.x` or later.
3. **MongoDB**: Local MongoDB instance running on `mongodb://127.0.0.1:27017` or a MongoDB Atlas URI.
4. **Google Gemini API Key**: Acquired from [Google AI Studio](https://aistudio.google.com/).

---

## 8. Installation

Clone repository and install dependencies across both workspaces:

```bash
# Clone the repository
git clone <repository-url>
cd AI-Career-Roadmap

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

---

## 9. Environment Variables

### Server Configuration (`server/.env`)
Create `server/.env` based on `server/.env.example`:
```ini
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/ai-career-roadmap
CLIENT_URL=http://localhost:5173
NODE_ENV=development

# JWT Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Google Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

### Client Configuration (`client/.env`)
Create `client/.env` based on `client/.env.example`:
```ini
VITE_API_BASE_URL=http://localhost:5000/api
```

> **Security Note:** Never add `GEMINI_API_KEY` or `JWT_SECRET` to `client/.env`. The AI key and token secrets must remain strictly server-side.

---

## 10. MongoDB Setup & Seeding

Ensure MongoDB is running locally or configured in `server/.env`. Seed the canonical skill taxonomy and industry job roles:

```bash
cd server
npm run seed
```
This loads:
- 100+ canonical technical skills across 7 categories (languages, frameworks, databases, tools, devops, soft skills, general concepts) with complete alias mapping dictionaries.
- 5 high-demand engineering job roles with prerequisite mappings and importance weights.

---

## 11. Gemini API Configuration
The system uses the Google Gemini Generative AI SDK (`@google/generative-ai`) configured to `gemini-2.5-flash`.
1. Obtain an API key from Google AI Studio.
2. Set `GEMINI_API_KEY=<your-key>` in `server/.env`.
3. The extraction service executes with `temperature: 0.1` and `responseMimeType: "application/json"` to ensure deterministic entity extraction.
4. Strict JSON validation ensures empty categories are returned as `[]` rather than crashing the system.

---

## 12. How to Start Backend

From `server/` directory:
```bash
# Development mode with live reload
npm run dev

# Standard production startup
npm run start
```
- API Base URL: `http://localhost:5000/api`
- Health Check: `http://localhost:5000/api/health`

---

## 13. How to Start Frontend

From `client/` directory:
```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```
- Client Application: `http://localhost:5173`

---

## 14. API Overview

| Group | Method | Endpoint | Access | Description |
|---|---|---|---|---|
| **Health** | `GET` | `/api/health` | Public | System status, uptime & MongoDB connection state |
| **Auth** | `POST` | `/api/auth/register` | Public | Register student with name, email, password |
| **Auth** | `POST` | `/api/auth/login` | Public | Authenticate student and issue JWT bearer token |
| **Auth** | `GET` | `/api/auth/me` | Private | Retrieve authenticated student identity & session |
| **Auth** | `POST` | `/api/auth/logout` | Private | Invalidate student session |
| **Profile** | `GET` | `/api/profile` | Private | Get student profile, target role & verified skills |
| **Profile** | `PUT` | `/api/profile` | Private | Full update of student profile |
| **Profile** | `PATCH` | `/api/profile` | Private | Partial update (e.g. target job role ID) |
| **Resumes** | `POST` | `/api/resumes/upload` | Private | Upload PDF/DOCX resume & extract sanitized text |
| **Resumes** | `GET` | `/api/resumes` | Private | List all resumes belonging to student |
| **Resumes** | `GET` | `/api/resumes/:id` | Private | Get specific resume with raw text & extracted entities |
| **Resumes** | `POST` | `/api/resumes/:id/extract` | Private | Trigger Gemini AI entity extraction |
| **Resumes** | `DELETE` | `/api/resumes/:id` | Private | Delete resume document and unlink active profile |
| **Skill Gap** | `GET` | `/api/skill-gap/roles` | Private | List available seeded industry job roles |
| **Skill Gap** | `POST` | `/api/skill-gap/analyze` | Private | Run semantic gap analysis between resume and role |
| **Skill Gap** | `GET` | `/api/skill-gap/my` | Private | Retrieve student's past skill-gap evaluations |
| **Skill Gap** | `GET` | `/api/skill-gap/:id` | Private | Retrieve specific analysis by ID |
| **Roadmaps** | `POST` | `/api/roadmaps/generate` | Private | Generate personalized roadmap from analysis ID |
| **Roadmaps** | `GET` | `/api/roadmaps` | Private | Retrieve all roadmaps generated by student |
| **Roadmaps** | `GET` | `/api/roadmaps/:id` | Private | Retrieve roadmap by ID with stages & milestones |
| **Roadmaps** | `PATCH` | `/api/roadmaps/:id/progress` | Private | Update milestone/module progress & recalculate overall |

---

## 15. Application Workflow

1. **Student Onboarding**: Student registers and logs in. JWT token is stored securely in localStorage and attached to all future requests.
2. **Resume Upload**: Student uploads a PDF or Word (.docx) resume. The server extracts clean text and records character/word counts.
3. **AI Entity Extraction**: Google Gemini AI scans the extracted text, classifying skills, languages, frameworks, databases, tools, projects, education, experience, and certifications.
4. **Target Role Selection**: Student selects an active industry role (e.g. *MERN Stack Developer*).
5. **Skill Normalization & Gap Analysis**: Candidate skills are mapped to canonical names, deduplicated, and matched against job requirements. Match %, gap %, and missing skill rankings are persisted.
6. **Roadmap Generation**: Topological sort generates an ordered curriculum of learning stages, modules, verified documentation links, and practical projects.
7. **Interactive Tracking**: Student marks module and milestone progress directly on the dashboard, with completion percentages dynamically updated in MongoDB.

---

## 16. Testing & Quality Assurance

The system includes automated integration and regression test suites across every development phase.

Run all tests:
```bash
cd server
npm test
```

### Individual Test Suites:
```bash
npm run test:auth        # Phase 3: Auth & Profile APIs (14 tests)
npm run test:resume      # Phase 4: Resume Ingestion & Parsing (14 tests)
npm run test:ai          # Phase 5: AI Entity Extraction Service (8 tests)
npm run test:skillgap    # Phase 6: Skill Normalization & Gap Analysis (16 tests)
npm run test:roadmap     # Phase 7: Roadmap Generator & Learning Service (16 tests)
npm run test:frontend   # Phase 8: Frontend Auth & Integration (13 tests)
npm run test:dashboard  # Phase 9: Dashboard & Visualizations (23 tests)
npm run test:e2e        # Phase 10: Complete Final End-to-End Audit (40 tests)
```

**Verification Result**: **100% of tests passed across all suites.**

---

## 17. Security Considerations
- **Password Protection**: Passwords are encrypted using bcrypt with salt rounds of 12.
- **Tenant Isolation**: All database queries for resumes, analyses, and roadmaps strictly verify `userId: req.user._id`, preventing unauthorized cross-user access.
- **Server-Side API Key Storage**: The Gemini API key is accessed exclusively server-side. No client bundle or API response exposes the key.
- **Input Sanitation & Error Handling**: File upload extensions are strictly checked (.pdf and .docx only). Corrupted files and invalid JSON formats return sanitized HTTP errors without leaking server stack traces.

---

## 18. Known Limitations
1. **External LLM Service Dependency**: AI entity extraction requires active internet connectivity and valid Google Gemini API quotas.
2. **Initial Taxonomy Coverage**: Skill normalization and gap analysis are scoped to the seeded canonical skills (~100 skills) and 5 pre-configured roles.
3. **Local Development Host**: The platform is configured for local development and demonstration (`localhost:5000` / `localhost:5173`). Production cloud infrastructure (load balancers, CDN, container clusters) is left for future deployment.

---

## 19. Future Improvements (Future Work)
- **Taxonomy Expansion**: Automated web scrapers to expand the skill taxonomy to 1,000+ specialized technical and non-technical domains.
- **Multi-Model LLM Fallback**: Automatic failover to secondary LLM providers (e.g. Anthropic Claude, OpenAI GPT-4o) if Gemini encounters quota limits.
- **Peer & Mentor Matching**: Recommending study groups or alumni mentors based on overlapping roadmap stages.
- **Automated Resume Tailoring**: LLM suggestions for optimizing resume wording to improve match scores for specific job postings.
- **Production CI/CD Pipelines**: Automated GitHub Actions workflow with Docker image compilation and Kubernetes Helm charts.
