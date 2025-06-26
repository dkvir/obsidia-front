<template>
  <div class="home-page">
    <canvas id="canvas"></canvas>
    <div class="header stop"></div>
    <div class="separator"></div>
    <div class="stop-1 stop"></div>
    <div class="separator"></div>
    <div class="stop-2 stop"></div>
    <div class="separator"></div>
    <div class="footer stop"></div>
    <div class="separator"></div>
    <ul class="texts">
      <li
        v-for="(item, index) in 5"
        :class="[
          'text',
          {
            'is-active': activeTextIndex == index,
            'is-even': index % 2 !== 0,
          },
        ]"
      >
        {{ index }} Lorem ipsum dolor sit amet, consectetur adipisicing elit.
        Inventore, eos! Ipsa minima sint a dolorem, sapiente quas commodi
        ducimus numquam?
      </li>
    </ul>
  </div>
</template>

<script setup>
const { setupSequentialLoading, activeTextIndex } = useThreeScene("#canvas");
import gsap from "gsap";

// const split = ref(null);
let listItems = ref(null);
const splitArr = ref([]);

watch(
  () => activeTextIndex.value,
  (curr, prev) => {
    if (curr !== null) {
      gsap.to(splitArr.value[curr].lines, {
        yPercent: 0,
        rotate: 0,
        opacity: 1,
        ease: "power2.out",
        duration: 0.9,
        stagger: 0.07,
      });
    }

    if (prev !== null) {
      gsap.to(splitArr.value[prev].lines, {
        yPercent: 200,
        rotate: 5,
        opacity: 0,
        ease: "power2.out",
        duration: 0.9,
        stagger: 0.05,
      });
    }
  }
);

onMounted(() => {
  gsap.registerPlugin(SplitText);

  listItems.value = document.querySelectorAll(".texts .text");

  listItems.value.forEach((item, index) => {
    let split = SplitText.create(item, {
      type: "lines",
      mask: "lines",
      linesClass: "line",
    });
    gsap.set(split.lines, {
      yPercent: 250,
      rotate: 10,
      opacity: 0,
    });
    splitArr.value.push(split);
  });

  setTimeout(() => {
    gsap.to(splitArr.value[0].lines, {
      yPercent: 0,
      rotate: 0,
      opacity: 1,
      ease: "power2.out",
      duration: 0.9,
      stagger: 0.1,
    });
  }, 1000);

  setupSequentialLoading();
});
</script>

<style lang="scss" scoped>
.home-page {
  width: 100%;
  min-height: 100vh;
  position: relative;
  .stop {
    width: 100vw;
    height: 200vh;
  }

  .separator {
    width: 100vw;
    height: 200vh;
  }

  #canvas,
  .texts {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100lvh;
  }

  :deep(.text) {
    position: absolute;
    top: 50%;
    right: 0;
    transform: translate3d(0, -50%, 0);
    padding: 0 calc(var(--page-offset-padding) * 2);
    width: 40%;
    font-size: 36px;
    font-family: var(--font-parmigiano-light);
    // opacity: var(--text-opacity, 0);
    @include default-transitions(opacity);
    &.is-even {
      right: initial;
      left: 0;
    }
    &.is-active {
      --text-opacity: 1;
    }
    .line-mask {
      overflow: hidden;
    }
  }
}
</style>
