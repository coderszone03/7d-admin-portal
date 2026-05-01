export type Enquiry = {
  id: string
  from: string
  to: string
  subject: string
  body: string
  receivedAt: string
  read: boolean
}

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

const now = Date.now()
const iso = (offsetMs: number) => new Date(now - offsetMs).toISOString()

export const ENQUIRIES: Enquiry[] = [
  {
    id: 'enq-1',
    from: 'Anushka Sharma <anushka.sharma@horizonenergy.com>',
    to: 'hello@7ddesign.in',
    subject: 'Rebrand proposal — Horizon Energy',
    body: `Hi team,

We're impressed with your case studies and would love to explore a brand refresh for Horizon Energy ahead of our Series C. The scope includes a refreshed identity system, launch collateral, and a microsite.

Could we set up an intro call next week? Flexible on timing.

Thanks,
Anushka Sharma
Head of Brand, Horizon Energy`,
    receivedAt: iso(2 * HOUR),
    read: false,
  },
  {
    id: 'enq-2',
    from: 'Jordan Mehta <jordan@orbitanalytics.io>',
    to: 'hello@7ddesign.in',
    subject: 'UX audit for Orbit mobile app',
    body: `Hello,

Orbit is looking for a design partner to run a comprehensive UX audit of our iOS and Android apps with a focus on accessibility and information architecture. Our timeline is aggressive — looking to kick off within 2 weeks.

Ballpark budget is in the 40–60k range. Would love to see if it's a fit.

Best,
Jordan Mehta
Director of Product, Orbit`,
    receivedAt: iso(5 * HOUR),
    read: false,
  },
  {
    id: 'enq-3',
    from: 'Priya Nair <priya@pulseelectronics.com>',
    to: 'hello@7ddesign.in',
    subject: 'Launch film — modular edits',
    body: `Hi 7D Design,

Pulse is launching a new audio product line in Q3 and we need a set of launch films with modular edits for paid social, event screens, and in-store looping.

Is this something you're taking on right now? Happy to share the brief under NDA.

— Priya`,
    receivedAt: iso(1 * DAY + 3 * HOUR),
    read: false,
  },
  {
    id: 'enq-4',
    from: 'Marcus Gray <marcus@northwindretail.com>',
    to: 'hello@7ddesign.in',
    subject: 'Seasonal campaign — DOOH + paid social',
    body: `Hey,

Northwind is planning our holiday campaign and we loved your Pulse case study. We'd need an integrated campaign across DOOH, paid social, and in-store. Delivery by end of September.

Let me know if you have capacity.

Cheers,
Marcus`,
    receivedAt: iso(1 * DAY + 8 * HOUR),
    read: true,
  },
  {
    id: 'enq-5',
    from: 'Sara Oliveira <sara.o@lumenhealth.org>',
    to: 'hello@7ddesign.in',
    subject: 'Follow-up: Lumen portal phase 2',
    body: `Hi team,

Circling back on our conversation about phase 2 of the Lumen health portal. We've got internal approval on the scope document you sent. When would be a good time to kick off?

Thanks,
Sara`,
    receivedAt: iso(2 * DAY + 4 * HOUR),
    read: false,
  },
  {
    id: 'enq-6',
    from: 'Daniel Kim <dkim@vertex-saas.com>',
    to: 'hello@7ddesign.in',
    subject: 'Playbook update — 2026 refresh',
    body: `Hi,

We're planning a refresh of the Vertex brand playbook you built for us in 2018. Looking for updated guidelines, a new messaging framework, and training assets for regional teams.

Happy to share our current materials and gaps.

— Daniel`,
    receivedAt: iso(3 * DAY),
    read: true,
  },
  {
    id: 'enq-7',
    from: 'Aisha Khan <aisha@figmentstudio.design>',
    to: 'hello@7ddesign.in',
    subject: 'Potential collab on AR experience',
    body: `Hello,

Figment Studio is building an AR experience for a retail client and we're looking for a brand partner to handle the identity and motion systems. Timeline: 3 months.

Would you be open to a partnership call?

Aisha Khan
Founder, Figment Studio`,
    receivedAt: iso(4 * DAY + 6 * HOUR),
    read: true,
  },
  {
    id: 'enq-8',
    from: 'Kenji Watanabe <kenji@sakurafoods.jp>',
    to: 'hello@7ddesign.in',
    subject: 'Packaging system for global launch',
    body: `Dear 7D Design,

Sakura Foods is preparing a global launch of our new product line and we need a packaging system that balances our Japanese heritage with modern appeal. Manufacturing starts in October.

Could we schedule an introductory call?

Best regards,
Kenji Watanabe`,
    receivedAt: iso(6 * DAY + 2 * HOUR),
    read: false,
  },
  {
    id: 'enq-9',
    from: 'Lindsay Pearce <lindsay@thenorthstreet.co>',
    to: 'hello@7ddesign.in',
    subject: 'Short animation for investor deck',
    body: `Hi,

We need a 90-second animation for our Series B investor pitch. Timeline is tight — delivery in 3 weeks. Style reference: Pulse launch film, tone similar.

Is this achievable on your side?

Lindsay`,
    receivedAt: iso(9 * DAY),
    read: true,
  },
  {
    id: 'enq-10',
    from: 'Tomás Álvarez <tomas@aurafitness.com>',
    to: 'hello@7ddesign.in',
    subject: 'Full rebrand — Aura Fitness',
    body: `Hi,

Aura Fitness (boutique fitness chain, 12 locations across Spain and Portugal) is going through a full rebrand in Q2 next year. Scope: identity, in-studio signage, app refresh, launch campaign.

Would love to get on a discovery call.

Thanks,
Tomás`,
    receivedAt: iso(14 * DAY),
    read: true,
  },
  {
    id: 'enq-11',
    from: 'Emily Carter <emily.carter@meridianlaw.com>',
    to: 'hello@7ddesign.in',
    subject: 'Website redesign — Meridian Law',
    body: `Hello,

Meridian Law is looking to refresh our website. We're a boutique commercial litigation firm and our current site doesn't reflect our positioning. Looking for a clean, trustworthy, modern feel.

Can you share relevant case studies?

— Emily`,
    receivedAt: iso(21 * DAY),
    read: true,
  },
  {
    id: 'enq-12',
    from: 'Student press <press@designweeklymag.com>',
    to: 'hello@7ddesign.in',
    subject: 'Feature request — Brand of the Year issue',
    body: `Hi 7D Design team,

Design Weekly is working on our Brand of the Year issue and we'd love to feature your work on the Horizon rebrand. Could we schedule a 30-minute interview with your creative director?

Deadline for responses is end of month.

Thanks,
Editorial team`,
    receivedAt: iso(30 * DAY),
    read: false,
  },
]
