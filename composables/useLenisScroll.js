import Lenis from "lenis";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { gsap } from "gsap";

export const useLenisScroll = () => {
  gsap.registerPlugin(ScrollTrigger);

  window.lenis = new Lenis({
    duration: 2.5, // Increased from 1.2 - makes scroll much slower
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Custom easing for ultra-smooth feel
    smoothWheel: true,
    wheelMultiplier: 0.6, // Reduces wheel sensitivity - slower scroll per wheel tick
    touchMultiplier: 1.2, // Slightly increase touch sensitivity to compensate
    infinite: false,
    orientation: "vertical",
    gestureOrientation: "vertical",
    normalizeWheel: true, // Helps normalize different input devices
    lerp: 0.05, // Lower lerp value = smoother interpolation (0.1 is default)
  });

  window.lenis.on("scroll", ({ scroll, limit }) => {
    ScrollTrigger.update();
  });

  function raf(time) {
    window.lenis.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);
};
