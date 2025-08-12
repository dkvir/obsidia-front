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
  // Three.js variables
  let canvas, scene, renderer, camera, statuemesh, envMap, material;
  let composer, bloomPass, bokehPass;
  let mixer,
    animations,
    animationActions = [];
  let dustParticles;
  let clock = new THREE.Clock();
  let statueGroup;
  let vertexDustSystems;
  let gradientBackground;
  let modelGroup; // Group for all GLB meshes

  // Rotation speed for the model
  const ROTATION_SPEED = 0.2; // Radians per second (adjust this value to change speed)

  // Mouse rotation variables
  let mouse = new THREE.Vector2();
  let lastMouse = new THREE.Vector2();
  let rotationOffset = new THREE.Vector2();
  let mouseMoveFactor = { value: 0.05 };
  let returnFactor = { value: 0.01 };
  let isMouseMoving = false;
  let mouseTimeout;

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
    // Bloom settings
    bloom: {
      strength: 0.1,
      radius: 0.1,
      threshold: 0.2,
    },

    // Depth of Field settings
    dof: {
      enabled: true,
      focus: 3.3, // Will be calculated dynamically to focus on scene center
      aperture: 0.01, // Fixed aperture for consistent blur
      maxblur: 0.005, // Maximum blur amount
    },

    // Other settings
    dustParticles: {
      count: 0,
      size: { min: 0.03, max: 0.5 },
      area: { width: 5, height: 2, depth: 15 },
      // opacity: 0.05,
      speed: { min: 0.0001, max: 0.0004 },
      color: {
        hue: { min: 200, max: 300 },
        saturation: { min: 90, max: 100 },
        lightness: { min: 70, max: 100 },
      },
    },
  };

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

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

          const normal = new THREE.TextureLoader().load("./images/normal.png");

          const rough = new THREE.TextureLoader().load("./images/rough.jpg");

          const color = new THREE.TextureLoader().load("./images/color.jpg");

          const metallic = new THREE.TextureLoader().load(
            "./images/metallic.jpg"
          );

          const matcap = new THREE.TextureLoader().load("./images/matcap.png");

          // Set tiling for normal map
          normal.wrapS = THREE.RepeatWrapping;
          normal.wrapT = THREE.RepeatWrapping;
          normal.repeat.set(10, 10); // Adjust these values to control tiling (4x4 tiles)

          // Optional: Apply tiling to other maps as well
          // rough.wrapS = THREE.RepeatWrapping;
          // rough.wrapT = THREE.RepeatWrapping;
          // rough.repeat.set(4, 4);

          // metallic.wrapS = THREE.RepeatWrapping;
          // metallic.wrapT = THREE.RepeatWrapping;
          // metallic.repeat.set(4, 4);

          // If you want to tile the color map too
          // color.wrapS = THREE.RepeatWrapping;
          // color.wrapT = THREE.RepeatWrapping;
          // color.repeat.set(4, 4);

          material = new THREE.MeshPhysicalMaterial({
            // map: color,
            color: 0xffffff,
            // normalMap: normal,
            // normalScale: new THREE.Vector2(0.05, 0.05), // Adjust normal intensity if needed
            // roughnessMap: rough,
            // metalnessMap: metallic,
            // opacity: 0.5,
            transmission: 1.0,
            thickness: 0.8,
            transparent: true,
            // color: 0x000000,
            // metalness: 0,
            ior: 1.7,
            roughness: 0.0,
            side: THREE.DoubleSide,
            envMap: envMap,
            dispersion: 5,
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
        "mesh/obsidian.glb",
        (gltf) => {
          // Use camera from model if available
          if (gltf.cameras && gltf.cameras.length > 0) {
            camera = gltf.cameras[0];
            if (!canvas) canvas = document.querySelector(canvasId);
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
          }

          gltf.scene.traverse((child) => {
            if (child.name.includes("crystal_")) {
              if (material && child.isMesh) {
                child.material = material;
                child.visible = true;
              }
            }
          });

          // Create a parent group and add the entire gltf.scene to it
          // This preserves the animation hierarchy
          modelGroup = new THREE.Group();
          modelGroup.add(gltf.scene);
          scene.add(modelGroup);

          vertexDustSystems = createVertexDustFromScene(scene);

          if (gltf.animations && gltf.animations.length > 0) {
            animations = gltf.animations;
            // Keep the mixer targeting the original gltf.scene
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

    const scrollTimeline = gsap.timeline({
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
  }

  // Initialize statue group
  function initStatueGroup() {
    statueGroup = new THREE.Group();
    const objectsToGroup = [];

    scene.traverse((child) => {
      if (
        child.name &&
        (child.name.includes("crystal") || child.name.includes("_part"))
      ) {
        // objectsToGroup.push(child);
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
    renderer.toneMappingExposure = 1.0;
    renderer.outputEncoding = THREE.sRGBEncoding;

    gradientBackground = useGradientBackground();

    gradientBackground.create(scene, camera, {
      bottomColor: 0x000000, // Your dark color
      topColor: 0x070211, // Same color initially
    });

    gradientBackground.setupScrollAnimation({
      trigger: ".home-page",
      start: "30% top",
      end: "60% top", // Adjust for speed
      startColor: 0x000000, // Dark (same as bottom)
      endColor: 0xdec4b6,
    });

    if (material) {
      gsap.to(material.color, {
        r: 0, // Target black (0,0,0)
        g: 0,
        b: 0,
        ease: "none",
        scrollTrigger: {
          trigger: ".home-page",
          start: "30% top",
          end: "32% top",
          scrub: true,
          onUpdate: function (self) {
            // Interpolate from white (1,1,1) to black (0,0,0)
            const progress = self.progress;
            material.color.r = 1 - progress;
            material.color.g = 1 - progress;
            material.color.b = 1 - progress;
          },
        },
      });
    }

    composer = new EffectComposer(renderer);
    composer.setSize(canvas.clientWidth, canvas.clientHeight);

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

    if (bokehPass && config.dof.enabled) {
      // Define the focus values for different scroll positions
      const focusStops = [
        { value: 1.0 }, // Start
        { value: 0.705 }, // Middle
        { value: 2.907 }, // End
      ];

      // First transition: 1.0 to 0.705
      ScrollTrigger.create({
        trigger: ".home-page",
        start: "top top",
        end: "12% top", // Adjust this to control when the first transition ends
        scrub: 1,
        onUpdate: function (self) {
          const focusValue = gsap.utils.interpolate(3.3, 0.705, self.progress);
          bokehPass.uniforms["focus"].value = focusValue;

          // console.log("Focus value:", focusValue);
        },
      });

      // Second transition: 0.705 to 2.907
      ScrollTrigger.create({
        trigger: ".home-page",
        start: "12% top", // Should match the end of the first transition
        end: "30% top",
        scrub: 1,
        onUpdate: function (self) {
          const focusValue = gsap.utils.interpolate(0.705, 3, self.progress);
          bokehPass.uniforms["focus"].value = focusValue;

          // console.log("Focus value:", focusValue);
        },
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

    // Add passes in the correct order
    composer.addPass(renderPass);
    composer.addPass(bloomPass);

    // Add DOF before bloom for better results
    if (bokehPass && config.dof.enabled) {
      composer.addPass(bokehPass);
    }

    composer.addPass(brightnessCompensationPass);

    const filmPass = new FilmPass(0.8, 0.325, 256, false); // intensity, scanline intensity, scanline count, grayscale
    composer.addPass(filmPass);
    composer.addPass(gammaCorrectionPass);

    window.addEventListener("resize", onWindowResize);

    if (camera) camera.userData.defaultPosition = camera.position.clone();

    // Only create dust particles if the class exists
    if (typeof useDustParticles === "function") {
      // dustParticles = new useDustParticles(scene, config.dustParticles);
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

    if (gradientBackground) {
      gradientBackground.updateAspect(camera.aspect);
    }

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
      // statueGroup.rotation.x = statueGroup.userData.originalRotation.x + rotationOffset.x/4;
      statueGroup.rotation.y =
        statueGroup.userData.originalRotation.y - rotationOffset.y;
    }

    // Apply constant rotation to the model group
    if (modelGroup) {
      modelGroup.rotation.y += ROTATION_SPEED * delta;
    }

    if (gradientBackground) {
      gradientBackground.animate(delta);
    }

    if (mixer) {
      mixer.update(delta);
    }

    if (dustParticles && dustParticles.animate) {
      dustParticles.animate(delta);
    }

    if (vertexDustSystems && vertexDustSystems.length > 0) {
      vertexDustSystems.forEach((dustSystem) => {
        if (dustSystem.animate) {
          dustSystem.animate(delta);
        }
      });
    }

    composer.render();
    // renderer.render(scene, camera);
  }

  // Cleanup function
  function cleanup() {
    window.removeEventListener("resize", onWindowResize);
    window.removeEventListener("mousemove", onMouseMove);

    if (gui) {
      gui.destroy();
    }

    if (gradientBackground) {
      gradientBackground.dispose();
    }

    if (renderer) {
      renderer.dispose();
    }
  }

  return {
    setupSequentialLoading,
    activeTextIndex,
    cleanup,
  };
}
