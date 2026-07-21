"use client";

import { useCallback, useEffect, useRef } from "react";
import type { MouseEvent } from "react";

/**
 * Cursor-follow spotlight: eases --mx/--my toward the pointer each frame
 * instead of snapping instantly, so the glow visibly "chases" the cursor.
 */
export function useSpotlight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const target = useRef({ x: 50, y: 50 });
  const current = useRef({ x: 50, y: 50 });
  const raf = useRef<number | null>(null);
  const hovering = useRef(false);

  const reduceMotion = useRef(false);
  useEffect(() => {
    reduceMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const tick = useCallback(() => {
    const el = ref.current;
    if (!el) {
      raf.current = null;
      return;
    }
    const ease = reduceMotion.current ? 1 : 0.18;
    current.current.x += (target.current.x - current.current.x) * ease;
    current.current.y += (target.current.y - current.current.y) * ease;
    el.style.setProperty("--mx", `${current.current.x}%`);
    el.style.setProperty("--my", `${current.current.y}%`);

    const dx = Math.abs(target.current.x - current.current.x);
    const dy = Math.abs(target.current.y - current.current.y);
    if (!reduceMotion.current && (hovering.current || dx > 0.05 || dy > 0.05)) {
      raf.current = requestAnimationFrame(tick);
    } else {
      raf.current = null;
    }
  }, []);

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      target.current.x = ((e.clientX - r.left) / r.width) * 100;
      target.current.y = ((e.clientY - r.top) / r.height) * 100;
      hovering.current = true;
      if (raf.current == null) raf.current = requestAnimationFrame(tick);
    },
    [tick]
  );

  const onMouseLeave = useCallback(() => {
    hovering.current = false;
    target.current = { x: 50, y: 50 };
    if (raf.current == null) raf.current = requestAnimationFrame(tick);
  }, [tick]);

  useEffect(() => {
    return () => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
    };
  }, []);

  return { ref, onMouseMove, onMouseLeave };
}
