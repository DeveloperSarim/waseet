// Default content for the public landing page (homepage). This mirrors the original
// hardcoded Landing.jsx 1:1, so the page looks identical until an admin edits it.
// Stored (and merged over) under the `landing` settings key; also consumed by the
// public /api/v1/landing endpoint and the prerender (SEO) endpoint.
//
// Image fields are { key, alt } — `key` is a public-bucket object key resolved to a
// /storage URL by imageUrl(); empty key means "no image".

export const LANDING_DEFAULTS = {
  seo: {
    title: 'Waseet · وسيط — Private Real-Estate Marketplace for Saudi Arabia',
    description:
      'Waseet connects verified property developers with licensed realtors across Saudi Arabia, with every commission shown upfront. Private, verified, commission-first.',
    keywords: 'Saudi real estate, off-plan projects, realtor commission, property developers, Riyadh, Jeddah, Vision 2030',
    canonicalUrl: '',
    themeColor: '#16A34A',
    faviconKey: '',
    appleIconKey: '',
    ogTitle: 'Waseet — The Private Marketplace Where Developers Meet Their Best Realtors',
    ogDescription:
      'Verified developers, licensed realtors, commission shown upfront. Real estate across Saudi Arabia.',
    ogImageKey: '',
    twitterCard: 'summary_large_image',
    structuredData: true,
  },

  sections: {
    hero: {
      visible: true,
      badgeText: 'Private · Verified · Commission-first',
      title: 'The Private Marketplace Where Developers Meet Their Best',
      highlight: 'Realtors.',
      subtitle:
        'Waseet connects verified property developers with licensed realtors across Saudi Arabia, with every commission shown upfront.',
      citiesLine: 'Jeddah · Riyadh · Dammam · Mecca · Medina · Khobar',
      checkLines: ['Verified developers only', 'Licensed realtors', 'Commission protected', '24hr approval'],
      // the 3 floating showcase cards under the hero — fully editable (text + image)
      cards: [
        { name: 'Olaya Park Towers', loc: 'Al Olaya, Riyadh', price: 'SAR 890K – 5.6M', comm: '4% Commission', badge: 'NEW', image: { key: '', alt: '' } },
        { name: 'Marsa Heights', loc: 'Al Shati, Jeddah', price: 'SAR 980,000 – 1.6M', comm: '3% Commission', badge: 'FEATURED', image: { key: '', alt: '' } },
        { name: 'Hittin Garden Villas', loc: 'Hittin, Riyadh', price: 'SAR 3.1M – 8.2M', comm: '2.5% Commission', badge: 'FEATURED', image: { key: '', alt: '' } },
      ],
      primaryBtn: { label: "List your project — I'm a Developer", href: '/register/developer', visible: true },
      secondaryBtn: { label: 'Join as Realtor — Start Earning', href: '/register/realtor', visible: true },
    },

    stats: {
      visible: true,
      items: [
        { value: '200+', label: 'Verified realtors' },
        { value: '50+', label: 'Developer projects' },
        { value: 'SAR 2M+', label: 'Commission paid' },
        { value: '13', label: 'Cities covered' },
      ],
    },

    forWho: {
      visible: true,
      eyebrow: 'Who is Waseet for?',
      heading: 'Built for two sides of every deal.',
      developer: {
        tag: 'Developers',
        title: 'List your projects. Get qualified leads.',
        body: 'Upload your development, set commission rates per unit type, and connect with 200+ verified licensed realtors across the region.',
        points: [
          'List unlimited projects after approval',
          'Commission rates shown upfront to realtors',
          'Full lead tracking dashboard',
          'Know exactly what you owe — transparent billing',
          'Realtor performance analytics per project',
        ],
        cta: 'List Your Project →',
        href: '/register/developer',
        visible: true,
      },
      realtor: {
        tag: 'Realtors',
        title: 'Browse projects. Submit leads. Get paid.',
        body: 'Browse exclusive developer projects with commissions shown upfront. Submit client leads and track every deal from submission to commission.',
        points: [
          'Browse projects not listed anywhere else',
          'Commission % shown before you submit any lead',
          'Real-time lead status tracking',
          'Bronze → Silver → Gold → Platinum badge system',
          'Commission paid directly to your bank account',
        ],
        cta: 'Join as Realtor →',
        href: '/register/realtor',
        visible: true,
      },
    },

    liveProjects: {
      visible: true,
      eyebrow: 'Live on Waseet',
      heading: 'Projects realtors are closing right now',
      browseLabel: 'Browse the marketplace →',
      browseHref: '/marketplace',
      source: 'featured', // populated from real featured projects by the API
    },

    howItWorksSticky: {
      visible: true,
      eyebrow: 'How Waseet works',
      steps: [
        {
          n: '01',
          rail: 'Browse projects',
          title: 'Every developer project, in one private feed.',
          body: 'Realtors browse exclusive off-plan and ready projects with the commission rate shown upfront on every unit — no portals, no noise.',
        },
        {
          n: '02',
          rail: 'Submit & track leads',
          title: 'Submit a lead, then watch it move to close.',
          body: 'Send a client lead in seconds and follow it live — New, Viewing, Negotiating, Closed — with every status update in one dashboard.',
        },
        {
          n: '03',
          rail: 'Get paid commission',
          title: 'Your commission, tracked and paid on time.',
          body: 'When a deal closes, Waseet verifies the commission and disburses your share straight to your bank — usually within 5–7 business days.',
        },
      ],
    },

    darkBand: {
      visible: true,
      badge: 'New developments live now',
      heading: "Exclusive access to Saudi Arabia's finest off-plan projects.",
      body: 'Every verified project shows commission rates upfront — no chasing developers, no surprises.',
      primaryBtn: { label: 'Explore projects', href: '/marketplace', visible: true },
      secondaryBtn: { label: 'View on map', href: '/marketplace', visible: true },
      // the 2 floating showcase cards on the right — editable text + image
      cards: [
        { name: 'Olaya Park Towers', loc: 'Al Olaya, Riyadh', price: 'SAR 890K – 5.6M', comm: '4% Commission', badge: 'NEW', image: { key: '', alt: '' } },
        { name: 'Marsa Heights', loc: 'Al Shati, Jeddah', price: 'SAR 980,000 – 1.6M', comm: '3% Commission', badge: 'FEATURED', image: { key: '', alt: '' } },
      ],
    },

    howItWorks3: {
      visible: true,
      eyebrow: 'How it works',
      heading: 'Three steps to your first closed deal.',
      steps: [
        { title: 'Register & get verified', body: 'Apply as a developer or realtor. Our team reviews your documents within 24 hours.' },
        { title: 'Browse projects & submit leads', body: 'Realtors browse exclusive projects with commissions shown upfront. Submit client leads instantly.' },
        { title: 'Deal closes — commission paid', body: 'When the deal closes, Waseet tracks payment and disburses your commission to your bank.' },
      ],
      ctaText: 'Ready to get started?',
      primaryBtn: { label: 'List Your Project', href: '/register/developer', visible: true },
      secondaryBtn: { label: 'Join as Realtor', href: '/register/realtor', visible: true },
    },

    saudiMarket: {
      visible: true,
      badge: 'Saudi Arabia',
      heading: "Private real estate in the world's fastest-growing market.",
      body: "Vision 2030 is reshaping the Kingdom's skyline. Waseet gives verified realtors first access to the developers building it — with commission locked upfront on every unit.",
      stats: [
        { value: 'SAR 1T+', label: 'in active giga-projects' },
        { value: '1.2M+', label: 'new homes planned by 2030' },
        { value: '+9.6%', label: 'annual real-estate growth' },
      ],
      primaryBtn: { label: 'Explore projects', href: '/marketplace', visible: true },
      secondaryBtn: { label: 'Watch how it works', href: '/register/realtor', visible: true },
    },

    whyWaseet: {
      visible: true,
      eyebrow: 'Why Waseet',
      heading: "Everything you need. Nothing you don't.",
      cards: [
        { title: 'One private marketplace', body: 'Every approved developer project in one place, with commission shown upfront on every unit type.' },
        { title: 'Verified partners only', body: 'Every developer and realtor is reviewed by our admin team before accessing the platform.' },
        { title: 'Commission always shown upfront', body: 'No negotiating after the deal. Commission rates are locked per unit type before you submit a lead.' },
        { title: 'Full tracking dashboard', body: 'Track every lead from submission to close. Know exactly where every deal stands in real time.' },
        { title: 'Badge & reward system', body: 'Realtors earn Bronze, Silver, Gold, and Platinum badges as they close more deals — unlocking more perks.' },
        { title: '24-hour approval', body: 'Apply today. Our team reviews applications within 24 hours — you could be submitting leads tomorrow.' },
      ],
    },

    browseType: {
      visible: true,
      heading: 'Browse by property type',
      href: '/marketplace',
      types: [
        { name: 'Apartments', count: '18,420 projects' },
        { name: 'Villas', count: '9,210 projects' },
        { name: 'Townhouses', count: '4,860 projects' },
        { name: 'Offices', count: '3,140 projects' },
        { name: 'Land', count: '2,705 plots' },
      ],
    },

    badges: {
      visible: true,
      eyebrow: 'Realtor rewards',
      heading: 'The more you close, the more you unlock.',
      body: "Waseet's badge system rewards realtors who consistently deliver. Move from Bronze to Platinum and unlock exclusive benefits with each tier.",
      cta: 'Join as Realtor',
      href: '/register/realtor',
      items: [
        { icon: '🥉', name: 'Bronze', req: 'New approved realtor', perk: 'Access to all projects' },
        { icon: '🥈', name: 'Silver', req: '5 leads OR 1 closed deal', perk: 'Priority project alerts' },
        { icon: '🥇', name: 'Gold', req: '3 closed deals', perk: 'Analytics + higher priority listing' },
        { icon: '💎', name: 'Platinum', req: '10 closed deals', perk: 'Direct developer contact + fast disbursement' },
      ],
    },

    reviews: {
      visible: true,
      heading: 'Trusted by realtors & developers',
      items: [
        { quote: '"Waseet got me two closed deals in my first week. The commission was shown upfront, tracked clearly, and paid on time. No chasing anyone."', initials: 'AR', name: 'Ahmed Al-Rashid', role: 'Gold Realtor, Jeddah' },
        { quote: '"Every project shows the commission rate before I even submit a lead. No surprises, no back-and-forth with developers."', initials: 'SO', name: 'Sara Al-Otaibi', role: 'Realtor, Riyadh' },
        { quote: '"As a developer, the verified realtor network brings serious, qualified leads. Not time-wasters — actual buyers."', initials: 'MF', name: 'Mohammed Al-Faisal', role: 'Al Faisal Development, Jeddah' },
      ],
    },

    trust: {
      visible: true,
      eyebrow: 'Built on trust',
      heading: 'Verified, protected, and Shariah-compliant.',
      cards: [
        { title: 'Verified partners only', body: 'Every developer and realtor is reviewed and licence-checked by our team before they can list or submit a single lead.' },
        { title: 'Commission protected', body: 'Rates are locked per unit before you submit. Waseet holds and verifies every payment, then disburses your share to your bank.' },
        { title: 'Shariah-compliant', body: 'Every deal and commission structure adheres to Islamic Sharia principles — invest and earn without compromising your values.' },
      ],
    },

    faq: {
      visible: true,
      heading: 'Frequently asked questions',
      items: [
        { q: 'Who can join Waseet?', a: 'Verified property developers and licensed real estate agents across Saudi Arabia. All applicants are reviewed by our admin team within 24 hours of applying.' },
        { q: 'How is commission paid?', a: 'When a deal closes, the developer pays the agreed commission to Waseet. After verification, we disburse your realtor share directly to your registered bank account within 5–7 business days.' },
        { q: 'What does it cost to join?', a: 'Joining Waseet is free. We charge a platform fee only when a deal closes — a percentage of the commission, which is always disclosed upfront before you submit any lead.' },
        { q: 'How long does verification take?', a: 'Applications are reviewed within 24 hours. Once approved, you receive your login credentials and can access the platform immediately.' },
        { q: 'Which cities does Waseet cover?', a: 'We operate across Saudi Arabia — including Jeddah, Riyadh, Dammam, Mecca, Medina and Khobar — with new cities added regularly.' },
      ],
    },

    finalCta: {
      visible: true,
      heading: 'Ready to join Waseet?',
      subtitle: 'Apply today. Our team reviews within 24 hours.',
      primaryBtn: { label: "List Your Project — I'm a Developer", href: '/register/developer', visible: true },
      secondaryBtn: { label: 'Join as Realtor — Start Earning', href: '/register/realtor', visible: true },
      footnote: 'Free to join · 24hr approval · No commitment',
    },
  },

  // ---- shared public-site chrome (nav + footer), edited in the "Header & Footer" tab ----
  navbar: {
    logoText: 'waseet',
    logoSub: 'وسيط',
    logoImage: { key: '', alt: '' }, // optional; when set, replaces the icon+text logo
    links: [
      { label: 'How it works', href: '/', visible: true },
      { label: 'For Developers', href: '/register/developer', visible: true },
      { label: 'For Realtors', href: '/register/realtor', visible: true },
      { label: 'Pricing', href: '/marketplace', visible: true },
    ],
    loginLabel: 'Login',
    primaryBtn: { label: 'List your project', href: '/register/developer', visible: true },
    secondaryBtn: { label: 'Join as realtor', href: '/register/realtor', visible: true },
    showLangToggle: true,
  },

  footer: {
    logoText: 'waseet',
    logoSub: 'وسيط',
    logoImage: { key: '', alt: '' },
    tagline: "Saudi Arabia's private B2B real estate network — verified developers, licensed realtors, commission protected.",
    socials: [
      { type: 'facebook', href: '', visible: true },
      { type: 'linkedin', href: '', visible: true },
      { type: 'x', href: '', visible: true },
    ],
    columns: [
      { title: 'Platform', links: [{ label: 'Marketplace', href: '/marketplace' }, { label: 'For Developers', href: '/register/developer' }, { label: 'For Realtors', href: '/register/realtor' }, { label: 'How it Works', href: '/' }] },
      { title: 'Company', links: [{ label: 'About', href: '#' }, { label: 'Contact', href: '#' }, { label: 'Careers', href: '#' }, { label: 'Pricing', href: '/marketplace' }] },
      { title: 'Legal', links: [{ label: 'Privacy Policy', href: '/legal/privacy' }, { label: 'Terms of Use', href: '/legal/terms' }, { label: 'Cookie Notice', href: '/legal/cookies' }] },
    ],
    copyrightLeft: '© 2026 Waseet. All rights reserved.',
    copyrightRight: 'جميع الحقوق محفوظة · Riyadh, Saudi Arabia',
  },

  custom: { css: '', headHtml: '', bodyHtml: '', js: '' },
}

export default LANDING_DEFAULTS
