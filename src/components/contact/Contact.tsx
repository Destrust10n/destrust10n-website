import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mail,
  Clock,
  Sparkles,
  ShieldCheck,
  Copy,
  Check
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ContactFormData, ContactSubmissionResponse } from '../../types';
import { AvailabilityIndicator } from '../layout/AvailabilityIndicator';

gsap.registerPlugin(ScrollTrigger);

export const Contact: React.FC = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    projectType: 'Website Development',
    budget: '$25 (Business Website)',
    description: '',
    website: '', // Honeypot field for bot trapping
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<ContactSubmissionResponse | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const sectionRef = useRef<HTMLElement | null>(null);
  const formCardRef = useRef<HTMLDivElement | null>(null);

  // Configured studio contact email
  const studioEmail = 'destrust100n@gmail.com';

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (formCardRef.current) {
        gsap.fromTo(
          formCardRef.current,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: formCardRef.current,
              start: 'top 85%',
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Listen for service selection from Services or Pricing section
  useEffect(() => {
    const handleSelectService = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setFormData((prev) => ({ ...prev, projectType: customEvent.detail }));
      }
    };

    const handleSelectPricingTier = (e: Event) => {
      const customEvent = e as CustomEvent<{ tierName: string; budget: string }>;
      if (customEvent.detail) {
        setFormData((prev) => ({
          ...prev,
          projectType: customEvent.detail.tierName,
          budget: customEvent.detail.budget,
        }));
      }
    };

    window.addEventListener('select-service', handleSelectService);
    window.addEventListener('select-pricing-tier', handleSelectPricingTier);

    return () => {
      window.removeEventListener('select-service', handleSelectService);
      window.removeEventListener('select-pricing-tier', handleSelectPricingTier);
    };
  }, []);

  const projectTypes = [
    'Website Development',
    'Business Websites',
    'Portfolio Websites',
    'Landing Pages',
    'Website Redesign',
    'Digital Solutions',
    'Starter Website ($10)',
    'Business Website ($25)',
    'Premium Starter Build ($50)',
    'Other / Custom Scope',
  ];

  const budgetRanges = [
    '$10 (Starter Website)',
    '$25 (Business Website)',
    '$50 (Premium Starter Build)',
    'Scope Dependent (Starting at $10)',
  ];

  const copyEmailToClipboard = () => {
    navigator.clipboard.writeText(studioEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ContactFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Please provide your name or organization.';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters.';
    } else if (formData.name.trim().length > 80) {
      newErrors.name = 'Name cannot exceed 80 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Please provide an email address.';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please provide a valid email address.';
    } else if (formData.email.trim().length > 100) {
      newErrors.email = 'Email cannot exceed 100 characters.';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Please describe your project requirements.';
    } else if (formData.description.trim().length < 15) {
      newErrors.description = 'Please provide at least 15 characters describing your project.';
    } else if (formData.description.trim().length > 1500) {
      newErrors.description = 'Description cannot exceed 1500 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(formData),
      });

      let data: ContactSubmissionResponse | null = null;
      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const rawText = await res.text();
        if (res.status === 404) {
          throw new Error('API route /api/contact is unavailable (HTTP 404). Please ensure serverless functions are deployed.');
        }
        throw new Error(rawText.slice(0, 120) || `Server returned unexpected HTTP ${res.status}`);
      }

      if (!res.ok || !data?.success) {
        if (data?.errors) {
          setErrors(data.errors);
        }
        throw new Error(data?.message || `Server returned HTTP ${res.status} while processing inquiry.`);
      }

      // Confirmed success: Store result and reset form
      setSubmitResult(data);
      window.dispatchEvent(new Event('availability-updated'));
      setFormData({
        name: '',
        email: '',
        projectType: 'Website Development',
        budget: '$25 (Business Website)',
        description: '',
        website: '',
      });
      setErrors({});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to backend server.';
      setServerError(msg);
      // Notice: formData is intentionally preserved so the user never loses their typed inquiry
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="relative py-24 sm:py-32 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">

          {/* Left Column: Direct Studio Information */}
          <div className="lg:col-span-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-pill text-xs font-mono text-[#00E5FF] mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]" />
              <span>06 // INITIATE COLLABORATION</span>
            </div>

            <h2 className="font-heading font-extrabold text-3xl sm:text-5xl tracking-tight text-[#F5F7FA] leading-[1.15] mb-6">
              Have an Idea? <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] to-[#00AFCB] text-cyan-glow">
                Let's Build It.
              </span>
            </h2>

            <p className="text-base text-[#929AA5] leading-relaxed mb-8">
              Whether you need a starter landing page, a professional business web hub, or a custom spatial portfolio,
              we are ready to bring your vision into reality.
            </p>

            {/* Live Availability Indicator */}
            <AvailabilityIndicator variant="detailed" className="mb-8" />

            {/* Direct Studio Email Box */}
            <div className="p-5 rounded-2xl glass-panel-subtle border border-[#00E5FF]/25 mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-[#00E5FF] flex items-center gap-1.5">
                  <Mail className="w-4 h-4" />
                  <span>OFFICIAL STUDIO INBOX</span>
                </span>
                <button
                  type="button"
                  onClick={copyEmailToClipboard}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#101318] hover:bg-[#00E5FF]/15 text-[11px] font-mono text-[#F5F7FA] hover:text-[#00E5FF] transition-colors cursor-pointer border border-white/5"
                  title="Copy email to clipboard"
                >
                  {copiedEmail ? (
                    <>
                      <Check className="w-3 h-3 text-[#00E5FF]" />
                      <span className="text-[#00E5FF]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <a
                href={`mailto:${studioEmail}`}
                className="font-mono text-sm sm:text-base text-[#F5F7FA] hover:text-[#00E5FF] transition-colors font-medium break-all"
              >
                {studioEmail}
              </a>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3.5 p-4 rounded-2xl glass-panel-subtle border border-white/5">
                <Clock className="w-5 h-5 text-[#00E5FF] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-[#F5F7FA]">24-Hour Review Turnaround</h4>
                  <p className="text-xs text-[#929AA5] mt-0.5">
                    Every project inquiry is evaluated and answered with an initial scope assessment within 24 hours.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-4 rounded-2xl glass-panel-subtle border border-white/5">
                <ShieldCheck className="w-5 h-5 text-[#00E5FF] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-[#F5F7FA]">Honest Pricing Guarantee</h4>
                  <p className="text-xs text-[#929AA5] mt-0.5">
                    Clear starter rates ($10, $25, $50), transparent milestones, and zero hidden costs.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#050608] border border-[#00E5FF]/20 text-xs font-mono text-[#929AA5]">
              <span className="text-[#00E5FF] block mb-1">PRIVACY PROTOCOL</span>
              <span>Personal details remain strictly confidential. Zero third-party analytics or ad trackers.</span>
            </div>
          </div>

          {/* Right Column: High-Performance Glass Contact Form */}
          <div className="lg:col-span-7">
            <div
              ref={formCardRef}
              className="glass-panel p-6 sm:p-10 rounded-3xl border border-[#00E5FF]/25 shadow-2xl relative"
            >

              {/* Success Notification View */}
              {submitResult ? (
                <div className="py-10 text-center animate-in fade-in zoom-in-95 duration-300">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF] flex items-center justify-center text-[#00E5FF] box-cyan-glow">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#F5F7FA] mb-2">
                    Inquiry Received.
                  </h3>
                  <p className="text-sm text-[#929AA5] max-w-md mx-auto mb-6">
                    {submitResult.message} We will review your project requirements and follow up at your provided email shortly.
                  </p>

                  <div className="inline-block p-4 rounded-2xl bg-[#050608] border border-white/10 font-mono text-xs text-left mb-8">
                    <div className="flex items-center justify-between gap-6 mb-1 text-[#929AA5]">
                      <span>Inquiry Reference:</span>
                      <strong className="text-[#00E5FF]">{submitResult.inquiryId}</strong>
                    </div>
                    <div className="flex items-center justify-between gap-6 text-[#929AA5]">
                      <span>Recorded Timestamp:</span>
                      <span className="text-[#F5F7FA]">{submitResult.timestamp}</span>
                    </div>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => setSubmitResult(null)}
                      className="px-6 py-2.5 rounded-full text-xs font-semibold glass-btn-secondary cursor-pointer"
                    >
                      Submit Another Project Inquiry
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate autoComplete="off" className="space-y-6">

                  {/* Realtime Availability Status Header */}
                  <div className="pb-4 border-b border-white/10 flex items-center justify-between">
                    <AvailabilityIndicator variant="compact" />
                    <span className="text-[10px] font-mono text-[#00E5FF] bg-[#00E5FF]/10 px-2.5 py-1 rounded-full border border-[#00E5FF]/20">
                      1 Day // 1 Work
                    </span>
                  </div>

                  {/* Anti-Spam Honeypot Field (Invisible to human users, traps automated bots) */}
                  <div className="opacity-0 absolute -z-50 w-0 h-0 overflow-hidden" aria-hidden="true">
                    <label htmlFor="website">Website</label>
                    <input
                      id="website"
                      type="text"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={formData.website || ''}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    />
                  </div>

                  {/* Server error alert banner if transmission failed */}
                  {serverError && (
                    <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/50 flex items-start gap-3 text-red-200 text-xs">
                      <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-semibold">Transmission Notice</strong>
                        <span>{serverError}</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Name Field */}
                    <div>
                      <label htmlFor="name" className="block text-xs font-mono uppercase tracking-wider text-[#929AA5] mb-2">
                        Your Name / Organization <span className="text-[#00E5FF]">*</span>
                      </label>
                      <input
                        id="name"
                        name="visitor_full_name"
                        type="text"
                        autoComplete="off"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        maxLength={80}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Alex Vance"
                        disabled={isSubmitting}
                        className={`w-full px-4 py-3 rounded-xl bg-[#050608]/70 border text-sm text-[#F5F7FA] placeholder-[#929AA5]/40 transition-colors focus:outline-none focus:ring-1 focus:ring-[#00E5FF] ${
                          errors.name ? 'border-red-500/70' : 'border-white/10 focus:border-[#00E5FF]'
                        }`}
                      />
                      {errors.name && (
                        <p className="mt-1 text-[11px] font-mono text-red-400">{errors.name}</p>
                      )}
                    </div>

                    {/* Email Field - Hardened against browser personal profile autofill */}
                    <div>
                      <label htmlFor="email" className="block text-xs font-mono uppercase tracking-wider text-[#929AA5] mb-2">
                        Email Address <span className="text-[#00E5FF]">*</span>
                      </label>
                      <input
                        id="email"
                        name="inquiry_contact_email"
                        type="email"
                        autoComplete="off"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck="false"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        maxLength={100}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="alex@example.com"
                        disabled={isSubmitting}
                        className={`w-full px-4 py-3 rounded-xl bg-[#050608]/70 border text-sm text-[#F5F7FA] placeholder-[#929AA5]/40 transition-colors focus:outline-none focus:ring-1 focus:ring-[#00E5FF] ${
                          errors.email ? 'border-red-500/70' : 'border-white/10 focus:border-[#00E5FF]'
                        }`}
                      />
                      {errors.email && (
                        <p className="mt-1 text-[11px] font-mono text-red-400">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Project Type Select */}
                    <div>
                      <label htmlFor="projectType" className="block text-xs font-mono uppercase tracking-wider text-[#929AA5] mb-2">
                        Project Type <span className="text-[#00E5FF]">*</span>
                      </label>
                      <select
                        id="projectType"
                        value={formData.projectType}
                        onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-3 rounded-xl bg-[#050608] border border-white/10 text-sm text-[#F5F7FA] transition-colors focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF]"
                      >
                        {projectTypes.map((type) => (
                          <option key={type} value={type} className="bg-[#101318] text-[#F5F7FA]">
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Target Budget Select (USD) */}
                    <div>
                      <label htmlFor="budget" className="block text-xs font-mono uppercase tracking-wider text-[#929AA5] mb-2">
                        Introductory Budget <span className="text-[#929AA5]/60 text-[10px]">(USD)</span>
                      </label>
                      <select
                        id="budget"
                        value={formData.budget}
                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-3 rounded-xl bg-[#050608] border border-white/10 text-sm text-[#F5F7FA] transition-colors focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF]"
                      >
                        {budgetRanges.map((range) => (
                          <option key={range} value={range} className="bg-[#101318] text-[#F5F7FA]">
                            {range}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Project Description Textarea */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="description" className="block text-xs font-mono uppercase tracking-wider text-[#929AA5]">
                        Project Description & Scope <span className="text-[#00E5FF]">*</span>
                      </label>
                      <span className="text-[10px] font-mono text-[#929AA5]">
                        {formData.description.length}/1500 chars
                      </span>
                    </div>
                    <textarea
                      id="description"
                      rows={5}
                      maxLength={1500}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Tell us about your project goals, pages needed, timeline, or design preferences..."
                      disabled={isSubmitting}
                      className={`w-full px-4 py-3 rounded-xl bg-[#050608]/70 border text-sm text-[#F5F7FA] placeholder-[#929AA5]/40 transition-colors focus:outline-none focus:ring-1 focus:ring-[#00E5FF] resize-y ${
                        errors.description ? 'border-red-500/70' : 'border-white/10 focus:border-[#00E5FF]'
                      }`}
                    />
                    {errors.description && (
                      <p className="mt-1 text-[11px] font-mono text-red-400">{errors.description}</p>
                    )}
                  </div>

                  {/* Submission Button */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="text-[11px] font-mono text-[#929AA5]">
                      🔒 Secure Transmission // Zero Client-Side Secret Leaks
                    </span>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-bold glass-btn-primary flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-[#050608]" />
                          <span>Transmitting Inquiry...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Project Request</span>
                          <Send className="w-4 h-4 text-[#050608]" />
                        </>
                      )}
                    </button>
                  </div>

                </form>
              )}

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
