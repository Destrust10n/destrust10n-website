export interface Project {
  id: string;
  name: string;
  tagline: string;
  description: string;
  detailedOverview: string;
  category: string;
  year: string;
  technologies: string[];
  keyFeatures: string[];
  architectureNotes: string;
  status: 'Production Ready' | 'Active Studio Build' | 'Internal Laboratory';
  url?: string;
  previewColor: string;
  badge: string;
}

export interface Service {
  id: string;
  index: string;
  title: string;
  summary: string;
  details: string[];
  icon: string;
  deliverables: string[];
}

export interface ProcessStep {
  step: string;
  title: string;
  tagline: string;
  description: string;
  activities: string[];
  output: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  projectType: string;
  budget?: string;
  description: string;
  website?: string; // Anti-spam honeypot
}

export interface ContactSubmissionResponse {
  success: boolean;
  message: string;
  inquiryId?: string;
  timestamp?: string;
  errors?: Record<string, string>;
}
