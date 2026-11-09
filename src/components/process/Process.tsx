import React, { useState, useEffect, useRef } from 'react';
import { Search, PenTool, Code, CheckCircle, ShieldCheck } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { processData } from '../../data/processData';

gsap.registerPlugin(ScrollTrigger);

export const Process: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const sectionRef = useRef<HTMLElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate progress line as user scrolls through the process section
      if (progressBarRef.current) {
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: 'top 70%',
          end: 'bottom 60%',
          scrub: 1.0,
          onUpdate: (self) => {
            const progress = self.progress;
            if (progressBarRef.current) {
              progressBarRef.current.style.width = `${progress * 100}%`;
            }
            const stepIndex = Math.min(3, Math.floor(progress * 4));
            setActiveStep(stepIndex);
          },
        });
      }

      // Staggered card reveal on scroll
      if (cardsRef.current) {
        const cards = cardsRef.current.children;
        gsap.fromTo(
          cards,
          { opacity: 0, y: 45 },
          {
            opacity: 1,
            y: 0,
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

  const getStepIcon = (index: number) => {
    switch (index) {
      case 0:
        return Search;
      case 1:
        return PenTool;
      case 2:
        return Code;
      case 3:
        return CheckCircle;
      default:
        return Search;
    }
  };

  return (
    <section 
      id="process" 
      ref={sectionRef} 
      className="relative py-24 sm:py-32 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-pill text-xs font-mono text-[#00E5FF] mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]" />
            <span>04 // DEVELOPMENT LIFECYCLE</span>
          </div>

          <h2 className="font-heading font-extrabold text-3xl sm:text-5xl tracking-tight text-[#F5F7FA] leading-[1.15] mb-6">
            Disciplined Process. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] to-[#00AFCB] text-cyan-glow">
              Deterministic Outcomes.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#929AA5] leading-relaxed">
            From initial concept discovery to production deployment, our four-stage framework
            eliminates ambiguity, accelerates execution, and guarantees technical excellence.
          </p>
        </div>

        {/* Connected Visual Timeline (Desktop) */}
        <div className="relative mb-16 hidden lg:block">
          {/* Connecting Cyan Backing Line */}
          <div className="absolute top-1/2 left-0 right-0 h-[2px] -translate-y-1/2 bg-white/10 z-0" />
          
          {/* GSAP Scroll-Triggered Animated Progress Track */}
          <div 
            ref={progressBarRef}
            className="absolute top-1/2 left-0 h-[2px] -translate-y-1/2 bg-gradient-to-r from-[#00E5FF] via-[#70EEFF] to-[#00AFCB] shadow-[0_0_15px_#00E5FF] z-0 transition-all duration-300"
            style={{ width: `${(activeStep / (processData.length - 1)) * 100}%` }}
          />

          {/* Interactive Step Milestones */}
          <div className="relative z-10 grid grid-cols-4 gap-6">
            {processData.map((step, idx) => {
              const Icon = getStepIcon(idx);
              const isSelected = activeStep === idx;
              const isPassed = activeStep >= idx;

              return (
                <button
                  key={step.step}
                  type="button"
                  onClick={() => setActiveStep(idx)}
                  className="flex flex-col items-center text-center group cursor-pointer focus:outline-none"
                >
                  {/* Node Circle */}
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 mb-4 ${
                      isSelected
                        ? 'bg-[#00E5FF] text-[#050608] shadow-[0_0_25px_#00E5FF] scale-110'
                        : isPassed
                        ? 'bg-[#101318] text-[#00E5FF] border border-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                        : 'bg-[#101318] text-[#929AA5] border border-white/10 group-hover:border-[#00E5FF]/40'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  <span className="font-mono text-xs font-bold text-[#00E5FF] mb-1">
                    {step.step}
                  </span>
                  <span className={`font-heading font-bold text-base transition-colors ${
                    isSelected ? 'text-[#00E5FF]' : 'text-[#F5F7FA] group-hover:text-[#00E5FF]'
                  }`}>
                    {step.title}
                  </span>
                  <span className="text-xs text-[#929AA5] mt-1 max-w-[190px] line-clamp-1">
                    {step.tagline}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4 Process Step Cards Grid */}
        <div 
          ref={cardsRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8"
        >
          {processData.map((item, index) => {
            const Icon = getStepIcon(index);
            const isCurrent = activeStep === index;

            return (
              <div
                key={item.step}
                className={`glass-card p-6 sm:p-8 rounded-3xl flex flex-col justify-between border transition-all duration-300 cursor-pointer ${
                  isCurrent
                    ? 'border-[#00E5FF] shadow-[0_0_30px_rgba(0,229,255,0.22)] bg-[#101318]/90'
                    : 'border-white/10 hover:border-[#00E5FF]/40'
                }`}
                onClick={() => setActiveStep(index)}
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-mono text-2xl font-black text-[#00E5FF]">
                      {item.step}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-[#050608] border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF]">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="font-heading font-bold text-xl text-[#F5F7FA] mb-1">
                    {item.title}
                  </h3>
                  <p className="font-mono text-xs text-[#00E5FF] mb-4">
                    {item.tagline}
                  </p>

                  <p className="text-xs sm:text-sm text-[#929AA5] leading-relaxed mb-6">
                    {item.description}
                  </p>

                  <div className="space-y-2 pt-4 border-t border-white/5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#929AA5] block">
                      Core Activities:
                    </span>
                    {item.activities.map((act, aIdx) => (
                      <div key={aIdx} className="flex items-start gap-2 text-xs text-[#F5F7FA]">
                        <span className="w-1 h-1 rounded-full bg-[#00E5FF] mt-1.5 shrink-0" />
                        <span className="text-[11px] text-[#929AA5] leading-snug">{act}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#00E5FF] block mb-1">
                    Key Deliverable
                  </span>
                  <p className="text-xs font-semibold text-[#F5F7FA]">
                    {item.output}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Milestone Guarantee Banner */}
        <div className="mt-12 p-6 rounded-3xl glass-panel-subtle border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-[#00E5FF] shrink-0" />
            <div>
              <h4 className="text-sm font-heading font-bold text-[#F5F7FA]">
                Milestone Transparency & Asynchronous Updates
              </h4>
              <p className="text-xs text-[#929AA5]">
                Direct git inspection, weekly review demos, and zero specification drift throughout the build.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-[#00E5FF] px-3 py-1.5 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/30 whitespace-nowrap">
            ZERO SPEC DRIFT
          </span>
        </div>

      </div>
    </section>
  );
};
