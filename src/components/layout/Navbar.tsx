import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowUpRight, Sparkles } from 'lucide-react';

interface NavbarProps {
  activeSection: string;
}

export const Navbar: React.FC<NavbarProps> = ({ activeSection }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', href: '#home' },
    { label: 'About', href: '#about' },
    { label: 'Services', href: '#services' },
    { label: 'Projects', href: '#projects' },
    { label: 'Process', href: '#process' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Contact', href: '#contact' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4 sm:pt-6 pointer-events-none">
      <div 
        className={`w-full max-w-6xl transition-all duration-300 pointer-events-auto rounded-full ${
          isScrolled 
            ? 'glass-panel py-2.5 px-4 sm:px-6 shadow-[0_20px_40px_rgba(0,0,0,0.85)] border-[#00E5FF]/25' 
            : 'glass-panel-subtle py-3 px-4 sm:px-6 border-white/10'
        }`}
      >
        <div className="flex items-center justify-between">
          {/* DESTRUST10N Brand Logo */}
          <a
            href="#home"
            onClick={(e) => handleNavClick(e, '#home')}
            className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5FF] rounded-lg"
          >
            {/* Custom Geometric D10 Monogram Emblem */}
            <div className="relative w-8 h-8 rounded-lg bg-[#101318] border border-[#00E5FF]/40 flex items-center justify-center transition-all duration-300 group-hover:border-[#00E5FF] group-hover:box-cyan-glow overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00E5FF]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="transition-transform group-hover:scale-110">
                <path d="M4 4h7a8 8 0 0 1 8 8 8 8 0 0 1-8 8H4V4z" stroke="#00E5FF" strokeWidth="2.5" strokeLinejoin="round" />
                <path d="M11 9v6" stroke="#F5F7FA" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="15" cy="12" r="1.5" fill="#00E5FF" />
              </svg>
            </div>

            {/* Brand Wordmark */}
            <div className="flex flex-col">
              <span className="font-heading font-extrabold tracking-wider text-base text-[#F5F7FA] group-hover:text-[#00E5FF] transition-colors">
                DESTRUST<span className="text-[#00E5FF]">10</span>N
              </span>
              <span className="text-[9px] font-mono tracking-widest text-[#929AA5] -mt-1 hidden sm:block">
                STUDIO
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const isActive = activeSection === link.href.substring(1);
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`relative px-3 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-200 ${
                    isActive
                      ? 'text-[#00E5FF] bg-[#00E5FF]/10 font-semibold shadow-[0_0_15px_rgba(0,229,255,0.15)]'
                      : 'text-[#929AA5] hover:text-[#F5F7FA] hover:bg-white/5'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-[2px] bg-[#00E5FF] rounded-full shadow-[0_0_8px_#00E5FF]" />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Right Action / Mobile Hamburger */}
          <div className="flex items-center gap-3">
            <a
              href="#contact"
              onClick={(e) => handleNavClick(e, '#contact')}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold glass-btn-primary"
            >
              <span>Start a Project</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-full glass-panel-subtle text-[#F5F7FA] hover:text-[#00E5FF] hover:border-[#00E5FF]/40 transition-colors focus:outline-none focus:ring-2 focus:ring-[#00E5FF]"
              aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-[#00E5FF]" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-[#00E5FF]/15 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-1 pb-2">
              {navLinks.map((link) => {
                const isActive = activeSection === link.href.substring(1);
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-[#00E5FF] bg-[#00E5FF]/10 font-semibold'
                        : 'text-[#929AA5] hover:text-[#F5F7FA] hover:bg-white/5'
                    }`}
                  >
                    <span>{link.label}</span>
                    {isActive && <Sparkles className="w-4 h-4 text-[#00E5FF]" />}
                  </a>
                );
              })}
              <div className="pt-2">
                <a
                  href="#contact"
                  onClick={(e) => handleNavClick(e, '#contact')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold glass-btn-primary"
                >
                  <span>Start a Project</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
