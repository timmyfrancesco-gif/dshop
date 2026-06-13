"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

export default function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { damping: 30, stiffness: 400, mass: 0.4 });
  const ringY = useSpring(y, { damping: 30, stiffness: 400, mass: 0.4 });

  useEffect(() => {
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!isFinePointer || prefersReducedMotion) return;

    // One-time sync with the platform's pointer capabilities on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(true);
    document.body.classList.add("cursor-none");

    function handleMove(e: MouseEvent) {
      x.set(e.clientX);
      y.set(e.clientY);
      const target = e.target as HTMLElement;
      setHovering(Boolean(target.closest("a, button, [role='button'], input, textarea")));
    }

    window.addEventListener("mousemove", handleMove);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      document.body.classList.remove("cursor-none");
    };
  }, [x, y]);

  if (!enabled) return null;

  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[200] h-1.5 w-1.5 rounded-full bg-accent"
        style={{ x, y, translateX: "-50%", translateY: "-50%" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[200] rounded-full border border-accent/50"
        style={{ x: ringX, y: ringY, translateX: "-50%", translateY: "-50%" }}
        animate={{ width: hovering ? 48 : 28, height: hovering ? 48 : 28, opacity: hovering ? 0.8 : 0.5 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      />
    </>
  );
}
