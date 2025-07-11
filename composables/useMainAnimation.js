import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
import { GammaCorrectionShader } from "three/examples/jsm/shaders/GammaCorrectionShader.js";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ref } from "vue";

export function useThreeScene(canvasId) {
  // Three.js variables
  let canvas, scene, renderer, camera, statuemesh, envMap, material;
  let composer, bloomPass, bokehPass;
  let mixer,
    animations,
    animationActions = [];
  let lineHandler, dustParticles;
  let clock = new THREE.Clock();
  let rightlight, leftlight;
  let statueGroup;
  let cursorLightsHandler;
  let envlineHandler;
  let gui,
    dofControllers = {};

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
      dof: {
        focus: {
          start: 5,
          middle: 3.5,
          end: 1.8,
        },
        aperture: { start: 0.0, middle: 0.0067, end: 0.006 },
      },
    },
    {
      trigger: ".home-page .stop-1",
      startDuration: 4,
      maxDuration: 8,
      dof: {
        focus: { start: 1.8, middle: 1.4, end: 1 },
        aperture: { start: 0.006, middle: 0.016, end: 0.0054 },
      },
    },
    {
      trigger: ".home-page .stop-2",
      startDuration: 8,
      maxDuration: 12,
      dof: {
        focus: { start: 1, middle: 1.05, end: 1.1 },
        aperture: { start: 0.0054, middle: 0.0116, end: 0.0153 },
      },
    },
    {
      trigger: ".stop-3",
      startDuration: 12,
      maxDuration: 16,
      dof: {
        focus: { start: 1.1, middle: 0.7, end: 0.1 },
        aperture: { start: 0, middle: 0, end: 0 },
      },
    },
    {
      trigger: ".stop-4",
      startDuration: 16,
      maxDuration: 20,
      dof: {
        focus: { start: 0.1, middle: 0.2, end: 0.2 },
        aperture: { start: 0, middle: 0, end: 0 },
      },
    },
    {
      trigger: ".stop-5",
      startDuration: 20,
      maxDuration: 24.16666603088379,
      dof: {
        focus: { start: 0.2, middle: 2.5, end: 5.5 },
        aperture: { start: 0, middle: 0.0012, end: 0 },
      },
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
      strength: 0.3,
      radius: 0.45,
      threshold: 0.02,
    },

    // Depth of Field settings
    dof: {
      enabled: false,
      focus: 5, // Starting with stop-0 value
      aperture: 0.006, // Starting with stop-0 value
      maxblur: 0.01, // Maximum blur amount
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
      depth: 1,
      smoothing: 0.1,
      xOffset: 1,
    },

    cloudShaders: {
      one: {
        size: { width: 20, height: 10 },
        position: { x: 0.0, y: -3.0, z: -10.0 },
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
    opacity: 0.8,
    bezierCurveAmount: 0.5,
    dustParticles: {
      count: 50,
      size: { min: 0.01, max: 0.06 },
      area: { width: 5, height: 2, depth: 15 },
      opacity: 0.1,
      speed: { min: 0.0001, max: 0.0004 },
      color: {
        hue: { min: 200, max: 300 },
        saturation: { min: 90, max: 100 },
        lightness: { min: 70, max: 100 },
      },
    },
    insideLineWidth: 0.7,
    insideLineOpacity: 1,
  };

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070211);

  // Function to setup scroll-based trim offset
  function setupScrollTrimOffset(envlineHandler) {
    const segmentSize = 0.2; // 20% of the line visible at a time
    
    console.log("Setting up scroll trim offset");
    
    ScrollTrigger.create({
      trigger: ".home-page",
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      markers: false, // Set to true to debug scroll positions
      onUpdate: (self) => {
        const progress = self.progress;
        
        // Calculate offset position
        // At progress 0: show 0-20%
        // At progress 0.5: show 40-60%
        // At progress 1: show 80-100%

        const maxOffset = 1 - segmentSize; // 0.8
        const offset = progress * maxOffset;
        
        const trimStart = offset;
        const trimEnd = offset + segmentSize;
        
        // Debug log
        // console.log(`Scroll progress: ${progress.toFixed(2)}, Trim: ${trimStart.toFixed(2)} - ${trimEnd.toFixed(2)}`);
        
        envlineHandler.setTrim(trimStart, trimEnd);
      }
    });
  }

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
        // setupGUI();
        // Create cloud shader handler
        // cloudShaderHandler = new useCloudShader(config.cloudShaders.one);
        // // Create cloud shader handler
        // cloudShaderHandler2 = new useCloudShader(config.cloudShaders.two);
        // // Create cloud shader handler
        // cloudShaderHandler3 = new useCloudShader(config.cloudShaders.three);

        // Initialize with configuration
        // cloudShaderHandler.init(scene);
        // cloudShaderHandler2.init(scene);
        // cloudShaderHandler3.init(scene);
      })
      .catch((error) => {
        console.error("Loading sequence failed:", error);
      });
  }

  // Update GUI controllers to reflect current values
  function updateGUIControllers() {
    if (dofControllers.focus) dofControllers.focus.updateDisplay();
    if (dofControllers.aperture) dofControllers.aperture.updateDisplay();
    if (dofControllers.maxblur) dofControllers.maxblur.updateDisplay();
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

          const rough = new THREE.TextureLoader().load("./images/rough.jpg");

          const color = new THREE.TextureLoader().load("./images/color.jpg");

          // color.encoding = THREE.sRGBEncoding;

          material = new THREE.MeshPhysicalMaterial({
            map: color,
            normalMap: normal,
            roughnessMap: rough,
            // color: 0x000000,
            metalness: 0,
            // roughness: 0.5,
            // thickness: 0.5,
            // side: THREE.DoubleSide,
            // envMap: envMap,
            // envMapIntensity: 1.0,
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
                child.visible = true;
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

            gsap.registerPlugin(ScrollTrigger, SplitText);

            ScrollTrigger.config({
              limitCallbacks: true,
              ignoreMobileResize: true,
            });

            cameraAnimationOptions.forEach((item, index) => {
              createAnimationController(mixer, animationActions, item, index);
            });

            window.scrollTo(0, 0);

            lineHandler = new useLineHandler(config);
            
            // Create envlineHandler with trim configuration for scroll
            envlineHandler = new useEnvLineHandler({
              // lineWidth: 5,
              // opacity: 1,
              // startColor: new THREE.Color(0xc337ff),
              // endColor: new THREE.Color(0x722fdf),
              enableEnergyFlow: true,
              energyOnly: true, // Set to false to see the line color too
              
              // Trim configuration for scroll effect
              trimEnabled: true,
              trimStart: 0.0,    // Start with nothing visible
              trimEnd: 0.0,      // Start with nothing visible
              trimSpeed: 0,      // No auto animation (we control via scroll)
              trimLoop: false,   // No auto looping
              trimAnimating: false, // We'll update manually
              trimFadeWidth: 0.01, // Sharp edges for clean segments
            });

            lineHandler
              .createCurvesFromEdgeModel(gltf.scene)
              .forEach((curve) => {
                // curve.renderOrder = 1;
                scene.add(curve);
              });

            envlineHandler
              .createLinesFromGLBScene(gltf.scene)
              .forEach((line) => {
                // line.renderOrder = -1;
                scene.add(line);
              });

            // Add scroll-based trim control after creating lines
            setupScrollTrimOffset(envlineHandler);
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

    if (index == 0) {
      const split = new SplitText(".window .scroll-down", { type: "chars" });

      const tl = gsap.timeline({
        paused: true,
        scrollTrigger: {
          trigger: item.trigger,
          start: "top top",
          end: "bottom top",
          invalidateOnRefresh: false,
          toggleActions: "play none none reverse",
          onUpdate: function (self) {
            proxy.time =
              item.startDuration +
              self.progress * (item.maxDuration - item.startDuration);

            // Animate DOF values with start -> middle -> end progression
            if (bokehPass && config.dof.enabled) {
              let targetFocus, targetAperture;

              if (self.progress <= 0.5) {
                // First half: interpolate from start to middle
                const localProgress = self.progress * 2; // 0-1 for first half
                targetFocus = gsap.utils.interpolate(
                  item.dof.focus.start,
                  item.dof.focus.middle,
                  localProgress
                );
                targetAperture = gsap.utils.interpolate(
                  item.dof.aperture.start,
                  item.dof.aperture.middle,
                  localProgress
                );
              } else {
                // Second half: interpolate from middle to end
                const localProgress = (self.progress - 0.5) * 2; // 0-1 for second half
                targetFocus = gsap.utils.interpolate(
                  item.dof.focus.middle,
                  item.dof.focus.end,
                  localProgress
                );
                targetAperture = gsap.utils.interpolate(
                  item.dof.aperture.middle,
                  item.dof.aperture.end,
                  localProgress
                );
              }

              bokehPass.uniforms["focus"].value = targetFocus;
              bokehPass.uniforms["aperture"].value = targetAperture;

              // Update config for GUI
              config.dof.focus = targetFocus;
              config.dof.aperture = targetAperture;

              // Update GUI display
              if (gui) {
                updateGUIControllers();
              }
            }
          },
        },
      });

      split.chars.forEach((char, index) => {
        const yOffset =
          index % 2 === 0 ? -50 * Math.random() : 50 * Math.random();

        const xOffset = (Math.random() * 2 - 1) * 30;
        const rotateOffset = (Math.random() * 2 - 1) * 30;
        tl.to(
          char,
          {
            y: yOffset,
            x: xOffset,
            rotate: rotateOffset,
            ease: "power2.inOut",
            opacity: 0,
            duration: 0.9,
          },
          0
        );
      });
    } else {
      const scrollTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: item.trigger,
          start: "top top",
          end: "bottom top",
          scrub: true,
          invalidateOnRefresh: false,
          onUpdate: function (self) {
            proxy.time =
              item.startDuration +
              self.progress * (item.maxDuration - item.startDuration);

            // Animate DOF values with start -> middle -> end progression
            if (bokehPass && config.dof.enabled) {
              let targetFocus, targetAperture;

              if (self.progress <= 0.5) {
                // First half: interpolate from start to middle
                const localProgress = self.progress * 2; // 0-1 for first half
                targetFocus = gsap.utils.interpolate(
                  item.dof.focus.start,
                  item.dof.focus.middle,
                  localProgress
                );
                targetAperture = gsap.utils.interpolate(
                  item.dof.aperture.start,
                  item.dof.aperture.middle,
                  localProgress
                );
              } else {
                // Second half: interpolate from middle to end
                const localProgress = (self.progress - 0.5) * 2; // 0-1 for second half
                targetFocus = gsap.utils.interpolate(
                  item.dof.focus.middle,
                  item.dof.focus.end,
                  localProgress
                );
                targetAperture = gsap.utils.interpolate(
                  item.dof.aperture.middle,
                  item.dof.aperture.end,
                  localProgress
                );
              }

              bokehPass.uniforms["focus"].value = targetFocus;
              bokehPass.uniforms["aperture"].value = targetAperture;

              // Update config for GUI
              config.dof.focus = targetFocus;
              config.dof.aperture = targetAperture;

              // Update GUI display
              if (gui) {
                updateGUIControllers();
              }
            }
          },
        },
      });
    }
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
    renderer.shadowMap.enabled = false;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputEncoding = THREE.sRGBEncoding;

    composer = new EffectComposer(renderer);
    composer.setSize(canvas.clientWidth * 0.5, canvas.clientHeight * 0.5);
    
    const renderPass = new RenderPass(scene, camera);

    // Bokeh depth of field pass
    if (config.dof.enabled) {
      bokehPass = new BokehPass(scene, camera, {
        focus: config.dof.focus,
        aperture: config.dof.aperture,
        maxblur: config.dof.maxblur,
        width: canvas.clientWidth,
        height: canvas.clientHeight,
      });
    }

    bloomPass = new UnrealBloomPass(
      new THREE.Vector2(canvas.clientWidth, canvas.clientHeight),
      config.bloom.strength,
      config.bloom.radius,
      config.bloom.threshold
    );

    const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);

    const brightnessCompensationPass = new ShaderPass({
      uniforms: { tDiffuse: { value: null }, brightness: { value: 0.55 } },
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

    // Add passes in the correct order
    composer.addPass(renderPass);

    // Add DOF before bloom for better results
    if (bokehPass && config.dof.enabled) {
      composer.addPass(bokehPass);
      
    }

  

    composer.addPass(brightnessCompensationPass);
    composer.addPass(bloomPass);
    composer.addPass(gammaCorrectionPass);

    rightlight = new THREE.PointLight(
      config.rightlightColor,
      config.rightlightIntensity
    );

    rightlight.position.set(-5, 2, 0);
    scene.add(rightlight);

    leftlight = new THREE.PointLight(
      config.lefttlightColor,
      config.leftlightIntensity
    );
    leftlight.position.set(5, 2, 0);
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

  // Setup GUI controls
  function setupGUI() {
    gui = new GUI();

    // DOF folder
    const dofFolder = gui.addFolder("Depth of Field");

    // Enable/Disable DOF
    dofFolder.add(config.dof, "enabled").onChange((value) => {
      if (value && !bokehPass) {
        // Create bokeh pass if it doesn't exist
        bokehPass = new BokehPass(scene, camera, {
          focus: config.dof.focus,
          aperture: config.dof.aperture,
          maxblur: config.dof.maxblur,
          width: canvas.clientWidth,
          height: canvas.clientHeight,
        });

        // Find the render pass index and insert bokeh pass after it
        const renderPassIndex = composer.passes.findIndex(
          (pass) => pass instanceof RenderPass
        );
        if (renderPassIndex !== -1) {
          composer.insertPass(bokehPass, renderPassIndex + 1);
        }
      } else if (!value && bokehPass) {
        // Remove bokeh pass
        composer.removePass(bokehPass);
        bokehPass = null;
      }
    });

    // Focus distance
    dofControllers.focus = dofFolder
      .add(config.dof, "focus", 0.1, 50, 0.1)
      .name("Focus Distance")
      .onChange((value) => {
        if (bokehPass) {
          bokehPass.uniforms["focus"].value = value;
        }
      });

    // Aperture (blur amount)
    dofControllers.aperture = dofFolder
      .add(config.dof, "aperture", 0.0001, 0.1, 0.0001)
      .name("Aperture")
      .onChange((value) => {
        if (bokehPass) {
          bokehPass.uniforms["aperture"].value = value;
        }
      });

    // Maximum blur
    dofControllers.maxblur = dofFolder
      .add(config.dof, "maxblur", 0.0, 0.1, 0.001)
      .name("Max Blur")
      .onChange((value) => {
        if (bokehPass) {
          bokehPass.uniforms["maxblur"].value = value;
        }
      });

    // Add presets
    const presets = {
      "Portrait (Shallow)": () => {
        config.dof.focus = 2.0;
        config.dof.aperture = 0.05;
        config.dof.maxblur = 0.02;
        // updateDOFSettings(config.dof);
        updateGUIControllers();
      },
      Standard: () => {
        config.dof.focus = 5.0;
        config.dof.aperture = 0.01;
        config.dof.maxblur = 0.01;
        // updateDOFSettings(config.dof);
        updateGUIControllers();
      },
      "Deep Focus": () => {
        config.dof.focus = 10.0;
        config.dof.aperture = 0.001;
        config.dof.maxblur = 0.005;
        // updateDOFSettings(config.dof);
        updateGUIControllers();
      },
      Cinematic: () => {
        config.dof.focus = 3.0;
        config.dof.aperture = 0.08;
        config.dof.maxblur = 0.03;
        // updateDOFSettings(config.dof);
        updateGUIControllers();
      },
    };

    const presetsFolder = dofFolder.addFolder("Presets");
    Object.keys(presets).forEach((key) => {
      presetsFolder.add(presets, key);
    });

    dofFolder.open();

    // Optional: Add bloom controls
    const bloomFolder = gui.addFolder("Bloom");
    bloomFolder.add(config.bloom, "strength", 0, 3, 0.01).onChange((value) => {
      bloomPass.strength = value;
    });
    bloomFolder.add(config.bloom, "radius", 0, 4, 0.01).onChange((value) => {
      bloomPass.radius = value;
    });
    bloomFolder.add(config.bloom, "threshold", 0, 1, 0.01).onChange((value) => {
      bloomPass.threshold = value;
    });

    // Optional: Add lighting controls
    const lightingFolder = gui.addFolder("Lighting");
    lightingFolder
      .add(config, "rightlightIntensity", 0, 50, 0.1)
      .onChange((value) => {
        rightlight.intensity = value;
      });
    lightingFolder
      .add(config, "leftlightIntensity", 0, 50, 0.1)
      .onChange((value) => {
        leftlight.intensity = value;
      });
  }

  // Window resize handler
  function onWindowResize() {
    if (!camera || !renderer || !composer || useDevice().isMobileOrTablet)
      return;

    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    composer.setSize(canvas.clientWidth, canvas.clientHeight);

    // Update bokeh pass resolution
    if (bokehPass && config.dof.enabled) {
      bokehPass.uniforms["aspect"].value = camera.aspect;
    }

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
      // statueGroup.rotation.x = statueGroup.userData.originalRotation.x + rotationOffset.x;
      // statueGroup.rotation.y = statueGroup.userData.originalRotation.y + rotationOffset.y;
    }

    if (mixer) {
      mixer.update(delta);
    }

    if (lineHandler && lineHandler.animate) {
      lineHandler.animate(delta);
    }

    if (envlineHandler && envlineHandler.animate) {
      envlineHandler.animate(delta);
    }

    if (dustParticles && dustParticles.animate) {
      dustParticles.animate(delta);
    }

    if (cloudShaderHandler) {
      // cloudShaderHandler.update(delta);
      // cloudShaderHandler2.update(delta);
      // cloudShaderHandler3.update(delta);
    }

    composer.render();
  }

  
  // Function to update DOF settings at runtime
  function updateDOFSettings(newSettings) {
    if (!bokehPass || !config.dof.enabled) return;

    if (newSettings.focus !== undefined) {
      config.dof.focus = newSettings.focus;
      bokehPass.uniforms["focus"].value = newSettings.focus;
    }

    if (newSettings.aperture !== undefined) {
      config.dof.aperture = newSettings.aperture;
      bokehPass.uniforms["aperture"].value = newSettings.aperture;
    }

    if (newSettings.maxblur !== undefined) {
      config.dof.maxblur = newSettings.maxblur;
      bokehPass.uniforms["maxblur"].value = newSettings.maxblur;
    }
  }

  // Cleanup function
  function cleanup() {
    if (gui) {
      gui.destroy();
    }

    window.removeEventListener("resize", onWindowResize);
    window.removeEventListener("mousemove", onMouseMove);

    if (renderer) {
      renderer.dispose();
    }
  }

  return {
    setupSequentialLoading,
    activeTextIndex,
    // updateDOFSettings,
    cleanup,
  };
}