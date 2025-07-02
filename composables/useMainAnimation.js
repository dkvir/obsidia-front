import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { GammaCorrectionShader } from "three/examples/jsm/shaders/GammaCorrectionShader.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ref } from "vue";

export function useThreeScene(canvasId) {
  // Three.js variables
  let canvas, scene, renderer, camera, statuemesh, envMap, material;
  let composer, bloomPass;
  let mixer,
    animations,
    animationActions = [];
  let lineHandler, dustParticles;
  let clock = new THREE.Clock();
  let rightlight, leftlight;
  let statueGroup;
  let cursorLightsHandler;

  // Mouse rotation variables (separate from cursor lights)
  let mouse = new THREE.Vector2();
  let lastMouse = new THREE.Vector2();
  let rotationOffset = new THREE.Vector2();
  let mouseMoveFactor = { value: 0.05 };
  let returnFactor = { value: 0.01 };
  let isMouseMoving = false;
  let mouseTimeout;

  let cloudShaderHandler;
  let cloudShaderHandler2;
  let cloudShaderHandler3;

  let activeTextIndex = ref(0);
  const cameraAnimationOptions = [
    {
      trigger: ".home-page .stop-0",
      startDuration: 0,
      maxDuration: 4,
    },
    {
      trigger: ".home-page .stop-1",
      startDuration: 4,
      maxDuration: 8,
    },
    {
      trigger: ".home-page .stop-2",
      startDuration: 8,
      maxDuration: 12,
    },
    {
      trigger: ".stop-3",
      startDuration: 12,
      maxDuration: 16,
    },
    {
      trigger: ".stop-4",
      startDuration: 16,
      maxDuration: 20,
    },
    {
      trigger: ".stop-5",
      startDuration: 20,
      maxDuration: 24.16666603088379,
    },
  ];

  // Configuration
  const config = {
    // Lighting
    rightlightIntensity: 10,
    rightlightColor: 0xff0000,
    leftlightIntensity: 20,
    lefttlightColor: 0x0000ff,

    // Bloom settings
    bloom: {
      strength: 0.2,
      radius: 2.0,
      threshold: 0.01,
    },

    // Cursor lights configuration
    cursorLight: {
      enabled: true,
      color: new THREE.Color(0xfcd2d8),
      intensity: 1,
      distance: 10,
      decay: 1,
      depth: 1,
      smoothing: 0.5,
    },
    cursorLightFar: {
      enabled: true,
      color: 0xc337ff,
      intensity: 0.8,
      distance: 20,
      decay: 0.5,
      depth: 10,
      smoothing: 0.1,
      xOffset: 0.2,
    },

    cloudShaders: {
      one: {
        size: { width: 20, height: 10 },
        position: { x: 0.0, y: -5.0, z: -10.0 },
        rotation: { x: 0, y: 0, z: 0 },
        timeSpeed: 1.2,
      },
      two: {
        size: { width: 5, height: 3 },
        position: { x: 0.0, y: -0.9, z: 1.0 },
        rotation: { x: 0, y: 0, z: 0 },
        timeSpeed: 0.7,
      },
      three: {
        size: { width: 1, height: 3 },
        position: { x: 2.0, y: -1.5, z: -12.0 },
        rotation: { x: 0, y: 0, z: 0 },
        timeSpeed: 0.9,
      },
    },

    // Other settings
    lineWidth: 6,
    opacity: 1,
    bezierCurveAmount: 0.5,
    dustParticles: {
      count: 500,
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
    insideLineWidth: 0.7,
    insideLineOpacity: 1,
  };

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  // Sequential loading: HDRI first, then model
  function setupSequentialLoading() {
    // First load HDRI
    loadEnvironment()
      .then(() => {
        return loadModel();
      })
      .then(() => {
        init();
        initStatueGroup();
        animate();
        // Create cloud shader handler
        cloudShaderHandler = new useCloudShader(config.cloudShaders.one);
        // Create cloud shader handler
        cloudShaderHandler2 = new useCloudShader(config.cloudShaders.two);
        // Create cloud shader handler
        cloudShaderHandler3 = new useCloudShader(config.cloudShaders.three);

        // Initialize with configuration
        cloudShaderHandler.init(scene);
        cloudShaderHandler2.init(scene);
        // cloudShaderHandler3.init(scene);

        // useGui(
        //   config,
        //   cursorLightsHandler?.getLights().cursorLightFar,
        //   cursorLightsHandler?.getLights().cursorLightFar2
        // );
      })
      .catch((error) => {
        console.error("Loading sequence failed:", error);
      });
  }

  // Load environment with Promise
  function loadEnvironment() {
    return new Promise((resolve, reject) => {
      const hdriLoader = new RGBELoader();

      hdriLoader.load(
        "images/03.hdr",
        function (texture) {
          envMap = texture;
          envMap.mapping = THREE.EquirectangularReflectionMapping;
          scene.environment = envMap;

          const normal = new THREE.TextureLoader().load("./images/normal.jpg");

          material = new THREE.MeshPhysicalMaterial({
            color: 0x000000,
            normalMap: normal,
            metalness: 0.1,
            roughness: 0.5,
            thickness: 0.5,
            side: THREE.DoubleSide,
            envMap: envMap,
            envMapIntensity: 0.5,
            // transmission: 0.1,
            // transparent: true,
            // opacity: 0.5,
            // depthWrite: false,
            // depthTest: true,
            // alphaTest: 0.001,
          });

          resolve(texture);
        },
        undefined,
        function (error) {
          console.warn(
            "HDRI loading failed, using fallback environment:",
            error
          );
        }
      );
    });
  }

  // Load 3D model with Promise
  function loadModel() {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();

      loader.load(
        "mesh/man3.glb",
        (gltf) => {
          // Use camera from model if available
          if (gltf.cameras && gltf.cameras.length > 0) {
            camera = gltf.cameras[0];
            if (!canvas) canvas = document.querySelector(canvasId);
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
          }

          gltf.scene.traverse((child) => {
            if (child.name.includes("statue_")) {
              if (material && child.isMesh) {
                child.material = material;
              }
            }

            if (
              child.name.includes("line_") ||
              child.name.includes("inside_")
            ) {
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

            gsap.registerPlugin(ScrollTrigger);

            ScrollTrigger.config({
              limitCallbacks: true,
              ignoreMobileResize: true,
            });

            cameraAnimationOptions.forEach((item, index) => {
              createAnimationController(mixer, animationActions, item, index);
            });

            window.scrollTo(0, 0);

            lineHandler = new useLineHandler(config);
            lineHandler
              .createCurvesFromEdgeModel(gltf.scene)
              .forEach((curve) => {
                curve.renderOrder = -1;
                scene.add(curve);
              });
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

  // Animation controller
  function createAnimationController(mixer, actions, item, index) {
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

    const scrollTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: item.trigger,
        start: "top top",
        end: "bottom top",
        scrub: true,
        invalidateOnRefresh: false,
        markers: true,
        onEnter: () => {
          activeTextIndex.value = null;
        },
        onLeave: () => {
          activeTextIndex.value = index;
        },
        onEnterBack: () => {
          activeTextIndex.value = null;
        },
        onLeaveBack: () => {
          activeTextIndex.value = index;
        },
        onUpdate: function (self) {
          proxy.time =
            item.startDuration +
            self.progress * (item.maxDuration - item.startDuration);
        },
      },
    });
  }

  // Mouse event handlers
  function onMouseMove(event) {
    lastMouse.x = mouse.x;
    lastMouse.y = mouse.y;

    mouse.x = (event.clientX / canvas.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / canvas.clientHeight) * 2 + 1;

    let deltaX = mouse.x - lastMouse.x;
    let deltaY = mouse.y - lastMouse.y;

    // Handle statue rotation
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

    // Update cursor lights
    if (cursorLightsHandler) {
      cursorLightsHandler.updateCursorLightPosition(event, config);
    }
  }

  // Initialize statue group
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

  // Initialize renderer and effects
  function init() {
    if (!canvas) canvas = document.querySelector(canvasId);

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: canvas,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 2.0;
    renderer.outputEncoding = THREE.sRGBEncoding;

    composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);

    bloomPass = new UnrealBloomPass(
      new THREE.Vector2(canvas.clientWidth, canvas.clientHeight),
      config.bloom.strength,
      config.bloom.radius,
      config.bloom.threshold
    );

    const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);

    const brightnessCompensationPass = new ShaderPass({
      uniforms: { tDiffuse: { value: null }, brightness: { value: 2.5 } },
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
    composer.addPass(brightnessCompensationPass);
    composer.addPass(gammaCorrectionPass);

    rightlight = new THREE.PointLight(
      config.rightlightColor,
      config.rightlightIntensity
    );
    rightlight.position.set(-8, 0, 0);
    scene.add(rightlight);

    leftlight = new THREE.PointLight(
      config.lefttlightColor,
      config.leftlightIntensity
    );
    leftlight.position.set(8, 0, 0);
    scene.add(leftlight);

    window.addEventListener("resize", onWindowResize);

    if (camera) camera.userData.defaultPosition = camera.position.clone();

    // Initialize cursor lights using the composable
    cursorLightsHandler = useCursorLights(scene, camera);
    cursorLightsHandler.createCursorLights(config);

    // Only create dust particles if the class exists
    if (typeof useDustParticles === "function") {
      dustParticles = new useDustParticles(scene, config.dustParticles);
    }
  }

  // Window resize handler
  function onWindowResize() {
    if (!camera || !renderer || !composer || useDevice().isMobileOrTablet)
      return;

    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    composer.setSize(canvas.clientWidth, canvas.clientHeight);

    if (dustParticles && dustParticles.updateSettings) {
      const aspectRatio = canvas.clientWidth / canvas.clientHeight;
      dustParticles.updateSettings({
        area: { width: 15 * aspectRatio, height: 15, depth: 15 * aspectRatio },
      });
    }
  }

  // Animation loop
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

    if (mixer) {
      mixer.update(delta);
    }

    if (lineHandler && lineHandler.animate) {
      lineHandler.animate(delta);
    }

    if (dustParticles && dustParticles.animate) {
      dustParticles.animate(delta);
    }

    if (cloudShaderHandler) {
      cloudShaderHandler.update(delta);
      cloudShaderHandler2.update(delta);
      // cloudShaderHandler3.update(delta);
    }

    composer.render();
  }

  return {
    setupSequentialLoading,
    activeTextIndex,
  };
}
