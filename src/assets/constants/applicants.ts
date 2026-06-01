export type ApplicantStatus =
  | 'new'
  | 'reviewing'
  | 'interviewed'
  | 'rejected'
  | 'hired'

export type Applicant = {
  id: string
  jobPostId: string
  name: string
  email: string
  phone: string
  coverNote: string
  portfolioLink?: string
  resumeUrl?: string
  status: ApplicantStatus
  appliedAt: string
  read: boolean
}

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

const now = Date.now()
const iso = (offsetMs: number) => new Date(now - offsetMs).toISOString()

export const APPLICANTS: Applicant[] = [
  {
    id: 'app-1',
    jobPostId: 'job-1',
    name: 'Anushka Sharma',
    email: 'anushka.sharma@gmail.com',
    phone: '+91 98765 43210',
    coverNote:
      "I've spent the last seven years at two B2B SaaS companies, most recently leading design for a data platform used by thousands of teams. I'm drawn to this role because of your focus on craft — happy to chat.",
    status: 'new',
    appliedAt: iso(3 * HOUR),
    read: false,
  },
  {
    id: 'app-2',
    jobPostId: 'job-1',
    name: 'Rahul Verma',
    email: 'rahul.verma@proton.me',
    phone: '+91 99887 77665',
    coverNote:
      "I've been shipping product design at early-stage startups for six years. My portfolio focuses on end-to-end work rather than polished hero shots. Would love to discuss how I might contribute.",
    status: 'reviewing',
    appliedAt: iso(1 * DAY + 2 * HOUR),
    read: true,
  },
  {
    id: 'app-3',
    jobPostId: 'job-1',
    name: 'Priya Nair',
    email: 'priyanair.design@gmail.com',
    phone: '+91 91234 56789',
    coverNote:
      'Senior Product Designer at Orbit Analytics for the last 4 years. Strong systems thinker. Looking for my next role and this one resonates with me.',
    status: 'new',
    appliedAt: iso(6 * HOUR),
    read: false,
  },
  {
    id: 'app-4',
    jobPostId: 'job-1',
    name: 'Diego Alvarez',
    email: 'diego.alvarez@hey.com',
    phone: '+34 612 345 678',
    coverNote:
      'Currently based in Madrid but fully remote-capable. I lead a 5-person design team at a fintech and am open to individual-contributor roles again.',
    status: 'interviewed',
    appliedAt: iso(4 * DAY),
    read: true,
  },
  {
    id: 'app-5',
    jobPostId: 'job-1',
    name: 'Tamara Kim',
    email: 'tamara.kim@outlook.com',
    phone: '+1 415 555 0199',
    coverNote:
      'Principal Product Designer at a public SaaS company. I miss smaller teams and the shipping velocity that comes with them.',
    status: 'reviewing',
    appliedAt: iso(2 * DAY + 5 * HOUR),
    read: true,
  },
  {
    id: 'app-6',
    jobPostId: 'job-2',
    name: 'Vikram Iyer',
    email: 'vikram.iyer@gmail.com',
    phone: '+91 98111 22334',
    coverNote:
      'Staff engineer at a scale-up for 3 years; before that, platform engineering at a unicorn. I enjoy hands-on coding and mentoring in equal measure.',
    status: 'new',
    appliedAt: iso(5 * HOUR),
    read: false,
  },
  {
    id: 'app-7',
    jobPostId: 'job-2',
    name: 'Emily Carter',
    email: 'emily.carter@fastmail.com',
    phone: '+44 7700 900123',
    coverNote:
      "Leading infra for a data platform. I'd like to move closer to application-level systems, and this role looks like the right balance.",
    status: 'interviewed',
    appliedAt: iso(5 * DAY),
    read: true,
  },
  {
    id: 'app-8',
    jobPostId: 'job-2',
    name: 'Kenji Watanabe',
    email: 'kenji.w@gmail.com',
    phone: '+81 90 1234 5678',
    coverNote:
      'Backend generalist with 9 years of experience. Go and Rust are my daily drivers. I can relocate to Bangalore for the right opportunity.',
    status: 'new',
    appliedAt: iso(1 * DAY),
    read: false,
  },
  {
    id: 'app-9',
    jobPostId: 'job-3',
    name: 'Sara Oliveira',
    email: 'sara.oliveira@gmail.com',
    phone: '+351 910 123 456',
    coverNote:
      'Growth lead at a Series B SaaS company. I scaled paid acquisition from $50k to $500k/month and built their lifecycle program from scratch.',
    status: 'reviewing',
    appliedAt: iso(2 * DAY),
    read: true,
  },
  {
    id: 'app-10',
    jobPostId: 'job-3',
    name: 'Marcus Gray',
    email: 'marcus@marcusgray.co',
    phone: '+1 646 555 0142',
    coverNote:
      '7 years in performance marketing across DTC and B2B. Currently consulting; looking to come back in-house.',
    status: 'new',
    appliedAt: iso(8 * HOUR),
    read: false,
  },
  {
    id: 'app-11',
    jobPostId: 'job-4',
    name: 'Jordan Mehta',
    email: 'jordan.mehta@gmail.com',
    phone: '+91 90000 11223',
    coverNote:
      'Frontend engineer focused on accessibility and performance. Three years at a design tools company, currently based in Hyderabad.',
    status: 'new',
    appliedAt: iso(4 * HOUR),
    read: false,
  },
  {
    id: 'app-12',
    jobPostId: 'job-4',
    name: 'Aisha Khan',
    email: 'aisha.khan@gmail.com',
    phone: '+91 98765 11223',
    coverNote:
      "Full-stack leaning frontend. Built a complex dashboard product for the last two years and it's been a blast. Excited about your stack.",
    status: 'reviewing',
    appliedAt: iso(2 * DAY + 3 * HOUR),
    read: true,
  },
  {
    id: 'app-13',
    jobPostId: 'job-4',
    name: 'Lindsay Pearce',
    email: 'lindsay.pearce@icloud.com',
    phone: '+1 212 555 0133',
    coverNote:
      "Remote frontend engineer with 4 years of React experience. I'm open to this being a contract-to-hire if that's useful.",
    status: 'rejected',
    appliedAt: iso(6 * DAY),
    read: true,
  },
  {
    id: 'app-14',
    jobPostId: 'job-5',
    name: 'Nikhil Rao',
    email: 'nikhil.rao.design@gmail.com',
    phone: '+91 91111 22233',
    coverNote:
      "Final-year Visual Communication student at NID. My portfolio is mostly self-initiated work but I've shipped a few small things for local startups.",
    status: 'new',
    appliedAt: iso(2 * HOUR),
    read: false,
  },
  {
    id: 'app-15',
    jobPostId: 'job-5',
    name: 'Ishita Das',
    email: 'ishitadas@students.iitk.ac.in',
    phone: '+91 96543 22110',
    coverNote:
      'Second-year masters student looking for a design internship to complement my academic work. Process-focused; happy to share case studies.',
    status: 'interviewed',
    appliedAt: iso(3 * DAY + 2 * HOUR),
    read: true,
  },
]
