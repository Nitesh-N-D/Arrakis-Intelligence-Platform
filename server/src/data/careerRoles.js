/**
 * Arrakis career catalogue — single source of truth.
 *
 * This file is mirrored byte-for-byte at client/src/data/careerRoles.js.
 * The server copy is authoritative: every career ID, skill and priority that
 * arrives from a browser is re-resolved against this file before it is stored
 * or analysed. A parity test (client/test/careerCatalogue.test.js) fails if the
 * two copies drift.
 *
 * Design rules (see docs/CAREER_INTELLIGENCE.md):
 *  - IDs are stable kebab-case strings. Never rename an ID; add an alias instead.
 *  - Every skill carries a `why` explaining its relevance, so no requirement is arbitrary.
 *  - Priorities: core (essential to do the job), important (expected by most teams),
 *    supporting (differentiating / adjacent). Weights are derived, not hand-tuned,
 *    except for the two legacy roles whose original weights are preserved.
 *  - `minLevel` is the expected proficiency on a 1–5 scale for a working practitioner:
 *    1 Awareness · 2 Beginner · 3 Intermediate · 4 Advanced · 5 Expert.
 *  - The catalogue is a starting point, not a list of standardised occupations.
 *    Users can always define a custom role.
 */

export const CAREER_CATALOGUE_VERSION = "2026.11.1";

export const PROFICIENCY_LEVELS = [
  { level: 1, label: "Awareness" },
  { level: 2, label: "Beginner" },
  { level: 3, label: "Intermediate" },
  { level: 4, label: "Advanced" },
  { level: 5, label: "Expert" }
];

/** Self-assessed experience and preferred learning depth use the four user-facing levels. */
export const EXPERIENCE_LEVELS = [
  { id: "beginner", label: "Beginner", level: 2, description: "New to this field or changing careers." },
  { id: "intermediate", label: "Intermediate", level: 3, description: "Can deliver work with occasional guidance." },
  { id: "advanced", label: "Advanced", level: 4, description: "Delivers independently and reviews others." },
  { id: "expert", label: "Expert", level: 5, description: "Sets direction and solves novel problems." }
];

export const TIMELINE_OPTIONS = [
  { months: 3, label: "3 months" },
  { months: 6, label: "6 months" },
  { months: 12, label: "12 months" },
  { months: 24, label: "2 years" }
];

export const PRIORITY_WEIGHTS = { core: 3, important: 2, supporting: 1 };
export const DEFAULT_MIN_LEVEL = { core: 4, important: 3, supporting: 3 };

export const CAREER_CATEGORIES = [
  { id: "software-engineering", name: "Software Engineering" },
  { id: "ai-ml", name: "AI & Machine Learning" },
  { id: "data", name: "Data Engineering" },
  { id: "cloud-devops", name: "Cloud & DevOps" },
  { id: "cybersecurity", name: "Cybersecurity" },
  { id: "product-design", name: "Product & Design" },
  { id: "engineering-leadership", name: "Engineering Leadership" },
  { id: "research", name: "Research" },
  { id: "business", name: "Business & Entrepreneurship" },
  { id: "education", name: "Education" },
  { id: "other", name: "Other" }
];

const doc = (title, url) => ({ title, url });

/**
 * Skill library. Keys are stable skill IDs.
 * difficulty drives suggested duration (easy 2w · medium 4w · hard 6w).
 */
export const SKILL_LIBRARY = {
  "javascript": { aliases: ["JS", "ECMAScript"], name: "JavaScript", difficulty: "medium", why: "The language of the web platform and of Node.js tooling.", resources: [doc("MDN JavaScript Guide", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide")], project: "Build a small interactive app without a framework." },
  "typescript": { aliases: ["TS"], name: "TypeScript", difficulty: "medium", why: "Static types reduce defects in large shared codebases.", resources: [doc("TypeScript Handbook", "https://www.typescriptlang.org/docs/handbook/intro.html")], project: "Convert an existing JavaScript module to strict TypeScript." },
  "html-css": { aliases: ["HTML", "CSS"], name: "HTML & CSS", difficulty: "easy", why: "Semantic markup and layout are the foundation of every interface.", resources: [doc("MDN Learn web development", "https://developer.mozilla.org/en-US/docs/Learn_web_development")], project: "Build a responsive, accessible landing page from 320px to 1920px." },
  "react": { aliases: ["React.js", "ReactJS"], name: "React", difficulty: "medium", why: "The most widely used component model for production web interfaces.", resources: [doc("react.dev — Learn", "https://react.dev/learn")], project: "Build a data-driven dashboard with routing and loading states." },
  "nodejs": { aliases: ["Node", "NodeJS", "Node JS"], name: "Node.js", difficulty: "medium", why: "Runs JavaScript on the server; the basis of many API backends.", resources: [doc("Node.js Learn", "https://nodejs.org/en/learn")], project: "Write a CLI or HTTP service with graceful shutdown and tests." },
  "express": { name: "Express", difficulty: "easy", why: "Minimal, widely deployed HTTP framework for Node.js APIs.", resources: [doc("Express guide", "https://expressjs.com/en/guide/routing.html")], project: "Build a REST API with validation and error middleware." },
  "rest-apis": { name: "REST APIs", difficulty: "medium", why: "Most systems integrate through HTTP resource APIs.", resources: [doc("MDN HTTP overview", "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview")], project: "Design and document a versioned API with consistent errors." },
  "mongodb": { name: "MongoDB", difficulty: "medium", why: "A common document database for product backends.", resources: [doc("MongoDB Manual", "https://www.mongodb.com/docs/manual/")], project: "Model a feature with indexes and a transaction." },
  "sql": { name: "SQL", difficulty: "medium", why: "Relational data and querying underpin most business systems.", resources: [doc("PostgreSQL Tutorial", "https://www.postgresql.org/docs/current/tutorial.html")], project: "Design a normalised schema and write analytical queries." },
  "authentication": { name: "Authentication", difficulty: "hard", why: "Every real service must identify users safely.", resources: [doc("OWASP Authentication Cheat Sheet", "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html")], project: "Implement sessions or JWT with refresh rotation and logout." },
  "testing": { name: "Testing", difficulty: "medium", why: "Automated tests make change safe and reviewable.", resources: [doc("Node.js test runner", "https://nodejs.org/api/test.html")], project: "Add unit and integration tests to an untested module." },
  "caching": { name: "Caching", difficulty: "medium", why: "Caching controls latency and cost at scale.", resources: [doc("MDN HTTP caching", "https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching")], project: "Add a cache layer with explicit invalidation to an API." },
  "system-design": { name: "System Design", difficulty: "hard", why: "Senior engineers are expected to reason about scale, failure and trade-offs.", resources: [], project: "Write a design document for a service, including failure modes." },
  "deployment": { name: "Deployment", difficulty: "medium", why: "Shipping reliably is part of the job, not an afterthought.", resources: [], project: "Deploy a service with environment config and a rollback plan." },
  "security": { name: "Security", difficulty: "hard", why: "Secure defaults prevent incidents that harm users.", resources: [doc("OWASP Top 10", "https://owasp.org/www-project-top-ten/")], project: "Threat-model a feature and fix the top findings." },
  "git": { name: "Git", difficulty: "easy", why: "Version control is how teams collaborate on code.", resources: [doc("Pro Git book", "https://git-scm.com/book/en/v2")], project: "Maintain a project with branches, reviews and a clean history." },
  "data-structures": { aliases: ["DSA", "Algorithms", "Data Structures"], name: "Data Structures & Algorithms", difficulty: "hard", why: "Choosing the right structure determines correctness and performance.", resources: [], project: "Implement and benchmark three structures for one real problem." },
  "accessibility": { name: "Accessibility", difficulty: "medium", why: "Interfaces must work for keyboard, screen-reader and low-vision users.", resources: [doc("WAI — Accessibility fundamentals", "https://www.w3.org/WAI/fundamentals/")], project: "Audit a page with a screen reader and fix every blocker." },
  "web-performance": { name: "Web Performance", difficulty: "medium", why: "Load and interaction speed directly affect usability.", resources: [doc("web.dev Performance", "https://web.dev/learn/performance")], project: "Measure and improve Core Web Vitals on a real page." },
  "java": { name: "Java", difficulty: "medium", why: "Dominant language for enterprise and Android backends.", resources: [doc("Dev.java Learn", "https://dev.java/learn/")], project: "Build a service with clear package boundaries and tests." },
  "spring": { aliases: ["Spring"], name: "Spring Boot", difficulty: "medium", why: "The standard Java framework for production services.", resources: [doc("Spring guides", "https://spring.io/guides")], project: "Build a Spring Boot API with persistence and security." },
  "python": { name: "Python", difficulty: "easy", why: "The primary language for data, ML and automation.", resources: [doc("Python Tutorial", "https://docs.python.org/3/tutorial/")], project: "Automate a real workflow with a tested Python package." },
  "mobile-ui": { name: "Mobile UI", difficulty: "medium", why: "Mobile apps have distinct navigation, input and lifecycle patterns.", resources: [], project: "Ship a multi-screen app with offline state." },
  "kotlin": { name: "Kotlin", difficulty: "medium", why: "Google's preferred language for Android.", resources: [doc("Kotlin docs", "https://kotlinlang.org/docs/home.html")], project: "Build an Android feature with coroutines." },
  "android": { name: "Android SDK", difficulty: "medium", why: "Platform APIs, lifecycle and Jetpack libraries.", resources: [doc("Android Developers", "https://developer.android.com/courses")], project: "Publish an internal-test build with a background job." },
  "swift": { name: "Swift", difficulty: "medium", why: "The primary language for Apple platforms.", resources: [doc("The Swift Programming Language", "https://docs.swift.org/swift-book/")], project: "Build a SwiftUI app with persistence." },
  "ios": { name: "iOS SDK", difficulty: "medium", why: "Platform frameworks, lifecycle and App Store constraints.", resources: [doc("Apple Developer Documentation", "https://developer.apple.com/documentation/")], project: "Ship a TestFlight build with push-safe permissions." },
  "react-native": { name: "Cross-platform Mobile", difficulty: "medium", why: "Many teams ship one codebase to both mobile platforms.", resources: [doc("React Native docs", "https://reactnative.dev/docs/getting-started")], project: "Build one app that runs on Android and iOS." },
  "linux": { name: "Linux", difficulty: "medium", why: "Most servers and containers run Linux.", resources: [], project: "Operate a Linux VM: users, services, logs and permissions." },
  "operating-systems": { name: "Operating Systems", difficulty: "hard", why: "Processes, memory and I/O explain how software really runs.", resources: [], project: "Profile a program and explain its CPU and memory behaviour." },
  "networking": { name: "Networking", difficulty: "medium", why: "DNS, TCP and TLS are behind every distributed system.", resources: [doc("MDN — How the web works", "https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Web_standards/How_the_web_works")], project: "Trace and explain a request from DNS lookup to response." },
  "architecture": { name: "Architecture", difficulty: "hard", why: "Shapes how systems evolve and how teams divide work.", resources: [], project: "Write an architecture decision record for a real trade-off." },
  "design-patterns": { name: "Design Patterns", difficulty: "medium", why: "Shared vocabulary for recurring design problems.", resources: [], project: "Refactor a module and document the pattern you applied." },
  "machine-learning": { aliases: ["ML"], name: "Machine Learning", difficulty: "hard", why: "Core modelling skill for any ML-facing role.", resources: [doc("scikit-learn User Guide", "https://scikit-learn.org/stable/user_guide.html")], project: "Train, validate and explain a model on a public dataset." },
  "deep-learning": { aliases: ["DL"], name: "Deep Learning", difficulty: "hard", why: "Neural networks power modern vision, language and speech systems.", resources: [doc("PyTorch Tutorials", "https://pytorch.org/tutorials/")], project: "Train a small network and analyse its failure cases." },
  "statistics": { name: "Statistics", difficulty: "medium", why: "Needed to judge whether a result is real or noise.", resources: [], project: "Run and report an A/B analysis with confidence intervals." },
  "linear-algebra": { name: "Linear Algebra & Calculus", difficulty: "hard", why: "The mathematics underneath model training.", resources: [], project: "Implement gradient descent from scratch." },
  "data-engineering": { name: "Data Engineering", difficulty: "medium", why: "Models and analyses are only as good as their data pipelines.", resources: [], project: "Build a reproducible ingestion pipeline with validation." },
  "llm-apis": { aliases: ["LLM", "OpenAI API", "Gemini API"], name: "LLM APIs", difficulty: "medium", why: "Most generative AI products integrate hosted model APIs.", resources: [], project: "Build a feature that calls a model API with structured output and fallbacks." },
  "llm-orchestration": { name: "LLM Orchestration", difficulty: "hard", why: "Production AI systems chain models, tools and retrieval with guardrails.", resources: [], project: "Build a multi-step model workflow with retries and evaluation." },
  "embeddings": { name: "Embeddings", difficulty: "medium", why: "Vector representations enable semantic search and retrieval.", resources: [], project: "Build semantic search over a document set." },
  "vector-databases": { name: "Vector Databases", difficulty: "medium", why: "Store and query embeddings efficiently at scale.", resources: [], project: "Index and query embeddings with filtering." },
  "rag": { aliases: ["RAG"], name: "Retrieval-Augmented Generation", difficulty: "hard", why: "Grounds model output in trusted sources to reduce fabrication.", resources: [], project: "Build a RAG assistant with citations and an evaluation set." },
  "ai-evaluation": { name: "AI Evaluation", difficulty: "hard", why: "Without evaluation you cannot tell if a model change helped.", resources: [], project: "Create an evaluation suite and track a metric across versions." },
  "model-deployment": { name: "Model Deployment", difficulty: "hard", why: "Models deliver value only when served reliably.", resources: [], project: "Serve a model behind an API with monitoring." },
  "agents": { name: "AI Agents & Tool Use", difficulty: "hard", why: "Agentic systems plan, call tools and need strict permission boundaries.", resources: [], project: "Build an agent that uses two tools with human approval for writes." },
  "prompt-engineering": { name: "Prompt Engineering", difficulty: "easy", why: "Clear instructions and examples change model behaviour cheaply.", resources: [], project: "Iterate on a prompt using a small evaluation set." },
  "nlp": { aliases: ["NLP"], name: "Natural Language Processing", difficulty: "hard", why: "Text understanding is the core of language products.", resources: [], project: "Build a text classifier and analyse its errors." },
  "computer-vision": { aliases: ["CV"], name: "Computer Vision", difficulty: "hard", why: "Image and video understanding for perception systems.", resources: [doc("OpenCV tutorials", "https://docs.opencv.org/4.x/d9/df8/tutorial_root.html")], project: "Train a detector or classifier on a custom image set." },
  "mlops": { name: "MLOps", difficulty: "hard", why: "Versioning, monitoring and retraining keep models healthy in production.", resources: [], project: "Automate train → evaluate → deploy with a model registry." },
  "research-methods": { name: "Research Methods", difficulty: "hard", why: "Forming hypotheses and designing fair experiments.", resources: [], project: "Reproduce a published result and document deviations." },
  "scientific-writing": { name: "Scientific Writing", difficulty: "medium", why: "Research has impact only when it is communicated clearly.", resources: [], project: "Write a short paper or technical report with peer feedback." },
  "robotics": { name: "Robotics Fundamentals", difficulty: "hard", why: "Kinematics, control and sensing for physical systems.", resources: [doc("ROS 2 documentation", "https://docs.ros.org/en/rolling/")], project: "Simulate a robot completing a navigation task." },
  "cpp": { aliases: ["C plus plus", "CPP"], name: "C++", difficulty: "hard", why: "Used where latency and hardware control matter.", resources: [doc("cppreference", "https://en.cppreference.com/")], project: "Write a performance-sensitive component with tests." },
  "data-analysis": { name: "Data Analysis", difficulty: "medium", why: "Turning raw data into decisions is the analyst's core output.", resources: [doc("pandas Getting started", "https://pandas.pydata.org/docs/getting_started/index.html")], project: "Answer a business question end-to-end with a written summary." },
  "data-visualization": { name: "Data Visualisation", difficulty: "easy", why: "Clear charts make findings understandable.", resources: [], project: "Redesign a misleading chart and explain your choices." },
  "spreadsheets": { name: "Spreadsheets", difficulty: "easy", why: "Still the most common analysis tool in business.", resources: [], project: "Build a model with lookups, pivots and documented assumptions." },
  "etl": { name: "ETL / ELT Pipelines", difficulty: "medium", why: "Moving and transforming data reliably between systems.", resources: [], project: "Build an idempotent pipeline with retries." },
  "data-modeling": { name: "Data Modelling", difficulty: "medium", why: "Good models make data correct and queryable.", resources: [], project: "Design a dimensional model for a reporting domain." },
  "data-warehousing": { name: "Data Warehousing", difficulty: "medium", why: "Analytical platforms centralise trusted data.", resources: [], project: "Load and model data into a warehouse with tests." },
  "spark": { aliases: ["Apache Spark", "Spark"], name: "Distributed Data Processing", difficulty: "hard", why: "Large datasets need parallel processing engines.", resources: [doc("Apache Spark docs", "https://spark.apache.org/docs/latest/")], project: "Process a large dataset and tune a slow job." },
  "orchestration": { name: "Workflow Orchestration", difficulty: "medium", why: "Schedules and monitors dependent data jobs.", resources: [], project: "Orchestrate a multi-step pipeline with alerts." },
  "data-quality": { name: "Data Quality & Governance", difficulty: "medium", why: "Wrong data leads to wrong decisions and compliance risk.", resources: [], project: "Add data contracts and quality checks to a pipeline." },
  "bi-tools": { name: "BI Tools", difficulty: "easy", why: "Dashboards are how stakeholders consume analysis.", resources: [], project: "Publish a dashboard with a documented metric definition." },
  "database-administration": { name: "Database Administration", difficulty: "hard", why: "Backups, replication and tuning keep data available.", resources: [], project: "Run a backup/restore drill and tune a slow query." },
  "cloud-fundamentals": { name: "Cloud Fundamentals", difficulty: "medium", why: "Compute, storage, networking and IAM across providers.", resources: [], project: "Deploy a three-tier app with least-privilege access." },
  "aws": { aliases: ["Amazon Web Services"], name: "AWS", difficulty: "medium", why: "The largest public cloud provider.", resources: [doc("AWS Documentation", "https://docs.aws.amazon.com/")], project: "Deploy a service on AWS with IAM, logging and alarms." },
  "azure": { name: "Microsoft Azure", difficulty: "medium", why: "Widely used in enterprise and Microsoft-centric organisations.", resources: [doc("Microsoft Learn — Azure", "https://learn.microsoft.com/en-us/azure/")], project: "Deploy a service on Azure with managed identity." },
  "gcp": { aliases: ["GCP"], name: "Google Cloud", difficulty: "medium", why: "Strong in data, analytics and Kubernetes workloads.", resources: [doc("Google Cloud documentation", "https://cloud.google.com/docs")], project: "Deploy a service on Google Cloud with IAM and monitoring." },
  "docker": { name: "Docker", difficulty: "easy", why: "Containers make builds reproducible across environments.", resources: [doc("Docker docs", "https://docs.docker.com/get-started/")], project: "Containerise an app with a small, non-root image." },
  "kubernetes": { aliases: ["K8s"], name: "Kubernetes", difficulty: "hard", why: "The standard platform for running containers at scale.", resources: [doc("Kubernetes docs", "https://kubernetes.io/docs/home/")], project: "Run an app on Kubernetes with probes and rolling updates." },
  "ci-cd": { aliases: ["CI CD", "Continuous Integration"], name: "CI/CD", difficulty: "medium", why: "Automated pipelines catch regressions and ship safely.", resources: [], project: "Build a pipeline that tests, scans and deploys on merge." },
  "infrastructure-as-code": { aliases: ["IaC", "Terraform"], name: "Infrastructure as Code", difficulty: "medium", why: "Reviewable, repeatable infrastructure changes.", resources: [doc("Terraform tutorials", "https://developer.hashicorp.com/terraform/tutorials")], project: "Provision an environment from code with a plan review." },
  "observability": { name: "Observability", difficulty: "medium", why: "Logs, metrics and traces let you understand production.", resources: [doc("OpenTelemetry docs", "https://opentelemetry.io/docs/")], project: "Instrument a service and build an alert on a real SLO." },
  "incident-response": { name: "Incident Response", difficulty: "medium", why: "Calm, structured recovery limits user impact.", resources: [], project: "Run a game-day and write a blameless post-incident review." },
  "scripting": { name: "Scripting & Automation", difficulty: "easy", why: "Automation removes repetitive manual operations.", resources: [], project: "Automate a recurring operational task with logging." },
  "socketio": { name: "Socket.io", aliases: ["WebSockets", "Real-time Systems"], difficulty: "medium", why: "Live updates need connection lifecycle and backpressure handling.", resources: [doc("Socket.IO docs", "https://socket.io/docs/v4/")], project: "Build a real-time feature with reconnect recovery." },
  "security-fundamentals": { name: "Security Fundamentals", difficulty: "medium", why: "CIA triad, threats and controls are the base of every security role.", resources: [], project: "Write a threat model for a small application." },
  "network-security": { name: "Network Security", difficulty: "hard", why: "Segmentation, firewalls and traffic analysis protect systems.", resources: [], project: "Capture and analyse traffic to identify a misconfiguration." },
  "siem": { name: "Security Monitoring (SIEM)", difficulty: "medium", why: "Detection depends on collecting and correlating events.", resources: [], project: "Write and tune a detection rule against sample logs." },
  "appsec": { name: "Application Security", difficulty: "hard", why: "Most breaches exploit application-layer weaknesses.", resources: [doc("OWASP Cheat Sheet Series", "https://cheatsheetseries.owasp.org/")], project: "Review an app for OWASP Top 10 issues and fix them." },
  "secure-code-review": { name: "Secure Code Review", difficulty: "hard", why: "Finding vulnerabilities before release is cheaper than after.", resources: [], project: "Review a pull request for security and write findings." },
  "penetration-testing": { name: "Penetration Testing", difficulty: "hard", why: "Authorised testing reveals exploitable weaknesses.", resources: [], project: "Complete a legal practice lab and write a professional report." },
  "threat-modeling": { name: "Threat Modelling", difficulty: "medium", why: "Systematically identifies risks during design.", resources: [doc("OWASP Threat Modeling", "https://owasp.org/www-community/Threat_Modeling")], project: "Threat-model a feature using STRIDE." },
  "cloud-security": { name: "Cloud Security", difficulty: "hard", why: "Misconfigured cloud identity and storage are a leading breach cause.", resources: [], project: "Audit a cloud account for IAM and storage exposure." },
  "cryptography": { name: "Applied Cryptography", difficulty: "hard", why: "Correct use of crypto primitives protects data.", resources: [], project: "Explain and implement safe password storage and TLS configuration." },
  "reverse-engineering": { name: "Reverse Engineering", difficulty: "hard", why: "Understanding binaries reveals vulnerabilities and malware behaviour.", resources: [], project: "Analyse a practice binary in a legal lab environment." },
  "compliance": { name: "Risk & Compliance", difficulty: "medium", why: "Security work operates within legal and regulatory frameworks.", resources: [], project: "Map a system's controls to a common framework." },
  "product-strategy": { name: "Product Strategy", difficulty: "hard", why: "Choosing what to build, and why, is the core of product work.", resources: [], project: "Write a one-page strategy with goals and non-goals." },
  "user-research": { name: "User Research", difficulty: "medium", why: "Decisions grounded in real user evidence.", resources: [], project: "Run five interviews and synthesise findings." },
  "roadmapping": { name: "Roadmapping & Prioritisation", difficulty: "medium", why: "Balancing value, effort and risk across a backlog.", resources: [], project: "Prioritise a backlog with an explicit framework." },
  "product-analytics": { name: "Product Analytics", difficulty: "medium", why: "Measuring outcomes, not just shipping output.", resources: [], project: "Define success metrics and instrument a feature." },
  "analytics": { name: "Analytics", difficulty: "medium", why: "Evidence for prioritisation and outcome tracking.", resources: [], project: "Build a metrics review for a product area." },
  "stakeholder-communication": { name: "Stakeholder Communication", difficulty: "medium", why: "Alignment across functions prevents wasted work.", resources: [], project: "Write and present a decision memo." },
  "technical-writing": { name: "Technical Writing", difficulty: "easy", why: "Clear specs and docs scale a team's knowledge.", resources: [], project: "Write a spec that another engineer can build from." },
  "ux-design": { name: "UX Design", difficulty: "medium", why: "Designing flows that are understandable and efficient.", resources: [], project: "Redesign a confusing flow and test it with users." },
  "ui-design": { name: "UI / Visual Design", difficulty: "medium", why: "Typography, layout and colour create clarity and trust.", resources: [], project: "Design a consistent screen set with a type and colour scale." },
  "prototyping": { name: "Prototyping", difficulty: "easy", why: "Cheap prototypes test ideas before engineering cost.", resources: [], project: "Prototype and test an interaction before building it." },
  "design-systems": { name: "Design Systems", difficulty: "medium", why: "Shared components keep products consistent and fast to build.", resources: [], project: "Document five components with states and usage rules." },
  "interaction-design": { name: "Interaction Design", difficulty: "medium", why: "Feedback, motion and states make interfaces understandable.", resources: [], project: "Specify interaction states for a complex component." },
  "usability-testing": { name: "Usability Testing", difficulty: "easy", why: "Watching people use a product reveals real problems.", resources: [], project: "Run a moderated usability test and report severity-ranked issues." },
  "coaching": { name: "Coaching & Mentoring", difficulty: "medium", why: "Leaders grow others' capability.", resources: [], project: "Mentor someone through a goal and reflect on what worked." },
  "delivery-management": { name: "Delivery Management", difficulty: "medium", why: "Predictable delivery depends on scope, risk and flow.", resources: [], project: "Run a project with a visible plan, risks and retrospectives." },
  "testing-strategy": { name: "Testing Strategy", difficulty: "medium", why: "Leads decide where testing effort gives the most confidence.", resources: [], project: "Write a test strategy for a product area." },
  "people-management": { name: "People Management", difficulty: "hard", why: "Hiring, feedback and performance shape team outcomes.", resources: [], project: "Run a quarter of 1:1s with written growth plans." },
  "hiring": { name: "Hiring", difficulty: "medium", why: "Fair, structured hiring builds strong teams.", resources: [], project: "Design a structured interview loop with a rubric." },
  "technical-strategy": { name: "Technical Strategy", difficulty: "hard", why: "Aligning technology choices with business direction.", resources: [], project: "Write a 12-month technical strategy with measurable outcomes." },
  "program-management": { name: "Program Management", difficulty: "medium", why: "Coordinating dependencies across many teams.", resources: [], project: "Run a cross-team initiative with a dependency map." },
  "budgeting": { name: "Budgeting & Finance", difficulty: "medium", why: "Leaders and founders own cost and investment trade-offs.", resources: [], project: "Build a budget with scenarios for a team or venture." },
  "business-analysis": { name: "Business Analysis", difficulty: "medium", why: "Translating business needs into clear requirements.", resources: [], project: "Write requirements and acceptance criteria for a process change." },
  "requirements": { name: "Requirements Engineering", difficulty: "medium", why: "Unclear requirements are a top cause of failed projects.", resources: [], project: "Elicit and document requirements with stakeholders." },
  "market-research": { name: "Market Research", difficulty: "medium", why: "Understanding customers and competitors reduces risk.", resources: [], project: "Size a market and profile three competitors." },
  "sales": { name: "Sales & Negotiation", difficulty: "medium", why: "Revenue and partnerships depend on persuasive conversations.", resources: [], project: "Run discovery calls and write up learnings." },
  "fundraising": { name: "Fundraising", difficulty: "hard", why: "Founders often need external capital to grow.", resources: [], project: "Write a pitch narrative and financial model." },
  "project-management": { name: "Project Management", difficulty: "medium", why: "Plans, risks and communication deliver projects on time.", resources: [], project: "Plan and run a project with a risk register." },
  "consulting": { name: "Consulting & Advisory", difficulty: "medium", why: "Diagnosing client problems and recommending solutions.", resources: [], project: "Deliver a recommendation report for a real problem." },
  "teaching": { name: "Teaching & Facilitation", difficulty: "medium", why: "Explaining clearly and checking understanding.", resources: [], project: "Design and deliver a lesson with an assessment." },
  "curriculum-design": { name: "Curriculum Design", difficulty: "medium", why: "Sequencing learning outcomes so they build on each other.", resources: [], project: "Design a short course with outcomes and assessments." },
  "learning-skills": { name: "Learning How to Learn", difficulty: "easy", why: "Spaced practice and retrieval make study time effective.", resources: [], project: "Plan four weeks of spaced practice and review results." },
  "time-management": { name: "Time & Focus Management", difficulty: "easy", why: "Protected focus time is the base of sustained progress.", resources: [], project: "Run a two-week focus experiment and review the data." },
  "portfolio": { name: "Portfolio Building", difficulty: "easy", why: "Visible work is the strongest evidence of skill.", resources: [], project: "Publish three documented projects." },
  "client-management": { name: "Client Management", difficulty: "medium", why: "Independent work depends on scoping and expectations.", resources: [], project: "Write a scope-of-work and handle a change request." },
  "personal-branding": { name: "Professional Presence", difficulty: "easy", why: "Being findable and credible creates opportunities.", resources: [], project: "Write case studies for two past projects." },
  "domain-expertise": { name: "Domain Expertise", difficulty: "hard", why: "Deep knowledge of a problem domain distinguishes researchers.", resources: [], project: "Write a literature review of your sub-field." },
  "scientific-computing": { name: "Scientific Computing", difficulty: "hard", why: "Numerical methods and simulation at scale.", resources: [doc("NumPy user guide", "https://numpy.org/doc/stable/user/")], project: "Implement and validate a numerical simulation." },
  "hpc": { name: "High-Performance Computing", difficulty: "hard", why: "Large simulations need parallel hardware.", resources: [], project: "Parallelise a computation and measure speed-up." },
  "experimentation": { name: "Experimentation", difficulty: "medium", why: "Controlled experiments establish causation.", resources: [], project: "Design and analyse a controlled experiment." }
};

/**
 * Compact role definitions.
 * skills: [skillId, priority, minLevel?, weightOverride?]
 */
const R = (id, name, category, description, skills, extra = {}) => ({ id, name, category, description, skills, ...extra });

const roleDefinitions = [
  // ---------------- Software Engineering ----------------
  R("software-engineer", "Software Engineer", "software-engineering", "Designs, builds and maintains software systems across the stack.",
    [["data-structures", "core"], ["git", "core"], ["testing", "core"], ["system-design", "important"], ["rest-apis", "important"], ["sql", "important"], ["security", "supporting"], ["deployment", "supporting"]],
    { aliases: ["SWE", "Developer", "Programmer", "Software Developer"], keywords: ["coding", "engineering"] }),
  R("frontend-developer", "Frontend Developer", "software-engineering", "Builds accessible, fast user interfaces for the web.",
    [["html-css", "core"], ["javascript", "core"], ["react", "core"], ["typescript", "important"], ["accessibility", "important"], ["web-performance", "important"], ["testing", "important"], ["design-systems", "supporting"]],
    { aliases: ["Front-end Developer", "Frontend Engineer", "UI Engineer", "Web Developer"], keywords: ["web", "ui", "browser"] }),
  R("backend-developer", "Backend Developer", "software-engineering", "Builds APIs, data stores and services that power applications.",
    [["nodejs", "core"], ["express", "important"], ["rest-apis", "core"], ["mongodb", "important"], ["sql", "core"], ["authentication", "core"], ["testing", "important"], ["caching", "important"], ["system-design", "important"], ["deployment", "supporting"], ["security", "important"]],
    { aliases: ["Back-end Developer", "Backend Engineer", "API Developer", "Server Engineer"], keywords: ["api", "server", "database"] }),
  R("full-stack-developer", "Full Stack Developer", "software-engineering", "Delivers features end-to-end, from interface to database.",
    [["javascript", "core"], ["react", "core"], ["nodejs", "core"], ["rest-apis", "core"], ["sql", "important"], ["mongodb", "important"], ["authentication", "important"], ["testing", "important"], ["deployment", "important"], ["html-css", "supporting"]],
    { aliases: ["Fullstack Developer", "Full-stack Engineer", "MERN Developer"], keywords: ["web", "frontend", "backend"] }),
  R("java-developer", "Java Developer", "software-engineering", "Builds JVM services and enterprise applications.",
    [["java", "core"], ["spring", "core"], ["sql", "core"], ["rest-apis", "important"], ["testing", "important"], ["design-patterns", "important"], ["system-design", "supporting"], ["docker", "supporting"]],
    { aliases: ["Java Engineer", "JVM Developer", "Spring Developer"], keywords: ["enterprise", "jvm"] }),
  R("python-developer", "Python Developer", "software-engineering", "Builds services, automation and tooling in Python.",
    [["python", "core"], ["rest-apis", "core"], ["sql", "important"], ["testing", "important"], ["git", "important"], ["scripting", "supporting"], ["docker", "supporting"]],
    { aliases: ["Python Engineer", "Django Developer", "FastAPI Developer"], keywords: ["automation", "backend"] }),
  R("react-developer", "React Developer", "software-engineering", "Specialises in React applications and component architecture.",
    [["react", "core"], ["javascript", "core"], ["typescript", "important"], ["html-css", "important"], ["testing", "important"], ["accessibility", "important"], ["web-performance", "supporting"]],
    { aliases: ["React Engineer", "React.js Developer"], keywords: ["frontend", "web", "spa"] }),
  R("nodejs-developer", "Node.js Developer", "software-engineering", "Builds JavaScript services and real-time backends on Node.js.",
    [["nodejs", "core"], ["javascript", "core"], ["express", "important"], ["rest-apis", "core"], ["mongodb", "important"], ["testing", "important"], ["socketio", "supporting"], ["authentication", "important"]],
    { aliases: ["Node Developer", "Node Engineer"], keywords: ["backend", "javascript", "api"] }),
  R("mobile-developer", "Mobile Developer", "software-engineering", "Builds native or cross-platform mobile applications.",
    [["mobile-ui", "core"], ["react-native", "important"], ["rest-apis", "important"], ["testing", "important"], ["accessibility", "supporting"], ["git", "supporting"]],
    { aliases: ["Mobile Engineer", "App Developer", "Flutter Developer"], keywords: ["android", "ios", "app"] }),
  R("android-developer", "Android Developer", "software-engineering", "Builds Android applications with Kotlin and Jetpack.",
    [["kotlin", "core"], ["android", "core"], ["mobile-ui", "important"], ["rest-apis", "important"], ["testing", "important"], ["java", "supporting"]],
    { aliases: ["Android Engineer"], keywords: ["mobile", "kotlin"] }),
  R("ios-developer", "iOS Developer", "software-engineering", "Builds applications for iPhone and iPad.",
    [["swift", "core"], ["ios", "core"], ["mobile-ui", "important"], ["rest-apis", "important"], ["testing", "important"], ["accessibility", "supporting"]],
    { aliases: ["iOS Engineer", "Swift Developer", "Apple Developer"], keywords: ["mobile", "swift"] }),
  R("systems-engineer", "Systems Engineer", "software-engineering", "Works close to the operating system on performance-critical software.",
    [["operating-systems", "core"], ["cpp", "important"], ["linux", "core"], ["networking", "important"], ["data-structures", "important"], ["scripting", "supporting"]],
    { aliases: ["Systems Programmer", "Low-level Engineer"], keywords: ["os", "performance", "c++"] }),
  R("software-architect", "Software Architect", "software-engineering", "Defines system structure, standards and long-term technical direction.",
    [["architecture", "core"], ["system-design", "core", 5], ["design-patterns", "important"], ["security", "important"], ["cloud-fundamentals", "important"], ["technical-writing", "important"], ["stakeholder-communication", "supporting"]],
    { aliases: ["Solutions Architect", "Application Architect"], keywords: ["architecture", "design"], alsoIn: ["engineering-leadership"], experienceLevel: "advanced" }),
  R("application-developer", "Application Developer", "software-engineering", "Builds and maintains business applications.",
    [["javascript", "important"], ["sql", "core"], ["rest-apis", "core"], ["testing", "important"], ["requirements", "important"], ["git", "supporting"]],
    { aliases: ["App Developer", "Business Application Developer"], keywords: ["enterprise", "software"] }),

  // ---------------- AI & Machine Learning ----------------
  R("ai-engineer", "AI Engineer", "ai-ml", "Builds products and systems on top of machine learning and foundation models.",
    [["python", "core"], ["machine-learning", "core"], ["deep-learning", "important"], ["statistics", "important"], ["data-engineering", "important"], ["llm-apis", "core"], ["embeddings", "important"], ["vector-databases", "supporting"], ["rag", "important"], ["ai-evaluation", "core"], ["model-deployment", "important"]],
    { aliases: ["Artificial Intelligence Engineer", "AI Developer"], keywords: ["llm", "ml", "genai"] }),
  R("ai-systems-engineer", "AI Systems Engineer", "ai-ml", "Engineers production systems around AI: orchestration, reliability, security and real-time delivery.",
    [["nodejs", "core", 4, 0.14], ["react", "important", 4, 0.12], ["mongodb", "important", 4, 0.1], ["system-design", "core", 4, 0.16], ["llm-orchestration", "core", 4, 0.14], ["docker", "supporting", 4, 0.08], ["observability", "supporting", 4, 0.08], ["socketio", "supporting", 4, 0.06], ["security", "important", 4, 0.12]],
    { aliases: ["AI Platform Engineer", "LLM Systems Engineer"], keywords: ["llm", "platform", "infrastructure"], legacy: true }),
  R("machine-learning-engineer", "Machine Learning Engineer", "ai-ml", "Trains, evaluates and ships machine learning models to production.",
    [["python", "core"], ["machine-learning", "core"], ["deep-learning", "important"], ["statistics", "core"], ["data-engineering", "important"], ["model-deployment", "core"], ["mlops", "important"], ["ai-evaluation", "important"], ["linear-algebra", "supporting"]],
    { aliases: ["ML Engineer", "MLE"], keywords: ["ml", "models", "training"] }),
  R("deep-learning-engineer", "Deep Learning Engineer", "ai-ml", "Designs and trains neural network models.",
    [["python", "core"], ["deep-learning", "core", 5], ["linear-algebra", "important"], ["machine-learning", "core"], ["ai-evaluation", "important"], ["model-deployment", "supporting"]],
    { aliases: ["DL Engineer", "Neural Network Engineer"], keywords: ["neural networks", "pytorch"] }),
  R("generative-ai-engineer", "Generative AI Engineer", "ai-ml", "Builds applications with large language and diffusion models.",
    [["python", "core"], ["llm-apis", "core"], ["prompt-engineering", "important"], ["embeddings", "important"], ["rag", "core"], ["vector-databases", "important"], ["ai-evaluation", "core"], ["security", "supporting"]],
    { aliases: ["GenAI Engineer", "LLM Engineer"], keywords: ["llm", "genai", "chatbot"] }),
  R("agentic-ai-engineer", "Agentic AI Engineer", "ai-ml", "Builds AI agents that plan, use tools and act under human-defined guardrails.",
    [["python", "core"], ["llm-apis", "core"], ["agents", "core"], ["llm-orchestration", "core"], ["ai-evaluation", "important"], ["security", "important"], ["rag", "supporting"]],
    { aliases: ["AI Agent Engineer", "Agent Developer"], keywords: ["agents", "tools", "automation"] }),
  R("nlp-engineer", "NLP Engineer", "ai-ml", "Builds systems that understand and generate human language.",
    [["python", "core"], ["nlp", "core"], ["machine-learning", "core"], ["deep-learning", "important"], ["embeddings", "important"], ["ai-evaluation", "important"]],
    { aliases: ["Natural Language Processing Engineer", "Computational Linguist"], keywords: ["text", "language"] }),
  R("computer-vision-engineer", "Computer Vision Engineer", "ai-ml", "Builds systems that interpret images and video.",
    [["python", "core"], ["computer-vision", "core"], ["deep-learning", "core"], ["linear-algebra", "important"], ["model-deployment", "important"], ["cpp", "supporting"]],
    { aliases: ["CV Engineer", "Vision Engineer"], keywords: ["images", "video", "perception"] }),
  R("data-scientist", "Data Scientist", "ai-ml", "Uses statistics and modelling to answer questions and inform decisions.",
    [["python", "core"], ["statistics", "core"], ["machine-learning", "core"], ["sql", "core"], ["data-analysis", "important"], ["data-visualization", "important"], ["experimentation", "important"], ["stakeholder-communication", "supporting"]],
    { aliases: ["DS", "Decision Scientist"], keywords: ["statistics", "analytics", "modelling"], alsoIn: ["data"] }),
  R("research-engineer", "Research Engineer", "ai-ml", "Turns research ideas into working experiments and reproducible code.",
    [["python", "core"], ["machine-learning", "core"], ["deep-learning", "important"], ["research-methods", "important"], ["experimentation", "important"], ["hpc", "supporting"], ["testing", "supporting"]],
    { aliases: ["ML Research Engineer"], keywords: ["research", "experiments"], alsoIn: ["research"] }),
  R("applied-ai-engineer", "Applied AI Engineer", "ai-ml", "Applies existing AI models to concrete business problems.",
    [["python", "core"], ["llm-apis", "core"], ["machine-learning", "important"], ["rest-apis", "important"], ["ai-evaluation", "core"], ["product-analytics", "supporting"]],
    { aliases: ["Applied ML Engineer", "AI Solutions Engineer"], keywords: ["applied", "product"] }),
  R("ai-research-scientist", "AI Research Scientist", "ai-ml", "Advances the state of the art in machine learning.",
    [["research-methods", "core", 5], ["deep-learning", "core", 5], ["linear-algebra", "core"], ["statistics", "important"], ["scientific-writing", "important"], ["python", "important"]],
    { aliases: ["ML Research Scientist", "AI Scientist"], keywords: ["research", "papers"], experienceLevel: "advanced" }),
  R("mlops-engineer", "MLOps Engineer", "ai-ml", "Operates the platforms that train, deploy and monitor models.",
    [["mlops", "core"], ["model-deployment", "core"], ["docker", "important"], ["kubernetes", "important"], ["ci-cd", "important"], ["observability", "important"], ["python", "important"], ["cloud-fundamentals", "supporting"]],
    { aliases: ["ML Platform Engineer", "ML Infrastructure Engineer"], keywords: ["ml", "platform", "ops"] }),
  R("robotics-engineer", "Robotics Engineer", "ai-ml", "Builds software for robots that perceive and act in the physical world.",
    [["robotics", "core"], ["cpp", "core"], ["python", "important"], ["computer-vision", "important"], ["linear-algebra", "important"], ["linux", "supporting"]],
    { aliases: ["Robotics Software Engineer", "ROS Developer"], keywords: ["robots", "control", "autonomy"] }),

  // ---------------- Data Engineering ----------------
  R("data-analyst", "Data Analyst", "data", "Turns data into clear answers, reports and recommendations.",
    [["sql", "core"], ["data-analysis", "core"], ["spreadsheets", "important"], ["data-visualization", "core"], ["statistics", "important"], ["bi-tools", "important"], ["stakeholder-communication", "supporting"], ["python", "supporting"]],
    { aliases: ["Business Data Analyst", "Reporting Analyst"], keywords: ["reports", "dashboards", "excel"] }),
  R("data-engineer", "Data Engineer", "data", "Builds reliable pipelines and platforms that deliver trusted data.",
    [["sql", "core"], ["python", "core"], ["etl", "core"], ["data-modeling", "important"], ["data-warehousing", "important"], ["spark", "important"], ["orchestration", "important"], ["data-quality", "important"], ["cloud-fundamentals", "supporting"]],
    { aliases: ["Big Data Engineer", "Pipeline Engineer"], keywords: ["pipelines", "etl", "warehouse"] }),
  R("analytics-engineer", "Analytics Engineer", "data", "Models raw data into tested, documented datasets for analysis.",
    [["sql", "core", 5], ["data-modeling", "core"], ["data-warehousing", "important"], ["data-quality", "important"], ["git", "important"], ["bi-tools", "supporting"]],
    { aliases: ["dbt Developer"], keywords: ["dbt", "modelling", "warehouse"] }),
  R("database-administrator", "Database Administrator", "data", "Keeps databases secure, available, backed up and fast.",
    [["database-administration", "core"], ["sql", "core"], ["linux", "important"], ["security", "important"], ["scripting", "supporting"], ["cloud-fundamentals", "supporting"]],
    { aliases: ["DBA", "Database Engineer"], keywords: ["database", "backup", "tuning"] }),
  R("bi-engineer", "Business Intelligence Engineer", "data", "Builds the reporting layer and dashboards organisations rely on.",
    [["sql", "core"], ["bi-tools", "core"], ["data-modeling", "important"], ["data-visualization", "important"], ["data-warehousing", "important"], ["stakeholder-communication", "supporting"]],
    { aliases: ["BI Engineer", "BI Developer", "Power BI Developer", "Tableau Developer"], keywords: ["dashboards", "reporting"] }),
  R("data-architect", "Data Architect", "data", "Designs an organisation's data platforms, models and governance.",
    [["data-modeling", "core", 5], ["data-warehousing", "core"], ["data-quality", "important"], ["architecture", "important"], ["cloud-fundamentals", "important"], ["compliance", "supporting"]],
    { aliases: ["Enterprise Data Architect"], keywords: ["governance", "platform"], experienceLevel: "advanced" }),

  // ---------------- Cloud & DevOps ----------------
  R("cloud-engineer", "Cloud Engineer", "cloud-devops", "Builds and runs workloads on public cloud platforms.",
    [["cloud-fundamentals", "core"], ["linux", "important"], ["networking", "important"], ["infrastructure-as-code", "core"], ["docker", "important"], ["security", "important"], ["scripting", "supporting"]],
    { aliases: ["Cloud Developer"], keywords: ["cloud", "infrastructure"] }),
  R("aws-engineer", "AWS Engineer", "cloud-devops", "Specialises in building and operating systems on AWS.",
    [["aws", "core"], ["cloud-fundamentals", "core"], ["infrastructure-as-code", "important"], ["networking", "important"], ["security", "important"], ["linux", "supporting"]],
    { aliases: ["AWS Cloud Engineer", "AWS Developer"], keywords: ["amazon", "cloud"] }),
  R("azure-engineer", "Azure Engineer", "cloud-devops", "Specialises in building and operating systems on Microsoft Azure.",
    [["azure", "core"], ["cloud-fundamentals", "core"], ["infrastructure-as-code", "important"], ["networking", "important"], ["security", "important"], ["scripting", "supporting"]],
    { aliases: ["Azure Cloud Engineer", "Azure Developer"], keywords: ["microsoft", "cloud"] }),
  R("gcp-engineer", "Google Cloud Engineer", "cloud-devops", "Specialises in building and operating systems on Google Cloud.",
    [["gcp", "core"], ["cloud-fundamentals", "core"], ["kubernetes", "important"], ["infrastructure-as-code", "important"], ["security", "important"], ["networking", "supporting"]],
    { aliases: ["GCP Engineer", "Google Cloud Developer"], keywords: ["google", "cloud"] }),
  R("devops-engineer", "DevOps Engineer", "cloud-devops", "Automates delivery and operations so teams ship safely and often.",
    [["ci-cd", "core"], ["docker", "core"], ["kubernetes", "important"], ["infrastructure-as-code", "core"], ["linux", "important"], ["observability", "important"], ["scripting", "important"], ["cloud-fundamentals", "supporting"]],
    { aliases: ["DevOps", "Build and Release Engineer"], keywords: ["automation", "pipelines"] }),
  R("site-reliability-engineer", "Site Reliability Engineer", "cloud-devops", "Keeps production reliable through engineering, SLOs and incident practice.",
    [["observability", "core"], ["incident-response", "core"], ["linux", "core"], ["kubernetes", "important"], ["system-design", "important"], ["scripting", "important"], ["networking", "important"], ["ci-cd", "supporting"]],
    { aliases: ["SRE", "Reliability Engineer", "Systems Reliability Engineer"], keywords: ["reliability", "on-call", "slo"] }),
  R("platform-engineer", "Platform Engineer", "cloud-devops", "Builds internal platforms that make other engineers productive.",
    [["kubernetes", "core"], ["infrastructure-as-code", "core"], ["ci-cd", "important"], ["observability", "important"], ["security", "important"], ["technical-writing", "supporting"]],
    { aliases: ["Internal Platform Engineer", "Developer Platform Engineer"], keywords: ["platform", "developer experience"] }),
  R("infrastructure-engineer", "Infrastructure Engineer", "cloud-devops", "Designs and runs the compute, network and storage foundation.",
    [["linux", "core"], ["networking", "core"], ["infrastructure-as-code", "important"], ["cloud-fundamentals", "important"], ["observability", "important"], ["security", "supporting"]],
    { aliases: ["Infra Engineer"], keywords: ["servers", "network"] }),
  R("cloud-architect", "Cloud Architect", "cloud-devops", "Designs secure, cost-aware cloud architectures.",
    [["cloud-fundamentals", "core", 5], ["architecture", "core"], ["security", "important"], ["networking", "important"], ["budgeting", "supporting"], ["stakeholder-communication", "supporting"]],
    { aliases: ["Cloud Solutions Architect"], keywords: ["architecture", "cloud"], experienceLevel: "advanced" }),

  // ---------------- Cybersecurity ----------------
  R("cybersecurity-analyst", "Cybersecurity Analyst", "cybersecurity", "Monitors, detects and responds to security events.",
    [["security-fundamentals", "core"], ["siem", "core"], ["networking", "important"], ["incident-response", "core"], ["linux", "important"], ["compliance", "supporting"]],
    { aliases: ["SOC Analyst", "Security Analyst", "Information Security Analyst"], keywords: ["soc", "detection", "blue team"] }),
  R("security-engineer", "Security Engineer", "cybersecurity", "Builds controls and tooling that protect systems and users.",
    [["security-fundamentals", "core"], ["appsec", "important"], ["network-security", "important"], ["cloud-security", "important"], ["cryptography", "important"], ["scripting", "important"], ["threat-modeling", "core"]],
    { aliases: ["InfoSec Engineer", "Information Security Engineer"], keywords: ["security", "controls"] }),
  R("application-security-engineer", "Application Security Engineer", "cybersecurity", "Secures software through design review, testing and developer enablement.",
    [["appsec", "core"], ["secure-code-review", "core"], ["threat-modeling", "core"], ["authentication", "important"], ["javascript", "supporting"], ["ci-cd", "supporting"]],
    { aliases: ["AppSec Engineer", "Product Security Engineer", "DevSecOps Engineer"], keywords: ["owasp", "code review"] }),
  R("penetration-tester", "Penetration Tester", "cybersecurity", "Performs authorised testing to find exploitable weaknesses and reports them clearly.",
    [["penetration-testing", "core"], ["networking", "core"], ["appsec", "important"], ["linux", "important"], ["scripting", "important"], ["technical-writing", "important"]],
    { aliases: ["Pentester", "Ethical Hacker", "Offensive Security Engineer", "Red Team"], keywords: ["offensive", "testing"] }),
  R("security-researcher", "Security Researcher", "cybersecurity", "Discovers and responsibly discloses new vulnerabilities.",
    [["reverse-engineering", "core"], ["appsec", "core"], ["cryptography", "important"], ["operating-systems", "important"], ["research-methods", "important"], ["scientific-writing", "supporting"]],
    { aliases: ["Vulnerability Researcher"], keywords: ["vulnerabilities", "disclosure"], experienceLevel: "advanced" }),
  R("cloud-security-engineer", "Cloud Security Engineer", "cybersecurity", "Secures cloud identity, networks, data and workloads.",
    [["cloud-security", "core"], ["cloud-fundamentals", "core"], ["infrastructure-as-code", "important"], ["network-security", "important"], ["compliance", "supporting"], ["siem", "supporting"]],
    { aliases: ["Cloud Security Architect"], keywords: ["iam", "cloud"] }),

  // ---------------- Product & Design ----------------
  R("product-manager", "Product Manager", "product-design", "Decides what to build and why, and drives it to outcomes.",
    [["product-strategy", "core"], ["user-research", "important"], ["roadmapping", "core"], ["product-analytics", "important"], ["stakeholder-communication", "core"], ["technical-writing", "supporting"]],
    { aliases: ["PM", "Product Owner"], keywords: ["product", "strategy", "roadmap"] }),
  R("technical-product-manager", "Technical Product Manager", "product-design", "Product manager for technical or platform products.",
    [["product-strategy", "core"], ["roadmapping", "core"], ["system-design", "important"], ["rest-apis", "important"], ["stakeholder-communication", "core"], ["product-analytics", "supporting"]],
    { aliases: ["TPM (Product)", "Platform Product Manager"], keywords: ["technical", "platform", "api"] }),
  R("product-engineer", "Product Engineer", "product-design", "Engineer who owns user outcomes, not just tickets.",
    [["react", "core"], ["nodejs", "important"], ["product-analytics", "important"], ["user-research", "supporting"], ["testing", "important"], ["ux-design", "supporting"]],
    { aliases: ["Product-minded Engineer"], keywords: ["product", "full stack"] }),
  R("product-engineering-lead", "Product Engineering Lead", "product-design", "Leads a product engineering team: architecture, delivery quality and people growth.",
    [["react", "core", 4, 0.16], ["nodejs", "important", 4, 0.13], ["design-systems", "important", 4, 0.12], ["analytics", "supporting", 4, 0.1], ["coaching", "supporting", 4, 0.09], ["delivery-management", "core", 4, 0.14], ["testing-strategy", "important", 4, 0.12], ["architecture", "core", 4, 0.14]],
    { aliases: ["Product Tech Lead"], keywords: ["leadership", "product", "delivery"], alsoIn: ["engineering-leadership"], legacy: true }),
  R("product-designer", "Product Designer", "product-design", "Designs end-to-end product experiences from research to polished UI.",
    [["ux-design", "core"], ["ui-design", "core"], ["prototyping", "important"], ["user-research", "important"], ["design-systems", "important"], ["accessibility", "important"]],
    { aliases: ["Digital Product Designer"], keywords: ["design", "figma"] }),
  R("ui-ux-designer", "UI/UX Designer", "product-design", "Designs usable flows and clear, consistent interfaces.",
    [["ux-design", "core"], ["ui-design", "core"], ["prototyping", "important"], ["usability-testing", "important"], ["accessibility", "important"], ["design-systems", "supporting"]],
    { aliases: ["UX Designer", "UI Designer", "UX/UI Designer"], keywords: ["design", "wireframes"] }),
  R("ux-researcher", "UX Researcher", "product-design", "Generates evidence about users to guide product decisions.",
    [["user-research", "core", 5], ["usability-testing", "core"], ["statistics", "important"], ["stakeholder-communication", "important"], ["research-methods", "important"]],
    { aliases: ["User Researcher", "Design Researcher"], keywords: ["interviews", "research"] }),
  R("interaction-designer", "Interaction Designer", "product-design", "Designs how interfaces respond, move and give feedback.",
    [["interaction-design", "core"], ["prototyping", "core"], ["ux-design", "important"], ["accessibility", "important"], ["usability-testing", "supporting"]],
    { aliases: ["IxD", "Motion Designer"], keywords: ["motion", "interaction"] }),

  // ---------------- Engineering Leadership ----------------
  R("technical-lead", "Technical Lead", "engineering-leadership", "Guides a team's technical decisions while still building.",
    [["system-design", "core"], ["architecture", "important"], ["coaching", "important"], ["technical-writing", "important"], ["testing-strategy", "important"], ["delivery-management", "supporting"]],
    { aliases: ["Tech Lead", "Lead Engineer", "Staff Engineer"], keywords: ["leadership", "architecture"], experienceLevel: "advanced" }),
  R("engineering-manager", "Engineering Manager", "engineering-leadership", "Leads people and delivery for an engineering team.",
    [["people-management", "core"], ["coaching", "core"], ["delivery-management", "core"], ["hiring", "important"], ["stakeholder-communication", "important"], ["system-design", "supporting"]],
    { aliases: ["EM", "Software Engineering Manager", "Development Manager"], keywords: ["management", "people"], experienceLevel: "advanced" }),
  R("engineering-director", "Engineering Director", "engineering-leadership", "Leads multiple teams and their managers toward organisational goals.",
    [["people-management", "core", 5], ["technical-strategy", "core"], ["hiring", "important"], ["budgeting", "important"], ["stakeholder-communication", "core"], ["program-management", "supporting"]],
    { aliases: ["Director of Engineering", "Head of Engineering", "VP Engineering"], keywords: ["leadership", "organisation"], experienceLevel: "expert" }),
  R("cto", "CTO", "engineering-leadership", "Owns technology strategy, risk and engineering organisation.",
    [["technical-strategy", "core", 5], ["architecture", "important"], ["people-management", "important"], ["security", "important"], ["budgeting", "important"], ["stakeholder-communication", "core"]],
    { aliases: ["Chief Technology Officer", "Technical Co-founder"], keywords: ["executive", "strategy"], experienceLevel: "expert" }),
  R("technical-program-manager", "Technical Program Manager", "engineering-leadership", "Coordinates complex cross-team technical programmes.",
    [["program-management", "core"], ["delivery-management", "core"], ["system-design", "important"], ["stakeholder-communication", "core"], ["technical-writing", "important"]],
    { aliases: ["TPM", "Engineering Program Manager"], keywords: ["programme", "coordination"] }),

  // ---------------- Research ----------------
  R("research-scientist", "Research Scientist", "research", "Designs and runs original research to produce new knowledge.",
    [["research-methods", "core", 5], ["domain-expertise", "core"], ["statistics", "important"], ["scientific-writing", "important"], ["python", "supporting"]],
    { aliases: ["Scientist"], keywords: ["research", "publications"] }),
  R("computational-scientist", "Computational Scientist", "research", "Uses simulation and numerical methods to study scientific problems.",
    [["scientific-computing", "core"], ["hpc", "important"], ["python", "core"], ["linear-algebra", "important"], ["research-methods", "important"], ["cpp", "supporting"]],
    { aliases: ["Computational Researcher", "Simulation Scientist"], keywords: ["simulation", "numerical"] }),
  R("research-analyst", "Research Analyst", "research", "Investigates questions and synthesises evidence into findings.",
    [["research-methods", "core"], ["data-analysis", "core"], ["statistics", "important"], ["scientific-writing", "important"], ["spreadsheets", "supporting"]],
    { aliases: ["Policy Analyst", "Market Research Analyst"], keywords: ["analysis", "reports"] }),
  R("applied-scientist", "Applied Scientist", "research", "Applies research methods to product problems at scale.",
    [["machine-learning", "core"], ["statistics", "core"], ["experimentation", "important"], ["python", "important"], ["research-methods", "important"], ["model-deployment", "supporting"]],
    { aliases: ["Applied Research Scientist"], keywords: ["applied research", "ml"] }),

  // ---------------- Business & Entrepreneurship ----------------
  R("entrepreneur", "Entrepreneur", "business", "Identifies opportunities and builds ventures around them.",
    [["market-research", "core"], ["product-strategy", "important"], ["sales", "core"], ["budgeting", "important"], ["stakeholder-communication", "important"], ["time-management", "supporting"]],
    { aliases: ["Business Owner"], keywords: ["business", "venture"] }),
  R("startup-founder", "Startup Founder", "business", "Builds a company from idea to product-market fit.",
    [["product-strategy", "core"], ["market-research", "core"], ["sales", "important"], ["fundraising", "important"], ["hiring", "important"], ["budgeting", "important"]],
    { aliases: ["Founder", "Co-founder"], keywords: ["startup", "venture"] }),
  R("business-analyst", "Business Analyst", "business", "Translates business needs into clear requirements and process improvements.",
    [["business-analysis", "core"], ["requirements", "core"], ["sql", "important"], ["data-analysis", "important"], ["stakeholder-communication", "important"], ["spreadsheets", "supporting"]],
    { aliases: ["BA", "Systems Analyst"], keywords: ["requirements", "process"] }),
  R("business-development-manager", "Business Development Manager", "business", "Creates growth through partnerships, deals and new markets.",
    [["sales", "core"], ["market-research", "important"], ["stakeholder-communication", "core"], ["budgeting", "supporting"], ["product-strategy", "supporting"]],
    { aliases: ["BDM", "Partnerships Manager"], keywords: ["sales", "partnerships"] }),
  R("technology-consultant", "Technology Consultant", "business", "Advises organisations on technology choices and transformation.",
    [["consulting", "core"], ["architecture", "important"], ["stakeholder-communication", "core"], ["business-analysis", "important"], ["technical-writing", "important"]],
    { aliases: ["IT Consultant", "Solutions Consultant"], keywords: ["consulting", "advisory"] }),
  R("product-strategist", "Product Strategist", "business", "Shapes product portfolio and market positioning.",
    [["product-strategy", "core", 5], ["market-research", "core"], ["product-analytics", "important"], ["stakeholder-communication", "important"], ["budgeting", "supporting"]],
    { aliases: ["Strategy Manager"], keywords: ["strategy", "market"] }),
  R("project-manager", "Project Manager", "business", "Plans and delivers projects on scope, time and budget.",
    [["project-management", "core"], ["stakeholder-communication", "core"], ["delivery-management", "important"], ["budgeting", "important"], ["requirements", "supporting"]],
    { aliases: ["Project Lead", "Scrum Master", "Delivery Manager"], keywords: ["projects", "planning"] }),

  // ---------------- Education ----------------
  R("student", "Student", "education", "Building foundations while studying.",
    [["learning-skills", "core", 3], ["time-management", "core", 3], ["git", "important", 2], ["python", "important", 2], ["portfolio", "supporting", 2]],
    { aliases: ["University Student", "College Student", "Undergraduate"], keywords: ["study", "learning"], experienceLevel: "beginner" }),
  R("research-student", "Research Student", "education", "Postgraduate or doctoral student conducting supervised research.",
    [["research-methods", "core"], ["domain-expertise", "important"], ["scientific-writing", "core"], ["statistics", "important"], ["time-management", "supporting"]],
    { aliases: ["PhD Student", "Doctoral Candidate", "Masters Student", "Graduate Student"], keywords: ["thesis", "research"] }),
  R("academic-researcher", "Academic Researcher", "education", "Researches and publishes within a university or institute.",
    [["research-methods", "core", 5], ["domain-expertise", "core"], ["scientific-writing", "core"], ["teaching", "important"], ["statistics", "supporting"]],
    { aliases: ["Postdoc", "Lecturer", "Professor"], keywords: ["academia", "publications"], alsoIn: ["research"] }),
  R("technical-trainer", "Technical Trainer", "education", "Teaches technical skills to professionals.",
    [["teaching", "core"], ["curriculum-design", "important"], ["technical-writing", "important"], ["domain-expertise", "important"], ["stakeholder-communication", "supporting"]],
    { aliases: ["Corporate Trainer", "Instructor", "Bootcamp Instructor"], keywords: ["training", "teaching"] }),
  R("educator", "Educator", "education", "Teaches and supports learners' development.",
    [["teaching", "core"], ["curriculum-design", "core"], ["stakeholder-communication", "important"], ["domain-expertise", "important"]],
    { aliases: ["Teacher", "Tutor"], keywords: ["teaching", "school"] }),
  R("independent-learner", "Independent Learner", "education", "Self-directed learning toward a personal or career goal.",
    [["learning-skills", "core", 3], ["time-management", "core", 3], ["portfolio", "important", 3]],
    { aliases: ["Self-taught", "Self Learner", "Career Changer"], keywords: ["learning", "self-study"] }),

  // ---------------- Other ----------------
  R("freelancer", "Freelancer", "other", "Delivers independent client work across projects.",
    [["client-management", "core"], ["portfolio", "core"], ["time-management", "important"], ["personal-branding", "important"], ["budgeting", "supporting"]],
    { aliases: ["Contractor", "Freelance Developer", "Freelance Designer"], keywords: ["clients", "independent"] }),
  R("independent-professional", "Independent Professional", "other", "Works independently on their own practice or consultancy.",
    [["client-management", "core"], ["time-management", "core"], ["personal-branding", "important"], ["budgeting", "important"], ["consulting", "supporting"]],
    { aliases: ["Solo Consultant", "Self-employed"], keywords: ["independent", "practice"] })
];

export const CUSTOM_ROLE_ID = "custom";

function buildRole(definition) {
  const totalPriorityWeight = definition.skills.reduce(
    (sum, [, priority]) => sum + PRIORITY_WEIGHTS[priority],
    0
  );
  const skills = definition.skills.map(([skillId, priority, minLevel, weightOverride]) => {
    const skill = SKILL_LIBRARY[skillId];
    if (!skill) throw new Error(`Unknown skill ${skillId} in role ${definition.id}`);
    return {
      id: skillId,
      name: skill.name,
      priority,
      minLevel: minLevel ?? DEFAULT_MIN_LEVEL[priority],
      difficulty: skill.difficulty,
      weight: weightOverride ?? Number((PRIORITY_WEIGHTS[priority] / totalPriorityWeight).toFixed(4)),
      why: skill.why
    };
  });
  return {
    id: definition.id,
    name: definition.name,
    category: definition.category,
    categories: [definition.category, ...(definition.alsoIn || [])],
    description: definition.description,
    aliases: definition.aliases || [],
    keywords: definition.keywords || [],
    experienceLevel: definition.experienceLevel || null,
    skills,
    prerequisites: skills
      .filter((skill) => skill.priority === "core")
      .map((skill) => skill.name)
      .slice(0, 3),
    learningRecommendations: skills
      .filter((skill) => skill.priority === "core")
      .map((skill) => SKILL_LIBRARY[skill.id].project),
    legacy: Boolean(definition.legacy)
  };
}

export const CAREER_ROLES = Object.freeze(roleDefinitions.map(buildRole));

const rolesById = new Map(CAREER_ROLES.map((role) => [role.id, role]));
const rolesByLookup = new Map();
for (const role of CAREER_ROLES) {
  for (const label of [role.name, ...role.aliases]) {
    const key = normalizeLookup(label);
    if (!rolesByLookup.has(key)) rolesByLookup.set(key, role);
  }
}
const skillsByName = new Map();
for (const [id, skill] of Object.entries(SKILL_LIBRARY)) {
  for (const label of [skill.name, ...(skill.aliases || [])]) {
    const key = normalizeLookup(label);
    if (!skillsByName.has(key)) skillsByName.set(key, { id, ...skill });
  }
}

export function normalizeLookup(value) {
  return String(value ?? "").normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}

export function getRoleById(id) {
  return typeof id === "string" ? rolesById.get(id) || null : null;
}

/** Resolves an exact role name or alias (case/whitespace-insensitive). */
export function findRoleByName(name) {
  return rolesByLookup.get(normalizeLookup(name)) || null;
}

export function findSkillByName(name) {
  return skillsByName.get(normalizeLookup(name)) || null;
}

export function getCategoryName(categoryId) {
  return CAREER_CATEGORIES.find((category) => category.id === categoryId)?.name || "Other";
}

/**
 * Ranked search across names, aliases, keywords and category names.
 * Scores: exact name 100 · name prefix 80 · alias exact 70 · name word 60 ·
 * alias contains 45 · keyword 35 · category 25 · description 10.
 */
export function searchCareerRoles(query, { categoryId = null, limit = 50 } = {}) {
  const q = normalizeLookup(query);
  const pool = categoryId ? CAREER_ROLES.filter((role) => role.categories.includes(categoryId)) : CAREER_ROLES;
  if (!q) return pool.slice(0, limit);
  const terms = q.split(" ").filter(Boolean);
  const scored = [];
  for (const role of pool) {
    const name = normalizeLookup(role.name);
    const aliases = role.aliases.map(normalizeLookup);
    const keywords = role.keywords.map(normalizeLookup);
    const categories = role.categories.map((id) => normalizeLookup(getCategoryName(id)));
    const description = normalizeLookup(role.description);
    let score = 0;
    if (name === q) score = 100;
    else if (name.startsWith(q)) score = 80;
    else if (aliases.includes(q)) score = 70;
    else if (name.split(/[\s/.-]+/).some((word) => word.startsWith(q))) score = 60;
    else if (aliases.some((alias) => alias.includes(q))) score = 45;
    else if (terms.every((term) => [name, ...aliases, ...keywords, ...categories].some((field) => field.includes(term)))) score = 35;
    else if (categories.some((category) => category.includes(q))) score = 25;
    else if (description.includes(q)) score = 10;
    if (score > 0) scored.push({ role, score });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.role.name.localeCompare(b.role.name))
    .slice(0, limit)
    .map((entry) => entry.role);
}

/**
 * Deterministic suggestions for a custom role title: finds catalogue roles that
 * share words with the title and returns their skills for the user to approve.
 * Nothing is applied automatically.
 */
export function suggestSkillsForTitle(title, limit = 8) {
  const words = normalizeLookup(title)
    .split(/[^a-z0-9+#.]+/)
    .filter((word) => word.length > 2 && !["and", "the", "for", "with", "senior", "junior", "lead"].includes(word));
  if (words.length === 0) return { basedOn: [], skills: [] };
  const matches = CAREER_ROLES.map((role) => {
    const haystack = [role.name, ...role.aliases, ...role.keywords].map(normalizeLookup).join(" ");
    return { role, hits: words.filter((word) => haystack.includes(word)).length };
  })
    .filter((match) => match.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 2);
  const seen = new Set();
  const skills = [];
  for (const { role } of matches) {
    for (const skill of role.skills) {
      if (!seen.has(skill.id) && skills.length < limit) {
        seen.add(skill.id);
        skills.push({ name: skill.name, priority: skill.priority });
      }
    }
  }
  return { basedOn: matches.map((match) => match.role.name), skills };
}
