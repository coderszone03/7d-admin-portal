import type { CareersGalleryImage } from '../../components/careers/galleryTypes'

const placeholder = (label: string, hue: number) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='hsl(${hue},45%,80%)'/><stop offset='1' stop-color='hsl(${(hue + 30) % 360},45%,55%)'/></linearGradient></defs><rect width='1200' height='800' fill='url(%23g)'/><text x='50%' y='52%' text-anchor='middle' font-family='Inter, system-ui, sans-serif' font-size='72' font-weight='700' fill='%23ffffff' fill-opacity='0.85'>${label}</text></svg>`,
  )}`

export const seedCareersGallery: CareersGalleryImage[] = [
  {
    id: 'g-1',
    imageUrl: placeholder('Studio offsite — Lonavala', 220),
    alt: 'Studio offsite — Lonavala',
    status: 1,
    displayOrder: 1,
    createdAt: '2026-04-02T09:30:00Z',
    updatedAt: '2026-04-02T09:30:00Z',
  },
  {
    id: 'g-2',
    imageUrl: placeholder('Diwali launch night', 30),
    alt: 'Diwali launch night',
    status: 1,
    displayOrder: 2,
    createdAt: '2026-03-28T19:00:00Z',
    updatedAt: '2026-03-28T19:00:00Z',
  },
  {
    id: 'g-3',
    imageUrl: placeholder('Brainstorm session', 280),
    alt: 'Brainstorm session in the war room',
    status: 1,
    displayOrder: 3,
    createdAt: '2026-03-15T14:00:00Z',
    updatedAt: '2026-03-15T14:00:00Z',
  },
  {
    id: 'g-4',
    imageUrl: placeholder('Edit bay late night', 200),
    alt: 'Late-night edit bay',
    status: 1,
    displayOrder: 4,
    createdAt: '2026-03-08T22:30:00Z',
    updatedAt: '2026-03-08T22:30:00Z',
  },
  {
    id: 'g-5',
    imageUrl: placeholder('Wrap party', 340),
    alt: 'Wrap party — Sanrey campaign',
    status: 1,
    displayOrder: 5,
    createdAt: '2026-02-22T20:00:00Z',
    updatedAt: '2026-02-22T20:00:00Z',
  },
  {
    id: 'g-6',
    imageUrl: placeholder('On-set with the talent', 120),
    alt: 'On-set with the talent',
    status: 0,
    displayOrder: 6,
    createdAt: '2026-02-10T11:00:00Z',
    updatedAt: '2026-02-10T11:00:00Z',
  },
]
