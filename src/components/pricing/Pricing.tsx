import React, { useEffect, useRef } from 'react';
import { Check, ArrowRight, Sparkles, ShieldCheck, HelpCircle } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface PricingTier {
  id: string;
  name: string;
  price: string;
  priceValue: number;
  badge?: string;
  isPopular?: boolean;
  tagline: string;
  scope: string;
  features: string[];
}

export const Pricing: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const cardsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (cardsRef.current) {
        const cards = cardsRef.current.children;
        gsap.fromTo(
          cards,
          { opacity: 0, y: 40, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: cardsRef.current,
              start: 'top 80%',
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const pricingTiers: PricingTier[] = [
    {
      id: 'starter',
      name: 'Starter Website',
      price: '$10',
      priceValue: 10,
      badge: 'Introductory Tier',
      isPopular: false,
      tagline: 'Ideal for personal portfolios, single-page launches & simple online presence.',
      scope: 'Single-page responsive layout engineered with React & Tailwind CSS.',
      features: [
        'Single-page responsive layout',
        'Mobile & tablet optimized interface',
        'Basic contact form integration',
        'Clean, accessible semantic HTML',
        'Fast static build (React + Vite)',
        'Deployment-ready asset delivery'
      ],
    },
    {
      id: 'business',
      name: 'Business Website',
      price: '$25',
      priceValue: 25,
      badge: 'Most Popular',
      isPopular: true,
      tagline: 'For emerging businesses, independent services & structured digital hubs.',
      scope: 'Multi-section web presence with custom styling and inquiry routing.',
      features: [
        'Up to 3–4 structured content sections',
        'Liquid-glass surface styling & brand theme',
        'Functional lead inquiry intake backend',
        'Responsive navigation with mobile drawer',
        'Essential SEO metadata & social cards',
        'Cross-browser testing & verification'
      ],
    },
    {
      id: 'premium',
      name: 'Premium Starter Build',
      price: '$50',
      priceValue: 50,
      badge: 'Flagship Starter',
      isPopular: false,
      tagline: 'For ambitious creator portfolios, tech prototypes & high-impact showcases.',
      scope: 'Comprehensive web experience with interactive 3D elements & GSAP motion.',
      features: [
        'Complete multi-section web experience',
        'Interactive 3D / WebGL canvas integration',
        'GSAP scroll-triggered motion effects',
        'Server-side validation & rate-limited intake',
        'Performance optimization (Lighthouse 90+)',
        'Detailed documentation & repository handoff'
      ],
    },
  ];

  const handleSelectTier = (tier: PricingTier) => {
    const contactSection = document.querySelector('#contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
      // Dispatch custom event to preselect project type and budget
      window.dispatchEvent(
        new CustomEvent('select-pricing-tier', {
          detail: {
            tierName: tier.name,
            budget: `${tier.price} (${tier.name})`,
          },
        })
      );
    }
  };

  return (
    <section 
      id="pricing" 
      ref={sectionRef} 
      className="relative py-24 sm:py-32 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 sm:mb-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-pill text-xs font-mono text-[#00E5FF] mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]" />
              <span>05 // INTRODUCTORY ESTIMATES</span>
            </div>

            <h2 className="font-heading font-extrabold text-3xl sm:text-5xl tracking-tight text-[#F5F7FA] leading-[1.15]">
              Transparent Pricing. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] to-[#00AFCB] text-cyan-glow">
                Accessible Starts.
              </span>
            </h2>
          </div>

          <p className="mt-4 md:mt-0 text-sm sm:text-base text-[#929AA5] max-w-md">
            As an emerging independent digital development studio, we offer honest, transparent starter estimates in USD ($).
          </p>
        </div>

        {/* 3 Pricing Cards */}
        <div 
          ref={cardsRef}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch mb-12"
        >
          {pricingTiers.map((tier) => (
            <div
              key={tier.id}
              className={`glass-card p-8 rounded-3xl flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${
                tier.isPopular
                  ? 'border-[#00E5FF] shadow-[0_0_40px_rgba(0,229,255,0.22)] bg-[#101318]/95'
                  : 'border-white/10 hover:border-[#00E5FF]/40'
              }`}
            >
              {/* Top Popular Glow */}
              {tier.isPopular && (
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-[#00E5FF]/20 rounded-full blur-2xl pointer-events-none" />
              )}

              <div>
                {/* Badge Header */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-mono px-3 py-1 rounded-full border ${
                    tier.isPopular
                      ? 'bg-[#00E5FF]/15 text-[#00E5FF] border-[#00E5FF]/40 font-bold'
                      : 'bg-white/5 text-[#929AA5] border-white/10'
                  }`}>
                    {tier.badge}
                  </span>
                  <span className="text-[11px] font-mono text-[#929AA5]">USD ($)</span>
                </div>

                <h3 className="font-heading font-extrabold text-2xl text-[#F5F7FA] mb-2">
                  {tier.name}
                </h3>

                <p className="text-xs text-[#929AA5] leading-relaxed mb-6">
                  {tier.tagline}
                </p>

                {/* Price Display */}
                <div className="flex items-baseline gap-2 mb-6 pb-6 border-b border-white/10">
                  <span className="font-heading font-black text-5xl text-[#F5F7FA] tracking-tight">
                    {tier.price}
                  </span>
                  <span className="text-xs font-mono text-[#929AA5]">
                    / starting estimate
                  </span>
                </div>

                {/* Scope Definition */}
                <div className="mb-6 p-3.5 rounded-xl bg-[#050608]/70 border border-white/5 text-xs text-[#F5F7FA]">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#00E5FF] block mb-1">
                    Scope of Work
                  </span>
                  {tier.scope}
                </div>

                {/* Features List */}
                <div className="space-y-3 mb-8">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#929AA5] block">
                    Included Capabilities:
                  </span>
                  {tier.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-[#F5F7FA]">
                      <Check className="w-4 h-4 text-[#00E5FF] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div>
                <button
                  type="button"
                  onClick={() => handleSelectTier(tier)}
                  className={`w-full py-3.5 rounded-full text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    tier.isPopular
                      ? 'glass-btn-primary'
                      : 'glass-btn-secondary'
                  }`}
                >
                  <span>Select {tier.name}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Clear Mandatory Pricing Disclaimer Note */}
        <div className="p-6 rounded-3xl glass-panel-subtle border border-[#00E5FF]/20 flex items-start sm:items-center gap-4">
          <HelpCircle className="w-6 h-6 text-[#00E5FF] shrink-0 mt-0.5 sm:mt-0" />
          <div className="text-xs sm:text-sm text-[#929AA5] leading-relaxed">
            <strong className="text-[#F5F7FA] font-semibold">Important Scope Note: </strong>
            These are introductory starting estimates. Final pricing depends on the project scope, pages, features and requirements.
            We maintain strict honesty in our work and do not promise unlimited features or enterprise systems for these introductory amounts.
          </div>
        </div>

      </div>
    </section>
  );
};
