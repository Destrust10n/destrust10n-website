import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const Hero3DMonolith: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [hasWebGL, setHasWebGL] = useState<boolean>(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Test WebGL support
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setHasWebGL(false);
        return;
      }
    } catch {
      setHasWebGL(false);
      return;
    }

    const width = container.clientWidth || 520;
    const height = container.clientHeight || 520;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0.25, 8.4);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.35;
      container.appendChild(renderer.domElement);
    } catch {
      setHasWebGL(false);
      return;
    }

    // 2. Master Group (Grounded, Fully Framed, Never Fades or Clips)
    const masterGroup = new THREE.Group();
    masterGroup.position.set(0, 0.1, 0);
    scene.add(masterGroup);

    // 3. High-Contrast Studio Materials
    // Metallic Titanium Dark Chrome (High contrast, clearly visible)
    const titaniumMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a3848,
      metalness: 0.92,
      roughness: 0.18,
    });

    // Secondary Brushed Steel / Graphite
    const graphiteMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e2836,
      metalness: 0.88,
      roughness: 0.28,
    });

    // High-Luminance Electric Cyan Core Material
    const cyanCoreMaterial = new THREE.MeshStandardMaterial({
      color: 0x00E5FF,
      emissive: 0x00E5FF,
      emissiveIntensity: 1.1,
      roughness: 0.1,
      metalness: 0.8,
    });

    // Secondary Cyan Accent Material
    const cyanSecondaryMaterial = new THREE.MeshStandardMaterial({
      color: 0x00AFCB,
      emissive: 0x00AFCB,
      emissiveIntensity: 0.85,
      roughness: 0.15,
      metalness: 0.85,
    });

    // Crisp Blueprint Wireframe Material
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x00E5FF,
      transparent: true,
      opacity: 0.85,
    });

    // 4. Monolith Core Chassis
    const monolithGroup = new THREE.Group();
    masterGroup.add(monolithGroup);

    // Main Chamfered Monolith Block (Positioned hovering above platform)
    const monolithGeom = new THREE.BoxGeometry(2.6, 3.3, 0.7, 4, 4, 4);
    const monolithMesh = new THREE.Mesh(monolithGeom, titaniumMaterial);
    monolithMesh.position.y = 0.45;
    monolithGroup.add(monolithMesh);

    // Blueprint Wireframe on Monolith
    const wireGeom = new THREE.EdgesGeometry(monolithGeom);
    const wireLines = new THREE.LineSegments(wireGeom, wireMat);
    wireLines.position.y = 0.45;
    wireLines.scale.set(1.002, 1.002, 1.002);
    monolithGroup.add(wireLines);

    // Lateral Titanium Reinforcement Ribs
    for (let i = -1; i <= 1; i += 2) {
      const ribGeom = new THREE.BoxGeometry(0.14, 3.1, 0.76);
      const ribMesh = new THREE.Mesh(ribGeom, graphiteMaterial);
      ribMesh.position.set(i * 1.34, 0.45, 0);
      monolithGroup.add(ribMesh);

      // Cyan Bolt Insets
      for (let j = -1.2; j <= 1.2; j += 0.6) {
        const boltGeom = new THREE.CylinderGeometry(0.045, 0.045, 0.06, 8);
        const bolt = new THREE.Mesh(boltGeom, cyanCoreMaterial);
        bolt.rotation.z = Math.PI / 2;
        bolt.position.set(i * 1.42, 0.45 + j, 0);
        monolithGroup.add(bolt);
      }
    }

    // 5. True 3D Sculpted "D10" Monogram (Bold, High Contrast, Extruded Forward)
    const d10Group = new THREE.Group();
    d10Group.position.set(0, 0.45, 0.42);
    monolithGroup.add(d10Group);

    // "D" - Heavy 3D Mechanical Arch
    const dCurve = new THREE.TorusGeometry(0.88, 0.13, 24, 64, Math.PI * 1.3);
    const dMesh = new THREE.Mesh(dCurve, cyanCoreMaterial);
    dMesh.rotation.z = -Math.PI / 2.3;
    dMesh.position.x = -0.16;
    d10Group.add(dMesh);

    // "D" Titanium Backing Bar
    const dBarGeom = new THREE.BoxGeometry(0.16, 1.6, 0.16);
    const dBarMesh = new THREE.Mesh(dBarGeom, titaniumMaterial);
    dBarMesh.position.x = -0.16;
    d10Group.add(dBarMesh);

    // "1" - Vertical Titanium Power Conduit Pylon
    const pylonGeom = new THREE.CylinderGeometry(0.11, 0.11, 1.65, 16);
    const pylonMesh = new THREE.Mesh(pylonGeom, cyanCoreMaterial);
    pylonMesh.position.x = -0.72;
    d10Group.add(pylonMesh);

    // Titanium Protective End-Caps on "1"
    const capGeom = new THREE.BoxGeometry(0.28, 0.14, 0.24);
    const capTop = new THREE.Mesh(capGeom, titaniumMaterial);
    capTop.position.set(-0.72, 0.82, 0);
    d10Group.add(capTop);

    const capBot = new THREE.Mesh(capGeom, titaniumMaterial);
    capBot.position.set(-0.72, -0.82, 0);
    d10Group.add(capBot);

    // "0" - Heavy 3D Toroidal Reactor Ring
    const zeroGeom = new THREE.TorusGeometry(0.72, 0.12, 24, 64);
    const zeroMesh = new THREE.Mesh(zeroGeom, cyanCoreMaterial);
    zeroMesh.position.x = 0.65;
    d10Group.add(zeroMesh);

    // Glowing Inner Energy Core Orb inside "0"
    const reactorCoreGeom = new THREE.IcosahedronGeometry(0.36, 1);
    const reactorCoreMesh = new THREE.Mesh(reactorCoreGeom, new THREE.MeshStandardMaterial({
      color: 0x00E5FF,
      emissive: 0x00E5FF,
      emissiveIntensity: 1.8,
      wireframe: true,
    }));
    reactorCoreMesh.position.x = 0.65;
    d10Group.add(reactorCoreMesh);

    // Rotating Titanium Stator Blades
    const statorGroup = new THREE.Group();
    statorGroup.position.x = 0.65;
    d10Group.add(statorGroup);

    for (let k = 0; k < 4; k++) {
      const pinGeom = new THREE.BoxGeometry(0.05, 0.52, 0.05);
      const pin = new THREE.Mesh(pinGeom, titaniumMaterial);
      pin.rotation.z = (k * Math.PI) / 4;
      statorGroup.add(pin);
    }

    // 6. PHYSICAL BOOK / PLATFORM PEDESTAL UNDERNEATH (CRITICAL REQUIREMENT)
    // Multi-tiered high-tech platform / tome plinth directly beneath the monolith
    const platformGroup = new THREE.Group();
    platformGroup.position.set(0, -1.65, 0);
    masterGroup.add(platformGroup);

    // Tier A: Upper Platform Surface / Top Cover (Chamfered Titanium Plate)
    const topPlateGeom = new THREE.BoxGeometry(4.3, 0.22, 3.1);
    const topPlateMesh = new THREE.Mesh(topPlateGeom, titaniumMaterial);
    topPlateMesh.position.y = 0.22;
    platformGroup.add(topPlateMesh);

    // Wireframe edge on top platform plate
    const topPlateWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(topPlateGeom),
      new THREE.LineBasicMaterial({ color: 0x00E5FF, transparent: true, opacity: 0.9 })
    );
    topPlateWire.position.y = 0.22;
    topPlateWire.scale.set(1.002, 1.002, 1.002);
    platformGroup.add(topPlateWire);

    // Neon Perimeter Glow Track on Top of Platform
    const neonRibbonGeom = new THREE.BoxGeometry(4.0, 0.04, 2.8);
    const neonRibbonMesh = new THREE.Mesh(neonRibbonGeom, cyanCoreMaterial);
    neonRibbonMesh.position.y = 0.34;
    platformGroup.add(neonRibbonMesh);

    // Contact Shadow Disc on Platform Surface (Gives realistic physical grounding)
    const shadowDiscGeom = new THREE.CircleGeometry(1.3, 32);
    const shadowDiscMat = new THREE.MeshBasicMaterial({
      color: 0x040810,
      transparent: true,
      opacity: 0.75,
    });
    const shadowDisc = new THREE.Mesh(shadowDiscGeom, shadowDiscMat);
    shadowDisc.rotation.x = -Math.PI / 2;
    shadowDisc.position.y = 0.345;
    platformGroup.add(shadowDisc);

    // Tier B: Inset Technical Core / Book Page Block
    const pageBlockGeom = new THREE.BoxGeometry(4.0, 0.38, 2.85);
    const pageBlockMesh = new THREE.Mesh(pageBlockGeom, graphiteMaterial);
    pageBlockMesh.position.y = -0.06;
    platformGroup.add(pageBlockMesh);

    // Horizontal Page Grooves / Conduits on sides
    for (let g = -0.15; g <= 0.05; g += 0.09) {
      const grooveGeom = new THREE.BoxGeometry(4.05, 0.02, 2.9);
      const grooveMesh = new THREE.Mesh(grooveGeom, cyanSecondaryMaterial);
      grooveMesh.position.y = g;
      platformGroup.add(grooveMesh);
    }

    // Tier C: Lower Foundation Base Plinth (Heavy Titanium Foundation)
    const basePlateGeom = new THREE.BoxGeometry(4.6, 0.24, 3.4);
    const basePlateMesh = new THREE.Mesh(basePlateGeom, titaniumMaterial);
    basePlateMesh.position.y = -0.36;
    platformGroup.add(basePlateMesh);

    const basePlateWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(basePlateGeom),
      new THREE.LineBasicMaterial({ color: 0x00AFCB, transparent: true, opacity: 0.7 })
    );
    basePlateWire.position.y = -0.36;
    basePlateWire.scale.set(1.002, 1.002, 1.002);
    platformGroup.add(basePlateWire);

    // 4 Corner Leveling Pods / Tech Feet
    const footPositions = [
      [-2.1, -0.52, -1.5],
      [2.1, -0.52, -1.5],
      [-2.1, -0.52, 1.5],
      [2.1, -0.52, 1.5],
    ];

    footPositions.forEach(([fx, fy, fz]) => {
      const footGeom = new THREE.CylinderGeometry(0.14, 0.18, 0.16, 12);
      const footMesh = new THREE.Mesh(footGeom, titaniumMaterial);
      footMesh.position.set(fx, fy, fz);
      platformGroup.add(footMesh);

      // Cyan diode on each foot
      const diodeGeom = new THREE.SphereGeometry(0.05, 8, 8);
      const diodeMesh = new THREE.Mesh(diodeGeom, cyanCoreMaterial);
      diodeMesh.position.set(fx, fy - 0.06, fz);
      platformGroup.add(diodeMesh);
    });

    // 7. Orbital Gimbal Rings
    const ringMasterGroup = new THREE.Group();
    masterGroup.add(ringMasterGroup);

    // Inner Cyan Ring
    const ring1Geom = new THREE.TorusGeometry(2.55, 0.028, 16, 120);
    const ring1Mat = new THREE.MeshBasicMaterial({ color: 0x00E5FF, transparent: true, opacity: 0.7 });
    const ring1 = new THREE.Mesh(ring1Geom, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    ring1.position.y = 0.3;
    ringMasterGroup.add(ring1);

    // Middle Secondary Ring
    const ring2Geom = new THREE.TorusGeometry(3.05, 0.02, 16, 120);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0x00AFCB, transparent: true, opacity: 0.5 });
    const ring2 = new THREE.Mesh(ring2Geom, ring2Mat);
    ring2.rotation.y = Math.PI / 4;
    ring2.rotation.x = -Math.PI / 5;
    ring2.position.y = 0.3;
    ringMasterGroup.add(ring2);

    // Outer Precision Ring
    const ring3Geom = new THREE.TorusGeometry(3.55, 0.016, 16, 140);
    const ring3Mat = new THREE.MeshBasicMaterial({ color: 0x929AA5, transparent: true, opacity: 0.3 });
    const ring3 = new THREE.Mesh(ring3Geom, ring3Mat);
    ring3.rotation.z = Math.PI / 6;
    ring3.position.y = 0.3;
    ringMasterGroup.add(ring3);

    // 8. Floating Geometric Satellite Shards
    const shards: THREE.Mesh[] = [];
    const shardGeom = new THREE.OctahedronGeometry(0.18, 0);
    const shardMaterial = new THREE.MeshStandardMaterial({
      color: 0x222d3d,
      metalness: 0.94,
      roughness: 0.15,
      emissive: 0x00E5FF,
      emissiveIntensity: 0.45,
    });

    for (let i = 0; i < 6; i++) {
      const shard = new THREE.Mesh(shardGeom, shardMaterial);
      const angle = (i / 6) * Math.PI * 2;
      const radius = 2.9 + (i % 2) * 0.4;
      shard.position.set(
        Math.cos(angle) * radius,
        0.3 + (Math.random() - 0.5) * 1.8,
        Math.sin(angle) * radius
      );
      ringMasterGroup.add(shard);
      shards.push(shard);
    }

    // 9. Ambient Background Particles (Positioned strictly behind the artifact)
    const particleCount = 75;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let p = 0; p < particleCount; p++) {
      particlePositions[p * 3] = (Math.random() - 0.5) * 11;
      particlePositions[p * 3 + 1] = (Math.random() - 0.5) * 10;
      particlePositions[p * 3 + 2] = -2.5 - Math.random() * 4.5;
    }

    const particleGeom = new THREE.BufferGeometry();
    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x00E5FF,
      size: 0.04,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const particleField = new THREE.Points(particleGeom, particleMat);
    scene.add(particleField);

    // 10. COMPREHENSIVE LIGHTING SETUP (Guarantees Vivid Visibility at All Times)
    // Hemisphere ambient light (rich metallic studio reflection)
    const hemiLight = new THREE.HemisphereLight(0x2e3f56, 0x0a1018, 3.2);
    scene.add(hemiLight);

    // Main Electric Cyan Directional Key Light (Sharp metallic reflections from top-right)
    const keyLight = new THREE.DirectionalLight(0x00E5FF, 4.5);
    keyLight.position.set(3.5, 4.5, 4.5);
    scene.add(keyLight);

    // Secondary Accent Fill Light (Steel cyan from front-left)
    const secondaryFill = new THREE.DirectionalLight(0x00AFCB, 2.5);
    secondaryFill.position.set(-4.0, 1.0, 4.0);
    scene.add(secondaryFill);

    // Dedicated Platform Uplight (Directly illuminates the physical book/platform and underneath monolith)
    const platformUplight = new THREE.PointLight(0x00E5FF, 5.5, 8.5);
    platformUplight.position.set(0, -1.1, 1.4);
    scene.add(platformUplight);

    // Cool Titanium White Rim Backlight (Accentuates bevels and metallic edges)
    const rimBacklight = new THREE.DirectionalLight(0xF5F7FA, 3.5);
    rimBacklight.position.set(-4.5, 5.5, -4.0);
    scene.add(rimBacklight);

    // Direct Frontal Soft Fill
    const frontFill = new THREE.DirectionalLight(0x38BDF8, 1.5);
    frontFill.position.set(0, 0.5, 6.0);
    scene.add(frontFill);

    // Interactive Pointer-Tracking Light
    const cursorLight = new THREE.PointLight(0x00E5FF, 2.8, 10);
    cursorLight.position.set(0, 0, 4.5);
    scene.add(cursorLight);

    // 11. Mouse Interaction & Tracking
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouse.targetX = x;
      mouse.targetY = y;
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });

    // 12. Controlled ScrollTrigger Behavior
    // Keeps the object fully visible, properly framed, and illuminated while scrolling
    const scrollCtx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: '#home',
        start: 'top top',
        end: 'bottom top',
        scrub: 1.0,
        onUpdate: (self) => {
          const progress = self.progress;
          // Subtle parallax that NEVER pushes the object into darkness or clips
          masterGroup.position.y = 0.1 - progress * 0.6;
          masterGroup.position.x = progress * 0.3;
          masterGroup.rotation.y = progress * 0.3;
        },
      });
    });

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // 13. Continuous High-Performance Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse easing (lerp)
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      // Update cursor light
      cursorLight.position.x = mouse.x * 4;
      cursorLight.position.y = mouse.y * 4;

      if (!prefersReducedMotion) {
        // Continuous slow rotation and subtle mouse parallax
        monolithGroup.rotation.y = elapsedTime * 0.18 + mouse.x * 0.32;
        monolithGroup.rotation.x = Math.sin(elapsedTime * 0.3) * 0.05 - mouse.y * 0.22;

        // Floating vertical oscillation of the monolith above the platform
        monolithGroup.position.y = Math.sin(elapsedTime * 0.8) * 0.09;

        // Subtle sympathetic tilt of the platform
        platformGroup.rotation.y = mouse.x * 0.15;
        platformGroup.rotation.x = -mouse.y * 0.1;

        // Orbital tech rings rotating on different axes
        ring1.rotation.z = elapsedTime * 0.15;
        ring2.rotation.y = elapsedTime * -0.2;
        ring3.rotation.x = elapsedTime * 0.1;

        // Rotating reactor stator pins inside the "0"
        statorGroup.rotation.z = elapsedTime * -1.2;
        reactorCoreMesh.rotation.x = elapsedTime * 0.6;
        reactorCoreMesh.rotation.y = elapsedTime * 0.8;

        // Orbiting shards
        for (let i = 0; i < shards.length; i++) {
          shards[i].rotation.x += 0.02;
          shards[i].rotation.y += 0.03;
        }

        // Particle field slow drift
        particleField.rotation.y = elapsedTime * 0.02;

        // Subtle cyan core breathing pulse
        const pulse = 1.05 + Math.sin(elapsedTime * 2.2) * 0.2;
        cyanCoreMaterial.emissiveIntensity = pulse;
      } else {
        // Reduced motion mode
        monolithGroup.rotation.y = 0.2 + mouse.x * 0.1;
        monolithGroup.rotation.x = -0.05 - mouse.y * 0.1;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      scrollCtx.revert();

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      monolithGeom.dispose();
      titaniumMaterial.dispose();
      graphiteMaterial.dispose();
      cyanCoreMaterial.dispose();
      cyanSecondaryMaterial.dispose();
      wireGeom.dispose();
      wireMat.dispose();
      dCurve.dispose();
      dBarGeom.dispose();
      pylonGeom.dispose();
      capGeom.dispose();
      zeroGeom.dispose();
      reactorCoreGeom.dispose();
      topPlateGeom.dispose();
      neonRibbonGeom.dispose();
      shadowDiscGeom.dispose();
      shadowDiscMat.dispose();
      pageBlockGeom.dispose();
      basePlateGeom.dispose();
      ring1Geom.dispose();
      ring1Mat.dispose();
      ring2Geom.dispose();
      ring2Mat.dispose();
      ring3Geom.dispose();
      ring3Mat.dispose();
      particleGeom.dispose();
      particleMat.dispose();
      shardGeom.dispose();
      shardMaterial.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[440px] sm:h-[520px] lg:h-[600px] flex items-center justify-center">
      {/* 3D WebGL Canvas - PERMANENTLY FULLY VISIBLE, ZERO FADING */}
      <div 
        ref={mountRef} 
        className="w-full h-full cursor-grab active:cursor-grabbing opacity-100 z-10"
      />

      {/* Graceful Fallback if WebGL is unavailable */}
      {!hasWebGL && (
        <div className="absolute inset-0 flex items-center justify-center p-6 z-20">
          <div className="glass-panel p-8 rounded-3xl text-center max-w-sm border border-[#00E5FF]/40">
            <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-[#101318] border border-[#00E5FF]/60 flex items-center justify-center box-cyan-glow">
              <span className="font-heading font-extrabold text-3xl text-[#00E5FF]">D10</span>
            </div>
            <p className="font-heading font-bold text-lg text-[#F5F7FA]">DESTRUST10N Monolith</p>
            <p className="text-xs text-[#929AA5] mt-1">3D Hardware Accelerated Studio Core</p>
          </div>
        </div>
      )}

      {/* Futuristic Telemetry HUD Badge */}
      <div className="absolute bottom-2 right-4 sm:bottom-4 sm:right-6 pointer-events-none text-right z-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel-subtle text-[11px] font-mono text-[#00E5FF] border border-[#00E5FF]/30 shadow-[0_0_15px_rgba(0,229,255,0.15)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-ping" />
          <span>D10_MONOLITH // TITANIUM ARTIFACT</span>
        </div>
      </div>
    </div>
  );
};
