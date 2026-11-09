# DESTRUST10N — Premium 3D Digital Development Studio
> **Building Beyond Limits**

---

## 💎 Brand & Visual Identity

- **Studio Name:** DESTRUST10N
- **Tagline:** Building Beyond Limits
- **Category:** Digital Development Studio
- **Contact Email:** [destrust100n@gmail.com](mailto:destrust100n@gmail.com)
- **GitHub:** [https://github.com/destrust10n](https://github.com/destrust10n)

### Studio Palette
- **Obsidian Black (Base):** `#050608`
- **Deep Charcoal (Surfaces):** `#101318`
- **Electric Cyan (Main Accent):** `#00E5FF`
- **Secondary Accent:** `#00AFCB`
- **Soft Cyan Glow:** `rgba(0, 229, 255, 0.18)`
- **Pure White (Headings):** `#F5F7FA`
- **Muted Grey (Metadata & Body):** `#929AA5`

---

## 🏛️ Architecture & Sections

### 1. Floating Glass Navbar
- Translucent liquid-glass pill with `backdrop-filter: blur(20px)` and cyan specular highlight rim.
- Custom geometric **D10** monogram emblem and wordmark.
- Active section indicator dynamically tracked as you scroll (`Home`, `About`, `Services`, `Projects`, `Process`, `Pricing`, `Contact`).
- Responsive mobile drawer navigation with animated overlay.
- Quick action CTA button: *"Start a Project"*.

### 2. Hero — The 3D Monolith Experience
- **Main Heading:**
  ```
  WE BUILD
  BEYOND LIMITS.
  ```
- **Supporting Copy:** *"Digital experiences engineered with creativity, technology and precision."*
- **Action Buttons:** `Explore Our Work` & `Start a Project`
- **Interactive 3D Three.js Titanium Monolith:**
  - 3D titanium dark chrome chassis (`metalness: 0.96`, `roughness: 0.14`).
  - Sculpted 3D mechanical **D** chamber, vertical titanium conduit **1** pylon, and toroidal reactor **0** ring with rotating stator pins.
  - Luminescent electric cyan power core with real-time breathing pulse.
  - Engraved blueprint-style wireframes highlighting the chamfered facets.
  - 3-tier orbital gimbal tech rings rotating on different axes.
  - 8 floating crystalline and metallic geometric satellite shards.
  - Volumetric 3D cyan particle swarm.
  - High-contrast sci-fi lighting (cyan key, deep steel fill, titanium rim backlight, and pointer-following spotlight).
  - Continuous slow rotation, floating vertical oscillation, and smooth mouse-parallax tilt.
  - **GSAP ScrollTrigger Integration:** Camera perspective and monolith position smoothly shift as the user scrolls down the page!
  - **GSAP Hero Entrance Sequence:** Background activates -> Monolith zooms in with depth -> Cyan core powers up -> Headline reveals line-by-line using clip-path masking -> Supporting copy and buttons emerge.

### 3. About Section ("Technology Meets Imagination.")
- Editorial introduction to DESTRUST10N as an independent digital development studio.
- Four core studio principles:
  1. **Creativity** — Spatial Visual Polish
  2. **Precision** — Type-Safe Architecture
  3. **Innovation** — Modern 3D & Motion
  4. **Performance** — Sub-Second Loading
- Strictly honest: zero fabricated awards, zero fake client lists, zero invented years of experience.
- Technical commitments: React 19, strict TypeScript, GSAP + ScrollTrigger, Three.js hardware acceleration, WCAG 2.1 AA accessibility.

### 4. Services Section
- Six interactive glass cards with unique Lucide icons, index numbers (`01`–`06`), and 3D pointer-tilt response:
  1. `Website Development` (`Code2`)
  2. `Business Websites` (`Building2`)
  3. `Portfolio Websites` (`Layout`)
  4. `Landing Pages` (`Rocket`)
  5. `Website Redesign` (`RefreshCw`)
  6. `Digital Solutions` (`Cpu`)
- Staggered GSAP ScrollTrigger reveals.
- Interactive modal with scope breakdown, deliverables, and one-click routing to the inquiry form.

### 5. Selected Projects Gallery
- Curated showcases for studio projects verified from the local workspace:
  - **Crema:** AI Study Buddy Workspace (React, TypeScript, Express, Vite, Tailwind CSS, Google Gemini API, Web Audio API, Firestore).
  - **Aetheria:** Academic AI Companion & Liquid-Glass System (React 19, TypeScript, Vite, Tailwind CSS v4, Motion, Canvas 2D Physics, Web Audio API).
  - **Medclear:** Dual-Specialty Medical Practice & Clinical Portal (React 19, TypeScript, GSAP, Vite, Tailwind CSS, Fuse.js Search).
- Interactive simulated runtime environments (SSE study chat, liquid-glass physics, clinical triage).
- System Architecture modal inspecting detailed engineering highlights and stack specs.
- Honest destination handling: Displays live link only when configured; otherwise marks builds as *"Local Studio Build // Workspace Verified"*.

### 6. Development Process (01 Discover, 02 Design, 03 Develop, 04 Deliver)
- Four-stage connected timeline:
  - `01 — DISCOVER`: Understand the idea and requirements.
  - `02 — DESIGN`: Plan the experience and visual direction.
  - `03 — DEVELOP`: Build and test the website.
  - `04 — DELIVER`: Prepare the finished project for launch.
- Animated with GSAP ScrollTrigger scrubbing the connecting cyan progress track as the user scrolls!

### 7. Pricing Section (Introductory Starting Estimates in USD)
- Honest, accessible introductory starter estimates:
  - **Starter Website — $10** (Single-page responsive layout, fast static build, contact integration)
  - **Business Website — $25** (3–4 structured content sections, liquid-glass styling, functional lead intake)
  - **Premium Starter Build — $50** (Complete multi-section experience, interactive 3D/WebGL canvas, GSAP motion)
- Clear note displayed:
  > *"These are introductory starting estimates. Final pricing depends on the project scope, pages, features and requirements. We maintain strict honesty in our work and do not promise unlimited features or enterprise systems for these introductory amounts."*
- One-click tier selection that automatically routes into the Contact form and preselects the budget.

### 8. Contact Section ("Have an Idea? Let's Build It.")
- Functional form: Name, Email, Project Type, Target Budget (USD), and Project Description.
- Configured studio inbox: [`destrust100n@gmail.com`](mailto:destrust100n@gmail.com) with one-click copy button.
- Real client-side validation and responsive error prompts.
- **Real Backend API (`POST /api/contact`)**:
  - Implemented in `server/contactHandler.ts` using Express and Zod validation.
  - IP-based rate limiting (max 5 submissions per 10 minutes).
  - Persists inquiries to `server/data/inquiries.json` with generated reference IDs (`D10-INQ-XXXX-XXXX`).
  - Supports optional backend email alerts without exposing credentials to the client.
- Loading spinner state and success confirmation receipt with unique reference code.

### 9. Minimal Studio Footer
- D10 Monogram, "Building Beyond Limits", navigation anchors, GitHub link (`https://github.com/destrust10n`), direct email (`destrust100n@gmail.com`), back-to-top button, and copyright notice (`© 2026 DESTRUST10N`).

---

## 🚀 Quick Start

### 1. Build for Production
```bash
npm run build
```

### 2. Run the Unified Production Server
```bash
npm start
```
Server runs at `http://localhost:3000` with both API endpoints and static SPA routing.

### 3. Run in Development Mode
```bash
npm run dev
# or pure Vite frontend:
npm run dev:vite
```
