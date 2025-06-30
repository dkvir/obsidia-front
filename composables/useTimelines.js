import gsap from "gsap";

const usetl0 = (triggerTitle, triggerDesc = null, subtitle, item) => {
  const tl = gsap.timeline({ ease: "power1.out" });

  tl.to(triggerTitle.lines, {
    yPercent: 200,
    opacity: 0,
    duration: 0.1,
    rotate: -5,
    ease: "power3.out",
    stagger: { amount: 0.001, from: "start" },
  });
  return tl;
};

const usetl01 = (triggerTitle, triggerDesc = null, subtitle, item) => {
  const tl = gsap.timeline();

  tl.to(triggerTitle.words, {
    yPercent: 0,
    rotate: 0,
    opacity: 1,
    duration: 1,
    ease: "power3.out",
    stagger: { amount: 0.001, from: "start" },
  })
    .to(
      triggerTitle.words,
      {
        yPercent: 0,
        duration: 2,
        ease: "power3.out",
      },
      ">"
    )
    .to(
      triggerTitle.words,
      {
        yPercent: 100,
        rotate: 0,
        duration: 1.5,
        ease: "power3.out",
        stagger: { amount: 0.001, from: "start" },
      },
      ">"
    );

  return tl;
};
const usetl02 = (triggerTitle, triggerDesc = null, subtitle, item) => {
  const tl = gsap.timeline();

  return tl;
};

const usetl03 = (triggerTitle, triggerDesc = null, subtitle, item) => {
  const tl = gsap.timeline();

  return tl;
};
const usetl04 = (triggerTitle, triggerDesc = null, subtitle, item) => {
  const tl = gsap.timeline();

  return tl;
};

export default [usetl0, usetl01, usetl02, usetl03, usetl04];
