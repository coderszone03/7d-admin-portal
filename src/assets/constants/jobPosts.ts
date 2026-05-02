export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'internship'
export type JobStatus = 'open' | 'closed' | 'draft'

export type JobPost = {
  id: string
  title: string
  department: string
  location: string
  employmentType: EmploymentType
  shortDescription: string
  description: string
  requirements: string[]
  responsibilities: string[]
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string
  status: JobStatus
  postedAt: string
  deadlineAt: string | null
}

const DAY = 24 * 60 * 60 * 1000
const now = Date.now()
const iso = (offsetMs: number) => new Date(now - offsetMs).toISOString()
const future = (days: number) => new Date(now + days * DAY).toISOString()

export const JOB_POSTS: JobPost[] = [
  {
    id: 'job-1',
    title: 'Senior Product Designer',
    department: 'Design',
    location: 'Remote',
    employmentType: 'full-time',
    shortDescription:
      'Lead end-to-end product design for our flagship SaaS platform.',
    description:
      'We are looking for a Senior Product Designer who will drive the vision and craft of our flagship product. You will work closely with product managers and engineers to ship thoughtful, well-researched features that customers love. This role owns everything from discovery through launch and post-launch iteration.',
    requirements: [
      '6+ years of product design experience at B2B or B2C SaaS companies',
      'Strong portfolio showcasing end-to-end work, not just final visuals',
      'Fluency with Figma, component libraries, and modern design systems',
      'Comfortable running user research and synthesising insights',
      'Excellent written and verbal communication',
    ],
    responsibilities: [
      'Partner with PM and engineering leads on roadmap and scoping',
      'Own discovery, exploration, and validation for major initiatives',
      'Deliver high-fidelity designs, prototypes, and production-ready specs',
      'Evolve our design system alongside other senior designers',
      'Mentor mid-level designers through critiques and pairing',
    ],
    salaryMin: 2500000,
    salaryMax: 3500000,
    salaryCurrency: 'INR',
    status: 'open',
    postedAt: iso(3 * DAY),
    deadlineAt: future(21),
  },
  {
    id: 'job-2',
    title: 'Engineering Lead — Platform',
    department: 'Engineering',
    location: 'Bangalore, India',
    employmentType: 'full-time',
    shortDescription:
      'Technical lead for our platform team, owning core services and infrastructure.',
    description:
      'The Platform team is the backbone of our product — we build the services, pipelines, and internal tooling that the rest of engineering depends on. We are looking for a hands-on lead who can balance technical direction with team mentorship.',
    requirements: [
      '8+ years of backend engineering, 2+ years in a tech-lead capacity',
      'Deep experience with at least one of: Go, Rust, or TypeScript (Node)',
      'Comfortable owning design of distributed systems at scale',
      'Experience running on-call rotations and managing incidents',
      'Strong opinions on code quality, testing, and observability',
    ],
    responsibilities: [
      'Set technical direction for the platform team',
      'Lead architecture reviews and RFC discussions',
      'Ship code alongside the team — not a pure manager role',
      'Own reliability, performance, and operational excellence',
      'Grow and mentor engineers through 1:1s and technical coaching',
    ],
    salaryMin: 4000000,
    salaryMax: 6000000,
    salaryCurrency: 'INR',
    status: 'open',
    postedAt: iso(7 * DAY),
    deadlineAt: future(14),
  },
  {
    id: 'job-3',
    title: 'Growth Marketing Manager',
    department: 'Marketing',
    location: 'Remote',
    employmentType: 'full-time',
    shortDescription:
      'Own performance and lifecycle marketing across paid and organic channels.',
    description:
      'Own our growth engine end-to-end — from paid acquisition to lifecycle email to on-site conversion. You will work with a small team and have significant ownership of channel strategy and budget allocation.',
    requirements: [
      '5+ years in growth or performance marketing roles',
      'Proven track record scaling paid channels (Meta, Google, LinkedIn)',
      'Hands-on with analytics tools (GA4, Mixpanel, Amplitude)',
      'Strong data and SQL skills — you should be comfortable writing your own queries',
      'Experience with lifecycle tooling (Customer.io, Braze, or similar)',
    ],
    responsibilities: [
      'Own growth goals across acquisition, activation, and retention',
      'Plan and execute campaigns across paid and organic channels',
      'Partner with product and design on conversion optimisation',
      'Manage budget allocation and report on performance weekly',
      'Build out lifecycle journeys and behavioural email programs',
    ],
    salaryMin: 1800000,
    salaryMax: 2600000,
    salaryCurrency: 'INR',
    status: 'open',
    postedAt: iso(5 * DAY),
    deadlineAt: future(10),
  },
  {
    id: 'job-4',
    title: 'Frontend Engineer',
    department: 'Engineering',
    location: 'Hyderabad, India',
    employmentType: 'full-time',
    shortDescription:
      'Build delightful, accessible user interfaces with React and TypeScript.',
    description:
      'Join our frontend guild building our web app used by thousands of teams. We care deeply about craft, accessibility, and performance. Expect to collaborate daily with designers and ship user-facing features regularly.',
    requirements: [
      '3+ years building production React applications',
      'Strong TypeScript skills',
      'Solid understanding of browser performance and accessibility',
      'Experience with modern frontend tooling (Vite, Tailwind, React Query)',
      'You have shipped features that real users use — bonus for open-source work',
    ],
    responsibilities: [
      'Ship polished user-facing features in our web app',
      'Collaborate with designers on interaction details',
      'Improve performance, accessibility, and code health',
      'Participate in design and code review',
      'Contribute to our shared component library',
    ],
    salaryMin: 1500000,
    salaryMax: 2400000,
    salaryCurrency: 'INR',
    status: 'open',
    postedAt: iso(2 * DAY),
    deadlineAt: future(18),
  },
  {
    id: 'job-5',
    title: 'Design Intern (6 months)',
    department: 'Design',
    location: 'Remote',
    employmentType: 'internship',
    shortDescription:
      'A six-month paid internship for emerging designers looking for real-world shipping experience.',
    description:
      'Our internship program pairs you with a senior designer and gives you a real team to ship with. You will own small-to-medium features end-to-end, with coaching, critique, and mentorship every step. Most interns leave with a full-time offer.',
    requirements: [
      'Final-year student or recent graduate in design or a related field',
      'A strong portfolio showing process, not just polish',
      'Curiosity, humility, and strong written communication',
      'Eagerness to learn and iterate on feedback',
    ],
    responsibilities: [
      'Partner with a senior designer on live product work',
      'Run small research studies and synthesise findings',
      'Contribute to component library work',
      'Present your work in design critiques',
    ],
    salaryMin: 50000,
    salaryMax: 70000,
    salaryCurrency: 'INR',
    status: 'open',
    postedAt: iso(1 * DAY),
    deadlineAt: future(30),
  },
  {
    id: 'job-6',
    title: 'Content Strategist (Contract)',
    department: 'Marketing',
    location: 'Remote',
    employmentType: 'contract',
    shortDescription:
      'Short-term engagement to build a content strategy and production plan for Q3.',
    description:
      'We are looking for an experienced content strategist to help us define our editorial voice, set up our publishing cadence, and plan out a quarter of high-quality content. Ideal for someone who has done this kind of work before and enjoys 0→1 projects.',
    requirements: [
      '7+ years of content or editorial experience',
      'Proven experience shipping content programs at B2B companies',
      'Comfortable with long-form writing and editorial planning',
      'Available for a 3-month engagement, ~30 hours/week',
    ],
    responsibilities: [
      'Define editorial voice and content pillars',
      'Build an editorial calendar for Q3',
      'Partner with growth on distribution and repurposing',
      'Set up measurement for content performance',
    ],
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: 'USD',
    status: 'draft',
    postedAt: iso(0),
    deadlineAt: null,
  },
]
