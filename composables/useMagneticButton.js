import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

export const useMagneticButton = class Magnet {
  constructor({ target, textElement, targetArrow }) {
    this.element = target.value || target;
    this.textElement = textElement.value || textElement;
    this.arroElement = targetArrow.value || targetArrow;

    gsap.registerPlugin(SplitText);

    this.init();
    this.setupTextAnimation();
    this.setupArrowAnimation();
    this.addListeners();
    this.xTo = gsap.quickTo(this.element, "x");
    this.yTo = gsap.quickTo(this.element, "y");
  }

  magnetize(val) {
    const dist = gsap.utils.normalize(0, this.dimensions.width, Math.abs(val));
    const interp = gsap.utils.interpolate([1, 0.4, 0], dist);
    return interp;
  }

  calcFactor(val) {
    return gsap.utils.mapRange(
      10,
      170,
      0.8,
      1.75,
      gsap.utils.clamp(10, 170, val)
    );
  }

  init() {
    this.dimensions = this.element.getBoundingClientRect();
  }

  resize() {
    this.dimensions = this.element.getBoundingClientRect();
  }

  setupTextAnimation() {
    if (!this.textElement) return;

    // Create clone and append to a container (assuming the text element has a parent)
    this.clone = this.textElement.cloneNode(true);
    this.textElement.parentNode.appendChild(this.clone);
    gsap.set(this.clone, { yPercent: -100 });

    // Create split text instances
    this.originalSplit = SplitText.create(this.textElement, { type: "chars" });
    this.cloneSplit = SplitText.create(this.clone, { type: "chars" });

    // Create timeline
    this.textTimeline = gsap.timeline({ paused: true });

    const duration = 0.4;
    const stagger = { each: 0.02, ease: "power2", from: "start" };

    // Set initial state for clone chars
    gsap.set(this.cloneSplit.chars, {
      rotationX: -90,
      opacity: 0,
      transformOrigin: "50% 50% -10",
    });

    // Build timeline
    this.textTimeline.to(this.originalSplit.chars, {
      duration: duration,
      rotationX: 90,
      transformOrigin: "50% 50% -10",
      stagger: stagger,
    });

    this.textTimeline.to(
      this.originalSplit.chars,
      { duration: duration, opacity: 0, stagger: stagger, ease: "power4.in" },
      0
    );

    this.textTimeline.to(
      this.cloneSplit.chars,
      { duration: 0.05, opacity: 1, stagger: stagger },
      0.001
    );

    this.textTimeline.to(
      this.cloneSplit.chars,
      { duration: duration, rotationX: 0, stagger: stagger },
      0
    );
  }

  setupArrowAnimation() {
    if (!this.arroElement) return;

    this.arrowClone = this.arroElement.cloneNode(true);
    this.arroElement.parentNode.appendChild(this.arrowClone);

    gsap.set(this.arrowClone, {
      yPercent: 100,
      xPercent: -100,
    });

    this.arrowTimeline = gsap.timeline({
      paused: true,
    });

    this.arrowTimeline
      .to(this.arroElement, {
        yPercent: -100,
        xPercent: 100,
        duration: 1,
        ease: "power2.inOut",
      })
      .to(
        this.arrowClone,
        {
          yPercent: 0,
          xPercent: 0,
          duration: 1,
          ease: "power2.inOut",
        },
        "<"
      );
  }

  playTextAnimation() {
    if (this.textTimeline) {
      this.textTimeline.restart();
    }
  }
  playArrowAnimation() {
    if (this.arrowTimeline) {
      this.arrowTimeline.restart();
    }
  }

  addListeners() {
    window.addEventListener("resize", () => {
      this.resize();
    });

    const { element } = this;

    const moveEvent = (e) => {
      // Get fresh dimensions and mouse position for each move event
      const rect = this.element.getBoundingClientRect();
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      const relX = mouseX - rect.left - rect.width / 2;
      const relY = mouseY - rect.top - rect.height / 2;
      const moveX = this.magnetize(relX);
      const moveY = this.magnetize(relY);

      gsap.to(element, {
        x: moveX * relX,
        y: moveY * relY,
      });
    };

    const enterEvent = (e) => {
      // Play text animation on mouse enter
      this.playTextAnimation();
      this.playArrowAnimation();
    };

    const leaveEvent = (e) => {
      // Get fresh dimensions and mouse position for leave event
      const rect = this.element.getBoundingClientRect();
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      const relX = mouseX - rect.left - rect.width / 2;
      const relY = mouseY - rect.top - rect.height / 2;

      const dist = Math.sqrt(Math.pow(relX, 2) + Math.pow(relY, 2));

      const factor = this.calcFactor(dist);
      gsap.to(element, {
        x: 0,
        y: 0,
        ease: `elastic.out(${factor}, 0.5)`,
        duration: 1,
      });
    };

    element.addEventListener("mousemove", moveEvent);
    element.addEventListener("mouseenter", enterEvent);
    element.addEventListener("mouseleave", leaveEvent);
  }
};
