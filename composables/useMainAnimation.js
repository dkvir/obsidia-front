import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
import { GammaCorrectionShader } from "three/examples/jsm/shaders/GammaCorrectionShader.js";
import { FilmPass } from "three/examples/jsm/postprocessing/FilmPass.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ref } from "vue";

export function useThreeScene(canvasId) {
  let canvas, scene, renderer, camera, envMap, material;
  let composer, bloomPass, bokehPass;
  let mixer, animations, animationActions = [];
  let clock = new THREE.Clock();
  let vertexDustSystems;
  let gradientBackground;
  let modelGroup;

  const FPS_LIMIT = 24;
  const FRAME_TIME = 1000 / FPS_LIMIT;
  let lastFrameTime = 0;

  let activeTextIndex = ref(0);
  
  const config = {
    bloom: { strength: 0.1, radius: 0.1, threshold: 0.2 },
    dof: { enabled: true, focus: 3.3, aperture: 0.01, maxblur: 0.005 },
  };

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  function setupSequentialLoading() {
    loadEnvironment()
      .then(() => loadModel())
      .then(() => {
        init();
        animate();
      })
      .catch((error) => console.error("Loading sequence failed:", error));
  }

  function loadEnvironment() {
    return new Promise((resolve, reject) => {
      const hdriLoader = new RGBELoader();

      hdriLoader.load(
        "images/03.hdr",
        function (texture) {
          envMap = texture;
          envMap.mapping = THREE.EquirectangularReflectionMapping;
          scene.environment = envMap;

          material = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transmission: 1.0,
            thickness: 0.8,
            transparent: true,
            ior: 1.7,
            roughness: 0.0,
            side: THREE.DoubleSide,
            envMap: envMap,
            dispersion: 5,
          });

          resolve(texture);
        },
        undefined,
        (error) =>
          console.warn(
            "HDRI loading failed, using fallback environment:",
            error
          )
      );
    });
  }

  function loadModel() {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();

      loader.load(
        "mesh/obsidian.glb",
        (gltf) => {
          if (gltf.cameras && gltf.cameras.length > 0) {
            camera = gltf.cameras[0];
            if (!canvas) canvas = document.querySelector(canvasId);
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
          }

          gltf.scene.traverse((child) => {
            if (child.name.includes("crystal_") && material && child.isMesh) {
              child.material = material;
              child.visible = true;
            }
          });

          modelGroup = new THREE.Group();
          modelGroup.add(gltf.scene);
          scene.add(modelGroup);

          vertexDustSystems = createVertexDustFromScene(scene);

          if (gltf.animations && gltf.animations.length > 0) {
            animations = gltf.animations;
            mixer = new THREE.AnimationMixer(gltf.scene);

            animations.forEach((animation) => {
              const action = mixer.clipAction(animation);
              action.timeScale = 1;
              action.setLoop(THREE.LoopOnce);
              action.clampWhenFinished = true;
              action.play();
              animationActions.push(action);
            });

            createAnimationController(mixer, animationActions, animations);
            window.scrollTo(0, 0);
          }

          resolve(gltf);
        },
        undefined,
        (error) => {
          console.warn("GLTF model loading failed:", error);
          reject(error);
        }
      );
    });
  }

  function createAnimationController(mixer, actions, clips) {
    gsap.registerPlugin(ScrollTrigger);

    ScrollTrigger.config({
      limitCallbacks: true,
      ignoreMobileResize: true,
    });

    let proxy = {
      get time() {
        return mixer.time;
      },
      set time(value) {
        actions.forEach((action) => action.paused = false);
        mixer.setTime(value);
        actions.forEach((action) => action.paused = true);
      },
    };

    proxy.time = 0;
    const maxDuration = Math.max(...clips.map((clip) => clip.duration));

    gsap.timeline({
      scrollTrigger: {
        trigger: ".home-page",
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        invalidateOnRefresh: false,
        onUpdate: function (self) {
          proxy.time = self.progress * maxDuration;
        },
      },
    });
  }

  function init() {
    if (!canvas) canvas = document.querySelector(canvasId);

    if (canvas.clientWidth <= 0 || canvas.clientHeight <= 0) {
      console.warn("Canvas has invalid dimensions, waiting...");
      setTimeout(() => init(), 100);
      return;
    }

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: canvas,
      powerPreference: "high-performance",
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.shadowMap.enabled = false;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputEncoding = THREE.sRGBEncoding;

    gradientBackground = useGradientBackground();
    gradientBackground.create(scene, camera, {
      bottomColor: 0x000000,
      topColor: 0x070211,
    });

    gradientBackground.setupScrollAnimation({
      trigger: ".home-page",
      start: "30% top",
      end: "60% top",
      startColor: 0x000000,
      endColor: 0x000000,
    });

    const postProcessWidth = Math.max(1, Math.floor(canvas.clientWidth * 0.5));
    const postProcessHeight = Math.max(1, Math.floor(canvas.clientHeight * 0.5));

    composer = new EffectComposer(renderer);
    composer.setSize(postProcessWidth, postProcessHeight);

    const renderPass = new RenderPass(scene, camera);

    if (config.dof.enabled) {
      bokehPass = new BokehPass(scene, camera, {
        focus: config.dof.focus,
        aperture: config.dof.aperture,
        maxblur: config.dof.maxblur,
        width: postProcessWidth,
        height: postProcessHeight,
      });

      ScrollTrigger.create({
        trigger: ".home-page",
        start: "top top",
        end: "12% top",
        scrub: 1,
        onUpdate: function (self) {
          bokehPass.uniforms["focus"].value = gsap.utils.interpolate(1, 0.705, self.progress);
        },
      });

      ScrollTrigger.create({
        trigger: ".home-page",
        start: "12% top",
        end: "30% top",
        scrub: 1,
        onUpdate: function (self) {
          bokehPass.uniforms["focus"].value = gsap.utils.interpolate(0.705, 2, self.progress);
        },
      });
    }

    bloomPass = new UnrealBloomPass(
      new THREE.Vector2(postProcessWidth, postProcessHeight),
      config.bloom.strength,
      config.bloom.radius,
      config.bloom.threshold
    );

    const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);

    const brightnessCompensationPass = new ShaderPass({
      uniforms: { tDiffuse: { value: null }, brightness: { value: 0.65 } },
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
    composer.addPass(bloomPass);

    if (bokehPass && config.dof.enabled) {
      composer.addPass(bokehPass);
    }

    composer.addPass(brightnessCompensationPass);
    composer.addPass(new FilmPass(0.8, 0.325, 256, false));
    composer.addPass(gammaCorrectionPass);

    window.addEventListener("resize", onWindowResize);

    if (camera) camera.userData.defaultPosition = camera.position.clone();
  }

  function onWindowResize() {
    if (!camera || !renderer || !composer || useDevice().isMobileOrTablet) return;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  }

  function animate(currentTime) {
    requestAnimationFrame(animate);

    if (currentTime - lastFrameTime < FRAME_TIME) return;

    lastFrameTime = currentTime - ((currentTime - lastFrameTime) % FRAME_TIME);

    const delta = Math.min(clock.getDelta(), FRAME_TIME / 1000);

    if (gradientBackground) gradientBackground.animate(delta);
    if (mixer) mixer.update(delta);

    if (vertexDustSystems && vertexDustSystems.length > 0) {
      vertexDustSystems.forEach((dustSystem) => {
        if (dustSystem.animate) dustSystem.animate(delta);
      });
    }

    composer.render();
  }

  function cleanup() {
    window.removeEventListener("resize", onWindowResize);

    if (gradientBackground) gradientBackground.dispose();
    if (renderer) renderer.dispose();
    if (envMap) envMap.dispose();
    if (material) material.dispose();

    scene.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => mat.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }

  return {
    setupSequentialLoading,
    activeTextIndex,
    cleanup,
  };
}