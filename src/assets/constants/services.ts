import type { Service } from '../../components/services/types'

const placeholderImage = (label: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%23eef2f7'/><stop offset='1' stop-color='%23dbe2ec'/></linearGradient></defs><rect width='600' height='600' fill='url(%23g)'/><text x='50%' y='52%' text-anchor='middle' font-family='Inter, system-ui, sans-serif' font-size='42' font-weight='700' fill='%2364748b'>${label}</text></svg>`,
  )}`

export const seedServices: Service[] = [
  {
    id: 's-1',
    title: 'Branding',
    slug: 'branding',
    description:
      'We build clear, standout brand identities that look great and feel consistent everywhere',
    longDescription:
      'From discovery to delivery, we craft a complete identity system — logo, type, palette, voice, and brand guidelines. Designed to scale across packaging, digital, OOH, and social without losing the essence.',
    imageUrl: placeholderImage('Branding'),
    status: 1,
    displayOrder: 1,
    createdAt: '2026-04-02T09:30:00Z',
    updatedAt: '2026-04-12T14:00:00Z',
  },
  {
    id: 's-2',
    title: 'Influencer Marketing',
    slug: 'influencer-marketing',
    description:
      'We connect brands with creator partnerships, content execution, and performance tracking to drive authentic engagement and measurable impact',
    longDescription:
      'Curated creator shortlists, contract negotiation, content calendars, and end-to-end campaign execution. Plus weekly performance reads so you can see what is working, not just what was posted.',
    imageUrl: placeholderImage('Influencer'),
    status: 1,
    displayOrder: 2,
    createdAt: '2026-04-02T09:30:00Z',
    updatedAt: '2026-04-02T09:30:00Z',
  },
  {
    id: 's-3',
    title: 'Social Media Marketing',
    slug: 'social-media-marketing',
    description:
      'Creating active strategic content planning and real-time analytics all tailored for platform-specific impact and growth',
    longDescription:
      'Editorial calendars built for each platform, daily community management, real-time analytics, and creative iteration based on what is actually performing.',
    imageUrl: placeholderImage('Social'),
    status: 1,
    displayOrder: 3,
    createdAt: '2026-03-22T08:15:00Z',
    updatedAt: '2026-04-01T10:45:00Z',
  },
  {
    id: 's-4',
    title: 'Video Production',
    slug: 'video-production',
    description: 'We help brands tell their stories through videos that speak to their audience',
    longDescription:
      'Concept development, scripting, casting, on-set direction, and post production — all under one roof. Anything from 15-second hooks to long-form brand films.',
    imageUrl: placeholderImage('Video'),
    status: 1,
    displayOrder: 4,
    createdAt: '2026-03-14T16:25:00Z',
    updatedAt: '2026-03-14T16:25:00Z',
  },
  {
    id: 's-5',
    title: 'UI/UX',
    slug: 'ui-ux',
    description:
      'We create websites and apps with digital experiences that are clear, friendly, and true to your brand',
    longDescription:
      'User research, information architecture, interaction design, and pixel-tight UI. We collaborate with engineering to make sure what we design is actually what ships.',
    imageUrl: placeholderImage('UI/UX'),
    status: 1,
    displayOrder: 5,
    createdAt: '2026-02-28T13:00:00Z',
    updatedAt: '2026-03-05T09:30:00Z',
  },
  {
    id: 's-6',
    title: 'Performance Marketing',
    slug: 'performance-marketing',
    description:
      'We run result-driven campaigns powered by data, smart content, and continuous testing. So your brand reaches the right people and actually grows.',
    longDescription:
      'Paid media planning, creative production tuned for the funnel, and ongoing optimisation across Meta, Google, and programmatic channels.',
    imageUrl: placeholderImage('Performance'),
    status: 1,
    displayOrder: 6,
    createdAt: '2026-02-12T10:20:00Z',
    updatedAt: '2026-02-12T10:20:00Z',
  },
  {
    id: 's-7',
    title: 'Brand Strategy Workshops',
    slug: 'brand-strategy-workshops',
    description:
      'Hands-on workshops to align stakeholders on positioning, messaging, and visual direction',
    longDescription: '',
    imageUrl: placeholderImage('Workshops'),
    status: 0,
    displayOrder: 7,
    createdAt: '2026-01-30T15:45:00Z',
    updatedAt: '2026-02-05T11:00:00Z',
  },
  {
    id: 's-8',
    title: 'Print & OOH',
    slug: 'print-ooh',
    description:
      'Out-of-home and print campaigns from concept through to print production and installation',
    longDescription: '',
    imageUrl: placeholderImage('Print/OOH'),
    status: 0,
    displayOrder: 8,
    createdAt: '2026-01-18T09:00:00Z',
    updatedAt: '2026-01-18T09:00:00Z',
  },
]
