import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowRight, Sparkles } from 'lucide-react';

interface CinematicIntroProps {
  onComplete: () => void;
}

const SESSION_KEY = 'd10_cinematic_intro_shown';

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const monolithRef = useRef<HTMLDivElement | null>(null);
  const flareRef = useRef<HTMLDivElement | null>(null);
  const brandRef = useRef<HTMLHeadingElement | null>(null);
  const taglineRef = useRef<HTMLParagraphElement | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    // 1. Check if user already saw the intro in this browser session or prefers reduced motion
    const hasSeen = sessionStorage.getItem(SESSION_KEY);
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (hasSeen || prefersReduced) {
      setIsVisible(false);
      onComplete();
      return;
    }

    // 2. Setup ambient canvas particles for the intro
    const canvas = canvasRef.current;
    let animId: number;
    let width = 0;
    let height = 0;

    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;

        const particleCount = 45;
        const particles: Array<{ x: number; y: number; vy: number; size: number; alpha: number }> = [];

        for (let i = 0; i < particleCount; i++) {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vy: -0.4 - Math.random() * 0.8,
            size: 0.8 + Math.random() * 1.8,
            alpha: 0.2 + Math.random() * 0.6,
          });
        }

        const renderParticles = () => {
          ctx.clearRect(0, 0, width, height);
          for (let p of particles) {
            p.y += p.vy;
            if (p.y < -10) {
              p.y = height + 10;
              p.x = Math.random() * width;
            }
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 229, 255, ${p.alpha})`;
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#00E5FF';
            ctx.fill();
            ctx.shadowBlur = 0;
          }
          animId = requestAnimationFrame(renderParticles);
        };

        renderParticles();
      }
    }

    // 3. GSAP Orchestrated Intro Sequence (~2.6 seconds)
    const tl = gsap.timeline({
      onComplete: () => {
        dismissIntro();
      },
    });
    timelineRef.current = tl;

    // Sequence Step 1: Pitch black (0.0s - 0.2s)
    // Sequence Step 2: Subtle cyan particles appear (0.2s - 0.5s)
    tl.fromTo(
      canvasRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.6, ease: 'power2.inOut' },
      0.2
    )
    // Sequence Step 3: D10 monolith emerges with 3D depth and rotation (0.5s - 1.2s)
    .fromTo(
      monolithRef.current,
      { opacity: 0, scale: 0.3, z: -100, rotateY: -45, rotateX: 20 },
      { opacity: 1, scale: 1, z: 0, rotateY: 0, rotateX: 0, duration: 1.0, ease: 'power3.out' },
      0.5
    )
    // Sequence Step 4: Cyan lighting flare activates (0.9s - 1.4s)
    .fromTo(
      flareRef.current,
      { opacity: 0, scale: 0.4 },
      { opacity: 0.85, scale: 1.2, duration: 0.6, ease: 'power2.out' },
      0.9
    )
    .to(
      flareRef.current,
      { opacity: 0.45, scale: 1.0, duration: 0.5, ease: 'power2.inOut' },
      1.5
    )
    // Sequence Step 5: Display "DESTRUST10N" (1.3s - 1.8s)
    .fromTo(
      brandRef.current,
      { opacity: 0, y: 20, letterSpacing: '0.4em' },
      { opacity: 1, y: 0, letterSpacing: '0.18em', duration: 0.7, ease: 'power3.out' },
      1.3
    )
    // Sequence Step 6: Display "BUILDING BEYOND LIMITS." (1.6s - 2.1s)
    .fromTo(
      taglineRef.current,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
      1.6
    )
    // Sequence Step 7: Hold for a brief beat and then fade transition into homepage (2.3s - 2.8s)
    .to(
      containerRef.current,
      {
        opacity: 0,
        scale: 1.03,
        duration: 0.5,
        ease: 'power2.inOut',
      },
      2.3
    );

    // Keyboard listener: Escape key skips intro
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismissIntro();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Safety failsafe: never block page if animation fails
    const failsafeTimeout = setTimeout(() => {
      dismissIntro();
    }, 3800);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(failsafeTimeout);
      if (timelineRef.current) timelineRef.current.kill();
    };
  }, []);

  const dismissIntro = () => {
    if (timelineRef.current) {
      timelineRef.current.kill();
    }

    if (containerRef.current) {
      gsap.to(containerRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.inOut',
        onComplete: () => {
          sessionStorage.setItem(SESSION_KEY, 'true');
          setIsVisible(false);
          onComplete();
        },
      });
    } else {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setIsVisible(false);
      onComplete();
    }
  };

  if (!isVisible) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-[#050608] flex flex-col items-center justify-center overflow-hidden pointer-events-auto select-none"
      style={{ perspective: '1200px' }}
      aria-label="Cinematic Studio Introduction"
    >
      {/* Background Particles Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Top Right Skip Intro Button */}
      <div className="absolute top-6 right-6 z-30">
        <button
          type="button"
          onClick={dismissIntro}
          className="px-4 py-2 rounded-full glass-panel-subtle text-xs font-mono text-[#929AA5] hover:text-[#00E5FF] hover:border-[#00E5FF]/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(0,0,0,0.5)]"
        >
          <span>Skip Intro</span>
          <span className="text-[10px] text-[#00E5FF]/70">[ESC]</span>
        </button>
      </div>

      {/* Center Cinematic Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4">
        
        {/* Radial Cyan Lighting Flare */}
        <div
          ref={flareRef}
          className="absolute w-[360px] h-[360px] rounded-full pointer-events-none -top-12 opacity-0"
          style={{
            background: 'radial-gradient(circle, rgba(0, 229, 255, 0.38) 0%, rgba(0, 175, 203, 0.12) 40%, transparent 70%)',
            filter: 'blur(35px)',
          }}
        />

        {/* 3D Emergent D10 Monolith Holographic Icon */}
        <div
          ref={monolithRef}
          className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-[#101318]/90 border border-[#00E5FF]/60 flex items-center justify-center box-cyan-glow mb-8 opacity-0 shadow-[0_0_45px_rgba(0,229,255,0.35)]"
          style={{
            transformStyle: 'preserve-3d',
            backgroundImage: 'linear-gradient(135deg, rgba(36,48,64,0.85) 0%, rgba(16,21,30,0.95) 100%)',
          }}
        >
          {/* Inner Glowing Monogram Core */}
          <div className="relative flex items-center justify-center">
            <svg width="72" height="72" viewBox="0 0 24 24" fill="none" className="filter drop-shadow-[0_0_12px_#00E5FF]">
              <path
                d="M4 4h7a8 8 0 0 1 8 8 8 8 0 0 1-8 8H4V4z"
                stroke="#00E5FF"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <path d="M11 8v8" stroke="#F5F7FA" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="15.5" cy="12" r="1.8" fill="#00E5FF" />
            </svg>
          </div>

          {/* Precision Blueprint Corner Ticks */}
          <span className="absolute top-2 left-2 w-2 h-2 border-t-2 border-l-2 border-[#00E5FF]" />
          <span className="absolute top-2 right-2 w-2 h-2 border-t-2 border-r-2 border-[#00E5FF]" />
          <span className="absolute bottom-2 left-2 w-2 h-2 border-b-2 border-l-2 border-[#00E5FF]" />
          <span className="absolute bottom-2 right-2 w-2 h-2 border-b-2 border-r-2 border-[#00E5FF]" />
        </div>

        {/* Brand Heading */}
        <h1
          ref={brandRef}
          className="font-heading font-extrabold text-3xl sm:text-5xl tracking-widest text-[#F5F7FA] mb-3 opacity-0"
        >
          DESTRUST<span className="text-[#00E5FF] text-cyan-glow">10</span>N
        </h1>

        {/* Tagline */}
        <p
          ref={taglineRef}
          className="font-mono text-xs sm:text-sm tracking-widest text-[#00E5FF] uppercase opacity-0 flex items-center gap-2"
        >
          <span className="w-6 h-[1px] bg-[#00E5FF]/40" />
          <span>BUILDING BEYOND LIMITS.</span>
          <span className="w-6 h-[1px] bg-[#00E5FF]/40" />
        </p>

      </div>

      {/* Bottom Loading / Progress Bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-white/10 rounded-full overflow-hidden">
        <div className="w-full h-full bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent animate-pulse" />
      </div>
    </div>
  );
};
