import React, { useState, useEffect, useRef } from 'react';
import { 
  ExternalLink, 
  Terminal, 
  Check, 
  ArrowUpRight, 
  Maximize2,
  X,
  Code2,
  Sparkles
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { projectsData } from '../../data/projectsData';
import { Project } from '../../types';

gsap.registerPlugin(ScrollTrigger);

export const Projects: React.FC = () => {
  const [activeProject, setActiveProject] = useState<Project>(projectsData[0]);
  const [modalProject, setModalProject] = useState<Project | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const showcaseRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (showcaseRef.current) {
        gsap.fromTo(
          showcaseRef.current,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 1.0,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: showcaseRef.current,
              start: 'top 80%',
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      id="projects" 
      ref={sectionRef} 
      className="relative py-24 sm:py-32 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 sm:mb-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-pill text-xs font-mono text-[#00E5FF] mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]" />
              <span>03 // SELECTED PORTFOLIO WORKS</span>
            </div>

            <h2 className="font-heading font-extrabold text-3xl sm:text-5xl tracking-tight text-[#F5F7FA] leading-[1.15]">
              Engineered Works. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] to-[#00AFCB] text-cyan-glow">
                Built with Purpose.
              </span>
            </h2>
          </div>

          <p className="mt-4 md:mt-0 text-sm sm:text-base text-[#929AA5] max-w-md">
            Production-grade systems and spatial interfaces developed by DESTRUST10N. Real codebases built for reliability and speed.
          </p>
        </div>

        {/* Project Selector Horizontal Tabs */}
        <div className="flex items-center gap-3 overflow-x-auto pb-4 mb-10 no-scrollbar">
          {projectsData.map((project) => {
            const isSelected = activeProject.id === project.id;
            return (
              <button
                key={project.id}
                type="button"
                onClick={() => setActiveProject(project)}
                className={`px-5 py-2.5 rounded-full text-xs font-mono tracking-wider transition-all duration-300 whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'glass-btn-primary font-bold text-[#050608] shadow-[0_0_20px_rgba(0,229,255,0.4)]'
                    : 'glass-panel-subtle text-[#929AA5] hover:text-[#F5F7FA] hover:border-[#00E5FF]/30'
                }`}
              >
                {project.name.toUpperCase()} // {project.category}
              </button>
            );
          })}
        </div>

        {/* Featured Project Showcase Panel */}
        <div 
          ref={showcaseRef} 
          className="glass-panel p-6 sm:p-10 rounded-3xl border border-[#00E5FF]/25 shadow-[0_20px_50px_rgba(0,0,0,0.85)] relative overflow-hidden mb-16"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Info Column */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-mono text-xs px-3 py-1 rounded-full bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 font-semibold">
                    {activeProject.badge}
                  </span>
                  <span className="font-mono text-xs text-[#929AA5]">
                    {activeProject.year}
                  </span>
                </div>

                <h3 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#F5F7FA] mb-2">
                  {activeProject.name}
                </h3>
                <p className="font-mono text-xs text-[#00E5FF] mb-4">
                  {activeProject.tagline}
                </p>

                <p className="text-sm sm:text-base text-[#929AA5] leading-relaxed mb-6">
                  {activeProject.description}
                </p>

                {/* Technical Highlights */}
                <div className="space-y-2 mb-8">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#F5F7FA]">
                    Architecture Highlights:
                  </span>
                  {activeProject.keyFeatures.slice(0, 3).map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2.5 text-xs text-[#929AA5]">
                      <Check className="w-3.5 h-3.5 text-[#00E5FF] shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Tech Stack Pills */}
                <div className="mb-8">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#929AA5] block mb-2">
                    Technologies Used:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeProject.technologies.map((tech, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-xs font-mono px-2.5 py-1 rounded-md bg-[#050608] border border-white/10 text-[#F5F7FA]"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalProject(activeProject)}
                  className="px-5 py-2.5 rounded-full text-xs font-bold glass-btn-primary flex items-center gap-2 cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Inspect System Architecture</span>
                </button>

                {/* Honest Destination Action */}
                {activeProject.url ? (
                  <a
                    href={activeProject.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-full text-xs font-semibold glass-btn-secondary flex items-center gap-1.5"
                  >
                    <span>View Project</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full glass-panel-subtle text-[11px] font-mono text-[#929AA5]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]/60" />
                    <span>Local Studio Build // Workspace Verified</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Interactive Preview Column */}
            <div className="lg:col-span-7">
              <div className="relative rounded-2xl overflow-hidden border border-[#00E5FF]/25 bg-[#080B10] shadow-2xl p-4 sm:p-6">
                
                {/* Browser / Shell Header Simulation */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                    <span className="ml-2 font-mono text-[11px] text-[#929AA5]">
                      destrust10n://runtime/{activeProject.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[10px] text-[#00E5FF]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-pulse" />
                    <span>RUNTIME SIMULATOR</span>
                  </div>
                </div>

                {/* Dynamic Interactive Component Previews */}
                {activeProject.id === 'crema' && (
                  <div className="space-y-4 text-xs font-mono">
                    <div className="p-3.5 rounded-xl bg-[#101318] border border-[#00E5FF]/20">
                      <div className="flex items-center justify-between text-[#00E5FF] mb-2">
                        <span>● SSE_STREAMING_STUDY_CHAT</span>
                        <span className="text-[10px] text-[#929AA5]">Gemini Flash 2.0</span>
                      </div>
                      <p className="text-[#F5F7FA] font-sans leading-relaxed text-sm">
                        "Breaking down your physics query: Angular momentum is conserved when net external torque equals zero. Let's calculate the kinetic energy step-by-step..."
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-[#050608] border border-white/10">
                        <span className="text-[#00E5FF] block mb-1">PRACTICE QUIZ ENGINE</span>
                        <p className="text-[#929AA5] text-[11px]">Dynamic multiple choice & rubric verification</p>
                      </div>
                      <div className="p-3 rounded-xl bg-[#050608] border border-white/10">
                        <span className="text-[#00E5FF] block mb-1">7-DAY PLANNER</span>
                        <p className="text-[#929AA5] text-[11px]">Automatic task redistribution on missed days</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-gradient-to-r from-[#00E5FF]/10 to-transparent border border-[#00E5FF]/20 text-[11px] text-[#00E5FF] flex items-center justify-between">
                      <span>Spaced Repetition SM-2 Active Deck</span>
                      <span className="font-bold">Mastery: 94.2%</span>
                    </div>
                  </div>
                )}

                {activeProject.id === 'aetheria' && (
                  <div className="space-y-4 text-xs font-mono">
                    <div className="p-4 rounded-xl bg-[#18100B]/90 border border-[#F59E0B]/30 relative overflow-hidden">
                      <div className="flex items-center justify-between text-[#F59E0B] mb-2 font-mono text-[11px]">
                        <span>SPATIAL_LIQUID_GLASS // OPTICS ENGINE</span>
                        <span>Espresso / Amber Mode</span>
                      </div>
                      <p className="text-[#FEF3C7] font-sans text-sm leading-relaxed mb-3">
                        Physical 3D tilt tracking cursor vector coordinates with specular edge highlights and ambient WebGL dust particles.
                      </p>
                      <div className="flex gap-2">
                        <span className="px-2.5 py-1 rounded-md bg-[#241811] text-[#F59E0B] text-[10px]">
                          3D Gyro Tilt: Active
                        </span>
                        <span className="px-2.5 py-1 rounded-md bg-[#241811] text-[#FEF3C7] text-[10px]">
                          Web Audio Synth: 440Hz
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                      <div className="p-2.5 rounded-lg bg-[#050505] border border-white/10 text-[#F8FAFC]">
                        Obsidian Theme
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#0E0903] border border-[#F59E0B]/30 text-[#FDE68A]">
                        Amber Theme
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#0A0604] border border-[#D97706]/30 text-[#D5B895]">
                        Espresso Theme
                      </div>
                    </div>
                  </div>
                )}

                {activeProject.id === 'medclear' && (
                  <div className="space-y-4 text-xs font-mono">
                    <div className="p-4 rounded-xl bg-[#0F172A] border border-[#38BDF8]/30">
                      <div className="flex items-center justify-between text-[#38BDF8] mb-2">
                        <span>DUAL_PRACTICE_PORTAL</span>
                        <span>ADA Compliant</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="p-2.5 rounded-lg bg-[#0284C7]/15 border border-[#38BDF8]/20">
                          <span className="text-[10px] text-[#38BDF8] block">Interventional Cardiology</span>
                          <span className="text-white text-xs font-semibold">Dr. Julian Vance</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[#0284C7]/15 border border-[#38BDF8]/20">
                          <span className="text-[10px] text-[#38BDF8] block">Vascular Neurology</span>
                          <span className="text-white text-xs font-semibold">Dr. Elena Rostova</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
                        <span>Fuzzy Procedure Index: Fuse.js</span>
                        <span className="text-[#38BDF8]">Online Inquiry Active</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#050608] border border-white/10 flex items-center justify-between text-[11px]">
                      <span className="text-[#929AA5]">Clinical Case Gallery Lightbox</span>
                      <span className="text-[#38BDF8]">GSAP Timeline Orchestrated</span>
                    </div>
                  </div>
                )}

                {/* Bottom Notice */}
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-[#929AA5]">
                  <span>VITE HMR // REACT 19 BUNDLE</span>
                  <span className="text-[#00E5FF]">SYSTEM VERIFIED</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 3 Project Summary Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {projectsData.map((project) => (
            <div
              key={project.id}
              className={`glass-card p-6 sm:p-8 rounded-3xl border transition-all duration-300 cursor-pointer ${
                activeProject.id === project.id
                  ? 'border-[#00E5FF] shadow-[0_0_30px_rgba(0,229,255,0.2)]'
                  : 'border-white/10 hover:border-[#00E5FF]/40'
              }`}
              onClick={() => setActiveProject(project)}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs text-[#00E5FF]">
                  {project.category}
                </span>
                <span className="text-xs text-[#929AA5] font-mono">
                  {project.year}
                </span>
              </div>

              <h4 className="font-heading font-bold text-xl text-[#F5F7FA] mb-2">
                {project.name}
              </h4>
              <p className="text-xs text-[#929AA5] line-clamp-3 mb-6 leading-relaxed">
                {project.description}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <span className="text-xs font-mono text-[#00E5FF] flex items-center gap-1">
                  <span>View Project Details</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
                <span className="w-2 h-2 rounded-full bg-[#00E5FF]" />
              </div>
            </div>
          ))}
        </div>

        {/* Full Architecture Inspection Modal */}
        {modalProject && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-in fade-in duration-200"
            onClick={() => setModalProject(null)}
          >
            <div
              className="glass-panel p-6 sm:p-10 rounded-3xl max-w-3xl w-full border border-[#00E5FF]/40 relative max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setModalProject(null)}
                className="absolute top-6 right-6 p-2 rounded-full glass-panel-subtle text-[#929AA5] hover:text-[#00E5FF] transition-colors"
                aria-label="Close project modal"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 text-xs font-mono text-[#00E5FF] mb-2">
                <span>PROJECT SYSTEM AUDIT // {modalProject.name.toUpperCase()}</span>
              </div>

              <h3 className="font-heading font-extrabold text-2xl sm:text-4xl text-[#F5F7FA] mb-2">
                {modalProject.name}
              </h3>
              <p className="text-sm font-mono text-[#00E5FF] mb-6">
                {modalProject.tagline}
              </p>

              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-[#929AA5] mb-2">
                    System Architecture Overview
                  </h4>
                  <p className="text-sm text-[#F5F7FA] leading-relaxed">
                    {modalProject.detailedOverview}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-[#929AA5] mb-2">
                    Engineering Stack
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {modalProject.technologies.map((t, idx) => (
                      <span key={idx} className="px-3 py-1 rounded-lg bg-[#050608] border border-[#00E5FF]/30 text-xs font-mono text-[#00E5FF]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-[#929AA5] mb-2">
                    Core Architectural Notes
                  </h4>
                  <p className="text-sm text-[#929AA5] bg-[#050608]/80 p-4 rounded-2xl border border-white/5 font-mono text-xs">
                    {modalProject.architectureNotes}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-[#929AA5] mb-2">
                    Key Features Built
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#F5F7FA]">
                    {modalProject.keyFeatures.map((kf, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-[#00E5FF] shrink-0 mt-0.5" />
                        <span>{kf}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs font-mono text-[#929AA5]">
                  Status: <strong className="text-[#00E5FF]">{modalProject.status}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setModalProject(null)}
                  className="px-6 py-2.5 rounded-full text-xs font-bold glass-btn-primary cursor-pointer"
                >
                  Close Specification
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
