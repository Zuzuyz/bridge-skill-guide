import React, { useEffect, useRef } from "react";

interface CelestialCosmosProps {
  className?: string;
  particleCount?: number;
  showRings?: boolean;
  opacity?: number;
}

export function CelestialCosmos({
  className = "",
  particleCount = 120,
  showRings = true,
  opacity = 0.9,
}: CelestialCosmosProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
      initStars();
    };

    window.addEventListener("resize", handleResize);

    // Color palette inspired by the celestial artwork
    const starColors = [
      "rgba(251, 191, 36, ",  // Celestial Gold
      "rgba(245, 158, 11, ",  // Warm Amber
      "rgba(236, 72, 153, ",  // Cosmic Magenta
      "rgba(168, 85, 247, ",  // Nebula Violet
      "rgba(45, 212, 191, ",  // Astral Cyan
      "rgba(255, 255, 255, ", // Pure Star White
    ];

    interface Star {
      x: number;
      y: number;
      size: number;
      color: string;
      alpha: number;
      baseAlpha: number;
      speed: number;
      pulseRate: number;
      isSupernova: boolean;
      vx: number;
      vy: number;
    }

    let stars: Star[] = [];

    const initStars = () => {
      stars = [];
      const total = Math.floor((width * height) / 6000) || particleCount;

      for (let i = 0; i < total; i++) {
        const isSupernova = Math.random() < 0.12;
        const color = starColors[Math.floor(Math.random() * starColors.length)] ?? starColors[0]!;
        const baseAlpha = isSupernova ? 0.6 + Math.random() * 0.4 : 0.2 + Math.random() * 0.5;

        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: isSupernova ? 1.8 + Math.random() * 2.5 : 0.6 + Math.random() * 1.4,
          color,
          alpha: baseAlpha,
          baseAlpha,
          speed: 0.01 + Math.random() * 0.03,
          pulseRate: 0.02 + Math.random() * 0.04,
          isSupernova,
          vx: (Math.random() - 0.5) * 0.2,
          vy: -0.08 - Math.random() * 0.15,
        });
      }
    };

    initStars();

    let rotation = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      rotation += 0.002;

      const centerX = width / 2;
      const centerY = height * 0.45;

      // 1. Multi-layered Celestial Nebula Background Glows
      // Center Solar Gold Core
      const sunGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        Math.min(width, height) * 0.55
      );
      sunGrad.addColorStop(0, "rgba(251, 191, 36, 0.22)");
      sunGrad.addColorStop(0.25, "rgba(245, 158, 11, 0.12)");
      sunGrad.addColorStop(0.55, "rgba(217, 70, 239, 0.08)");
      sunGrad.addColorStop(0.85, "rgba(14, 165, 233, 0.04)");
      sunGrad.addColorStop(1, "rgba(5, 5, 16, 0)");

      ctx.fillStyle = sunGrad;
      ctx.fillRect(0, 0, width, height);

      // Top-Left Astral Violet / Ruby Nebula
      const rubyGrad = ctx.createRadialGradient(
        width * 0.2,
        height * 0.25,
        0,
        width * 0.2,
        height * 0.25,
        Math.min(width, height) * 0.5
      );
      rubyGrad.addColorStop(0, "rgba(225, 29, 72, 0.15)");
      rubyGrad.addColorStop(0.4, "rgba(168, 85, 247, 0.08)");
      rubyGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = rubyGrad;
      ctx.fillRect(0, 0, width, height);

      // Bottom-Right Teal / Indigo Nebula
      const tealGrad = ctx.createRadialGradient(
        width * 0.8,
        height * 0.75,
        0,
        width * 0.8,
        height * 0.75,
        Math.min(width, height) * 0.6
      );
      tealGrad.addColorStop(0, "rgba(20, 184, 166, 0.14)");
      tealGrad.addColorStop(0.5, "rgba(59, 130, 246, 0.06)");
      tealGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = tealGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Astrolabe & Sacred Celestial Concentric Rings
      if (showRings) {
        ctx.save();
        ctx.translate(centerX, centerY);

        const baseRadius = Math.min(width, height) * 0.38;

        // Outer Astrolabe Ring with Degree Ticks
        ctx.save();
        ctx.rotate(rotation * 0.5);
        ctx.beginPath();
        ctx.arc(0, 0, baseRadius, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(251, 191, 36, 0.25)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Degree marks around the outer ring
        const ticks = 36;
        for (let t = 0; t < ticks; t++) {
          const angle = (t * Math.PI * 2) / ticks;
          const innerR = t % 3 === 0 ? baseRadius - 10 : baseRadius - 5;
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
          ctx.lineTo(Math.cos(angle) * baseRadius, Math.sin(angle) * baseRadius);
          ctx.strokeStyle = t % 3 === 0 ? "rgba(251, 191, 36, 0.4)" : "rgba(251, 191, 36, 0.2)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.restore();

        // Middle Counter-Rotating Astrological Dial
        ctx.save();
        ctx.rotate(-rotation * 0.7);
        const midRadius = baseRadius * 0.72;

        ctx.beginPath();
        ctx.arc(0, 0, midRadius, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(244, 114, 182, 0.28)";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // 8-Point Compass / Astrological Rays
        for (let r = 0; r < 8; r++) {
          const angle = (r * Math.PI * 2) / 8;
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * (midRadius * 0.4), Math.sin(angle) * (midRadius * 0.4));
          ctx.lineTo(Math.cos(angle) * (midRadius * 1.15), Math.sin(angle) * (midRadius * 1.15));
          ctx.strokeStyle = "rgba(251, 191, 36, 0.18)";
          ctx.lineWidth = 0.8;
          ctx.stroke();

          // Small planetary nodes at vertices
          const nodeX = Math.cos(angle) * midRadius;
          const nodeY = Math.sin(angle) * midRadius;
          ctx.beginPath();
          ctx.arc(nodeX, nodeY, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(253, 224, 71, 0.8)";
          ctx.fill();
        }
        ctx.restore();

        // Inner Sacred Sun Mandala Core
        ctx.save();
        ctx.rotate(rotation * 1.2);
        const innerRadius = baseRadius * 0.42;

        ctx.beginPath();
        ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(251, 191, 36, 0.45)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 12 Sun Flare Rays
        const rays = 12;
        for (let k = 0; k < rays; k++) {
          const rayAngle = (k * Math.PI * 2) / rays;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(rayAngle) * innerRadius, Math.sin(rayAngle) * innerRadius);
          ctx.strokeStyle = "rgba(253, 224, 71, 0.35)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Center Sun Sphere Glow
        const centerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, innerRadius * 0.6);
        centerGrad.addColorStop(0, "rgba(255, 255, 255, 0.9)");
        centerGrad.addColorStop(0.3, "rgba(253, 224, 71, 0.7)");
        centerGrad.addColorStop(0.7, "rgba(245, 158, 11, 0.3)");
        centerGrad.addColorStop(1, "rgba(245, 158, 11, 0)");
        ctx.fillStyle = centerGrad;
        ctx.beginPath();
        ctx.arc(0, 0, innerRadius * 0.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        ctx.restore();
      }

      // 3. Floating Stars, Supernovas, and Nebula Dust
      for (const s of stars) {
        if (!s) continue;

        s.alpha = s.baseAlpha + Math.sin(rotation * 10 + s.size * 3) * 0.25;
        if (s.alpha < 0.08) s.alpha = 0.08;
        if (s.alpha > 0.95) s.alpha = 0.95;

        s.x += s.vx;
        s.y += s.vy;

        if (s.y < -10) s.y = height + 10;
        if (s.x < -10) s.x = width + 10;
        if (s.x > width + 10) s.x = -10;

        // Draw star
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `${s.color}${s.alpha})`;
        ctx.fill();

        // Supernova 4-point cross flare
        if (s.isSupernova) {
          ctx.save();
          ctx.translate(s.x, s.y);
          ctx.strokeStyle = `${s.color}${s.alpha * 0.45})`;
          ctx.lineWidth = 0.8;

          const flareLen = s.size * 3.5;
          ctx.beginPath();
          ctx.moveTo(-flareLen, 0);
          ctx.lineTo(flareLen, 0);
          ctx.moveTo(0, -flareLen);
          ctx.lineTo(0, flareLen);
          ctx.stroke();

          // Soft ambient halo
          ctx.beginPath();
          ctx.arc(0, 0, s.size * 2.8, 0, Math.PI * 2);
          ctx.fillStyle = `${s.color}${s.alpha * 0.18})`;
          ctx.fill();
          ctx.restore();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, [particleCount, showRings]);

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden bg-[#05040a] ${className}`}
      style={{ opacity }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}
