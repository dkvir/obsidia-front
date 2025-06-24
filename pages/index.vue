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
        v-for="(item, index) in 4"
        :class="[
          'text',
          {
            'is-active': activeTextIndex == index,
            'is-even': index % 2 !== 0,
          },
        ]"
      >
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Inventore,
        eos! Ipsa minima sint a dolorem, sapiente quas commodi ducimus numquam?
      </li>
    </ul>
  </div>
</template>

<script setup>
import gsap from "gsap";
const { setupSequentialLoading, activeTextIndex } = useThreeScene("#canvas");

onMounted(() => {
  gsap.registerPlugin(SplitText);

  let split = SplitText.create(".home-page .texts .text", {
    type: "lines",
    mask: "line-mask",
  });

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
    height: 100vh;
  }

  .separator {
    width: 100vw;
    height: 100vh;
  }

  #canvas,
  .texts {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100lvh;
  }

  .text {
    position: absolute;
    top: 50%;
    right: 0;
    transform: translate3d(0, -50%, 0);
    padding: 0 calc(var(--page-offset-padding) * 2);
    width: 40%;
    font-size: 36px;
    font-family: var(--font-parmigiano-light);
    opacity: var(--text-opacity, 0);
    @include default-transitions(opacity);
    &.is-even {
      right: initial;
      left: 0;
    }
    &.is-active {
      --text-opacity: 1;
    }
  }
}
</style>
