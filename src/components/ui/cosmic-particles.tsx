import React, { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  radius: number;
  color: string;
  alpha: number;
  baseAlpha: number;
  twinkleSpeed: number;
  vx: number;
  vy: number;
  glow: boolean;
}

interface CosmicParticlesProps {
  className?: string;
  particleCount?: number;
  accentColor?: "emerald" | "blue" | "gold";
  enableGlowRings?: boolean;
}

export function CosmicParticles({
  className = "",
  particleCount = 90,
  accentColor = "emerald",
  enableGlowRings = true,
}: CosmicParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
      initParticles();
    };

    window.addEventListener("resize", handleResize);

    const colors =
      accentColor === "emerald"
        ? [
            "rgba(104, 166, 125, ", // Sage/Emerald
            "rgba(52, 211, 153, ",  // Mint
            "rgba(167, 243, 208, ", // Soft green
            "rgba(220, 252, 231, ", // Pale green
            "rgba(255, 255, 255, ", // Star white
          ]
        : [
            "rgba(96, 165, 250, ",
            "rgba(147, 197, 253, ",
            "rgba(255, 255, 255, ",
          ];

    let particles: Particle[] = [];

    const initParticles = () => {
      particles = [];
      const count = Math.floor((width * height) / 8000) || particleCount;

      for (let i = 0; i < count; i++) {
        const isGlow = Math.random() < 0.18;
        const baseAlpha = isGlow ? 0.4 + Math.random() * 0.45 : 0.15 + Math.random() * 0.5;
        const colorPrefix = colors[Math.floor(Math.random() * colors.length)] ?? "rgba(104, 166, 125, ";

        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: isGlow ? 1.5 + Math.random() * 2.2 : 0.6 + Math.random() * 1.2,
          color: colorPrefix,
          alpha: baseAlpha,
          baseAlpha,
          twinkleSpeed: 0.008 + Math.random() * 0.02,
          vx: (Math.random() - 0.5) * 0.15,
          vy: -0.05 - Math.random() * 0.15, // Gentle upward drift
          glow: isGlow,
        });
      }
    };

    initParticles();

    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      angle += 0.01;

      // Draw subtle background radial glow clusters
      if (enableGlowRings) {
        // Top-right soft emerald nebula
        const grad1 = ctx.createRadialGradient(
          width * 0.8,
          height * 0.3,
          0,
          width * 0.8,
          height * 0.3,
          Math.min(width, height) * 0.6
        );
        grad1.addColorStop(0, "rgba(52, 211, 153, 0.08)");
        grad1.addColorStop(0.5, "rgba(16, 185, 129, 0.03)");
        grad1.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = grad1;
        ctx.fillRect(0, 0, width, height);

        // Bottom-center soft glow
        const grad2 = ctx.createRadialGradient(
          width * 0.3,
          height * 0.75,
          0,
          width * 0.3,
          height * 0.75,
          Math.min(width, height) * 0.5
        );
        grad2.addColorStop(0, "rgba(104, 166, 125, 0.06)");
        grad2.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = grad2;
        ctx.fillRect(0, 0, width, height);
      }

      // Draw and update each star/particle
      for (const p of particles) {
        if (!p) continue;

        // Twinkle alpha calculation
        p.alpha = p.baseAlpha + Math.sin(angle + p.radius) * 0.25;
        if (p.alpha < 0.05) p.alpha = 0.05;
        if (p.alpha > 0.95) p.alpha = 0.95;

        // Position update
        p.x += p.vx;
        p.y += p.vy;

        // Wrap edges smoothly
        if (p.y < -10) p.y = height + 10;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.alpha})`;
        ctx.fill();

        // Extra soft halo for glowing orbs
        if (p.glow) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 3.5, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${p.alpha * 0.25})`;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [particleCount, accentColor, enableGlowRings]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
