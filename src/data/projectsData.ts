import { Project } from '../types';

export const projectsData: Project[] = [
  {
    id: 'crema',
    name: 'Crema',
    tagline: 'AI Study Buddy Workspace',
    description:
      'An elite, high-performance study companion workspace engineered for deep conceptual learning, active recall testing, dynamic curriculum scheduling, and computer-vision problem solving.',
    detailedOverview:
      'Crema bridges cutting-edge generative AI capabilities with disciplined learning science. Engineered with low-latency Server-Sent Events (SSE) streaming, interactive multi-format quiz generators, textbook summarizers, and an adaptive 7-day study rescheduler that dynamically redistributes overdue tasks to protect focus.',
    category: 'Full-Stack AI Application',
    year: '2026',
    technologies: [
      'React 19',
      'TypeScript',
      'Express',
      'Vite',
      'Tailwind CSS',
      'Google Gemini API',
      'Web Audio API',
      'Firestore'
    ],
    keyFeatures: [
      'Low-latency SSE streaming study dialogues with multi-turn memory',
      'Interactive multi-format quizzes with instantaneous rubric feedback',
      'Computer-vision homework solver with step-by-step Socratic breakdowns',
      'Dynamic 7-day study planner that recalibrates on missed tasks',
      'Spaced repetition flashcard engine with mastery progression'
    ],
    architectureNotes:
      'Engineered with an Express-Vite unified runtime, strict client-side abort controllers for streaming safety, and modular state machines.',
    status: 'Active Studio Build',
    previewColor: '#00E5FF',
    badge: 'Flagship AI Workspace'
  },
  {
    id: 'aetheria',
    name: 'Aetheria',
    tagline: 'Academic AI Companion & Liquid-Glass Design System',
    description:
      'A refined academic AI study companion wrapped in an Apple-inspired liquid-glass design system with physical 3D tilt interactions, canvas ambient dust particle physics, and procedural audio synthesis.',
    detailedOverview:
      'Aetheria demonstrates high-fidelity visual craft without sacrificing performance. It translates physical glass optics—specular rim highlights, layered translucency, and spatial depth—into responsive web interfaces powered by modern CSS, canvas rendering, and reactive micro-interactions.',
    category: 'Spatial UI & Creative Engineering',
    year: '2026',
    technologies: [
      'React 19',
      'TypeScript',
      'Tailwind CSS v4',
      'Motion',
      'Canvas 2D Physics',
      'Web Audio API',
      'Express',
      'Vite'
    ],
    keyFeatures: [
      'Ultra-refined liquid-glass surface shaders and backdrop blur mechanics',
      'Dynamic 3D gyro and pointer-driven tilt response with spring physics',
      'Canvas-based ambient particle field with fluid dissipation',
      'Synthesized Web Audio tactile sound effects for user interactions',
      'Socratic homework guidance with markdown and KaTeX formula rendering'
    ],
    architectureNotes:
      'Built upon Tailwind CSS v4, custom CSS custom-property design tokens, and lightweight mathematical projection algorithms.',
    status: 'Production Ready',
    previewColor: '#00B4D8',
    badge: 'Spatial Design System'
  },
  {
    id: 'medclear',
    name: 'Medclear',
    tagline: 'Dual-Specialty Medical Practice & Clinical Portal',
    description:
      'An authoritative, high-performance web platform designed for specialized medical practices, combining clinical credibility, procedure timelines, dynamic case galleries, and patient consultation workflows.',
    detailedOverview:
      'Medclear was developed to solve the communication challenge of dual-specialty medical practices (Interventional Cardiology and Vascular Neurology). It delivers accessible typography, instant fuzzy search for procedures, interactive physician credentialing views, and seamless enquiry dispatch.',
    category: 'Healthcare & Enterprise Web',
    year: '2026',
    technologies: [
      'React 19',
      'TypeScript',
      'GSAP Animations',
      'Vite',
      'Tailwind CSS',
      'Fuse.js Search',
      'Lucide React'
    ],
    keyFeatures: [
      'Dual-specialist interactive profiles with credential timelines',
      'Fuzzy-search enabled clinical procedure and diagnostic index',
      'Dynamic clinical case gallery with categorized lightbox views',
      'Triage consultation workflow with scheduling enquiry validations',
      'Fully ADA-compliant contrast ratios and high-legibility medical typography'
    ],
    architectureNotes:
      'Zero external bloated frameworks; utilizes GSAP timeline orchestration, memoized fuzzy indexes, and local persistent data caching.',
    status: 'Production Ready',
    previewColor: '#38BDF8',
    badge: 'Clinical Web Platform'
  }
];
