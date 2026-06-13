import type { MouseEvent } from "react";

/**
 * Tracks the cursor position over an element and writes it to --spot-x/--spot-y,
 * which the `.spotlight` CSS class uses to render a glow that follows the mouse.
 */
export function handleSpotlight(e: MouseEvent<HTMLElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
}
