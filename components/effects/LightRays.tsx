"use client";

import { useEffect, useRef } from "react";

interface LightRaysProps {
  className?: string;
  /** "r,g,b" decimal triplet, no spaces required. */
  color?: string;
  rayCount?: number;
  followMouse?: boolean;
}

/**
 * Ambient light-beam background: soft rays fanning down from an anchor
 * above the container, swaying gently and leaning toward the cursor.
 * Pure canvas 2D (no WebGL dependency) so it stays cheap to mount anywhere.
 */
export default function LightRays({
  className = "",
  color = "216,141,248",
  rayCount = 7,
  followMouse = true,
}: LightRaysProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = 0;
    let height = 0;
    const targetOrigin = { x: 0.5 };
    const currentOrigin = { x: 0.5 };

    function resize() {
      const rect = container!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = Math.max(1, width * dpr);
      canvas!.height = Math.max(1, height * dpr);
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    function onPointerMove(e: PointerEvent) {
      const rect = container!.getBoundingClientRect();
      targetOrigin.x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    }
    function onPointerLeave() {
      targetOrigin.x = 0.5;
    }
    if (followMouse && !reduceMotion) {
      window.addEventListener("pointermove", onPointerMove);
      container.addEventListener("pointerleave", onPointerLeave);
    }

    const rays = Array.from({ length: rayCount }, (_, i) => ({
      angleOffset: (i - (rayCount - 1) / 2) * 0.11,
      phase: Math.random() * Math.PI * 2,
      speed: 0.35 + Math.random() * 0.3,
      widthScale: 0.6 + Math.random() * 0.8,
      opacity: 0.1 + Math.random() * 0.09,
    }));

    let raf = 0;
    const start = performance.now();

    function render(now: number) {
      const t = (now - start) / 1000;
      currentOrigin.x += (targetOrigin.x - currentOrigin.x) * 0.08;

      ctx!.clearRect(0, 0, width, height);
      ctx!.globalCompositeOperation = "lighter";

      const originX = currentOrigin.x * width;
      const originY = -height * 0.15;

      for (const ray of rays) {
        const sway = reduceMotion ? 0 : Math.sin(t * ray.speed + ray.phase) * 0.05;
        const angle = Math.PI / 2 + ray.angleOffset + sway;
        const length = height * 1.4;
        const endX = originX + Math.cos(angle) * length;
        const endY = originY + Math.sin(angle) * length;

        const rayWidth = 60 * ray.widthScale;
        const perp = angle + Math.PI / 2;
        const dx = Math.cos(perp) * rayWidth;
        const dy = Math.sin(perp) * rayWidth;

        const pulse = reduceMotion
          ? ray.opacity
          : ray.opacity * (0.7 + 0.3 * Math.sin(t * 0.6 + ray.phase));

        const grad = ctx!.createLinearGradient(originX, originY, endX, endY);
        grad.addColorStop(0, `rgba(${color}, ${pulse})`);
        grad.addColorStop(0.4, `rgba(${color}, ${pulse * 0.4})`);
        grad.addColorStop(1, `rgba(${color}, 0)`);

        ctx!.beginPath();
        ctx!.moveTo(originX - dx * 0.15, originY - dy * 0.15);
        ctx!.lineTo(originX + dx * 0.15, originY + dy * 0.15);
        ctx!.lineTo(endX + dx, endY + dy);
        ctx!.lineTo(endX - dx, endY - dy);
        ctx!.closePath();
        ctx!.fillStyle = grad;
        ctx!.fill();
      }

      if (!reduceMotion) raf = requestAnimationFrame(render);
    }

    render(start);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [color, rayCount, followMouse]);

  return (
    <div
      ref={containerRef}
      className={`light-rays-container pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
      style={{ transition: "opacity 0.5s" }}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
