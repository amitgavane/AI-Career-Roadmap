/**
 * Deterministic Skill Knowledge Catalog & Curriculum Generator
 * 
 * Provides structured learning objectives, curated topics, practical tasks,
 * official documentation resources, and milestone project blueprints.
 */

export const SKILL_KNOWLEDGE_BASE = {
  JavaScript: {
    objective: 'Master core JavaScript language mechanics, asynchronous programming, modern ES6+ syntax, and DOM manipulation.',
    prerequisites: ['HTML5', 'CSS3'],
    topics: [
      'Scope, Closures, Execution Context, and Hoisting',
      'Prototypes, Inheritance, and ES6+ Class Syntax',
      'Asynchronous JavaScript: Event Loop, Promises, and Async/Await',
      'Modern ES6+ Features: Destructuring, Modules, Rest/Spread, and Array Utilities',
    ],
    practiceTasks: [
      'Implement a custom Promise polyfill or async task queue with concurrency limits',
      'Build an interactive browser dashboard using vanilla JavaScript and DOM events without frameworks',
    ],
    resources: [
      {
        title: 'MDN Web Docs: JavaScript Guide',
        type: 'documentation',
        platform: 'MDN Web Docs',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
        isFree: true,
      },
      {
        title: 'JavaScript.info: The Modern JavaScript Tutorial',
        type: 'tutorial',
        platform: 'javascript.info',
        url: 'https://javascript.info/',
        isFree: true,
      },
    ],
    baseHours: 14,
  },
  TypeScript: {
    objective: 'Gain proficiency in static type systems, interfaces, generics, utility types, and TypeScript configuration.',
    prerequisites: ['JavaScript'],
    topics: [
      'Type Annotations, Primitive Types, Union & Intersection Types',
      'Interfaces, Type Aliases, and Object Type Modeling',
      'Generics, Constraints, and Conditional Types',
      'tsconfig Compiler Options, Declaration Files, and Strict Mode Setup',
    ],
    practiceTasks: [
      'Refactor an existing JavaScript module to strict TypeScript with complete type safety',
      'Create reusable generic utility functions for deep object cloning and validation',
    ],
    resources: [
      {
        title: 'TypeScript Official Handbook',
        type: 'official_docs',
        platform: 'typescriptlang.org',
        url: 'https://www.typescriptlang.org/docs/handbook/intro.html',
        isFree: true,
      },
      {
        title: 'Total TypeScript Core Essentials',
        type: 'interactive_tutorial',
        platform: 'totaltypescript.com',
        url: 'https://www.totaltypescript.com/tutorials',
        isFree: true,
      },
    ],
    baseHours: 12,
  },
  React: {
    objective: 'Build scalable, interactive single-page web applications using React components, hooks, state management, and routing.',
    prerequisites: ['JavaScript', 'HTML5', 'CSS3'],
    topics: [
      'Component Architecture, JSX, Props, and Pure Rendering',
      'State Management: useState, useReducer, and Custom Hooks',
      'Side Effects and Lifecycle Management with useEffect and useLayoutEffect',
      'React Router, Code Splitting, and Performance Optimization with useMemo & useCallback',
    ],
    practiceTasks: [
      'Build a multi-page e-commerce catalog with client-side routing, filtering, and cart state',
      'Develop custom hooks for debounced API queries, localStorage sync, and window resizing',
    ],
    resources: [
      {
        title: 'React Official Documentation & Interactive Guide',
        type: 'official_docs',
        platform: 'react.dev',
        url: 'https://react.dev/learn',
        isFree: true,
      },
      {
        title: 'React Router Documentation',
        type: 'documentation',
        platform: 'reactrouter.com',
        url: 'https://reactrouter.com/en/main',
        isFree: true,
      },
    ],
    baseHours: 16,
  },
  'Node.js': {
    objective: 'Understand Node.js asynchronous runtime, event loop, file system, streams, and server-side JavaScript architecture.',
    prerequisites: ['JavaScript'],
    topics: [
      'Node.js Architecture: V8 Engine, libuv, and the Non-blocking Event Loop',
      'Core Modules: fs, path, events, http, and stream pipelines',
      'Package Management: npm/yarn, package.json scripts, and semantic versioning',
      'Buffer Manipulation, Process Management, and Environment Configurations',
    ],
    practiceTasks: [
      'Create a command-line tool that streams and transforms large log files line-by-line',
      'Construct a minimal HTTP server using the built-in node:http module with routing',
    ],
    resources: [
      {
        title: 'Node.js Official Documentation & Guides',
        type: 'official_docs',
        platform: 'nodejs.org',
        url: 'https://nodejs.org/en/docs/guides',
        isFree: true,
      },
      {
        title: 'Node.js Learning Path on MDN',
        type: 'documentation',
        platform: 'MDN Web Docs',
        url: 'https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/Introduction',
        isFree: true,
      },
    ],
    baseHours: 12,
  },
  Express: {
    objective: 'Design and build resilient, production-ready RESTful APIs using Express.js middleware and router architectures.',
    prerequisites: ['Node.js', 'JavaScript'],
    topics: [
      'Express Router, Request Lifecycle, and Nested Route Handlers',
      'Middleware Pipelines: Body Parsers, CORS, Authentication, and Custom Middleware',
      'Error Handling, Async Error Wrappers, and HTTP Status Codes',
      'API Security Best Practices: Helmet, Rate Limiting, and Input Sanitization',
    ],
    practiceTasks: [
      'Build a robust RESTful API with CRUD endpoints, authentication guards, and validation',
      'Implement centralized error handling middleware with structured JSON error responses',
    ],
    resources: [
      {
        title: 'Express.js Official Guide',
        type: 'official_docs',
        platform: 'expressjs.com',
        url: 'https://expressjs.com/en/guide/routing.html',
        isFree: true,
      },
      {
        title: 'REST API Best Practices Guide',
        type: 'article',
        platform: 'restfulapi.net',
        url: 'https://restfulapi.net/',
        isFree: true,
      },
    ],
    baseHours: 12,
  },
  MongoDB: {
    objective: 'Model non-relational document databases, write complex aggregation pipelines, and optimize queries using indexing.',
    prerequisites: ['JavaScript'],
    topics: [
      'BSON Document Data Modeling, Schemas, and Embedding vs Referencing',
      'CRUD Operations, Query Operators, and Projection',
      'Aggregation Framework: $match, $group, $lookup, $project, and $facet',
      'Indexing Strategies: Compound, Text, Unique indexes, and Query Profiling with explain()',
    ],
    practiceTasks: [
      'Design an e-commerce data model with products, embedded reviews, and referenced user orders',
      'Write an aggregation pipeline computing monthly revenue metrics grouped by category',
    ],
    resources: [
      {
        title: 'MongoDB University: MongoDB Basics & Data Modeling',
        type: 'course',
        platform: 'learn.mongodb.com',
        url: 'https://learn.mongodb.com/',
        isFree: true,
      },
      {
        title: 'MongoDB Manual: Aggregation Pipeline Operators',
        type: 'official_docs',
        platform: 'mongodb.com',
        url: 'https://www.mongodb.com/docs/manual/core/aggregation-pipeline/',
        isFree: true,
      },
    ],
    baseHours: 12,
  },
  PostgreSQL: {
    objective: 'Design normalized relational schemas, write high-performance SQL queries, and enforce relational data integrity.',
    prerequisites: ['SQL'],
    topics: [
      'Relational Schema Design: 3NF Normalization, Primary/Foreign Keys, and Constraints',
      'Advanced SQL: Window Functions, Common Table Expressions (CTEs), Subqueries',
      'ACID Transactions, Isolation Levels, and Row-Level Locking',
      'PostgreSQL Indexing: B-Tree, GIN, GiST, EXPLAIN ANALYZE, and Query Tuning',
    ],
    practiceTasks: [
      'Design a normalized banking ledger schema with transactional money transfer stored procedures',
      'Optimize a slow multi-table join using EXPLAIN ANALYZE and composite B-Tree indexes',
    ],
    resources: [
      {
        title: 'PostgreSQL Official Documentation',
        type: 'official_docs',
        platform: 'postgresql.org',
        url: 'https://www.postgresql.org/docs/current/',
        isFree: true,
      },
      {
        title: 'PostgreSQL Tutorial: SQL & Database Administration',
        type: 'tutorial',
        platform: 'postgresqltutorial.com',
        url: 'https://www.postgresqltutorial.com/',
        isFree: true,
      },
    ],
    baseHours: 14,
  },
  SQL: {
    objective: 'Gain strong command over relational data query language, relational algebra, joins, and aggregations.',
    prerequisites: [],
    topics: [
      'SELECT Queries, Filtering with WHERE, LIKE, IN, and BETWEEN',
      'Table Joins: INNER, LEFT, RIGHT, FULL OUTER, and CROSS JOINs',
      'Group By, HAVING, Aggregate Functions (COUNT, SUM, AVG, MIN, MAX)',
      'Data Manipulation: INSERT, UPDATE, DELETE, and Basic DDL Statements',
    ],
    practiceTasks: [
      'Solve 15 relational query challenges involving complex multi-table joins and aggregation',
      'Build a schema with foreign key cascading rules and check constraints',
    ],
    resources: [
      {
        title: 'SQLBolt: Interactive SQL Tutorials',
        type: 'interactive_tutorial',
        platform: 'sqlbolt.com',
        url: 'https://sqlbolt.com/',
        isFree: true,
      },
      {
        title: 'W3Schools SQL Tutorial & Reference',
        type: 'documentation',
        platform: 'w3schools.com',
        url: 'https://www.w3schools.com/sql/',
        isFree: true,
      },
    ],
    baseHours: 10,
  },
  Python: {
    objective: 'Master Python syntax, object-oriented concepts, functional paradigms, standard library, and package ecosystem.',
    prerequisites: [],
    topics: [
      'Python Data Structures: Lists, Tuples, Dictionaries, Sets, and Comprehensions',
      'OOP in Python: Classes, Inheritance, Magic Methods (__repr__, __init__)',
      'Generators, Decorators, Iterators, and Context Managers',
      'Virtual Environments, pip, poetry, and Standard Library modules (os, sys, json, math)',
    ],
    practiceTasks: [
      'Write a CLI application using argparse that downloads and parses public JSON APIs',
      'Implement custom decorators for execution timing and function argument caching',
    ],
    resources: [
      {
        title: 'Python Official Tutorial & Documentation',
        type: 'official_docs',
        platform: 'python.org',
        url: 'https://docs.python.org/3/tutorial/',
        isFree: true,
      },
      {
        title: 'Real Python: Python Basics & Tutorials',
        type: 'tutorial',
        platform: 'realpython.com',
        url: 'https://realpython.com/',
        isFree: true,
      },
    ],
    baseHours: 14,
  },
  FastAPI: {
    objective: 'Develop high-performance asynchronous web APIs with Python using FastAPI, Pydantic, and Starlette.',
    prerequisites: ['Python'],
    topics: [
      'FastAPI Routing, Path Parameters, and Query Parameters',
      'Data Validation and Serialization using Pydantic Models',
      'Dependency Injection System and Authentication Guards',
      'Async/Await Handlers, Background Tasks, and Automatic OpenAPI/Swagger Documentation',
    ],
    practiceTasks: [
      'Build a RESTful task management API with JWT OAuth2 authentication and Pydantic validation',
      'Implement an async background notification worker with FastAPI BackgroundTasks',
    ],
    resources: [
      {
        title: 'FastAPI Official Documentation',
        type: 'official_docs',
        platform: 'fastapi.tiangolo.com',
        url: 'https://fastapi.tiangolo.com/tutorial/',
        isFree: true,
      },
      {
        title: 'Pydantic Documentation',
        type: 'documentation',
        platform: 'docs.pydantic.dev',
        url: 'https://docs.pydantic.dev/latest/',
        isFree: true,
      },
    ],
    baseHours: 12,
  },
  Docker: {
    objective: 'Containerize multi-tier applications, manage multi-stage Dockerfiles, and orchestrate environments with Docker Compose.',
    prerequisites: ['Linux'],
    topics: [
      'Containers vs Virtual Machines, Image Layers, and the Docker Daemon',
      'Writing Optimized Dockerfiles with Multi-stage Builds and Caching',
      'Container Networking, Volume Bindings, and Persistent Data Storage',
      'Docker Compose: Multi-container Orchestration for Frontend, Backend, and Database',
    ],
    practiceTasks: [
      'Dockerize a full-stack web application with minimal Alpine-based multi-stage builds',
      'Write a docker-compose.yml file managing backend, database with persistent volume, and redis cache',
    ],
    resources: [
      {
        title: 'Docker Official Get Started Guide',
        type: 'official_docs',
        platform: 'docker.com',
        url: 'https://docs.docker.com/get-started/',
        isFree: true,
      },
      {
        title: 'Docker Curriculum by Prakhar Srivastav',
        type: 'tutorial',
        platform: 'docker-curriculum.com',
        url: 'https://docker-curriculum.com/',
        isFree: true,
      },
    ],
    baseHours: 10,
  },
  Git: {
    objective: 'Master distributed version control, branching workflows, pull requests, rebasing, and merge conflict resolution.',
    prerequisites: [],
    topics: [
      'Git Internals: Working Directory, Staging Area, Commits, and Commit Tree',
      'Branching Strategies: Feature Branching, Gitflow, and Trunk-based Development',
      'Rebase vs Merge, Cherry-pick, Stash, and Resolving Merge Conflicts',
      'Remote Collaboration: Remotes, Fetch, Pull, Push, and GitHub Pull Requests',
    ],
    practiceTasks: [
      'Simulate and resolve a complex merge conflict across two feature branches',
      'Practice interactive rebase (git rebase -i) to squash and rewrite commit history cleanly',
    ],
    resources: [
      {
        title: 'Pro Git Book (Official Free Book)',
        type: 'book',
        platform: 'git-scm.com',
        url: 'https://git-scm.com/book/en/v2',
        isFree: true,
      },
      {
        title: 'Learn Git Branching (Interactive Visualizer)',
        type: 'interactive_tutorial',
        platform: 'learngitbranching.js.org',
        url: 'https://learngitbranching.js.org/',
        isFree: true,
      },
    ],
    baseHours: 8,
  },
  'REST APIs': {
    objective: 'Design clean, predictable, and compliant RESTful API interfaces adhering to HTTP specifications and best practices.',
    prerequisites: ['Node.js', 'JavaScript'],
    topics: [
      'HTTP Methods (GET, POST, PUT, PATCH, DELETE) and Semantic Status Codes',
      'REST Resource URI Design, Plural Naming, and Hierarchical Endpoints',
      'Pagination, Filtering, Sorting, and Partial Field Selection Strategies',
      'API Security: Authentication (Bearer Tokens), Rate Limiting, and CORS Policies',
    ],
    practiceTasks: [
      'Draft an OpenAPI / Swagger 3.0 specification for a university portal API',
      'Implement cursor-based pagination and sorting on a collection endpoint',
    ],
    resources: [
      {
        title: 'RESTful API Guidelines by Zalando',
        type: 'documentation',
        platform: 'opensource.zalando.com',
        url: 'https://opensource.zalando.com/restful-api-guidelines/',
        isFree: true,
      },
      {
        title: 'MDN HTTP Overview',
        type: 'documentation',
        platform: 'MDN Web Docs',
        url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview',
        isFree: true,
      },
    ],
    baseHours: 8,
  },
  Redux: {
    objective: 'Manage predictable global application state using Redux Toolkit, slices, thunks, and selectors.',
    prerequisites: ['React', 'JavaScript'],
    topics: [
      'Predictable State Container: Actions, Reducers, and the Unidirectional Data Flow',
      'Redux Toolkit (RTK): createSlice, configureStore, and Immer Integration',
      'Asynchronous State with createAsyncThunk and ExtraReducers',
      'RTK Query: Declarative Data Fetching, Caching, and Optimistic Updates',
    ],
    practiceTasks: [
      'Refactor a complex React app to manage user sessions and global cart with Redux Toolkit',
      'Implement an async thunk that fetches API data and handles pending/fulfilled/rejected states',
    ],
    resources: [
      {
        title: 'Redux Toolkit Official Quick Start',
        type: 'official_docs',
        platform: 'redux-toolkit.js.org',
        url: 'https://redux-toolkit.js.org/introduction/getting-started',
        isFree: true,
      },
    ],
    baseHours: 10,
  },
  HTML5: {
    objective: 'Structure accessible, semantic web content compliant with modern W3C standards.',
    prerequisites: [],
    topics: [
      'Semantic Tags: header, nav, main, article, section, footer, and aside',
      'Forms, Inputs, Types, Validation Attributes, and FormData',
      'Web Accessibility (A11y): ARIA Roles, Landmarks, and Screen Reader Support',
      'SEO Best Practices, OpenGraph Metadata, and Document Outline',
    ],
    practiceTasks: [
      'Build a fully semantic and accessible multi-section corporate landing page',
      'Create a comprehensive accessible form with custom validations and ARIA attributes',
    ],
    resources: [
      {
        title: 'MDN Web Docs: HTML Elements Reference',
        type: 'official_docs',
        platform: 'MDN Web Docs',
        url: 'https://developer.mozilla.org/en-US/docs/Web/HTML',
        isFree: true,
      },
    ],
    baseHours: 8,
  },
  CSS3: {
    objective: 'Design responsive, modern layouts using CSS Flexbox, Grid, custom properties, and animations.',
    prerequisites: ['HTML5'],
    topics: [
      'Box Model, Specificity, Inheritance, and CSS Reset/Normalize',
      'CSS Flexbox for 1D Layouts and Alignment',
      'CSS Grid for 2D Responsive Page Layouts',
      'Media Queries, Mobile-First Design, CSS Variables, and Smooth Transitions',
    ],
    practiceTasks: [
      'Build a responsive grid portfolio layout that smoothly adapts to mobile, tablet, and desktop',
      'Create CSS-only micro-animations for buttons, cards, and modal dialogs',
    ],
    resources: [
      {
        title: 'MDN Web Docs: CSS Reference & Modules',
        type: 'official_docs',
        platform: 'MDN Web Docs',
        url: 'https://developer.mozilla.org/en-US/docs/Web/CSS',
        isFree: true,
      },
      {
        title: 'CSS-Tricks: A Complete Guide to Flexbox & Grid',
        type: 'tutorial',
        platform: 'css-tricks.com',
        url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/',
        isFree: true,
      },
    ],
    baseHours: 10,
  },
  Postman: {
    objective: 'Test, document, and automate RESTful API endpoints using Postman collections and tests.',
    prerequisites: ['REST APIs'],
    topics: [
      'Creating Requests, Headers, Query Params, and Request Bodies',
      'Environment Variables, Collection Variables, and Dynamic Token Propagation',
      'Writing JavaScript Tests for Status Codes, Response Schemas, and Timings',
      'Exporting Postman Collections and Automated CLI Runs via Newman',
    ],
    practiceTasks: [
      'Create a Postman test suite that automatically extracts a login JWT and tests 5 authenticated routes',
    ],
    resources: [
      {
        title: 'Postman Learning Center',
        type: 'official_docs',
        platform: 'learning.postman.com',
        url: 'https://learning.postman.com/docs/getting-started/introduction/',
        isFree: true,
      },
    ],
    baseHours: 6,
  },
};

/**
 * Deterministic fallback prerequisite catalog to augment database taxonomy
 */
export const FALLBACK_PREREQUISITES = {
  JavaScript: ['HTML5', 'CSS3'],
  TypeScript: ['JavaScript'],
  React: ['JavaScript', 'HTML5', 'CSS3'],
  'Node.js': ['JavaScript'],
  Express: ['Node.js', 'JavaScript'],
  Redux: ['React', 'JavaScript'],
  'Next.js': ['React', 'Node.js'],
  MongoDB: ['JavaScript'],
  Mongoose: ['MongoDB', 'Node.js'],
  PostgreSQL: ['SQL'],
  MySQL: ['SQL'],
  FastAPI: ['Python'],
  Django: ['Python'],
  Flask: ['Python'],
  Docker: ['Linux'],
  Kubernetes: ['Docker'],
  'CI/CD': ['Git'],
  CSS3: ['HTML5'],
  'Tailwind CSS': ['CSS3', 'HTML5'],
  'REST APIs': ['Node.js', 'JavaScript'],
  GraphQL: ['JavaScript', 'REST APIs'],
};

/**
 * Returns curriculum metadata for any skill, dynamically falling back
 * to a sensible deterministic curriculum for uncataloged skills.
 */
export const getSkillCurriculum = (skillName, category = 'Other', weight = 3, isPartial = false) => {
  const catalogEntry = SKILL_KNOWLEDGE_BASE[skillName];
  if (catalogEntry) {
    const hoursMultiplier = isPartial ? 0.5 : 1.0;
    const finalHours = Math.max(4, Math.round(catalogEntry.baseHours * hoursMultiplier));

    return {
      skill: skillName,
      title: `${isPartial ? 'Reinforce & Bridge' : 'Master'} ${skillName}`,
      objective: isPartial
        ? `Bridge gaps and reinforce advanced proficiency in ${skillName}, building on existing foundational familiarity.`
        : catalogEntry.objective,
      description: isPartial
        ? `Targeted learning path focusing on deep-dive topics and production-grade mastery of ${skillName}.`
        : `Comprehensive foundation and practical hands-on module covering ${skillName}.`,
      prerequisites: catalogEntry.prerequisites || [],
      topics: catalogEntry.topics,
      practiceTasks: catalogEntry.practiceTasks,
      resources: catalogEntry.resources,
      estimatedHours: finalHours,
    };
  }

  // Fallback for custom or uncataloged skills
  const normalizedCategory = category || 'Other';
  const hoursMultiplier = isPartial ? 0.5 : 1.0;
  const baseHours = Math.max(4, Math.round((weight * 2.5 + 4) * hoursMultiplier));

  return {
    skill: skillName,
    title: `${isPartial ? 'Reinforce & Bridge' : 'Learn'} ${skillName}`,
    objective: `${isPartial ? 'Solidify and extend' : 'Master core concepts and practical application of'} ${skillName} in modern software engineering.`,
    description: `Targeted learning module for ${skillName} (${normalizedCategory}) to meet job role requirements.`,
    prerequisites: FALLBACK_PREREQUISITES[skillName] || [],
    topics: [
      `Foundational Architecture & Core Mechanics of ${skillName}`,
      `Practical Implementation and Best Practices with ${skillName}`,
      `Integration with Surrounding Frameworks and Ecosystems`,
      `Debugging, Testing, and Production Optimization for ${skillName}`,
    ],
    practiceTasks: [
      `Build a standalone demonstration project implementing key features of ${skillName}`,
      `Integrate ${skillName} into a production-style application workflow with test coverage`,
    ],
    resources: [
      {
        title: `${skillName} Official Documentation & Developer Guide`,
        type: 'official_docs',
        platform: 'Official Portal',
        url: `https://devdocs.io/#q=${encodeURIComponent(skillName)}`,
        isFree: true,
      },
      {
        title: `Comprehensive Guide to ${skillName}`,
        type: 'documentation',
        platform: 'Developer Knowledge Network',
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(skillName)}`,
        isFree: true,
      },
    ],
    estimatedHours: baseHours,
  };
};

/**
 * Generates practical milestone projects tailored to the skills covered in a milestone.
 */
export const buildMilestoneProject = (milestoneNumber, skillsCovered = [], jobRoleTitle = 'Software Engineer') => {
  const skillsList = skillsCovered.length > 0 ? skillsCovered : ['Software Engineering Principles'];
  const skillsJoined = skillsList.join(', ');

  if (milestoneNumber === 1) {
    return {
      title: `Milestone 1 Project: ${skillsList.slice(0, 2).join(' & ')} Core Service`,
      description: `Build a functional, test-driven application consolidating ${skillsJoined}. Demonstrate architectural cleanliness and separation of concerns.`,
      skillsCovered: skillsList,
      skillsPracticed: skillsList,
      deliverables: [
        'Complete Git repository with clean commit history',
        'Functional implementation matching technical specification',
        'Unit tests covering core business logic and edge cases',
        'README with local setup instructions and architectural diagram',
      ],
      expectedDeliverable: `Git repository with test-covered implementation of ${skillsJoined}`,
      estimatedHours: 12,
      difficulty: 'beginner',
    };
  }

  if (milestoneNumber === 2) {
    return {
      title: `Milestone 2 Project: Integrated Multi-Tier System`,
      description: `Design and construct a multi-tier service applying ${skillsJoined}. Implement resilient data flow, error handling, and robust integration tests.`,
      skillsCovered: skillsList,
      skillsPracticed: skillsList,
      deliverables: [
        'Multi-tier application repository with comprehensive environment configuration',
        'Integration test suite verifying end-to-end user workflows',
        'Interactive API documentation or interface demonstration',
        'Performance benchmark report verifying response latency',
      ],
      expectedDeliverable: `Production-ready multi-tier system exercising ${skillsJoined}`,
      estimatedHours: 16,
      difficulty: 'intermediate',
    };
  }

  return {
    title: `Milestone ${milestoneNumber} Capstone: Production ${jobRoleTitle} System`,
    description: `Architect and deploy an enterprise-grade capstone project integrating all milestone competencies: ${skillsJoined}. Emphasize security, scalability, and deployment readiness.`,
    skillsCovered: skillsList,
    skillsPracticed: skillsList,
    deliverables: [
      'Full-stack or end-to-end repository with automated CI/CD checks',
      'Containerized deployment configuration (Docker / Docker Compose)',
      'Security audit report addressing authentication, authorization, and rate limiting',
      'Comprehensive technical documentation and live demo link',
    ],
    expectedDeliverable: `Containerized capstone platform validating readiness for ${jobRoleTitle}`,
    estimatedHours: 20,
    difficulty: 'advanced',
  };
};
