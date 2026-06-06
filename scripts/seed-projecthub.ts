import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import dotenv from "dotenv";

// ── Env loader ────────────────────────────────────────────────────────────────
// .env.local takes precedence; .env fills any gaps. dotenv never overrides
// variables that are already set in the shell environment.
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(`
❌  Missing required environment variables.

  NEXT_PUBLIC_SUPABASE_URL   – already in .env.local
  SUPABASE_SERVICE_ROLE_KEY  – Supabase dashboard → Project Settings → API → service_role key

Add SUPABASE_SERVICE_ROLE_KEY to .env.local (it is already in .gitignore).
`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Seed data ─────────────────────────────────────────────────────────────────
// All seed records carry is_ai_generated = true so they can be identified
// and cleared without ever touching real user data.

const SEED_DOMAIN = "@seed.ph.internal";

interface SeedProfile {
  email: string;
  full_name: string;
  username: string;
  university: string;
  role: string;
  bio: string;
  skills: string;
  interests: string;
  github_url: string | null;
}

const SEED_PROFILES: SeedProfile[] = [
  {
    email: `kenji.watanabe${SEED_DOMAIN}`,
    full_name: "Kenji Watanabe",
    username: "kenji_builds",
    university: "Stanford University",
    role: "Full-stack Developer",
    bio: "CS senior at Stanford shipping full-stack products since sophomore year. Ex-Stripe intern on the payments infra team. I want co-founders who are obsessed with craft, not just shipping.",
    skills: "TypeScript, Next.js, Rust, PostgreSQL, Kubernetes",
    interests: "Developer tools, fintech infrastructure, open-source",
    github_url: null,
  },
  {
    email: `aisha.okonkwo${SEED_DOMAIN}`,
    full_name: "Aisha Okonkwo",
    username: "aisha_nlp",
    university: "MIT",
    role: "ML Engineer",
    bio: "MIT PhD student researching LLMs for low-resource languages. Fine-tuned models that outperform GPT-4 on specific domains by 40%. Looking for a product person who understands what AI can actually do — not just what TechCrunch says.",
    skills: "Python, PyTorch, Hugging Face, LangChain, CUDA",
    interests: "NLP, AI accessibility, healthcare AI, EdTech",
    github_url: null,
  },
  {
    email: `carlos.mendez${SEED_DOMAIN}`,
    full_name: "Carlos Mendez",
    username: "carlos_ios",
    university: "USC",
    role: "iOS Developer",
    bio: "Shipped 5 apps on the App Store, including one that hit #2 in Productivity. SwiftUI native only — I don't believe in cross-platform for consumer apps that people actually love. Looking for a backend partner and a real problem.",
    skills: "Swift, SwiftUI, Combine, CloudKit, Xcode",
    interests: "Consumer apps, health tech, campus tools",
    github_url: null,
  },
  {
    email: `priya.sharma${SEED_DOMAIN}`,
    full_name: "Priya Sharma",
    username: "priya_ux",
    university: "NYU",
    role: "Product Designer",
    bio: "NYU HCI grad student designing for healthcare. Did a 6-month residency at Bellevue Hospital to learn what actual patients experience. Most healthtech UX is designed by people who've never been sick — I'm trying to fix that.",
    skills: "Figma, Prototyping, UX Research, Service Design, Framer",
    interests: "Healthcare UX, accessibility, mental health, patient experience",
    github_url: null,
  },
  {
    email: `ethan.park${SEED_DOMAIN}`,
    full_name: "Ethan Park",
    username: "ethan_infra",
    university: "Carnegie Mellon University",
    role: "Backend Engineer",
    bio: "CMU senior obsessed with distributed systems. Maintains a Postgres extension with 900 GitHub stars. I've built systems that handle 50k req/sec — now I want to build something people actually care about using.",
    skills: "Go, PostgreSQL, Kafka, Redis, AWS, Docker",
    interests: "Infrastructure, B2B SaaS, dev tools, real-time systems",
    github_url: null,
  },
  {
    email: `zoe.campbell${SEED_DOMAIN}`,
    full_name: "Zoe Campbell",
    username: "zoe_growth",
    university: "Harvard University",
    role: "Growth & Marketing",
    bio: "Harvard MBA, 4 years in D2C before school. Grew a skincare brand from $0 to $2.1M ARR using content and community before it was trendy. I know how to find and keep customers — I need a product worth finding.",
    skills: "Growth Strategy, SEO, Content Marketing, Analytics, Paid Acquisition",
    interests: "Consumer brands, marketplace, social commerce",
    github_url: null,
  },
  {
    email: `marcus.williams${SEED_DOMAIN}`,
    full_name: "Marcus Williams",
    username: "marcus_data",
    university: "Georgia Tech",
    role: "Data Scientist",
    bio: "Georgia Tech CS + Business double major and former Division I track athlete. Building at the intersection of sports science and data. I've analyzed performance data for Olympic-level athletes — now I want to build products around it.",
    skills: "Python, SQL, dbt, Tableau, R, Pandas, BigQuery",
    interests: "Sports tech, health analytics, performance science, EdTech",
    github_url: null,
  },
  {
    email: `leila.hassan${SEED_DOMAIN}`,
    full_name: "Leila Hassan",
    username: "leila_frontend",
    university: "UC Berkeley",
    role: "Frontend Developer",
    bio: "Berkeley EECS junior deeply annoyed by slow, inaccessible websites. My personal projects score 99 on Lighthouse. Accessibility isn't an afterthought — I've been building with screen reader testing since high school.",
    skills: "React, TypeScript, CSS, Web Performance, WCAG, Testing Library",
    interests: "Accessibility, consumer apps, design systems, social products",
    github_url: null,
  },
  {
    email: `jake.morrison${SEED_DOMAIN}`,
    full_name: "Jake Morrison",
    username: "jake_biz",
    university: "Wharton, UPenn",
    role: "Business & Strategy",
    bio: "Wharton MBA with 3 years at JPMorgan structuring deals before I figured out I wanted to build, not advise. I can model a business, close enterprise customers, and keep the cap table clean. Looking for a strong technical co-founder.",
    skills: "Financial Modeling, Enterprise Sales, SQL, Product Strategy, Operations",
    interests: "Fintech, B2B SaaS, marketplace, compliance tools",
    github_url: null,
  },
  {
    email: `nina.petrov${SEED_DOMAIN}`,
    full_name: "Nina Petrov",
    username: "nina_fullstack",
    university: "Columbia University",
    role: "Full-stack Developer",
    bio: "Columbia Climate Science + CS double major. My thesis is on carbon accounting in supply chains. I want to build the software infrastructure that makes sustainability reporting unavoidable — and actually useful — for every company.",
    skills: "Next.js, Python, PostgreSQL, Supabase, D3.js",
    interests: "Climate tech, sustainability, environmental data, B2B SaaS",
    github_url: null,
  },
  {
    email: `omar.abdullah${SEED_DOMAIN}`,
    full_name: "Omar Abdullah",
    username: "omar_cv",
    university: "Princeton University",
    role: "ML Engineer",
    bio: "Princeton EECS specializing in computer vision for real-world deployment. My research is cited in 6 papers. I know the gap between a benchmark score and something that actually works in production — and I build for the latter.",
    skills: "Python, PyTorch, OpenCV, TensorRT, ONNX, MLflow",
    interests: "Computer vision, autonomous systems, agriculture tech, climate",
    github_url: null,
  },
  {
    email: `emma.liu${SEED_DOMAIN}`,
    full_name: "Emma Liu",
    username: "emma_pm",
    university: "Northwestern University",
    role: "Product Manager",
    bio: "Northwestern grad and ex-Meta APM on the Instagram DMs team. I know what 0-to-1 looks like inside a big company — the committee, the 6-month roadmap, the 3 PMs for one feature. Now I want to do it in a week.",
    skills: "Product Strategy, User Research, SQL, A/B Testing, Roadmapping",
    interests: "Consumer social, messaging, creator tools, marketplace",
    github_url: null,
  },
  {
    email: `ryan.oconnell${SEED_DOMAIN}`,
    full_name: "Ryan O'Connell",
    username: "ryan_android",
    university: "UT Austin",
    role: "Android Developer",
    bio: "UT Austin CS senior. Android specialist who has built mobile payment flows that process real money under real load. Fintech and health are the only sectors where I think native mobile still clearly beats cross-platform.",
    skills: "Kotlin, Jetpack Compose, Android SDK, Room, Retrofit",
    interests: "Fintech, health tech, mobile payments, campus tools",
    github_url: null,
  },
  {
    email: `sasha.ivanova${SEED_DOMAIN}`,
    full_name: "Sasha Ivanova",
    username: "sasha_design",
    university: "Yale University",
    role: "Product Designer",
    bio: "Yale Art + CS, brand and UX. Designed the visual identities of 14 student startups. Most design conversations miss the emotional layer — I care about how a product makes you feel at 2am when you actually need it.",
    skills: "Figma, Branding, Motion Design, User Testing, Illustration",
    interests: "Social products, mental health, consumer apps, creative tools",
    github_url: null,
  },
  {
    email: `theo.bernard${SEED_DOMAIN}`,
    full_name: "Theo Bernard",
    username: "theo_realtime",
    university: "University of Michigan",
    role: "Backend Engineer",
    bio: "Michigan EECS building real-time collaborative systems. Co-authored a paper on CRDTs at SOSP. I find most collaboration software unforgivably slow — I'm looking for a problem that requires the kind of infrastructure I know how to build.",
    skills: "Elixir, Rust, WebSockets, CRDTs, PostgreSQL, Distributed Systems",
    interests: "Real-time collaboration, dev tools, B2B SaaS, productivity",
    github_url: null,
  },
  {
    email: `amara.diallo${SEED_DOMAIN}`,
    full_name: "Amara Diallo",
    username: "amara_builds",
    university: "Howard University",
    role: "Full-stack Developer",
    bio: "Howard University CS senior building in health equity. My mom is a nurse — I grew up watching what under-resourced healthcare looks like. I write clean, tested code and I care deeply about who gets left out of the products we build.",
    skills: "React, Node.js, Python, PostgreSQL, AWS, Jest",
    interests: "Health equity, community health, EdTech, social impact",
    github_url: null,
  },
  {
    email: `lucas.ferreira${SEED_DOMAIN}`,
    full_name: "Lucas Ferreira",
    username: "lucas_climate",
    university: "UCLA",
    role: "Data Scientist",
    bio: "UCLA Environmental Data Science MS. Built carbon lifecycle models for three California utilities and two cities. Climate is the only sector where I think software can still create irreversible change — fast. Looking for a builder obsessed with this problem.",
    skills: "Python, R, SQL, GIS, Tableau, dbt, Spark",
    interests: "Climate tech, energy systems, environmental policy, sustainability",
    github_url: null,
  },
  {
    email: `isabel.torres${SEED_DOMAIN}`,
    full_name: "Isabel Torres",
    username: "isabel_ios",
    university: "Boston University",
    role: "iOS Developer",
    bio: "BU CS + Geography double major. Shipped a campus navigation app that 4,000 BU students downloaded in the first week. Location-aware products are my specialty — I want to build something that knows where you are and actually helps.",
    skills: "Swift, SwiftUI, MapKit, CoreLocation, ARKit, Firebase",
    interests: "Location tech, campus apps, travel, urban planning",
    github_url: null,
  },
  {
    email: `kai.nakamura${SEED_DOMAIN}`,
    full_name: "Kai Nakamura",
    username: "kai_ai",
    university: "Stanford University",
    role: "ML Engineer",
    bio: "Stanford AI PhD, robotics and vision. My research makes vision models work in the real world, not just on benchmarks — domain shift, distribution mismatch, the stuff that breaks at deployment. Looking for a founder-type to translate this into product.",
    skills: "Python, PyTorch, ROS2, CUDA, MLOps, C++",
    interests: "Autonomous systems, robotics, agriculture tech, climate",
    github_url: null,
  },
  {
    email: `chloe.asante${SEED_DOMAIN}`,
    full_name: "Chloe Asante",
    username: "chloe_ui",
    university: "Rhode Island School of Design",
    role: "Product Designer",
    bio: "RISD Industrial Design, coding on the side. Designed the UI for two products that got into YC. I work in Figma and code in parallel — my prototypes actually work, not just look good in a Loom demo.",
    skills: "Figma, React, CSS, Motion Design, Design Systems, Storybook",
    interests: "Design systems, EdTech, climate, consumer apps",
    github_url: null,
  },
  {
    email: `ben.hartley${SEED_DOMAIN}`,
    full_name: "Ben Hartley",
    username: "ben_devtools",
    university: "University of Oxford",
    role: "Full-stack Developer",
    bio: "Oxford CS finalist. Built and sold a SaaS dev tool to 200 paying customers before graduating. Looking for a larger problem and a US-based co-founder who wants to build infrastructure that developers actually love using.",
    skills: "TypeScript, Go, React, PostgreSQL, Stripe, Docker",
    interests: "Developer tools, API infrastructure, open-source, B2B SaaS",
    github_url: null,
  },
  {
    email: `fatima.alrashid${SEED_DOMAIN}`,
    full_name: "Fatima Al-Rashid",
    username: "fatima_ops",
    university: "Harvard University",
    role: "Operations & Strategy",
    bio: "Harvard Economics + CS. My thesis analyzed Airbnb's supply-side incentive structure — what makes a marketplace actually liquid. Now I want to build the marketplace I've spent three years writing papers about.",
    skills: "Marketplace Design, Financial Modeling, SQL, Operations, Fundraising",
    interests: "Marketplace, platform economics, logistics, EdTech",
    github_url: null,
  },
  {
    email: `noah.chen${SEED_DOMAIN}`,
    full_name: "Noah Chen",
    username: "noah_iot",
    university: "Carnegie Mellon University",
    role: "Hardware & IoT Engineer",
    bio: "CMU ECE with a focus on embedded systems. Built IoT sensor nodes that run for 3 years on a coin battery and transmit over LoRaWAN. Hardware is where software-only solutions hit a wall — especially in climate and agriculture.",
    skills: "C, C++, Embedded Systems, PCB Design, LoRaWAN, RTOS",
    interests: "Climate tech, precision agriculture, IoT, smart infrastructure",
    github_url: null,
  },
  {
    email: `diana.fernandez${SEED_DOMAIN}`,
    full_name: "Diana Fernandez",
    username: "diana_dataviz",
    university: "Cornell University",
    role: "Frontend Developer",
    bio: "Cornell Information Science, data visualization researcher. Built interactive dashboards used by NYC city planners. If your product has complex data, I can make it legible to anyone — without dumbing it down.",
    skills: "D3.js, React, TypeScript, Observable, SVG, WebGL",
    interests: "Data visualization, civic tech, climate, urban planning",
    github_url: null,
  },
  {
    email: `darius.mitchell${SEED_DOMAIN}`,
    full_name: "Darius Mitchell",
    username: "darius_saas",
    university: "University of Pennsylvania",
    role: "Growth & Marketing",
    bio: "UPenn Wharton + CIS dual degree. Closed my first 8 B2B SaaS customers before junior year — cold outreach, demo, contract, all of it. I understand enterprise sales cycles but move fast enough to close in under a week.",
    skills: "B2B Sales, CRM, Cold Outreach, Copywriting, SQL, Product Analytics",
    interests: "B2B SaaS, developer tools, productivity, compliance",
    github_url: null,
  },
];

interface SeedProject {
  title: string;
  tagline: string;
  description: string;
  category: string;
  stage: "idea" | "mvp" | "launched";
  looking_for: string;
  tech_stack: string;
}

const SEED_PROJECTS: SeedProject[] = [
  {
    title: "OfficeHours",
    tagline: "Book 1:1 sessions with professors at any partner university",
    description:
      "Professors at elite universities hold office hours that 90% of students never use. OfficeHours creates a cross-university marketplace where students at any partner school can book verified 1:1 sessions with professors outside their own institution. Think: a guest lecture, but just for you. Six professors have already agreed to pilot.",
    category: "EdTech",
    stage: "idea",
    looking_for: "Full-stack Developer, UX Designer",
    tech_stack: "Next.js, Supabase, Cal.com API, Stripe",
  },
  {
    title: "Trckr",
    tagline: "Habit-building designed for ADHD brains, not neurotypical ones",
    description:
      "ADHD is underdiagnosed in college and every habit app assumes neurotypical users. Trckr uses behavioral science to build reward loops that actually work — variable rewards, streak forgiveness without shame spirals, and pattern analysis to surface your personal productivity windows. Backed by a clinical psych advisor from Penn.",
    category: "Health & Wellness",
    stage: "mvp",
    looking_for: "iOS Developer, ML Engineer",
    tech_stack: "React Native, Python, Supabase, OpenAI API",
  },
  {
    title: "PitchPal",
    tagline: "An AI that grills your startup idea like a skeptical YC partner",
    description:
      "Most startup ideas die because nobody will honestly pressure-test them. PitchPal is an AI that asks the uncomfortable questions — it finds holes in your market sizing, challenges your GTM assumptions, and won't let you off the hook with vague answers. 300 founders in beta, with 40 crediting it for pivots that saved their companies.",
    category: "AI Tools",
    stage: "mvp",
    looking_for: "Growth Marketer",
    tech_stack: "Next.js, OpenAI API, Supabase, Vercel",
  },
  {
    title: "SummerSublet",
    tagline: ".edu-verified short-term sublet marketplace for semester breaks",
    description:
      "Every summer, thousands of students overpay to break their lease or scramble to find a 3-month tenant on Craigslist. SummerSublet is .edu-verified, built around academic calendar timelines, and includes a roommate compatibility layer. No Facebook groups, no sketchy DMs — just trusted, campus-native subletting.",
    category: "Marketplace",
    stage: "idea",
    looking_for: "Full-stack Developer, iOS Developer",
    tech_stack: "Next.js, Supabase, Stripe, Mapbox",
  },
  {
    title: "Lecture.fm",
    tagline: "Your lecture recordings, re-edited into podcast-style study audio",
    description:
      "Upload a lecture recording and Lecture.fm re-edits it into a clean audio episode — trimming dead air, adding chapter markers at topic transitions, and generating a written summary. Used by 1,200 students across 8 universities. Premium tier with auto-flashcard generation launches next semester.",
    category: "EdTech",
    stage: "launched",
    looking_for: "ML Engineer",
    tech_stack: "Next.js, OpenAI Whisper, GPT-4o, Supabase",
  },
  {
    title: "LabQueue",
    tagline: "Real-time equipment scheduler for shared university research labs",
    description:
      "Research labs share expensive equipment — PCR machines, centrifuges, electron microscopes — using a physical sign-up sheet on the door. LabQueue replaces the clipboard with real-time bookings, usage analytics, and automated maintenance alerts. 14 labs across 3 universities paying $180/month each.",
    category: "Research Tools",
    stage: "launched",
    looking_for: "Full-stack Developer",
    tech_stack: "Next.js, Supabase, PostgreSQL, Resend",
  },
  {
    title: "ClubOS",
    tagline: "The operating system for student clubs — treasury, roster, events",
    description:
      "Student clubs waste half their energy on admin: Venmo splits, reply-all email chains, Google Sheets rosters no one updates. ClubOS is the operating system — shared treasury with transaction history, member permissions, event ticketing, and an alumni re-engagement layer. Piloting with 6 clubs at our university with 4 more waitlisted.",
    category: "EdTech",
    stage: "mvp",
    looking_for: "Full-stack Developer, Product Designer",
    tech_stack: "Next.js, Supabase, Stripe, Resend",
  },
  {
    title: "PostMatch",
    tagline: "Job discovery for students where companies have to move first",
    description:
      "Job searching is a full-time job for the wrong reasons — hundreds of apps, no responses, no transparency. PostMatch flips the model: students create a profile, companies post open roles, and a mutual match means the company has 48 hours to reach out before the slot disappears. No more black holes. Launching at 5 campuses in spring.",
    category: "Career",
    stage: "idea",
    looking_for: "Full-stack Developer, Growth Marketer",
    tech_stack: "Next.js, Supabase, SendGrid, TypeScript",
  },
  {
    title: "Clarity",
    tagline: "Records your meetings, removes filler, delivers a summary in 2 minutes",
    description:
      "Clarity joins your Zoom or Google Meet, removes filler words and tangents, and delivers a bullet-point summary with action items and owners within 2 minutes of the call ending. 800 monthly active users growing 20% week over week. Enterprise tier with CRM sync closes first deal next month.",
    category: "Productivity",
    stage: "launched",
    looking_for: "Growth Marketer, Enterprise Sales",
    tech_stack: "Next.js, OpenAI Whisper, GPT-4o, Supabase, Vercel",
  },
  {
    title: "ThriftU",
    tagline: "Campus-local secondhand marketplace, .edu login required",
    description:
      "Secondhand clothing marketplaces break down on campus because you can't ship a hoodie to someone three floors above you. ThriftU is campus-local, .edu-verified, and built around in-person exchanges — no shipping, no strangers, no fees. $14,000 in GMV across 3 campuses in the first month with zero marketing spend.",
    category: "Marketplace",
    stage: "mvp",
    looking_for: "iOS Developer, Growth Marketer",
    tech_stack: "React Native, Supabase, Stripe, Expo",
  },
  {
    title: "Solarpunk",
    tagline: "Carbon footprint gamification for campus sustainability committees",
    description:
      "Sustainability committees have real budgets and real mandates but no way to measure the actual impact of their programs. Solarpunk turns campus actions into points, runs dormitory vs. dormitory competitions, and connects every action to real carbon data pulled from campus facilities management systems.",
    category: "Climate Tech",
    stage: "mvp",
    looking_for: "Full-stack Developer, Data Scientist",
    tech_stack: "Next.js, PostgreSQL, Python, AWS, Mapbox",
  },
  {
    title: "MedBuddy",
    tagline: "Medication adherence with a peer accountability layer",
    description:
      "40% of college students with chronic conditions stop taking medication consistently within 6 months. MedBuddy adds a peer accountability layer — a trusted friend gets a quiet nudge if you miss two doses in a row, not a robocall from a pharmacy. 180 active users, 94% adherence rate in the pilot cohort.",
    category: "Health & Wellness",
    stage: "mvp",
    looking_for: "iOS Developer, Backend Developer",
    tech_stack: "React Native, Supabase, Twilio, Expo",
  },
  {
    title: "QuickDraft",
    tagline: "First drafts of legal docs for student founders, in under 60 seconds",
    description:
      "Student founders sign bad agreements because real legal help is expensive and slow. QuickDraft generates first drafts of NDAs, equity agreements, advisor contracts, and service agreements in under a minute — and explains every clause in plain English so you know what you're actually signing.",
    category: "Legal Tech",
    stage: "idea",
    looking_for: "Full-stack Developer, Legal Advisor",
    tech_stack: "Next.js, OpenAI API, Supabase, PDF generation",
  },
  {
    title: "FounderGPS",
    tagline: "Weekly async video check-ins for solo bootstrapped founders",
    description:
      "Solo founders lose momentum because there's no accountability structure. FounderGPS is simple: record your goals Sunday night, record your wins Friday evening, and watch your 12-week arc unfold. 500 founders using it, 65% post every single week. Adding peer cohorts next quarter.",
    category: "Productivity",
    stage: "launched",
    looking_for: "Growth Marketer",
    tech_stack: "Next.js, Supabase, Mux Video, Vercel",
  },
  {
    title: "SlateAI",
    tagline: "An AI agent that negotiates meeting times so you never open your calendar",
    description:
      "Scheduling across 5+ people with different tools, time zones, and preferences is a full-time job. SlateAI reads everyone's calendars, understands priorities and preferences, and negotiates time slots on your behalf — sending invites without you ever touching your calendar. Closing first enterprise pilot with a 200-person org next week.",
    category: "AI Tools",
    stage: "mvp",
    looking_for: "ML Engineer, Enterprise Sales",
    tech_stack: "Next.js, OpenAI API, Google Calendar API, PostgreSQL",
  },
  {
    title: "CampusCredit",
    tagline: "Build credit in college, co-signed by your university's alumni network",
    description:
      "Most college students can't get a credit card without a parent co-signer. CampusCredit replaces the parent with the university's alumni network — alumni co-sign small credit lines and get a small stake in the student's future financial success. Structured as a financial product, not a charity. Three schools in private beta.",
    category: "Fintech",
    stage: "mvp",
    looking_for: "Full-stack Developer, Compliance Advisor",
    tech_stack: "Next.js, Supabase, Plaid, Stripe Issuing",
  },
  {
    title: "GreenLeaf",
    tagline: "Automatic sustainability reporting for campus food service operations",
    description:
      "Campus food service is one of the biggest sustainability challenges universities face, but no operations team can measure it in real time. GreenLeaf integrates with existing food service management software and generates LEED-compatible sustainability reports automatically — no consultant, no spreadsheet. First paying contract signed.",
    category: "Climate Tech",
    stage: "mvp",
    looking_for: "Full-stack Developer, Data Scientist",
    tech_stack: "Next.js, Python, PostgreSQL, AWS, Supabase",
  },
  {
    title: "NutriDorm",
    tagline: "Macro tracking pre-loaded with your university's actual dining hall menus",
    description:
      "Nutrition apps treat every chicken breast the same regardless of how it was cooked. NutriDorm pre-loads the exact macro and micronutrient profiles of your university's dining hall — updated daily from the school's own nutrition data. Plan your meals before you walk in. Eat intentionally without thinking.",
    category: "Health & Wellness",
    stage: "idea",
    looking_for: "iOS Developer, Full-stack Developer",
    tech_stack: "React Native, Supabase, university dining APIs, Expo",
  },
  {
    title: "InternLink",
    tagline: "Verified peer reviews of internships, searchable by team and manager",
    description:
      "Glassdoor reviews are anonymous, stale, and biased toward bad experiences posted by people who just got fired. InternLink requires .edu verification and focuses specifically on internship quality — team culture, actual learning, manager accessibility. 600 verified reviews across 120 companies in the first 90 days.",
    category: "Career",
    stage: "mvp",
    looking_for: "Full-stack Developer, Growth Marketer",
    tech_stack: "Next.js, Supabase, PostgreSQL, Resend",
  },
  {
    title: "DesignDeck",
    tagline: "Shared mood board and design feedback canvas for student creative teams",
    description:
      "Student creative teams scatter assets across Google Drive, Notion, and random Slack channels. DesignDeck is a shared visual workspace built for design feedback — real-time collaboration, version history, and a commenting layer that understands visual context. Think Figma for the ideation phase, not the execution phase.",
    category: "Design Tools",
    stage: "idea",
    looking_for: "Full-stack Developer, Product Designer",
    tech_stack: "Next.js, WebSockets, Supabase, Canvas API",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

// Spreads index i across the last maxDays days with slight jitter so timestamps
// look organic rather than perfectly uniform.
function withinLastDays(i: number, total: number, maxDays = 14): string {
  const totalHours = maxDays * 24;
  const stepHours = totalHours / Math.max(total - 1, 1);
  const jitterHours = (i % 5) * 0.9; // up to ~4 hours of variation
  const hoursAgo = Math.round(i * stepHours + jitterHours);
  return new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
}

// Suppress unused warning — daysAgo is kept for potential manual overrides.
void daysAgo;

async function loadExistingAuthUsers(): Promise<Map<string, string>> {
  const emailToId = new Map<string, string>();
  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`listUsers page ${page}: ${error.message}`);
    for (const u of data.users) {
      if (u.email) emailToId.set(u.email, u.id);
    }
    if (data.users.length < perPage) break;
    page++;
  }
  return emailToId;
}

async function getOrCreateAuthUser(
  email: string,
  cache: Map<string, string>
): Promise<string> {
  const cached = cache.get(email);
  if (cached) return cached;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: randomUUID(),
    email_confirm: true,
    user_metadata: { is_seed: true },
  });
  if (error) throw new Error(`createUser(${email}): ${error.message}`);
  const id = data.user.id;
  cache.set(email, id);
  return id;
}

// ── Seed runners ──────────────────────────────────────────────────────────────

async function seedProfiles(authCache: Map<string, string>): Promise<string[]> {
  console.log("\n🌱  Seeding builder profiles…");
  const seededIds: string[] = [];

  for (let i = 0; i < SEED_PROFILES.length; i++) {
    const { email, ...fields } = SEED_PROFILES[i];
    try {
      const userId = await getOrCreateAuthUser(email, authCache);
      const { error } = await supabase.from("profiles").upsert(
        {
          id: userId,
          ...fields,
          linkedin_url: null,
          portfolio_url: null,
          avatar_url: null,
          is_ai_generated: true,
          created_at: withinLastDays(i, SEED_PROFILES.length),
        },
        { onConflict: "id" }
      );
      if (error) {
        console.error(`  ✗  ${fields.full_name}: ${error.message}`);
      } else {
        console.log(`  ✓  ${fields.full_name} (@${fields.username})`);
        seededIds.push(userId);
      }
    } catch (err: unknown) {
      console.error(
        `  ✗  ${fields.full_name}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return seededIds;
}

async function seedProjects(ownerIds: string[]): Promise<void> {
  console.log("\n🚀  Seeding projects…");

  if (ownerIds.length === 0) {
    console.warn("  ⚠  No owner IDs available — skipping project seed.");
    return;
  }

  for (let i = 0; i < SEED_PROJECTS.length; i++) {
    const proj = SEED_PROJECTS[i];

    // Idempotency: skip if a seeded project with this title already exists
    const { data: existing, error: checkErr } = await supabase
      .from("projects")
      .select("id")
      .eq("title", proj.title)
      .eq("is_ai_generated", true)
      .maybeSingle();

    if (checkErr) {
      console.error(`  ✗  ${proj.title}: ${checkErr.message}`);
      continue;
    }
    if (existing) {
      console.log(`  ↩  Skipped (exists): ${proj.title}`);
      continue;
    }

    const { error } = await supabase.from("projects").insert({
      ...proj,
      owner_id: ownerIds[i % ownerIds.length],
      is_ai_generated: true,
      created_at: withinLastDays(i, SEED_PROJECTS.length),
    });

    if (error) {
      console.error(`  ✗  ${proj.title}: ${error.message}`);
    } else {
      console.log(`  ✓  ${proj.title} [${proj.stage}]`);
    }
  }
}

// ── Clear runner ──────────────────────────────────────────────────────────────
// Deletes ONLY rows where is_ai_generated = true. Real user data is untouched.

async function clearSeedData(): Promise<void> {
  console.log("\n🧹  Clearing seed data (is_ai_generated = true)…\n");
  console.log("    Real user data will NOT be touched.\n");

  // 1. Seeded projects
  const { error: projErr, count: projCount } = await supabase
    .from("projects")
    .delete({ count: "exact" })
    .eq("is_ai_generated", true);
  if (projErr) console.error(`  ✗  projects: ${projErr.message}`);
  else console.log(`  ✓  Deleted ${projCount ?? 0} project(s)`);

  // 2. Seeded profiles
  const { data: seededProfiles } = await supabase
    .from("profiles")
    .select("id")
    .eq("is_ai_generated", true);
  const seedIds = (seededProfiles ?? []).map((p: { id: string }) => p.id);

  if (seedIds.length > 0) {
    const { error: profErr, count: profCount } = await supabase
      .from("profiles")
      .delete({ count: "exact" })
      .eq("is_ai_generated", true);
    if (profErr) console.error(`  ✗  profiles: ${profErr.message}`);
    else console.log(`  ✓  Deleted ${profCount ?? 0} profile(s)`);
  }

  // 3. Seed auth users (identified by their @seed.ph.internal email domain)
  const authMap = await loadExistingAuthUsers();
  let deletedAuth = 0;
  for (const { email } of SEED_PROFILES) {
    const uid = authMap.get(email);
    if (!uid) continue;
    const { error } = await supabase.auth.admin.deleteUser(uid);
    if (error) console.error(`  ✗  auth user ${email}: ${error.message}`);
    else deletedAuth++;
  }
  if (deletedAuth > 0) console.log(`  ✓  Deleted ${deletedAuth} auth user(s)`);

  console.log("\n✅  Seed data cleared.");
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const isClear = process.argv.includes("--clear");

  console.log("\nProjectHub Seed Script");
  console.log("======================");
  console.log(`Target: ${SUPABASE_URL}`);

  if (isClear) {
    await clearSeedData();
    return;
  }

  // Load existing auth users once (avoids per-profile round-trips)
  const authCache = await loadExistingAuthUsers();
  console.log(`\nFound ${authCache.size} existing auth user(s) in project`);

  // Collect already-seeded profile IDs so projects can reference them
  const { data: preSeeded } = await supabase
    .from("profiles")
    .select("id")
    .eq("is_ai_generated", true);
  const preExistingIds = (preSeeded ?? []).map((p: { id: string }) => p.id);

  const newIds = await seedProfiles(authCache);
  const allOwnerIds = Array.from(new Set([...preExistingIds, ...newIds]));

  await seedProjects(allOwnerIds);

  console.log(`
✅  Seed complete!

Verify in Supabase dashboard:
  → Table Editor → profiles  (filter is_ai_generated = true → should show 25 rows)
  → Table Editor → projects  (filter is_ai_generated = true → should show 20 rows)

Verify in the browser (run npm run dev first):
  → /builders  (should show 25 builder cards spread across the last 14 days)
  → /projects  (should show 20 project cards across idea / mvp / launched)

To reset seed data:
  npm run seed:clear
`);
}

main().catch((err: unknown) => {
  console.error(
    "\n❌  Seed failed:",
    err instanceof Error ? err.message : err
  );
  process.exit(1);
});
