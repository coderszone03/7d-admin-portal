export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'internship'

// Persisted status — maps to API status codes:
//   'draft'  → 0
//   'open'   → 1
//   'filled' → 2  (position filled, kept visible but no longer accepting)
export type JobStatus = 'draft' | 'open' | 'filled'

export type WhatYoullDo = {
  subtitle: string
  intro: string
  items: string[]
}

export type JobPost = {
  id: string
  title: string
  department: string
  location: string
  employmentType: EmploymentType
  aboutCompany: string
  whatYoullDo: WhatYoullDo
  whatYouBring: string[]
  why7d: string[]
  readyToJoinDescription: string
  status: JobStatus
}

const ABOUT_7D =
  "We're a no-fluff, all-ideas creative agency that blends branding, marketing, and design to solve business problems. At 7D Design, we create campaigns that hit the sweet spot between strategy and storytelling. If you're into bold ideas, solid execution, and memes that convert — you're in the right place."

export const JOB_POSTS: JobPost[] = [
  {
    id: 'job-1',
    title: 'Senior Product Designer',
    department: 'Design',
    location: 'Remote',
    employmentType: 'full-time',
    aboutCompany: ABOUT_7D,
    whatYoullDo: {
      subtitle: 'Design end-to-end',
      intro:
        'Lead end-to-end product design for our flagship SaaS platform. Own discovery, shape direction, and ship polished features with product and engineering partners.',
      items: [
        'Discovery & User Research',
        'End-to-End Design Ownership',
        'Design System Contribution',
        'Cross-functional Collaboration',
        'Mentorship & Critique',
      ],
    },
    whatYouBring: [
      '6+ years of product design experience at B2B or B2C SaaS companies',
      'Strong portfolio showcasing end-to-end work, not just final visuals',
      'Fluency with Figma, component libraries, and modern design systems',
      'Comfortable running user research and synthesising insights',
      'Excellent written and verbal communication',
    ],
    why7d: [
      'Work on meaningful problems with a small, senior team',
      'Collaborative, experimental team culture',
      'Creative freedom and ownership',
      'Remote-first with flexible hours',
    ],
    readyToJoinDescription:
      "Apply now. Let's build brands that everyone talks about.",
    status: 'open',
  },
  {
    id: 'job-2',
    title: 'Engineering Lead — Platform',
    department: 'Engineering',
    location: 'Bangalore, India',
    employmentType: 'full-time',
    aboutCompany: ABOUT_7D,
    whatYoullDo: {
      subtitle: 'Set technical direction',
      intro:
        'Set technical direction for the Platform team while staying hands-on with code. Balance architecture, mentorship, and shipping.',
      items: [
        'Technical Direction & Architecture',
        'Hands-on Shipping',
        'Reliability & Observability',
        'Hiring & Mentorship',
        'Cross-team Collaboration',
      ],
    },
    whatYouBring: [
      '8+ years of backend engineering, 2+ years in a tech-lead capacity',
      'Deep experience with Go, Rust, or TypeScript (Node)',
      'Comfortable owning design of distributed systems at scale',
      'Experience running on-call rotations and managing incidents',
      'Strong opinions on code quality, testing, and observability',
    ],
    why7d: [
      'Greenfield platform work with real autonomy',
      'High-trust team that ships small and often',
      'Annual learning budget and conference attendance',
      'Hybrid office in Bangalore, flexible schedule',
    ],
    readyToJoinDescription:
      'Apply now and help shape the systems our whole product depends on.',
    status: 'open',
  },
  {
    id: 'job-3',
    title: 'Growth Marketing Manager',
    department: 'Marketing',
    location: 'Remote',
    employmentType: 'full-time',
    aboutCompany: ABOUT_7D,
    whatYoullDo: {
      subtitle: 'Own the growth engine',
      intro:
        "Own the growth engine end-to-end — from paid acquisition to lifecycle email to on-site conversion. You'll have real ownership of channel strategy and budget.",
      items: [
        'Paid Acquisition (Meta, Google, LinkedIn)',
        'Lifecycle & Retention Programs',
        'Conversion Rate Optimisation',
        'Performance Analytics & Reporting',
        'Budget Planning',
      ],
    },
    whatYouBring: [
      '5+ years in growth or performance marketing roles',
      'Proven track record scaling paid channels',
      'Hands-on with GA4, Mixpanel, or Amplitude',
      'Strong data and SQL skills',
      'Experience with lifecycle tooling (Customer.io, Braze, or similar)',
    ],
    why7d: [
      'Significant channel and budget ownership from day one',
      'Small team, big leverage',
      'Remote-first, async-friendly',
      'Yearly performance bonus tied to outcomes',
    ],
    readyToJoinDescription: 'Apply now. Let’s grow something that converts.',
    status: 'open',
  },
  {
    id: 'job-4',
    title: 'Frontend Engineer',
    department: 'Engineering',
    location: 'Hyderabad, India',
    employmentType: 'full-time',
    aboutCompany: ABOUT_7D,
    whatYoullDo: {
      subtitle: 'Ship polished UIs',
      intro:
        'Ship delightful, accessible user interfaces with React and TypeScript. Collaborate closely with designers and care deeply about craft, a11y, and performance.',
      items: [
        'User-facing Feature Delivery',
        'Design Collaboration',
        'Accessibility & Performance',
        'Design System Contributions',
        'Code Review & Quality',
      ],
    },
    whatYouBring: [
      '3+ years building production React applications',
      'Strong TypeScript skills',
      'Solid understanding of browser performance and accessibility',
      'Experience with modern frontend tooling (Vite, Tailwind, React Query)',
      'Shipped features that real users use',
    ],
    why7d: [
      'Ship every week with a tight feedback loop',
      'Design and engineering in the same room',
      'Home-office setup stipend',
      'Hyderabad office with remote flexibility',
    ],
    readyToJoinDescription:
      "Apply now. We'll talk about the details that matter.",
    status: 'open',
  },
  {
    id: 'job-5',
    title: 'Design Intern (6 months)',
    department: 'Design',
    location: 'Remote',
    employmentType: 'internship',
    aboutCompany: ABOUT_7D,
    whatYoullDo: {
      subtitle: 'Learn by shipping',
      intro:
        "Pair with a senior designer and own small-to-medium features end-to-end. You'll get coaching, critique, and a real team to ship with.",
      items: [
        'Live Product Work',
        'Research & Synthesis',
        'Design System Contributions',
        'Presenting in Critiques',
      ],
    },
    whatYouBring: [
      'Final-year student or recent graduate in design or a related field',
      'A strong portfolio showing process, not just polish',
      'Curiosity, humility, and strong written communication',
      'Eagerness to learn and iterate on feedback',
    ],
    why7d: [
      'Paid internship with real shipping responsibilities',
      'Senior designer as a dedicated mentor',
      'Most interns leave with a full-time offer',
      'Fully remote, flexible hours around classes',
    ],
    readyToJoinDescription: 'Apply now. Bring your curiosity — we’ll handle the rest.',
    status: 'open',
  },
  {
    id: 'job-6',
    title: 'Content Strategist (Contract)',
    department: 'Marketing',
    location: 'Remote',
    employmentType: 'contract',
    aboutCompany: ABOUT_7D,
    whatYoullDo: {
      subtitle: 'Plan the editorial calendar',
      intro:
        'Help us define editorial voice, set a publishing cadence, and plan out a quarter of high-quality content. Ideal for someone who enjoys 0→1 projects.',
      items: [
        'Editorial Voice & Pillars',
        'Editorial Calendar Planning',
        'Distribution & Repurposing',
        'Content Performance Measurement',
      ],
    },
    whatYouBring: [
      '7+ years of content or editorial experience',
      'Proven experience shipping content programs at B2B companies',
      'Comfortable with long-form writing and editorial planning',
      'Available for a 3-month engagement, ~30 hours/week',
    ],
    why7d: [
      'Focused 3-month engagement with clear outcomes',
      'Own editorial direction with minimal meetings',
      'Work async across timezones',
      'Potential to extend based on fit',
    ],
    readyToJoinDescription: "Apply now. Let's build the editorial foundation together.",
    status: 'draft',
  },
]
