import React from 'react';
import { ArrowUp, Github, Mail, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  const scrollTo = (id: string) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const navLinks = [
    { label: 'Home', href: '#home' },
    { label: 'About', href: '#about' },
    { label: 'Services', href: '#services' },
    { label: 'Projects', href: '#projects' },
    { label: 'Process', href: '#process' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <footer className="relative border-t border-white/10 bg-[#050608] pt-16 pb-12 overflow-hidden z-10">
      {/* Subtle Cyan Bottom Backlight */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[150px] bg-[radial-gradient(ellipse_at_bottom,_rgba(0,229,255,0.08),_transparent_70%)] blur-[60px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-12 border-b border-white/10">

          {/* Logo, Tagline & Direct Email */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#101318] border border-[#00E5FF]/40 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M4 4h7a8 8 0 0 1 8 8 8 8 0 0 1-8 8H4V4z" stroke="#00E5FF" strokeWidth="2.5" strokeLinejoin="round" />
                  <path d="M11 9v6" stroke="#F5F7FA" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="15" cy="12" r="1.5" fill="#00E5FF" />
                </svg>
              </div>
              <span className="font-heading font-extrabold tracking-wider text-xl text-[#F5F7FA]">
                DESTRUST<span className="text-[#00E5FF]">10</span>N
              </span>
            </div>
            <p className="font-mono text-xs text-[#00E5FF] tracking-wider mb-2">
              Building Beyond Limits
            </p>
            <a
              href="mailto:destrust100n@gmail.com"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-[#929AA5] hover:text-[#00E5FF] transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>destrust100n@gmail.com</span>
            </a>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-wrap items-center gap-6">
            {navLinks.map((link) => (
              <button
                key={link.href}
                type="button"
                onClick={() => scrollTo(link.href)}
                className="text-xs font-mono text-[#929AA5] hover:text-[#00E5FF] transition-colors cursor-pointer"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Social / GitHub Link & Back-to-Top */}
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/destrust10n"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-full glass-panel-subtle text-[#929AA5] hover:text-[#00E5FF] hover:border-[#00E5FF]/40 transition-colors"
              aria-label="DESTRUST10N GitHub Organization"
            >
              <Github className="w-4 h-4" />
            </a>

            <button
              type="button"
              onClick={() => scrollTo('#home')}
              className="p-2.5 rounded-full glass-panel-subtle text-[#929AA5] hover:text-[#00E5FF] hover:border-[#00E5FF]/40 transition-colors cursor-pointer"
              aria-label="Scroll back to top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Bottom Metadata & Copyright Notice */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#929AA5]">
          <p>© 2026 DESTRUST10N. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-[#00E5FF]">DIGITAL DEVELOPMENT STUDIO</span>
            <span className="text-white/20">|</span>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event('open-admin'))}
              className="text-[#929AA5] hover:text-[#00E5FF] transition-colors flex items-center gap-1 cursor-pointer"
              title="Studio Operations Hub"
            >
              <Lock className="w-3 h-3 text-[#00E5FF]/60" />
              <span>Studio Ops</span>
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
