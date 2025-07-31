// DustParticles.js
import * as THREE from "three";

export const useDustParticles = class DustParticles {
  constructor(scene, options = {}) {
    this.scene = scene;

    // Default options
    this.options = {
      count: options.count || 20,
      size: options.size || { min: 0.2, max: 0.4 },
      area: options.area || { width: 10, height: 10, depth: 10 },
      colors: options.colors || [
        new THREE.Color(0x9400d3), // Purple
        new THREE.Color(0x0000ff), // Blue
        new THREE.Color(0xff00ff), // Magenta
      ],
      opacity: options.opacity || { min: 0.05, max: 0.1 }, // Changed to range
      speed: options.speed || { min: 0.02, max: 0.05 },
      blending: options.blending || THREE.NormalBlending,
    };

    this.particles = null;
    this.particlesGeometry = null;
    this.particlesMaterial = null;
    this.velocities = [];

    this.init();
  }

  init() {
    // Create geometry
    this.particlesGeometry = new THREE.BufferGeometry();

    // Create positions array
    const positions = new Float32Array(this.options.count * 3);
    const sizes = new Float32Array(this.options.count);
    const colors = new Float32Array(this.options.count * 3);
    const opacities = new Float32Array(this.options.count);

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

      // Random opacity
      opacities[i] =
        Math.random() * (this.options.opacity.max - this.options.opacity.min) +
        this.options.opacity.min;

      // Pick a random color from the three options
      const randomColor = this.options.colors[Math.floor(Math.random() * this.options.colors.length)];
      colors[i * 3] = randomColor.r;
      colors[i * 3 + 1] = randomColor.g;
      colors[i * 3 + 2] = randomColor.b;

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
    this.particlesGeometry.setAttribute(
      "opacity",
      new THREE.BufferAttribute(opacities, 1)
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
    // Simplified shader material without light influence
    const vertexShader = `
        attribute float size;
        attribute float opacity;
        varying vec3 vColor;
        varying float vOpacity;
        
        void main() {
          vColor = color;
          vOpacity = opacity;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `;

    const fragmentShader = `
        uniform sampler2D pointTexture;
        varying vec3 vColor;
        varying float vOpacity;
        
        void main() {
          vec4 textureColor = texture2D(pointTexture, gl_PointCoord);
          gl_FragColor = vec4(vColor, vOpacity) * textureColor;
          
          // Discard very transparent pixels for performance
          if (gl_FragColor.a < 0.01) discard;
        }
      `;

    // Create shader material without light influence uniforms
    this.particlesMaterial = new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: { value: texture },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      blending: this.options.blending,
      depthWrite: true,
      vertexColors: true,
      transparent: true,
    });

    // Create mesh
    this.particles = new THREE.Points(
      this.particlesGeometry,
      this.particlesMaterial
    );
    this.particles.renderOrder = 10; // Render after statue and lines

    // Add to scene
    this.scene.add(this.particles);
  }

  animate(delta) {
    if (!this.particles) return;

    const positions = this.particlesGeometry.attributes.position.array;
    const colors = this.particlesGeometry.attributes.color.array;
    const opacities = this.particlesGeometry.attributes.opacity.array;

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

        // Pick a new random color when particle resets
        const randomColor = this.options.colors[Math.floor(Math.random() * this.options.colors.length)];
        colors[ix] = randomColor.r;
        colors[ix + 1] = randomColor.g;
        colors[ix + 2] = randomColor.b;

        // Generate new random opacity when particle resets
        opacities[i] =
          Math.random() * (this.options.opacity.max - this.options.opacity.min) +
          this.options.opacity.min;

        // Mark attributes for update
        this.particlesGeometry.attributes.color.needsUpdate = true;
        this.particlesGeometry.attributes.opacity.needsUpdate = true;
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
    // Update colors
    if (options.colors !== undefined && Array.isArray(options.colors)) {
      this.options.colors = options.colors;

      // Update all particle colors
      if (this.particlesGeometry && this.particlesGeometry.attributes.color) {
        const colors = this.particlesGeometry.attributes.color.array;

        for (let i = 0; i < this.options.count; i++) {
          const ix = i * 3;

          // Pick a new random color from the updated colors array
          const randomColor = this.options.colors[Math.floor(Math.random() * this.options.colors.length)];
          colors[ix] = randomColor.r;
          colors[ix + 1] = randomColor.g;
          colors[ix + 2] = randomColor.b;
        }

        this.particlesGeometry.attributes.color.needsUpdate = true;
      }
    }

    if (options.opacity !== undefined) {
      this.options.opacity = {
        ...this.options.opacity,
        ...(typeof options.opacity === "object" ? options.opacity : { min: 0.1, max: 0.3 }),
      };

      // Update all particle opacities
      if (this.particlesGeometry && this.particlesGeometry.attributes.opacity) {
        const opacities = this.particlesGeometry.attributes.opacity.array;

        for (let i = 0; i < this.options.count; i++) {
          opacities[i] =
            Math.random() * (this.options.opacity.max - this.options.opacity.min) +
            this.options.opacity.min;
        }

        this.particlesGeometry.attributes.opacity.needsUpdate = true;
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
};