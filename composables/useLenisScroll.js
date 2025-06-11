import Lenis from "lenis";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { gsap } from "gsap";

export const useLenisScroll = () => {
  gsap.registerPlugin(ScrollTrigger);

  window.lenis = new Lenis({
    duration: 1.2,
    smoothWheel: true,
    orientation: "vertical",
    gestureOrientation: "vertical",
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
