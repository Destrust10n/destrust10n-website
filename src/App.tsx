import React, { useState, useEffect } from 'react';
import { AmbientBackground } from './components/layout/AmbientBackground';
import { Navbar } from './components/layout/Navbar';
import { Hero } from './components/hero/Hero';
import { About } from './components/about/About';
import { Services } from './components/services/Services';
import { Projects } from './components/projects/Projects';
import { Process } from './components/process/Process';
import { Pricing } from './components/pricing/Pricing';
import { Contact } from './components/contact/Contact';
import { Footer } from './components/footer/Footer';
import { CinematicIntro } from './components/layout/CinematicIntro';

export function App() {
  const [activeSection, setActiveSection] = useState<string>('home');
  const [introFinished, setIntroFinished] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const hasSeen = sessionStorage.getItem('d10_cinematic_intro_shown');
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      return Boolean(hasSeen || prefersReduced);
    }
    return false;
  });

  // Track active section on scroll
  useEffect(() => {
    const sectionIds = ['home', 'about', 'services', 'projects', 'process', 'pricing', 'contact'];
    
    const handleScroll = () => {
      const scrollY = window.scrollY;

      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop - 180;
          const height = el.offsetHeight;
          if (scrollY >= top && scrollY < top + height) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#050608] text-[#F5F7FA] overflow-x-hidden selection:bg-[#00E5FF] selection:text-[#050608]">
      {/* Cinematic Studio Intro Overlay (Shows once per session) */}
      <CinematicIntro onComplete={() => setIntroFinished(true)} />

      {/* Dynamic Ambient Background & Particle Physics */}
      <AmbientBackground />

      {/* Floating Transparent Glass Navbar */}
      <Navbar activeSection={activeSection} />

      {/* Main Content Flow */}
      <main className="relative z-10">
        <Hero canAnimateText={introFinished} />
        <About />
        <Services />
        <Projects />
        <Process />
        <Pricing />
        <Contact />
      </main>

      {/* Minimal Studio Footer */}
      <Footer />
    </div>
  );
}

export default App;
