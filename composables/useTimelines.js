import gsap from "gsap";

const usetl0 = (trigger, item) => {
  const tl = gsap.timeline({ ease: "power1.out" });
  tl.fromTo(
    trigger,
    {
      yPercent: 0,
    },
    {
      yPercent: 100,
      duration: 0.9,
      stagger: { amount: 0.3, from: "start" },
    }
  ).to(
    item,
    {
      yPercent: -70,
      duration: 1.5,
    },
    "<"
  );

  return tl;
};

const usetl01 = (trigger, item) => {
  const tl = gsap.timeline();
  tl.to(trigger, {
    yPercent: 0,
    duration: 0.5,
    stagger: { amount: 0.3, from: "start" },
  })
    .to(trigger, {
      yPercent: 0,
      duration: 1,
    })
    .to(trigger, {
      yPercent: 100,
      duration: 0.8,
      stagger: { amount: 0.3, from: "start" },
    });

  return tl;
};
const usetl02 = (trigger, item) => {
  const tl = gsap.timeline();
  tl.to(trigger, {
    yPercent: 0,
    duration: 0.5,
    stagger: { amount: 0.3, from: "start" },
  })
    .to(trigger, {
      yPercent: 0,
      duration: 1,
    })
    .to(trigger, {
      yPercent: 100,
      duration: 0.8,
      stagger: { amount: 0.3, from: "start" },
    });

  return tl;
};
const usetl03 = (trigger, item) => {
  const tl = gsap.timeline();
  tl.to(trigger, {
    yPercent: 0,
    duration: 0.5,
    stagger: { amount: 0.3, from: "start" },
  })
    .to(trigger, {
      yPercent: 0,
      duration: 1,
    })
    .to(trigger, {
      yPercent: 100,
      duration: 0.8,
      stagger: { amount: 0.3, from: "start" },
    });

  return tl;
};

export default [usetl0, usetl01, usetl02, usetl03];
