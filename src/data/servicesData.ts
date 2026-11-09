import { Service } from '../types';

export const servicesData: Service[] = [
  {
    id: 'web-development',
    index: '01',
    title: 'Website Development',
    summary:
      'Custom-engineered web applications crafted with React, TypeScript, and modern frameworks. Built for speed, resilience, and maintainability.',
    details: [
      'Single Page & Full-Stack Architectures',
      'Modern Component-Driven Systems',
      'Ultra-Fast Loading & Core Web Vitals Optimization',
      'API & Third-Party Service Integration'
    ],
    icon: 'Code2',
    deliverables: ['Production SPA/SSR Build', 'Component Architecture', 'Documentation & Clean Code']
  },
  {
    id: 'business-websites',
    index: '02',
    title: 'Business Websites',
    summary:
      'Authoritative digital hubs designed to establish credibility, articulate complex value propositions, and drive commercial inquiries.',
    details: [
      'Strategic Information Architecture',
      'High-Conversion Inquiry Workflows',
      'Enterprise-Grade Security & Privacy Compliance',
      'CMS Integration & Structured Content Management'
    ],
    icon: 'Building2',
    deliverables: ['Custom Brand Portal', 'Contact & Lead Capture Pipelines', 'Analytics Integration']
  },
  {
    id: 'portfolio-websites',
    index: '03',
    title: 'Portfolio Websites',
    summary:
      'Bespoke, cinematic personal and studio portfolios designed to make an indelible impression through spatial design, motion, and interaction.',
    details: [
      'Custom 3D & WebGL Environments',
      'Interactive Project Showcases & Galleries',
      'Fluid Micro-Interactions & Custom Cursors',
      'Fast Image & Video Asset Optimization'
    ],
    icon: 'Layout',
    deliverables: ['Spatial Portfolio Interface', 'Interactive Project Drawers', 'Mobile-Optimized Responsive Views']
  },
  {
    id: 'landing-pages',
    index: '04',
    title: 'Landing Pages',
    summary:
      'Hyper-focused conversion vehicles engineered for product releases, SaaS campaigns, and venture announcements. Maximum velocity and clarity.',
    details: [
      'Compelling Hero Visuals & Micro-Demos',
      'A/B Testing Ready Architecture',
      'Sub-Second First Contentful Paint (FCP)',
      'Cross-Platform Conversion Tracking'
    ],
    icon: 'Rocket',
    deliverables: ['High-Velocity Landing Page', 'Optimized Asset Bundles', 'Form Validation & Webhook Sync']
  },
  {
    id: 'website-redesign',
    index: '05',
    title: 'Website Redesign',
    summary:
      'Transform outdated, slow, or fragmented web properties into modern, accessible, and high-performance digital flagships.',
    details: [
      'Legacy Code & UI Audit',
      'Performance & Accessibility Modernization',
      'Design System Extraction & Harmonization',
      'Zero-Downtime Migration Strategies'
    ],
    icon: 'RefreshCw',
    deliverables: ['Audit Report', 'Modernized Design System', 'Clean Codebase Transition']
  },
  {
    id: 'digital-solutions',
    index: '06',
    title: 'Digital Solutions',
    summary:
      'Specialized bespoke web tools, client dashboards, interactive calculation engines, and custom workflows tailored to unique technical needs.',
    details: [
      'Interactive Data Visualizations & Dashboards',
      'Automated Form & Document Workflows',
      'Real-Time WebSocket & SSE State Feeds',
      'Tailored Integration Middleware'
    ],
    icon: 'Cpu',
    deliverables: ['Specialized Tool Interface', 'Custom Backend Endpoint', 'Full End-to-End Testing']
  }
];
