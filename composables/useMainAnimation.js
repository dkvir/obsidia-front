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
  let focusObject; // Reference to focuss object

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
      enabled: false,
      focus: 1.0, // Will be calculated dynamically to focus on scene center
      aperture: 0.001, // Fixed aperture for consistent blur
      maxblur: 0.01, // Maximum blur amount
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

          const normal = new THREE.TextureLoader().load("./images/normal.jpg");

          const rough = new THREE.TextureLoader().load("./images/rough.jpg");

          const color = new THREE.TextureLoader().load("./images/color.jpg");

          const metallic= new THREE.TextureLoader().load("./images/metallic.jpg");

          const matcap = new THREE.TextureLoader().load("./images/matcap.png");

          // color.encoding = THREE.sRGBEncoding;

          // material = new THREE.MeshMatcapMaterial({
         
          //   matcap: matcap,
          //   // normalMap: normal,
          //   flatShading: true
           
          // });

          material = new THREE.MeshPhysicalMaterial({
            // map: color,
            color: 0x000000,
            normalMap: normal,
            roughnessMap: rough,
            metalnessMap: metallic,
            // opacity: 0.5,
            transmission: 1.0,
            thickness: 0.8,
            transparent: true,
            // color: 0x000000,
            // metalness: 0,
            ior: 1.5,
            roughness: 0.0,
            side: THREE.DoubleSide,
            envMap: envMap,
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
            
            // Store reference to focuss object
            if (child.name === "focuss") {
              focusObject = child;
              child.visible = false; // Hide the focuss object
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

            gsap.registerPlugin(ScrollTrigger, SplitText);

            ScrollTrigger.config({
              limitCallbacks: true,
              ignoreMobileResize: true,
            });

            cameraAnimationOptions.forEach((item, index) => {
              createAnimationController(mixer, animationActions, item, index);
            });

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
    bottomColor: 0x000000,  // Your dark color
    topColor: 0x070211      // Same color initially
  });
  
    gradientBackground.setupScrollAnimation({
    trigger: '.home-page',
    start: '30% top',
    end: '60% top',        // Adjust for speed
    startColor: 0x000000,  // Dark (same as bottom)
    endColor: 0xFFF9F5 // Purple (change this!)
  });

    composer = new EffectComposer(renderer);
    composer.setSize(canvas.clientWidth , canvas.clientHeight );

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
      uniforms: { tDiffuse: { value: null }, brightness: { value: 0.8 } },
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
      statueGroup.rotation.y = statueGroup.userData.originalRotation.y - rotationOffset.y;
    }

    // Apply constant rotation to the model group
    if (modelGroup) {
      modelGroup.rotation.y += ROTATION_SPEED * delta;
    }

    // Update DOF to focus on focuss object
    if (bokehPass && config.dof.enabled && camera && focusObject) {
      // Get world position of focuss
      const targetPosition = new THREE.Vector3();
      focusObject.getWorldPosition(targetPosition);
      
      // Calculate distance from camera to focuss
      const distance = camera.position.distanceTo(targetPosition);
      bokehPass.uniforms["focus"].value = distance;
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

      
    vertexDustSystems.forEach(dustSystem => {
      
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