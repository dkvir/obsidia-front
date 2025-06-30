import gsap from "gsap";

const usetl0 = (triggerTitle, triggerDesc = null, item) => {
  const tl = gsap.timeline({ ease: "power1.out" });
  tl.to(triggerTitle, {
    yPercent: 0,
    duration: 1.2,
  });
  tl.fromTo(
    triggerTitle,
    {
      yPercent: 0,
    },
    {
      yPercent: 100,
      duration: 0.6,
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

const usetl01 = (triggerTitle, triggerDesc = null, item) => {
  const tl = gsap.timeline();
  tl.to(triggerTitle, {
    yPercent: 0,
    duration: 0.5,
    stagger: { amount: 0.3, from: "start" },
  })
    .to(triggerTitle, {
      yPercent: 0,
      duration: 1,
    })
    .to(
      triggerDesc,
      {
        yPercent: 0,
        rotate: 0,
        opacity: 1,
        ease: "power2.out",
        duration: 0.5,
        stagger: 0.07,
      },
      "<+=0.5"
    )
    .to(
      triggerTitle,
      {
        yPercent: 100,
        duration: 0.8,
        stagger: { amount: 0.3, from: "start" },
      },
      "+=2"
    )
    .to(
      triggerDesc,
      {
        yPercent: 200,
        rotate: 5,
        opacity: 1,
        ease: "power2.out",
        duration: 0.5,
        stagger: 0.07,
      },
      "<+=0.5"
    );

  return tl;
};
const usetl02 = (triggerTitle, triggerDesc = null, item) => {
  const tl = gsap.timeline();
  tl.to(triggerTitle, {
    yPercent: 0,
    duration: 0.5,
    stagger: { amount: 0.3, from: "start" },
  })
    .to(triggerTitle, {
      yPercent: 0,
      duration: 1,
    })
    .to(
      triggerDesc,
      {
        yPercent: 0,
        rotate: 0,
        opacity: 1,
        ease: "power2.out",
        duration: 0.5,
        stagger: 0.07,
      },
      "<+=0.5"
    )
    .to(
      triggerTitle,
      {
        yPercent: 100,
        duration: 0.8,
        stagger: { amount: 0.3, from: "start" },
      },
      "+=2"
    )
    .to(
      triggerDesc,
      {
        yPercent: 200,
        rotate: 5,
        opacity: 1,
        ease: "power2.out",
        duration: 0.5,
        stagger: 0.07,
      },
      "<+=0.5"
    );

  return tl;
};

const usetl03 = (triggerTitle, triggerDesc = null, item) => {
  const tl = gsap.timeline();
  tl.to(triggerTitle, {
    yPercent: 0,
    duration: 0.5,
    stagger: { amount: 0.3, from: "start" },
  })
    .to(triggerTitle, {
      yPercent: 0,
      duration: 1,
    })
    .to(triggerTitle, {
      yPercent: 100,
      duration: 0.8,
      stagger: { amount: 0.3, from: "start" },
    });

  return tl;
};

export default [usetl0, usetl01, usetl02, usetl03];
