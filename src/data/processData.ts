import { ProcessStep } from '../types';

export const processData: ProcessStep[] = [
  {
    step: '01',
    title: 'Discover',
    tagline: 'Deconstruct & Architect',
    description:
      'We begin by analyzing objectives, audience requirements, technical constraints, and competitive landscapes. We define clear milestones and establish performance budgets before writing a single line of code.',
    activities: [
      'Technical Scope & Feasibility Audit',
      'Information Architecture & Content Strategy',
      'Performance & Accessibility Benchmark Targets',
      'Milestone Scheduling & Technical Specification'
    ],
    output: 'System Architecture Document & Project Roadmap'
  },
  {
    step: '02',
    title: 'Design',
    tagline: 'Spatial Aesthetics & Motion Prototypes',
    description:
      'We craft refined spatial user interfaces inspired by physical glass optics, precise typographic hierarchy, and responsive fluid layouts. We prototype micro-interactions and transitions to ensure a cinematic experience.',
    activities: [
      'High-Fidelity Wireframes & Spatial Layouts',
      'Liquid-Glass Design System & Token Tokens',
      'Interactive Motion & Micro-Interaction Prototypes',
      'Responsive Mobile & Tablet Viewport Specifications'
    ],
    output: 'Complete Design System & Motion Specification'
  },
  {
    step: '03',
    title: 'Develop',
    tagline: 'Type-Safe Precision Engineering',
    description:
      'We build your product using modern React, TypeScript, and clean component architecture. 3D elements, canvas shaders, and state handling are engineered for 60fps smoothness and sub-second loading.',
    activities: [
      'Strict TypeScript Component Development',
      'Interactive 3D / Canvas Physics Integration',
      'API, Database & Secure Webhook Infrastructure',
      'Cross-Browser & Hardware Acceleration Optimization'
    ],
    output: 'Production-Ready Codebase & Fully Functional Build'
  },
  {
    step: '04',
    title: 'Deliver',
    tagline: 'Verification, Deployment & Launch',
    description:
      'Every project undergoes rigorous QA: Lighthouse audits for 100/100 Core Web Vitals, accessibility validation (WCAG AA), security verification, and automated deployment pipelines.',
    activities: [
      'Core Web Vitals & Lighthouse Performance Optimization',
      'WCAG 2.1 AA Accessibility & Keyboard Navigation QA',
      'Automated CI/CD Pipeline & Edge Network Deployment',
      'Post-Launch Telemetry & Documentation Handoff'
    ],
    output: 'Live Deployed Platform & Production Verification Report'
  }
];
