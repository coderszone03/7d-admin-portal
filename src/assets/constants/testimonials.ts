import type { Testimonial } from '../../components/testimonials/types'

const placeholderPhoto = (initial: string) =>
  // 600x600 grey square SVG with the initial centered — keeps the dummy seed self-contained.
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600'><rect width='600' height='600' fill='%23eef2f7'/><text x='50%' y='54%' text-anchor='middle' font-family='Inter, system-ui, sans-serif' font-size='280' font-weight='700' fill='%2394a3b8'>${initial}</text></svg>`,
  )}`

export const seedTestimonials: Testimonial[] = [
  {
    id: 't-1',
    name: 'Jasmine Davenport',
    role: 'CEO of XYZ',
    category: 'Branding',
    quote:
      "7D Design rebuilt our identity from the ground up. The system they delivered isn't just a logo — it's a language our whole team now speaks. We've launched three campaigns since with zero brand drift.",
    photoUrl: placeholderPhoto('JD'),
    status: 1,
    displayOrder: 1,
    createdAt: '2026-04-02T09:30:00Z',
    updatedAt: '2026-04-12T14:00:00Z',
  },
  {
    id: 't-2',
    name: 'Raghav Menon',
    role: 'Founder, Northwind Studios',
    category: 'Video Production',
    quote:
      'They turned a six-week launch film into a four-week sprint without ever sacrificing quality. Direction, edit, sound — all dialled in. The kind of partner you keep on speed dial.',
    photoUrl: placeholderPhoto('RM'),
    status: 1,
    displayOrder: 2,
    createdAt: '2026-04-08T11:10:00Z',
    updatedAt: '2026-04-08T11:10:00Z',
  },
  {
    id: 't-3',
    name: 'Priya Iyer',
    role: 'VP Product, Lumen Health',
    category: 'UI/UX',
    quote:
      'Our patient portal redesign moved task completion up 38% in the first quarter post-launch. The team brought rigour to research and warmth to craft — rare combination.',
    photoUrl: placeholderPhoto('PI'),
    status: 1,
    displayOrder: 3,
    createdAt: '2026-03-22T08:15:00Z',
    updatedAt: '2026-04-01T10:45:00Z',
  },
  {
    id: 't-4',
    name: 'Daniel Park',
    role: 'Head of Marketing, Greyhive',
    category: 'Performance Marketing',
    quote:
      'Our seasonal ad pulled 4.2x ROAS in week one. The strategy was tight, the creative was sharp, and the post-launch readout helped us frame the next quarter.',
    photoUrl: placeholderPhoto('DP'),
    status: 1,
    displayOrder: 4,
    createdAt: '2026-03-14T16:25:00Z',
    updatedAt: '2026-03-14T16:25:00Z',
  },
  {
    id: 't-5',
    name: 'Aisha Khan',
    role: 'Creative Director, Sanrey',
    category: 'Branding',
    quote:
      'I came in with a half-formed brief and left with a brand book that answered questions we hadn’t even thought to ask. They listen first and design second.',
    photoUrl: placeholderPhoto('AK'),
    status: 1,
    displayOrder: 5,
    createdAt: '2026-02-28T13:00:00Z',
    updatedAt: '2026-03-05T09:30:00Z',
  },
  {
    id: 't-6',
    name: 'Vivek Rao',
    role: 'Co-founder, Champa Sweets',
    category: 'Branding',
    quote:
      'Our packaging finally matches what we put in the box. Footfall is up, but more importantly the brand finally feels like ours.',
    photoUrl: placeholderPhoto('VR'),
    status: 1,
    displayOrder: 6,
    createdAt: '2026-02-12T10:20:00Z',
    updatedAt: '2026-02-12T10:20:00Z',
  },
  {
    id: 't-7',
    name: 'Hannah Wright',
    role: 'CMO, Beacon Logistics',
    category: 'Video Production',
    quote:
      'We needed a corporate film that felt human, not stiff. They cast it perfectly, kept the schedule honest, and delivered a piece our drivers actually share.',
    photoUrl: placeholderPhoto('HW'),
    status: 0,
    displayOrder: 7,
    createdAt: '2026-01-30T15:45:00Z',
    updatedAt: '2026-02-05T11:00:00Z',
  },
  {
    id: 't-8',
    name: 'Marco Silva',
    role: 'Director, Folk Art Foundation',
    category: 'Performance Marketing',
    quote:
      'A small budget, a tight window, and a campaign that ended up on the front page. They treated our cause like it was their own.',
    photoUrl: placeholderPhoto('MS'),
    status: 0,
    displayOrder: 8,
    createdAt: '2026-01-18T09:00:00Z',
    updatedAt: '2026-01-18T09:00:00Z',
  },
]
