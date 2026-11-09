import React, { useState, useEffect, useRef } from 'react';
import { 
  Code2, 
  Building2, 
  Layout, 
  Rocket, 
  RefreshCw, 
  Cpu, 
  ArrowRight, 
  CheckCircle2, 
  X,
  Sparkles
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { servicesData } from '../../data/servicesData';
import { Service } from '../../types';

gsap.registerPlugin(ScrollTrigger);

export const Services: React.FC = () => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (gridRef.current) {
        const cards = gridRef.current.children;
        gsap.fromTo(
          cards,
          { opacity: 0, y: 50, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            stagger: 0.12,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: gridRef.current,
              start: 'top 80%',
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const getIcon = (name: string) => {
    switch (name) {
      case 'Code2':
        return Code2;
      case 'Building2':
        return Building2;
      case 'Layout':
        return Layout;
      case 'Rocket':
        return Rocket;
      case 'RefreshCw':
        return RefreshCw;
      case 'Cpu':
        return Cpu;
      default:
        return Code2;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -7;
    const rotateY = ((x - centerX) / centerX) * 7;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
  };

  const scrollToContactWithService = (serviceTitle: string) => {
    setSelectedService(null);
    const contactSection = document.querySelector('#contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
      window.dispatchEvent(new CustomEvent('select-service', { detail: serviceTitle }));
    }
  };

  return (
    <section 
      id="services" 
      ref={sectionRef}
      className="relative py-24 sm:py-32 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 sm:mb-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-pill text-xs font-mono text-[#00E5FF] mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]" />
              <span>02 // STUDIO CAPABILITIES</span>
            </div>

            <h2 className="font-heading font-extrabold text-3xl sm:text-5xl tracking-tight text-[#F5F7FA] leading-[1.15]">
              Engineered Services. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] to-[#00AFCB] text-cyan-glow">
                Tailored for Impact.
              </span>
            </h2>
          </div>

          <p className="mt-4 md:mt-0 text-sm sm:text-base text-[#929AA5] max-w-md">
            Every solution is engineered from first principles. We do not use cookie-cutter templates—every interface is purpose-built for speed and conversion.
          </p>
        </div>

        {/* 6 Premium Interactive Service Cards */}
        <div 
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
        >
          {servicesData.map((service) => {
            const Icon = getIcon(service.icon);
            return (
              <div
                key={service.id}
                className="glass-card p-8 rounded-3xl flex flex-col justify-between group cursor-pointer border border-white/10 hover:border-[#00E5FF]/60 relative overflow-hidden transition-all duration-200"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onClick={() => setSelectedService(service)}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedService(service);
                  }
                }}
              >
                {/* Subtle Hover Bloom Glow */}
                <div className="absolute -top-16 -right-16 w-36 h-36 bg-[#00E5FF]/10 rounded-full blur-2xl group-hover:bg-[#00E5FF]/20 transition-all duration-300 pointer-events-none" />

                {/* Top Corner Index & Icon */}
                <div className="flex items-center justify-between mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-[#101318] border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF] group-hover:scale-110 group-hover:border-[#00E5FF] group-hover:box-cyan-glow transition-all duration-300">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="font-mono text-sm font-bold text-[#929AA5] group-hover:text-[#00E5FF] transition-colors">
                    {service.index}
                  </span>
                </div>

                {/* Content */}
                <div>
                  <h3 className="font-heading font-bold text-xl text-[#F5F7FA] mb-3 group-hover:text-[#00E5FF] transition-colors flex items-center justify-between">
                    <span>{service.title}</span>
                    <ArrowRight className="w-4 h-4 text-[#00E5FF] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                  </h3>
                  
                  <p className="text-sm text-[#929AA5] leading-relaxed mb-6">
                    {service.summary}
                  </p>

                  {/* Feature Highlights Pills */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                    {service.details.slice(0, 2).map((detail, dIdx) => (
                      <span
                        key={dIdx}
                        className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-[#050608]/80 border border-white/5 text-[#929AA5] group-hover:border-[#00E5FF]/25 group-hover:text-[#F5F7FA] transition-colors"
                      >
                        {detail}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Trigger Indicator */}
                <div className="mt-6 pt-4 flex items-center gap-1.5 text-xs font-semibold text-[#00E5FF] opacity-80 group-hover:opacity-100">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Learn More & Scope Details</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Service Detail Modal */}
        {selectedService && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setSelectedService(null)}
          >
            <div
              className="glass-panel p-6 sm:p-10 rounded-3xl max-w-2xl w-full border border-[#00E5FF]/40 relative shadow-[0_25px_60px_rgba(0,0,0,0.95)] animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedService(null)}
                className="absolute top-6 right-6 p-2 rounded-full glass-panel-subtle text-[#929AA5] hover:text-[#00E5FF] hover:border-[#00E5FF] transition-colors"
                aria-label="Close service modal"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-xs text-[#00E5FF] font-bold px-2.5 py-1 rounded-md bg-[#00E5FF]/10 border border-[#00E5FF]/30">
                  CAPABILITY // {selectedService.index}
                </span>
              </div>

              <h3 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#F5F7FA] mb-4">
                {selectedService.title}
              </h3>

              <p className="text-base text-[#929AA5] leading-relaxed mb-6">
                {selectedService.summary}
              </p>

              {/* Scope Breakdown */}
              <div className="mb-6">
                <h4 className="text-xs font-mono uppercase tracking-wider text-[#00E5FF] mb-3">
                  Scope & Architecture Focus
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedService.details.map((detail, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-[#F5F7FA]">
                      <CheckCircle2 className="w-4 h-4 text-[#00E5FF] shrink-0" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deliverables */}
              <div className="mb-8 p-4 rounded-2xl bg-[#050608]/80 border border-white/10">
                <h4 className="text-xs font-mono uppercase tracking-wider text-[#929AA5] mb-2">
                  Key Deliverables
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedService.deliverables.map((item, idx) => (
                    <span key={idx} className="text-xs font-mono px-3 py-1 rounded-full bg-[#101318] border border-[#00E5FF]/20 text-[#00E5FF]">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold text-[#929AA5] hover:text-[#F5F7FA] transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => scrollToContactWithService(selectedService.title)}
                  className="px-6 py-2.5 rounded-full text-xs font-bold glass-btn-primary flex items-center gap-2 cursor-pointer"
                >
                  <span>Inquire About This Service</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
