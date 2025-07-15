import * as THREE from "three";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function useGradientBackground() {
  // Private variables
  let mesh = null;
  let material = null;
  let scene = null;
  let camera = null;
  
  // Store color objects
  let topColorObj = new THREE.Color();
  let bottomColorObj = new THREE.Color();
  let startColorObj = new THREE.Color();
  let endColorObj = new THREE.Color();
  
  // Default settings
  let settings = {
    gradientType: 0, // 0: linear, 1: radial, 2: diagonal
    smoothness: 1.0,
    enableVignette: false,
    vignetteStrength: 0.3
  };

  // Create gradient background
  function create(sceneRef, cameraRef, options = {}) {
    scene = sceneRef;
    camera = cameraRef;
    
    // Set initial colors
    const bottomColor = options.bottomColor || 0x111111;
    const topColor = options.topColor || bottomColor; // Default to same as bottom
    
    bottomColorObj.set(bottomColor);
    topColorObj.set(topColor);
    
    // Create fullscreen quad geometry
    const geometry = new THREE.PlaneGeometry(2, 2, 1, 1);
    
    // Create shader material
    material = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: topColorObj },
        bottomColor: { value: bottomColorObj },
        smoothness: { value: settings.smoothness },
        gradientType: { value: settings.gradientType },
        enableVignette: { value: settings.enableVignette },
        vignetteStrength: { value: settings.vignetteStrength }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float smoothness;
        uniform int gradientType;
        uniform bool enableVignette;
        uniform float vignetteStrength;
        
        varying vec2 vUv;
        
        void main() {
          float mixValue = 0.0;
          
          // Different gradient types
          if (gradientType == 0) { // Linear vertical
            mixValue = vUv.y;
          } else if (gradientType == 1) { // Radial
            vec2 center = vec2(0.5, 0.5);
            mixValue = distance(vUv, center) * 1.4;
            mixValue = clamp(mixValue, 0.0, 1.0);
          } else if (gradientType == 2) { // Diagonal
            mixValue = (vUv.x + vUv.y) * 0.5;
          }
          
          // Apply smoothness curve
          mixValue = pow(mixValue, smoothness);
          
          // Two-color gradient
          vec3 color = mix(bottomColor, topColor, mixValue);
          
          // Add vignette if enabled
          if (enableVignette) {
            float vignette = 1.0 - distance(vUv, vec2(0.5, 0.5)) * vignetteStrength;
            color *= vignette;
          }
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      depthTest: false,
      depthWrite: false,
    });
    
    // Create mesh
    mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    
    // Position behind everything
    mesh.renderOrder = -1000;
    
    // Add to scene
    scene.add(mesh);
    
    // Attach to camera for consistent positioning
    if (camera) {
      mesh.position.z = -10;
      camera.add(mesh);
    }
  }
  
  // Setup scroll animation
  function setupScrollAnimation(options = {}) {
    if (typeof ScrollTrigger === 'undefined') {
      console.warn('ScrollTrigger not found. Make sure GSAP ScrollTrigger is loaded.');
      return;
    }
    
    const {
      trigger = '.home-page',
      start = 'top top',
      end = '30% top',
      startColor = 0x070211,  // Same as bottom initially
      endColor = 0x1a0a3e     // Purple
    } = options;
    
    // Set start colors
    startColorObj.set(startColor);
    endColorObj.set(endColor);
    
    // Create a temporary color for interpolation
    const tempColor = new THREE.Color();
    
    ScrollTrigger.create({
      trigger: trigger,
      start: start,
      end: end,
      scrub: true,
      onUpdate: (self) => {
        const progress = self.progress;
        
        // Interpolate color
        tempColor.copy(startColorObj);
        tempColor.lerp(endColorObj, progress);
        
        // Update the top color
        topColorObj.copy(tempColor);
        
        // Update shader uniform
        if (material) {
          material.uniforms.topColor.value.copy(topColorObj);
        }
      }
    });
  }
  
  // Direct color setters
  function setTopColor(color) {
    topColorObj.set(color);
    if (material) {
      material.uniforms.topColor.value.copy(topColorObj);
    }
  }
  
  function setBottomColor(color) {
    bottomColorObj.set(color);
    if (material) {
      material.uniforms.bottomColor.value.copy(bottomColorObj);
    }
  }
  
  function setColors(top, bottom) {
    setTopColor(top);
    setBottomColor(bottom);
  }
  
  // Gradient type setter
  function setGradientType(type) {
    const types = { 'linear': 0, 'radial': 1, 'diagonal': 2 };
    settings.gradientType = typeof type === 'string' ? (types[type] || 0) : type;
    if (material) {
      material.uniforms.gradientType.value = settings.gradientType;
    }
  }
  
  // Other setters
  function setSmoothness(value) {
    settings.smoothness = value;
    if (material) {
      material.uniforms.smoothness.value = value;
    }
  }
  
  function setVignette(enabled, strength = 0.3) {
    settings.enableVignette = enabled;
    settings.vignetteStrength = strength;
    if (material) {
      material.uniforms.enableVignette.value = enabled;
      material.uniforms.vignetteStrength.value = strength;
    }
  }
  
  // Animate (keeping for compatibility but does nothing now)
  function animate(deltaTime) {
    // No animation needed without noise
  }
  
  // Cleanup
  function dispose() {
    if (mesh) {
      if (mesh.parent) {
        mesh.parent.remove(mesh);
      }
      mesh.geometry.dispose();
      material.dispose();
    }
  }
  
  // Return public API
  return {
    create,
    setupScrollAnimation,
    setTopColor,
    setBottomColor,
    setColors,
    setGradientType,
    setSmoothness,
    setVignette,
    animate,
    dispose
  };
}