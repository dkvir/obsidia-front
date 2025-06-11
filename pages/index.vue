<template>
  <div class="home-page">
    <canvas id="canvas"></canvas>
  </div>
</template>

<script setup>
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
import { GammaCorrectionShader } from "three/examples/jsm/shaders/GammaCorrectionShader.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

let scene,
  renderer,
  camera,
  controls,
  statuemesh,
  envMap,
  material,
  alternativeMaterial;
let composer, bloomPass, bokehPass;
let mixer,
  animations,
  animationActions = [];
let lineHandler, dustParticles;
let clock = new THREE.Clock();
let scrollTimeline, dofTimeline;
let cursorLight, cursorLightFar, cursorLightFar2; // Added second far light
let cursorLightFarHelper, cursorLightFarHelper2; // Added helpers
let rightlight, leftlight; // Store light references

// Mouse rotation variables
let mouse = new THREE.Vector2();
let lastMouse = new THREE.Vector2();
let rotationOffset = new THREE.Vector2();
let mouseMoveFactor = { value: 0.05 };
let returnFactor = { value: 0.01 };
let isMouseMoving = false;
let mouseTimeout;
let statueGroup;

// ================================
// CONFIGURATION - EASY TO MODIFY
// ================================
const config = {
  final: false,

  // Regular lighting (final = true)
  rightlightIntensity: 10,
  rightlightColor: 0xff0000,
  leftlightIntensity: 20,
  lefttlightColor: 0x0000ff,

  // Bloom settings
  bloom: {
    // Final mode bloom
    finalStrength: 0.2,
    finalRadius: 2.0,
    // Non-final mode bloom (increased for dramatic effect)
    nonFinalStrength: 0.3,
    nonFinalRadius: 2.0,
    threshold: 0.05,
  },

  // Cursor lights
  cursorLight: {
    enabled: true,
    color: new THREE.Color(0xfcd2d8),
    intensity: 1,
    distance: 20,
    decay: 1,
    depth: 4,
    smoothing: 0.5,
  },
  cursorLightFar: {
    enabled: true,
    // Colors for different modes
    finalColor: 0xc337ff, // Purple for final mode
    nonFinalColor: 0xf1f1ff, // White for non-final mode
    intensity: 0.5,
    distance: 20,
    decay: 0.5,
    finalDepth: 10, // Original depth for final mode
    nonFinalDepth: 6, // Closer depth for non-final mode
    smoothing: 0.1,
    xOffset: 1.2, // X offset for the two lights
  },

  // Other settings
  lineWidth: 6,
  opacity: 1,
  bezierCurveAmount: 0.5,
  orbitControls: { enabled: false, enableDamping: true, dampingFactor: 0.1 },
  dustParticles: {
    count: 2000,
    size: { min: 0.008, max: 0.06 },
    area: { width: 5, height: 5, depth: 15 },
    opacity: 0.3,
    speed: { min: 0.0001, max: 0.0004 },
    color: {
      hue: { min: 200, max: 300 },
      saturation: { min: 70, max: 90 },
      lightness: { min: 70, max: 100 },
    },
  },
  dof: { focus: 2.5, aperture: 0.001, maxblur: 0.5, enabled: false },
  insideLineWidth: 0.7,
  insideLineOpacity: 1,
};

const dofFocusPoints = [
  { position: 0, focus: 5.5 },
  { position: 0.6, focus: 0.2 },
  { position: 1, focus: 0.1 },
];

// Create scene
scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

onMounted(() => {
  // Loading manager
  const loadingManager = new THREE.LoadingManager(() => {
    init();
    initStatueGroup();
    animate();
  });

  // Load HDRI environment
  const hdriLoader = new RGBELoader(loadingManager);
  hdriLoader.load("images/03.hdr", function (texture) {
    envMap = texture;
    envMap.mapping = THREE.EquirectangularReflectionMapping;
    const normal = new THREE.TextureLoader().load("./images/normal.jpg");

    material = new THREE.MeshPhysicalMaterial({
      color: 0x000000,
      normalMap: normal,
      metalness: 0.1,
      roughness: 0.5,
      thickness: 0.5,
      side: THREE.DoubleSide,
      envMap: envMap,
      envMapIntensity: 0.3,
    });

    alternativeMaterial = new THREE.MeshStandardMaterial({
      color: 0x00000,
      // wireframe: true,
      roughness: 0.5,
      transparent: true,
      opacity: 1,
    });
  });

  // Load model
  const loader = new GLTFLoader(loadingManager);
  loader.load("mesh/man3.glb", (gltf) => {
    camera = gltf.cameras[0];
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    gltf.scene.traverse((child) => {
      if (child.name.includes("statue_")) {
        statuemesh = child;
        statuemesh.material = material;
      }
      if (child.name.includes("line_") || child.name.includes("inside_")) {
        child.visible = false;
      }
    });

    scene.add(gltf.scene);

    if (gltf.animations && gltf.animations.length > 0) {
      animations = gltf.animations;
      mixer = new THREE.AnimationMixer(gltf.scene);

      for (let i = 0; i < animations.length; i++) {
        const action = mixer.clipAction(animations[i]);
        action.timeScale = 1;
        action.setLoop(THREE.LoopOnce);
        action.clampWhenFinished = true;
        action.play();
        animationActions.push(action);
      }

      createAnimationController(mixer, animationActions, animations);

      lineHandler = new useLineHandler(config);
      lineHandler.createCurvesFromEdgeModel(gltf.scene).forEach((curve) => {
        curve.renderOrder = -1;
        scene.add(curve);
      });
    }
  });
});

function createAnimationController(mixer, actions, clips) {
  let proxy = {
    get time() {
      return mixer.time;
    },
    set time(value) {
      actions.forEach((action) => {
        action.paused = false;
      });
      mixer.setTime(value);
      actions.forEach((action) => {
        action.paused = true;
      });
    },
  };

  proxy.time = 0;
  const maxDuration = Math.max(...clips.map((clip) => clip.duration));

  scrollTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: function (self) {
        proxy.time = self.progress * maxDuration;
      },
    },
  });

  window.scrollTo(0, 0);
}

function createDOFScrollAnimation() {
  const dofProxy = { focus: dofFocusPoints[0].focus };

  dofTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
    },
  });

  dofTimeline.to(dofProxy, {
    focus: dofFocusPoints[1].focus,
    duration: 0.5,
    ease: "none",
    onUpdate: function () {
      updateDOFFocus(dofProxy.focus);
    },
  });

  dofTimeline.to(dofProxy, {
    focus: dofFocusPoints[2].focus,
    duration: 0.5,
    ease: "none",
    onUpdate: function () {
      updateDOFFocus(dofProxy.focus);
    },
  });

  return dofTimeline;
}

function updateDOFFocus(focusValue) {
  if (bokehPass) {
    config.dof.focus = focusValue;
    bokehPass.uniforms["focus"].value = focusValue;
  }
}

function toggleFinalMode(isFinal) {
  config.final = isFinal;

  // Update all statue parts materials
  scene.traverse((child) => {
    if (
      child.name &&
      (child.name.includes("statue_") || child.name.includes("_part"))
    ) {
      if (child.material) {
        child.material = isFinal ? material : alternativeMaterial;
      }
    }
  });

  // Toggle lights based on final mode
  if (rightlight) {
    rightlight.visible = isFinal;
  }
  if (leftlight) {
    leftlight.visible = isFinal;
  }
  if (cursorLight) {
    cursorLight.visible = isFinal;
  }

  // Change both far cursor lights color and depth based on final mode
  if (cursorLightFar) {
    cursorLightFar.color.setHex(
      isFinal
        ? config.cursorLightFar.finalColor
        : config.cursorLightFar.nonFinalColor
    );
    // Update the config depth for the updateCursorLightPosition function
    config.cursorLightFar.depth = isFinal
      ? config.cursorLightFar.finalDepth
      : config.cursorLightFar.nonFinalDepth;
  }

  if (cursorLightFar2) {
    cursorLightFar2.color.setHex(
      isFinal
        ? config.cursorLightFar.finalColor
        : config.cursorLightFar.nonFinalColor
    );
  }

  // Update bloom settings based on final mode
  if (bloomPass) {
    bloomPass.strength = isFinal
      ? config.bloom.finalStrength
      : config.bloom.nonFinalStrength;
    bloomPass.radius = isFinal
      ? config.bloom.finalRadius
      : config.bloom.nonFinalRadius;
  }

  if (isFinal) {
    if (scrollTimeline && scrollTimeline.scrollTrigger)
      scrollTimeline.scrollTrigger.enable();
    if (dofTimeline && dofTimeline.scrollTrigger)
      dofTimeline.scrollTrigger.enable();
  } else {
    if (scrollTimeline && scrollTimeline.scrollTrigger)
      scrollTimeline.scrollTrigger.disable();
    if (dofTimeline && dofTimeline.scrollTrigger)
      dofTimeline.scrollTrigger.disable();
  }

  ScrollTrigger.refresh();
}

function onMouseMove(event) {
  lastMouse.x = mouse.x;
  lastMouse.y = mouse.y;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  let deltaX = mouse.x - lastMouse.x;
  let deltaY = mouse.y - lastMouse.y;

  if (Math.abs(deltaX) > 0.004 || Math.abs(deltaY) > 0.004) {
    rotationOffset.x = Math.max(
      -0.5,
      Math.min(0.5, rotationOffset.x - deltaY * mouseMoveFactor.value)
    );
    rotationOffset.y = Math.max(
      -0.5,
      Math.min(0.5, rotationOffset.y - deltaX * mouseMoveFactor.value)
    );

    clearTimeout(mouseTimeout);
    isMouseMoving = true;

    mouseTimeout = setTimeout(() => {
      isMouseMoving = false;
    }, 100);
  }

  updateCursorLightPosition(event);
}

function updateCursorLightPosition(event) {
  if (!camera) return;

  const mouse3D = new THREE.Vector3(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1,
    0.5
  );

  mouse3D.unproject(camera);
  const direction = mouse3D.sub(camera.position).normalize();

  if (cursorLight && config.cursorLight.enabled) {
    const targetPosition = camera.position
      .clone()
      .add(direction.clone().multiplyScalar(config.cursorLight.depth));
    cursorLight.position.lerp(targetPosition, config.cursorLight.smoothing);
  }

  if (cursorLightFar && config.cursorLightFar.enabled) {
    const targetPositionFar = camera.position
      .clone()
      .add(direction.clone().multiplyScalar(config.cursorLightFar.depth));
    // Apply X offset to the first far light
    targetPositionFar.x += config.cursorLightFar.xOffset;
    cursorLightFar.position.lerp(
      targetPositionFar,
      config.cursorLightFar.smoothing
    );
  }

  if (cursorLightFar2 && config.cursorLightFar.enabled) {
    const targetPositionFar2 = camera.position
      .clone()
      .add(direction.clone().multiplyScalar(config.cursorLightFar.depth));
    // Apply negative X offset to the second far light
    targetPositionFar2.x -= config.cursorLightFar.xOffset;
    cursorLightFar2.position.lerp(
      targetPositionFar2,
      config.cursorLightFar.smoothing
    );
  }
}

function createCursorLights() {
  cursorLight = new THREE.PointLight(
    config.cursorLight.color,
    config.cursorLight.intensity,
    config.cursorLight.distance,
    config.cursorLight.decay
  );
  cursorLight.position.set(0, 0, config.cursorLight.depth);
  scene.add(cursorLight);

  // First far cursor light
  cursorLightFar = new THREE.PointLight(
    config.cursorLightFar.color,
    config.cursorLightFar.intensity,
    config.cursorLightFar.distance,
    config.cursorLightFar.decay
  );

  // Initialize far light behind the camera instead of in front
  if (camera) {
    // Get camera's forward direction
    const cameraForward = new THREE.Vector3(0, 0, -1);
    cameraForward.transformDirection(camera.matrixWorld);

    // Position behind the camera with X offset
    const initialPosition = camera.position
      .clone()
      .add(
        cameraForward.clone().multiplyScalar(-config.cursorLightFar.finalDepth)
      );
    initialPosition.x += config.cursorLightFar.xOffset;
    cursorLightFar.position.copy(initialPosition);
  } else {
    // Fallback if camera isn't ready yet - position behind origin with X offset
    cursorLightFar.position.set(
      config.cursorLightFar.xOffset,
      0,
      -config.cursorLightFar.finalDepth
    );
  }

  scene.add(cursorLightFar);

  // Second far cursor light (duplicate)
  cursorLightFar2 = new THREE.PointLight(
    config.cursorLightFar.color,
    config.cursorLightFar.intensity,
    config.cursorLightFar.distance,
    config.cursorLightFar.decay
  );

  // Initialize second far light behind the camera with negative X offset
  if (camera) {
    // Get camera's forward direction
    const cameraForward = new THREE.Vector3(0, 0, -1);
    cameraForward.transformDirection(camera.matrixWorld);

    // Position behind the camera with negative X offset
    const initialPosition2 = camera.position
      .clone()
      .add(
        cameraForward.clone().multiplyScalar(-config.cursorLightFar.finalDepth)
      );
    initialPosition2.x -= config.cursorLightFar.xOffset;
    cursorLightFar2.position.copy(initialPosition2);
  } else {
    // Fallback if camera isn't ready yet - position behind origin with negative X offset
    cursorLightFar2.position.set(
      -config.cursorLightFar.xOffset,
      0,
      -config.cursorLightFar.finalDepth
    );
  }

  scene.add(cursorLightFar2);

  // Create helpers for both far lights
  cursorLightFarHelper = new THREE.PointLightHelper(cursorLightFar, 0.5);
  // scene.add(cursorLightFarHelper);

  cursorLightFarHelper2 = new THREE.PointLightHelper(cursorLightFar2, 0.5);
  // scene.add(cursorLightFarHelper2);
}

function initStatueGroup() {
  statueGroup = new THREE.Group();
  const objectsToGroup = [];

  scene.traverse((child) => {
    if (
      child.name &&
      (child.name.includes("statue_") || child.name.includes("_part"))
    ) {
      objectsToGroup.push(child);
    }
  });

  objectsToGroup.forEach((child) => {
    const worldPosition = new THREE.Vector3();
    const worldQuaternion = new THREE.Quaternion();
    const worldScale = new THREE.Vector3();

    child.getWorldPosition(worldPosition);
    child.getWorldQuaternion(worldQuaternion);
    child.getWorldScale(worldScale);

    if (child.parent) child.parent.remove(child);
    else scene.remove(child);

    statueGroup.add(child);

    child.position.copy(worldPosition);
    child.quaternion.copy(worldQuaternion);
    child.scale.copy(worldScale);
  });

  if (lineHandler && lineHandler.getLineCurves) {
    const lineCurves = lineHandler.getLineCurves();
    lineCurves.forEach((curve) => {
      const worldPosition = new THREE.Vector3();
      const worldQuaternion = new THREE.Quaternion();
      const worldScale = new THREE.Vector3();

      curve.getWorldPosition(worldPosition);
      curve.getWorldQuaternion(worldQuaternion);
      curve.getWorldScale(worldScale);

      if (curve.parent) curve.parent.remove(curve);
      else scene.remove(curve);

      statueGroup.add(curve);

      curve.position.copy(worldPosition);
      curve.quaternion.copy(worldQuaternion);
      curve.scale.copy(worldScale);
    });
  }

  scene.add(statueGroup);

  statueGroup.userData.originalPosition = statueGroup.position.clone();
  statueGroup.userData.originalRotation = new THREE.Vector3(
    statueGroup.rotation.x,
    statueGroup.rotation.y,
    statueGroup.rotation.z
  );

  mouse.set(0, 0);
  lastMouse.set(0, 0);
  rotationOffset.set(0, 0);

  window.addEventListener("mousemove", onMouseMove, false);
}

function init() {
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: document.querySelector("#canvas"),
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.5;
  renderer.outputEncoding = THREE.sRGBEncoding;

  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);

  bokehPass = new BokehPass(scene, camera, {
    focus: config.dof.focus,
    aperture: config.dof.aperture,
    maxblur: config.dof.maxblur,
    width: window.innerWidth,
    height: window.innerHeight,
  });
  bokehPass.enabled = config.dof.enabled;

  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    config.bloom.finalStrength,
    config.bloom.finalRadius,
    config.bloom.threshold
  );

  const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);

  const brightnessCompensationPass = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, brightness: { value: 1.5 } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float brightness;
      varying vec2 vUv;
      void main() {
        vec4 color = texture2D(tDiffuse, vUv);
        gl_FragColor = vec4(color.rgb * brightness, color.a);
      }
    `,
  });

  composer.addPass(renderPass);
  composer.addPass(bokehPass);
  composer.addPass(bloomPass);
  composer.addPass(brightnessCompensationPass);
  composer.addPass(gammaCorrectionPass);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = config.orbitControls.enableDamping;
  controls.dampingFactor = config.orbitControls.dampingFactor;
  controls.enabled = config.orbitControls.enabled;

  // Store light references for later visibility control
  rightlight = new THREE.PointLight(
    config.rightlightColor,
    config.rightlightIntensity
  );
  rightlight.position.set(-10, 0, 0);
  scene.add(rightlight);

  leftlight = new THREE.PointLight(
    config.lefttlightColor,
    config.leftlightIntensity
  );
  leftlight.position.set(10, 0, 0);
  scene.add(leftlight);

  window.addEventListener("resize", onWindowResize);

  if (camera) camera.userData.defaultPosition = camera.position.clone();

  createCursorLights();
  useGui(config, toggleFinalMode);
  dustParticles = new useDustParticles(scene, config.dustParticles);
  createDOFScrollAnimation();

  // Apply initial lighting state based on config.final
  toggleFinalMode(config.final);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);

  if (bokehPass) {
    if (
      bokehPass.renderTargetDepth &&
      typeof bokehPass.renderTargetDepth.setSize === "function"
    ) {
      bokehPass.renderTargetDepth.setSize(
        window.innerWidth,
        window.innerHeight
      );
    }
  }

  if (dustParticles) {
    const aspectRatio = window.innerWidth / window.innerHeight;
    dustParticles.updateSettings({
      area: { width: 15 * aspectRatio, height: 15, depth: 15 * aspectRatio },
    });
  }
}

function animate() {
  const delta = clock.getDelta();
  requestAnimationFrame(animate);

  if (!isMouseMoving) {
    rotationOffset.x += (0 - rotationOffset.x) * returnFactor.value;
    rotationOffset.y += (0 - rotationOffset.y) * returnFactor.value;
  }

  if (statueGroup) {
    statueGroup.rotation.x =
      statueGroup.userData.originalRotation.x + rotationOffset.x;
    statueGroup.rotation.y =
      statueGroup.userData.originalRotation.y + rotationOffset.y;
  }

  if (controls.enabled) controls.update();
  if (lineHandler) lineHandler.animate(delta);
  if (dustParticles) dustParticles.animate(delta);

  // Update light helpers to follow their respective lights
  if (cursorLightFarHelper && cursorLightFar) {
    cursorLightFarHelper.update();
  }
  if (cursorLightFarHelper2 && cursorLightFar2) {
    cursorLightFarHelper2.update();
  }

  composer.render();
}
</script>

<style lang="scss" scoped>
.home-page {
  width: 100%;
  min-height: 500vh;

  #canvas {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
  }
}
</style>
