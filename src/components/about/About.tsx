import React, { useEffect, useRef } from 'react';
import { Sparkles, Target, Lightbulb, Zap, Code2 } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const About: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate header on scroll
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: 35 },
        {
          opacity: 1,
          y: 0,
          duration: 1.0,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: headerRef.current,
            start: 'top 85%',
          },
        }
      );

      // Staggered reveal of the 4 principle cards
      if (cardsRef.current) {
        const cards = cardsRef.current.children;
        gsap.fromTo(
          cards,
          { opacity: 0, y: 40, scale: 0.96 },
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

  const principles = [
    {
      icon: Sparkles,
      title: 'Creativity',
      subtitle: 'Spatial Visual Polish',
      description:
        'We translate concepts into bespoke, atmospheric digital environments. From realistic liquid-glass panels to cinematic lighting, every interface is designed to leave a lasting impression.',
    },
    {
      icon: Target,
      title: 'Precision',
      subtitle: 'Type-Safe Architecture',
      description:
        'Every project is engineered with strict TypeScript and clean component boundaries. We build dependable, maintainable codebases with zero bloat and absolute attention to detail.',
    },
    {
      icon: Lightbulb,
      title: 'Innovation',
      subtitle: 'Modern 3D & Motion',
      description:
        'We integrate Three.js hardware-accelerated 3D environments, smooth GSAP animation pipelines, and modern CSS to craft web experiences that stand out in a world of generic templates.',
    },
    {
      icon: Zap,
      title: 'Performance',
      subtitle: 'Sub-Second Loading',
      description:
        'Speed and responsiveness are fundamental. We lazy-load heavy assets, optimize bundles for fast initial paint, and ensure fluid 60 FPS transitions across desktop, tablet, and mobile.',
    },
  ];

  const technicalCommitments = [
    { label: 'Engineering Stack', value: 'React 19 + TypeScript + Vite' },
    { label: 'Animation Engine', value: 'GSAP + ScrollTrigger' },
    { label: 'Spatial Layer', value: 'Three.js Hardware Accelerated' },
    { label: 'Accessibility Target', value: 'WCAG 2.1 AA Compliant' },
  ];

  return (
    <section 
      id="about" 
      ref={sectionRef} 
      className="relative py-24 sm:py-32 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div ref={headerRef} className="max-w-3xl mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-pill text-xs font-mono text-[#00E5FF] mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]" />
            <span>01 // THE STUDIO MANIFESTO</span>
          </div>

          <h2 className="font-heading font-extrabold text-3xl sm:text-5xl tracking-tight text-[#F5F7FA] leading-[1.15] mb-6">
            Technology Meets <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] to-[#00AFCB] text-cyan-glow">
              Imagination.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#929AA5] leading-relaxed">
            DESTRUST10N is an independent digital development studio focused on creating modern websites, 
            interactive digital experiences, and technology-driven solutions. We build web platforms that unite 
            creative visual identity with disciplined modern engineering.
          </p>
        </div>

        {/* 4 Core Principles Grid */}
        <div 
          ref={cardsRef} 
          className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-16"
        >
          {principles.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="glass-card p-8 rounded-3xl relative overflow-hidden group border border-white/10 hover:border-[#00E5FF]/50"
              >
                {/* Cyan Corner Glow Accent on Hover */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#00E5FF]/10 rounded-full blur-2xl group-hover:bg-[#00E5FF]/25 transition-all duration-500 pointer-events-none" />

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#101318] border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF] group-hover:scale-110 group-hover:border-[#00E5FF] group-hover:box-cyan-glow transition-all duration-300">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-xl text-[#F5F7FA] group-hover:text-[#00E5FF] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs font-mono text-[#00E5FF]/80 tracking-wider">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-[#929AA5] leading-relaxed relative z-10">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Technical Protocol Bar (Ethical, Concrete, No Fabricated Awards) */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#00E5FF]/20">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#00E5FF] mb-1">
                <Code2 className="w-4 h-4" />
                <span>STUDIO CODEBASE STANDARDS</span>
              </div>
              <h4 className="font-heading font-bold text-lg text-[#F5F7FA]">
                Crafted from scratch with zero boilerplate compromises.
              </h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto">
              {technicalCommitments.map((item, index) => (
                <div key={index} className="px-4 py-3 rounded-2xl bg-[#050608]/70 border border-white/5">
                  <span className="block text-[11px] font-mono text-[#929AA5] mb-0.5">
                    {item.label}
                  </span>
                  <span className="block text-xs font-semibold text-[#F5F7FA]">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
