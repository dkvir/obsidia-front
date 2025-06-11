// DustParticles.js
import * as THREE from "three";

export const useDustParticles = class DustParticles {
  constructor(scene, options = {}) {
    this.scene = scene;

    // Default options
    this.options = {
      count: options.count || 20,
      size: options.size || { min: 0.1, max: 0.3 },
      area: options.area || { width: 10, height: 10, depth: 10 },
      color: options.color || {
        // Default blue range
        hue: { min: 200, max: 240 }, // Blue hue range
        saturation: { min: 50, max: 100 },
        lightness: { min: 40, max: 80 },
      },
      opacity: options.opacity || 0.5,
      speed: options.speed || { min: 0.02, max: 0.05 },
      blending: options.blending || THREE.AdditiveBlending,
      // Light-based visibility settings
      lightInfluence: {
        enabled: true,
        lightDistance: 8.0, // Maximum distance for light influence
        fadeDistance: 2.0, // Distance over which fade occurs
        minOpacity: 0.0, // Minimum opacity in darkness
        maxOpacity: 1.0, // Maximum opacity in light
      },
    };

    this.particles = null;
    this.particlesGeometry = null;
    this.particlesMaterial = null;
    this.velocities = [];
    this.cursorLight = null; // Reference to cursor light

    this.init();
  }

  // Method to set cursor light reference
  setCursorLight(light) {
    this.cursorLight = light;
  }

  init() {
    // Create geometry
    this.particlesGeometry = new THREE.BufferGeometry();

    // Create positions array
    const positions = new Float32Array(this.options.count * 3);
    const sizes = new Float32Array(this.options.count);
    const colors = new Float32Array(this.options.count * 3);

    // Fill positions array with random positions
    for (let i = 0; i < this.options.count; i++) {
      // Position
      positions[i * 3] = (Math.random() - 0.5) * this.options.area.width;
      positions[i * 3 + 1] = (Math.random() - 0.5) * this.options.area.height;
      positions[i * 3 + 2] = (Math.random() - 0.5) * this.options.area.depth;

      // Size (random between min and max)
      sizes[i] =
        Math.random() * (this.options.size.max - this.options.size.min) +
        this.options.size.min;

      // Generate random blue shade
      const hue =
        Math.random() *
          (this.options.color.hue.max - this.options.color.hue.min) +
        this.options.color.hue.min;
      const saturation =
        Math.random() *
          (this.options.color.saturation.max -
            this.options.color.saturation.min) +
        this.options.color.saturation.min;
      const lightness =
        Math.random() *
          (this.options.color.lightness.max -
            this.options.color.lightness.min) +
        this.options.color.lightness.min;

      // Convert HSL to RGB
      const color = new THREE.Color().setHSL(
        hue / 360,
        saturation / 100,
        lightness / 100
      );
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      // Store velocity for each particle
      this.velocities.push({
        x:
          Math.random() * (this.options.speed.max - this.options.speed.min) +
          this.options.speed.min,
        y:
          Math.random() * (this.options.speed.max - this.options.speed.min) +
          this.options.speed.min,
        z:
          Math.random() * (this.options.speed.max - this.options.speed.min) +
          this.options.speed.min,
      });
    }

    // Add attributes to geometry
    this.particlesGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    this.particlesGeometry.setAttribute(
      "size",
      new THREE.BufferAttribute(sizes, 1)
    );
    this.particlesGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(colors, 3)
    );

    // Create material
    const textureLoader = new THREE.TextureLoader();

    // Add texture loading callbacks to debug
    textureLoader.load(
      "./images/dust_particle.png",
      (texture) => {
        this.createParticleSystem(texture);
      },
      (error) => {
        console.error("❌ Error loading particle texture:", error);

        // Create a default texture if loading failed
        const defaultTexture = this.createDefaultTexture();
        this.createParticleSystem(defaultTexture);
      }
    );
  }

  // Create a default particle texture if loading fails
  createDefaultTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");

    // Draw a white circle
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(16, 16, 8, 0, Math.PI * 2);
    ctx.fill();

    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // Create particle system with the given texture
  createParticleSystem(texture) {
    // Enhanced shader material with light-based visibility
    const vertexShader = `
        attribute float size;
        varying vec3 vColor;
        varying vec3 vWorldPosition;
        
        void main() {
          vColor = color;
          
          // Calculate world position
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `;

    const fragmentShader = `
        uniform sampler2D pointTexture;
        uniform float opacity;
        uniform bool lightInfluenceEnabled;
        uniform vec3 lightPosition;
        uniform float lightDistance;
        uniform float fadeDistance;
        uniform float minOpacity;
        uniform float maxOpacity;
        
        varying vec3 vColor;
        varying vec3 vWorldPosition;
        
        void main() {
          vec4 textureColor = texture2D(pointTexture, gl_PointCoord);
          
          float finalOpacity = opacity;
          
          if (lightInfluenceEnabled) {
            // Calculate distance from particle to light
            float distanceToLight = distance(vWorldPosition, lightPosition);
            
            // Calculate light influence factor
            float lightInfluence = 1.0;
            
            if (distanceToLight > lightDistance) {
              // Outside light range - fade to minimum opacity
              lightInfluence = minOpacity / maxOpacity;
            } else if (distanceToLight > (lightDistance - fadeDistance)) {
              // In fade zone - interpolate between max and min opacity
              float fadeProgress = (distanceToLight - (lightDistance - fadeDistance)) / fadeDistance;
              lightInfluence = mix(maxOpacity, minOpacity, fadeProgress) / maxOpacity;
            } else {
              // Inside full light range - maximum opacity
              lightInfluence = 1.0;
            }
            
            finalOpacity *= lightInfluence;
          }
          
          gl_FragColor = vec4(vColor, finalOpacity) * textureColor;
          
          // Discard very transparent pixels for performance
          if (gl_FragColor.a < 0.01) discard;
        }
      `;

    // Create shader material with light influence uniforms
    this.particlesMaterial = new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: { value: texture },
        opacity: { value: this.options.opacity },
        lightInfluenceEnabled: { value: this.options.lightInfluence.enabled },
        lightPosition: { value: new THREE.Vector3(0, 0, 5) },
        lightDistance: { value: this.options.lightInfluence.lightDistance },
        fadeDistance: { value: this.options.lightInfluence.fadeDistance },
        minOpacity: { value: this.options.lightInfluence.minOpacity },
        maxOpacity: { value: this.options.lightInfluence.maxOpacity },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      blending: this.options.blending,
      depthWrite: false,
      transparent: true,
      vertexColors: true,
    });

    // Create mesh
    this.particles = new THREE.Points(
      this.particlesGeometry,
      this.particlesMaterial
    );
    this.particles.renderOrder = 2; // Render after statue and lines

    // Add to scene
    this.scene.add(this.particles);
  }

  animate(delta) {
    if (!this.particles) return;

    // Update light position in shader if cursor light exists
    if (
      this.cursorLight &&
      this.particlesMaterial &&
      this.particlesMaterial.uniforms
    ) {
      this.particlesMaterial.uniforms.lightPosition.value.copy(
        this.cursorLight.position
      );
    }

    const positions = this.particlesGeometry.attributes.position.array;
    const colors = this.particlesGeometry.attributes.color.array;

    // Update each particle position
    for (let i = 0; i < this.options.count; i++) {
      // Get current position
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;

      // Move particle
      positions[ix] += this.velocities[i].x;
      positions[iy] += this.velocities[i].y;
      positions[iz] += this.velocities[i].z;

      // Only reset if particle goes too far up (Y-axis +10)
      if (positions[iy] > this.options.area.height / 2 + 10) {
        // Instead of disposing, reset the particle to the bottom
        positions[iy] = -this.options.area.height / 2;

        // Optionally, randomize X and Z positions for a more natural appearance
        positions[ix] = (Math.random() - 0.5) * this.options.area.width;
        positions[iz] = (Math.random() - 0.5) * this.options.area.depth;

        // Optionally, randomize velocity for variety
        this.velocities[i] = {
          x: (Math.random() - 0.5) * 0.01,
          y:
            Math.random() * (this.options.speed.max - this.options.speed.min) +
            this.options.speed.min,
          z: (Math.random() - 0.5) * 0.01,
        };

        // Generate a new random blue color when particle resets
        const hue =
          Math.random() *
            (this.options.color.hue.max - this.options.color.hue.min) +
          this.options.color.hue.min;
        const saturation =
          Math.random() *
            (this.options.color.saturation.max -
              this.options.color.saturation.min) +
          this.options.color.saturation.min;
        const lightness =
          Math.random() *
            (this.options.color.lightness.max -
              this.options.color.lightness.min) +
          this.options.color.lightness.min;

        const color = new THREE.Color().setHSL(
          hue / 360,
          saturation / 100,
          lightness / 100
        );
        colors[ix] = color.r;
        colors[ix + 1] = color.g;
        colors[ix + 2] = color.b;

        // Mark color attribute for update
        this.particlesGeometry.attributes.color.needsUpdate = true;
      }

      // Keep particles within bounds horizontally and depth-wise
      // Note: We're using a gentler approach here - push back rather than hard reset
      if (Math.abs(positions[ix]) > this.options.area.width / 2) {
        // Reverse direction and slightly push back into bounds
        this.velocities[i].x *= -1;
        positions[ix] =
          positions[ix] > 0
            ? (this.options.area.width / 2) * 0.98
            : (-this.options.area.width / 2) * 0.98;
      }

      if (Math.abs(positions[iz]) > this.options.area.depth / 2) {
        // Reverse direction and slightly push back into bounds
        this.velocities[i].z *= -1;
        positions[iz] =
          positions[iz] > 0
            ? (this.options.area.depth / 2) * 0.98
            : (-this.options.area.depth / 2) * 0.98;
      }
    }

    // Update the geometry
    this.particlesGeometry.attributes.position.needsUpdate = true;
  }

  // Method to update settings
  updateSettings(options) {
    // Update light influence settings
    if (options.lightInfluence !== undefined) {
      this.options.lightInfluence = {
        ...this.options.lightInfluence,
        ...(typeof options.lightInfluence === "object"
          ? options.lightInfluence
          : {}),
      };

      // Update shader uniforms
      if (this.particlesMaterial && this.particlesMaterial.uniforms) {
        this.particlesMaterial.uniforms.lightInfluenceEnabled.value =
          this.options.lightInfluence.enabled;
        this.particlesMaterial.uniforms.lightDistance.value =
          this.options.lightInfluence.lightDistance;
        this.particlesMaterial.uniforms.fadeDistance.value =
          this.options.lightInfluence.fadeDistance;
        this.particlesMaterial.uniforms.minOpacity.value =
          this.options.lightInfluence.minOpacity;
        this.particlesMaterial.uniforms.maxOpacity.value =
          this.options.lightInfluence.maxOpacity;
      }
    }

    // Update options
    if (options.color !== undefined) {
      this.options.color = {
        ...this.options.color,
        ...(typeof options.color === "object" ? options.color : {}),
      };

      // Update all particle colors
      if (this.particlesGeometry && this.particlesGeometry.attributes.color) {
        const colors = this.particlesGeometry.attributes.color.array;

        for (let i = 0; i < this.options.count; i++) {
          const ix = i * 3;

          // Generate new color within the updated ranges
          const hue =
            Math.random() *
              (this.options.color.hue.max - this.options.color.hue.min) +
            this.options.color.hue.min;
          const saturation =
            Math.random() *
              (this.options.color.saturation.max -
                this.options.color.saturation.min) +
            this.options.color.saturation.min;
          const lightness =
            Math.random() *
              (this.options.color.lightness.max -
                this.options.color.lightness.min) +
            this.options.color.lightness.min;

          const color = new THREE.Color().setHSL(
            hue / 360,
            saturation / 100,
            lightness / 100
          );
          colors[ix] = color.r;
          colors[ix + 1] = color.g;
          colors[ix + 2] = color.b;
        }

        this.particlesGeometry.attributes.color.needsUpdate = true;
      }
    }

    if (options.opacity !== undefined) {
      this.options.opacity = options.opacity;
      if (
        this.particlesMaterial &&
        this.particlesMaterial.uniforms &&
        this.particlesMaterial.uniforms.opacity
      ) {
        this.particlesMaterial.uniforms.opacity.value = options.opacity;
      }
    }

    if (options.speed !== undefined) {
      this.options.speed = {
        ...this.options.speed,
        ...(typeof options.speed === "object" ? options.speed : {}),
      };

      // Update velocities
      for (let i = 0; i < this.velocities.length; i++) {
        this.velocities[i].y =
          Math.random() * (this.options.speed.max - this.options.speed.min) +
          this.options.speed.min;
      }
    }

    if (options.size !== undefined) {
      // Update size options
      this.options.size = {
        ...this.options.size,
        ...(typeof options.size === "object" ? options.size : {}),
      };

      // Check if geometry exists and has size attribute
      if (this.particlesGeometry && this.particlesGeometry.attributes.size) {
        const sizes = this.particlesGeometry.attributes.size.array;

        // Update each particle's size
        for (let i = 0; i < this.options.count; i++) {
          sizes[i] =
            Math.random() * (this.options.size.max - this.options.size.min) +
            this.options.size.min;
        }

        // Mark attribute for update
        this.particlesGeometry.attributes.size.needsUpdate = true;
      } else {
        console.warn(
          "Cannot update particle sizes: geometry or size attribute not available"
        );
      }
    }

    // Handle area updates if provided
    if (options.area) {
      this.options.area = {
        ...this.options.area,
        ...(typeof options.area === "object" ? options.area : {}),
      };
    }

    // Handle count updates (this would require recreating the system)
    if (options.count !== undefined && options.count !== this.options.count) {
      console.warn(
        "Changing particle count requires recreating the particle system"
      );
      // You could implement this by disposing and reinitializing
    }
  }

  // Clean up method to remove particles from scene
  dispose() {
    if (this.particles) {
      this.scene.remove(this.particles);
      this.particlesGeometry.dispose();
      this.particlesMaterial.dispose();
      this.particles = null;
    }
  }
};
