/**
 * ─────────────────────────────────────────────────────────────
 *  ALL PORTFOLIO CONTENT LIVES HERE.
 *  Edit text, links and lists in this file only — the 3D scene,
 *  the simple 2D version and the SEO tags are all generated from it.
 *  (Plain data only: no JSX, no imports. vite.config.js reads it too.)
 * ─────────────────────────────────────────────────────────────
 */

export const site = {
  // Your final domain, no trailing slash. Used for canonical + Open Graph URLs.
  url: 'https://jithanroy.dev',
  title: 'Jithan Roy — Software Engineer | Ride-through Portfolio',
  description:
    'Jithan Roy is a full-stack software engineer in Dhaka, Bangladesh, building scalable web applications with React, Next.js, Node.js, NestJS and PostgreSQL. Take a ride through the portfolio.',
  ogImage: '/og-image.png',
  themeColor: '#0b1020',
};

export const profile = {
  name: 'Jithan Roy',
  role: 'Software Engineer',
  tagline: 'Full-stack engineer · React, Next.js, Node.js & PostgreSQL',
  location: 'Rampura, Dhaka, Bangladesh',
  bio: [
    'Full-stack software engineer with 4+ years of experience building and shipping scalable web applications.',
    'Strong foundation in frontend engineering with React and Next.js, now specializing in backend development and database engineering using Node.js, Express.js, NestJS and PostgreSQL.',
    'Experienced in designing RESTful APIs, optimizing database queries, and containerizing services with Docker. Comfortable across the full stack and passionate about reliable, performant backend systems.',
  ],
};

export const education = [
  {
    school: 'East West University',
    degree: 'B.Sc. in Computer Science',
    detail: 'CGPA 3.06 / 4.00',
    years: '2016 – 2021',
    place: 'Dhaka, Bangladesh',
  },
  {
    school: 'Dhaka City College',
    degree: 'Higher Secondary Certificate (HSC)',
    detail: 'GPA 5.00 / 5.00',
    years: '',
    place: 'Dhaka, Bangladesh',
  },
  {
    school: 'Willes Little Flower School',
    degree: 'Secondary School Certificate (SSC)',
    detail: 'GPA 5.00 / 5.00',
    years: '',
    place: 'Dhaka, Bangladesh',
  },
];

// Each group becomes one road sign in the Skills stop.
export const skills = [
  { group: 'Frontend', items: ['React', 'Next.js', 'JavaScript (ES6+)', 'TypeScript', 'Tailwind CSS', 'React Query'] },
  { group: 'Backend', items: ['Node.js', 'Express.js', 'NestJS', 'PostgreSQL', 'RESTful API Design', 'JWT Auth'] },
  { group: 'Database', items: ['PostgreSQL', 'MongoDB', 'Database Migrations'] },
  { group: 'Tools & DevOps', items: ['Git', 'Docker', 'Linux'] },
];

// Each project becomes one billboard. Leave `link` empty if it is private.
export const projects = [
  {
    name: 'EBS Enterprise Software',
    summary:
      'Core frontend for accounting workflows — dynamic company setup interfaces and multi-tier financial configuration modules.',
    tech: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
    highlights: [
      'Built core accounting workflows incl. dynamic company setup and multi-tier financial configuration.',
      'Designed responsive forms and data tables with complex state for high-volume accounting data.',
    ],
    link: '',
  },
  {
    name: 'Cartup E-Commerce Platform',
    summary:
      'E-commerce backend in Golang with RESTful APIs for catalog, cart, orders and JWT auth, plus a Next.js storefront.',
    tech: ['Next.js', 'React', 'Tailwind CSS', 'PostgreSQL', 'Go'],
    highlights: [
      'RESTful APIs for product catalog, cart, order processing and JWT user authentication.',
      'Designed the PostgreSQL schema (users, products, orders, inventory) with proper indexing.',
      'Containerized the full stack with Docker for reproducible dev and deployment.',
    ],
    link: 'https://cartup.com',
  },
  {
    name: 'Empathika',
    summary:
      'Mental-health web application — RESTful API endpoints, dynamic UI and type-safe data handling end to end.',
    tech: ['TypeScript', 'Next.js', 'React', 'Tailwind CSS', 'Node.js', 'PostgreSQL'],
    highlights: [
      'Built RESTful API endpoints and dynamic UI components.',
      'Handled async data with React Query, cutting unnecessary re-fetches.',
      'Defined API contracts with the backend team for type-safe data flow.',
    ],
    link: 'https://app.empathika.com',
  },
  {
    name: 'iThrive Wellness Platform',
    summary:
      'Fully responsive wellness platform built pixel-perfect from Figma, with big Lighthouse performance gains.',
    tech: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'],
    highlights: [
      'Cross-browser, fully responsive build from Figma across mobile, tablet and desktop.',
      'Lazy loading and dynamic imports improved Lighthouse performance significantly.',
    ],
    link: 'https://ithrive365.thriveos.org',
  },
];

// Oldest first — each entry becomes a milestone marker along the road.
export const experience = [
  {
    company: 'TulipTech Ltd.',
    role: 'Junior Software Engineer',
    period: 'Apr 2022 – Apr 2024',
    year: '2022',
    place: 'Uttar Badda, Dhaka',
    points: [
      'Built responsive, pixel-perfect interfaces with React.js from Figma designs.',
      'Developed scalable web applications using React.js and modern JavaScript (ES6+).',
      'Built reusable component-based architecture to improve maintainability.',
    ],
  },
  {
    company: 'TulipTech Ltd.',
    role: 'Software Engineer',
    period: 'May 2024 – Aug 2025',
    year: '2024',
    place: 'Uttar Badda, Dhaka',
    points: [
      'Integrated AI features into a production web app, consuming RESTful APIs for real-time data.',
      'Defined API contracts with the backend team, cutting frontend-backend handoff time ~20%.',
      'Refactored a shared component library, reducing duplicate code by over 40%.',
    ],
  },
  {
    company: 'TechnoNext Ltd.',
    role: 'Software Engineer',
    period: 'Sep 2025 – Present',
    year: '2025',
    place: 'Notun Bazar, Dhaka',
    points: [
      'Design and build RESTful APIs with Node.js and Express.js on PostgreSQL, serving 5+ integrated client applications.',
      'Architect and maintain PostgreSQL schemas, optimizing queries and indexes.',
      'Containerized the stack with Docker, eliminating environment-specific bugs.',
      'Integrated third-party REST APIs with structured error handling and logging.',
    ],
  },
];

export const contact = {
  email: 'jithanroyjony@gmail.com',
  github: 'https://github.com/JithanRoy',
  linkedin: 'https://www.linkedin.com/in/jithanroy',
  phone: '+880 1521-327660',
  showPhone: true, // set false to hide the phone number on the site
  // Put your PDF in /public (e.g. /public/Jithan-Roy-Resume.pdf) and set '/Jithan-Roy-Resume.pdf'. Empty = hidden.
  resume: '',
};

// The six top-level stops, in ride order. Labels show in the menu + progress bar.
export const sectionLabels = {
  start: 'Start',
  about: 'About',
  skills: 'Skills',
  projects: 'Projects',
  experience: 'Experience',
  contact: 'Contact',
};
