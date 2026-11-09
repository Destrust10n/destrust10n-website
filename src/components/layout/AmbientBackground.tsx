import React, { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  alpha: number;
  phase: number;
}

export const AmbientBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    targetX: window.innerWidth / 2,
    targetY: window.innerHeight / 2,
  });

  const [mouseGlowPos, setMouseGlowPos] = useState({ x: -500, y: -500 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let isVisible = !document.hidden;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleVisibility = () => {
      isVisible = !document.hidden;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
      setMouseGlowPos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Initialize particles
    const particleCount = prefersReducedMotion ? 12 : isMobile ? 24 : 65;
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * (prefersReducedMotion ? 0.05 : 0.25),
        vy: (Math.random() - 0.5) * (prefersReducedMotion ? 0.05 : 0.25),
        size: Math.random() * 1.8 + 0.6,
        baseAlpha: Math.random() * 0.4 + 0.15,
        alpha: Math.random() * 0.4 + 0.15,
        phase: Math.random() * Math.PI * 2,
      });
    }

    let frame = 0;

    const render = () => {
      if (!isVisible) {
        animId = requestAnimationFrame(render);
        return;
      }

      frame++;
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse spring
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.04;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.04;

      // Draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;
          p.phase += 0.02;

          // Wrap edges
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          // Breathing alpha
          p.alpha = p.baseAlpha + Math.sin(p.phase) * 0.12;
        }

        // Draw particle dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 229, 255, ${Math.max(0.05, p.alpha)})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#00E5FF';
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw subtle connection lines between close particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            const lineAlpha = (1 - dist / 110) * 0.08;
            ctx.strokeStyle = `rgba(0, 229, 255, ${lineAlpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* Dynamic Cursor Spotlight Glow */}
      <div
        className="absolute rounded-full transition-opacity duration-500 ease-out"
        style={{
          width: '750px',
          height: '750px',
          left: `${mouseGlowPos.x}px`,
          top: `${mouseGlowPos.y}px`,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(0, 229, 255, 0.07) 0%, rgba(0, 229, 255, 0.015) 45%, transparent 70%)',
          filter: 'blur(45px)',
          opacity: mouseGlowPos.x > 0 ? 1 : 0,
        }}
      />

      {/* Atmospheric Ambient Lighting Gradients */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse_at_top,_rgba(0,229,255,0.12),_transparent_70%)] blur-[90px]" />
      <div className="absolute top-[40%] -left-40 w-[600px] h-[600px] bg-[radial-gradient(circle,_rgba(0,180,216,0.06),_transparent_65%)] blur-[100px]" />
      <div className="absolute top-[70%] -right-40 w-[600px] h-[600px] bg-[radial-gradient(circle,_rgba(0,229,255,0.08),_transparent_65%)] blur-[100px]" />

      {/* Sub-grid fine grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px'
        }}
      />

      {/* Particle Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};
