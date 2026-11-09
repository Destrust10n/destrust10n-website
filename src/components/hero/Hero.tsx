import React, { Suspense, lazy, useRef, useEffect } from 'react';
import { ArrowDown, ArrowUpRight, ShieldCheck, Zap, Terminal, Sparkles, Loader2 } from 'lucide-react';
import gsap from 'gsap';
import { AvailabilityIndicator } from '../layout/AvailabilityIndicator';

// Lazy-load the heavy 3D Three.js Monolith
const Hero3DMonolith = lazy(() =>
  import('./Hero3DMonolith').then((mod) => ({ default: mod.Hero3DMonolith }))
);

interface HeroProps {
  canAnimateText?: boolean;
}

export const Hero: React.FC<HeroProps> = ({ canAnimateText = true }) => {
  const heroRef = useRef<HTMLElement | null>(null);
  const statusPillRef = useRef<HTMLDivElement | null>(null);
  const line1Ref = useRef<HTMLHeadingElement | null>(null);
  const line2Ref = useRef<HTMLHeadingElement | null>(null);
  const subTextRef = useRef<HTMLParagraphElement | null>(null);
  const buttonsRef = useRef<HTMLDivElement | null>(null);
  const pillarsRef = useRef<HTMLDivElement | null>(null);
  const hasAnimatedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!canAnimateText || hasAnimatedRef.current) return;
    hasAnimatedRef.current = true;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // Orchestrated Hero Entrance Sequence:
      // 1. Status Pill slides in
      tl.fromTo(
        statusPillRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.7, delay: 0.1 }
      )
      // 2. Headline reveals line-by-line using clip-path masking
      .fromTo(
        line1Ref.current,
        { y: '100%', opacity: 0 },
        { y: '0%', opacity: 1, duration: 0.9, ease: 'power4.out' },
        '-=0.3'
      )
      .fromTo(
        line2Ref.current,
        { y: '100%', opacity: 0 },
        { y: '0%', opacity: 1, duration: 1.0, ease: 'power4.out' },
        '-=0.6'
      )
      // 3. Supporting copy fades up
      .fromTo(
        subTextRef.current,
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.8 },
        '-=0.4'
      )
      // 4. Buttons emerge
      .fromTo(
        buttonsRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.7 },
        '-=0.3'
      )
      // 5. Technical pillars activate
      .fromTo(
        pillarsRef.current,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.6 },
        '-=0.2'
      );
    }, heroRef);

    return () => ctx.revert();
  }, [canAnimateText]);

  const scrollTo = (id: string) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="home"
      ref={heroRef}
      className="relative min-h-screen pt-28 pb-16 sm:pb-24 flex items-center justify-center overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

          {/* Left Column: Typography & Intent */}
          <div className="lg:col-span-7 flex flex-col items-start z-10">

            {/* Status Pill */}
            <div
              ref={statusPillRef}
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full glass-pill text-xs font-mono text-[#00E5FF] mb-6 border-[#00E5FF]/30 box-cyan-glow opacity-0"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E5FF] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00E5FF]" />
              </span>
              <span className="tracking-wider">DESTRUST10N // DIGITAL DEVELOPMENT STUDIO</span>
            </div>

            {/* Main Headline with Masked Line Reveals */}
            <div className="overflow-hidden mb-1">
              <h1
                ref={line1Ref}
                className="font-heading font-extrabold text-5xl sm:text-7xl xl:text-8xl tracking-tight text-[#F5F7FA] leading-[1.04]"
              >
                WE BUILD
              </h1>
            </div>

            <div className="overflow-hidden mb-6">
              <h1
                ref={line2Ref}
                className="font-heading font-extrabold text-5xl sm:text-7xl xl:text-8xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] via-[#70EEFF] to-[#F5F7FA] text-cyan-glow leading-[1.04]"
              >
                BEYOND LIMITS.
              </h1>
            </div>

            {/* Supporting Text */}
            <p
              ref={subTextRef}
              className="text-base sm:text-xl text-[#929AA5] max-w-2xl leading-relaxed mb-10 font-normal opacity-0"
            >
              Digital experiences engineered with creativity, technology and precision.
            </p>

            {/* Action Buttons */}
            <div
              ref={buttonsRef}
              className="flex flex-wrap items-center gap-4 sm:gap-5 w-full sm:w-auto opacity-0"
            >
              <button
                type="button"
                onClick={() => scrollTo('#projects')}
                className="w-full sm:w-auto px-8 py-4 rounded-full text-sm font-bold glass-btn-primary flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Explore Our Work</span>
                <ArrowDown className="w-4 h-4 transition-transform group-hover:translate-y-1" />
              </button>

              <button
                type="button"
                onClick={() => scrollTo('#contact')}
                className="w-full sm:w-auto px-8 py-4 rounded-full text-sm font-semibold glass-btn-secondary flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Start a Project</span>
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>

            {/* Daily Availability Indicator ("One Day, One Work") */}
            <div className="mt-8 w-full">
              <AvailabilityIndicator variant="detailed" />
            </div>

            {/* Key Technical Pillars Mini-Bar */}
            <div
              ref={pillarsRef}
              className="mt-8 pt-6 border-t border-white/10 w-full grid grid-cols-3 gap-4 opacity-0"
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-xs text-[#00E5FF] font-mono mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>CREATIVITY</span>
                </div>
                <span className="text-xs text-[#929AA5]">Spatial Aesthetics</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-xs text-[#00E5FF] font-mono mb-1">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>TECHNOLOGY</span>
                </div>
                <span className="text-xs text-[#929AA5]">Modern React Stack</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-xs text-[#00E5FF] font-mono mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>PRECISION</span>
                </div>
                <span className="text-xs text-[#929AA5]">Zero Template Code</span>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Monolith & Floating Geometric Environment */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <Suspense
              fallback={
                <div className="w-full h-[420px] sm:h-[500px] lg:h-[580px] flex items-center justify-center">
                  <div className="glass-panel p-6 rounded-2xl flex items-center gap-3 text-xs font-mono text-[#00E5FF]">
                    <Loader2 className="w-4 h-4 animate-spin text-[#00E5FF]" />
                    <span>INITIALIZING 3D ENVIRONMENT...</span>
                  </div>
                </div>
              }
            >
              <Hero3DMonolith />
            </Suspense>
          </div>

        </div>
      </div>
    </section>
  );
};
