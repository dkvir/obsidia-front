import * as THREE from "three";
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

export function useThreeScene(canvasId = "canvas") {
  // Three.js variables
  let scene, renderer, camera, statuemesh, envMap, material;
  let composer, bloomPass, bokehPass;
  let mixer,
    animations,
    animationActions = [];
  let lineHandler, dustParticles;
  let clock = new THREE.Clock();
  let scrollTimeline, dofTimeline;
  let cursorLight, cursorLightFar, cursorLightFar2;
  let rightlight, leftlight;
  let statueGroup;

  // Mouse rotation variables
  let mouse = new THREE.Vector2();
  let lastMouse = new THREE.Vector2();
  let rotationOffset = new THREE.Vector2();
  let mouseMoveFactor = { value: 0.05 };
  let returnFactor = { value: 0.01 };
  let isMouseMoving = false;
  let mouseTimeout;

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
      color: 0xc337ff,
      intensity: 0.5,
      distance: 20,
      decay: 0.5,
      depth: 10,
      smoothing: 0.1,
      xOffset: 1.2,
    },

    // Other settings
    lineWidth: 6,
    opacity: 1,
    bezierCurveAmount: 0.5,
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
        useGui(config, cursorLightFar, cursorLightFar2);
      })
      .catch((error) => {
        console.error("Loading sequence failed:", error);
        // Initialize with fallbacks
        init();
        initStatueGroup();
        animate();
        useGui(config, cursorLightFar, cursorLightFar2);
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
            envMapIntensity: 0.3,
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
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
          }

          gltf.scene.traverse((child) => {
            if (child.name.includes("statue_")) {
              statuemesh = child;
              if (material) {
                statuemesh.material = material;
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

            createAnimationController(mixer, animationActions, animations);

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
  function createAnimationController(mixer, actions, clips) {
    gsap.registerPlugin(ScrollTrigger);

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

  // DOF scroll animation
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

  // Mouse event handlers
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
      targetPositionFar2.x -= config.cursorLightFar.xOffset;
      cursorLightFar2.position.lerp(
        targetPositionFar2,
        config.cursorLightFar.smoothing
      );
    }
  }

  // Create cursor lights
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

    if (camera) {
      const cameraForward = new THREE.Vector3(0, 0, -1);
      cameraForward.transformDirection(camera.matrixWorld);

      const initialPosition = camera.position
        .clone()
        .add(
          cameraForward.clone().multiplyScalar(-config.cursorLightFar.depth)
        );
      initialPosition.x += config.cursorLightFar.xOffset;
      cursorLightFar.position.copy(initialPosition);
    } else {
      cursorLightFar.position.set(
        config.cursorLightFar.xOffset,
        0,
        -config.cursorLightFar.depth
      );
    }

    scene.add(cursorLightFar);

    // Second far cursor light
    cursorLightFar2 = new THREE.PointLight(
      config.cursorLightFar.color,
      config.cursorLightFar.intensity,
      config.cursorLightFar.distance,
      config.cursorLightFar.decay
    );

    if (camera) {
      const cameraForward = new THREE.Vector3(0, 0, -1);
      cameraForward.transformDirection(camera.matrixWorld);

      const initialPosition2 = camera.position
        .clone()
        .add(
          cameraForward.clone().multiplyScalar(-config.cursorLightFar.depth)
        );
      initialPosition2.x -= config.cursorLightFar.xOffset;
      cursorLightFar2.position.copy(initialPosition2);
    } else {
      cursorLightFar2.position.set(
        -config.cursorLightFar.xOffset,
        0,
        -config.cursorLightFar.depth
      );
    }

    scene.add(cursorLightFar2);
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
    const canvas = document.querySelector(`#${canvasId}`);

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: canvas,
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
      config.bloom.strength,
      config.bloom.radius,
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

    // Only create dust particles if the class exists
    if (typeof useDustParticles === "function") {
      dustParticles = new useDustParticles(scene, config.dustParticles);
    }

    createDOFScrollAnimation();
  }

  // Window resize handler
  function onWindowResize() {
    if (!camera || !renderer || !composer) return;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);

    if (bokehPass && bokehPass.renderTargetDepth) {
      bokehPass.renderTargetDepth.setSize(
        window.innerWidth,
        window.innerHeight
      );
    }

    if (dustParticles && dustParticles.updateSettings) {
      const aspectRatio = window.innerWidth / window.innerHeight;
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

    composer.render();
  }

  return {
    setupSequentialLoading,
  };
}
