import * as THREE from "three";

export const useVertexDustParticles = class VertexDustParticles {
  constructor(scene, object, options = {}) {
    this.scene = scene;
    this.sourceObject = object;

    // Determine particle type from object name using includes
    let particleType = 'normal'; // default
    if (object.name && object.name.includes("particle_")) {
      if (object.name.includes("big")) {
        particleType = 'big';
      } else if (object.name.includes("small")) {
        particleType = 'small';
      } else if (object.name.includes("normal")) {
        particleType = 'normal';
      }
    }

    // Define presets for each particle type
 
const presets = {
  normal: {
    size: { min: 0.1, max: 1.0 },
    baseSize: 1.0,
    colors: [
      { r: 1, g: 0.6, b: 0.2 }, // Orange
      { r: 1, g: 0.8, b: 0.4 }, // Light Orange
      { r: 1, g: 1, b: 1 }, // White
    ],
    opacity: 0.01,
    noiseScale: 0.5,
    noiseStrength: 0.1,
    noiseSpeed: 0.3,
    texture: "./images/dust_particle.png"
  },
  big: {
    size: { min: 0.01, max: 0.9 },
    baseSize: 1.5,
    colors: [
      { r: 1, g: 0.5, b: 0 }, // Deep Orange
      { r: 1, g: 1, b: 1 }, // White
    ],
    opacity: 0.01,
    noiseScale: 0.6,
    noiseStrength: 0.5,
    noiseSpeed: 0.2,
    texture: "./images/dust_particle.png"
  },
  small: {
    size: { min: 0.5, max: 0.7 },
    baseSize: 0.5,
    colors: [
      { r: 1, g: 0.7, b: 0.3 }, // Orange
      { r: 1, g: 1, b: 1 }, // White
    ],
    opacity: 0.02,
    noiseScale: 1.0,
    noiseStrength: 0.2,
    noiseSpeed: 0.7,
    texture: "./images/dust_particle.png"
  }
};
    // Use the appropriate preset
    const preset = presets[particleType];

    // Set options based on preset
    this.options = {
      size: preset.size,
      baseSize: preset.baseSize,
      colors: preset.colors,
      opacity: preset.opacity,
      speed: { min: 0.0001, max: 0.0004 },
      blending: THREE.NormalBlending,
      hideMesh: true,
      noiseScale: preset.noiseScale,
      noiseStrength: preset.noiseStrength,
      noiseSpeed: preset.noiseSpeed,
      deformMesh: true,
      particleType: particleType,
      texture: preset.texture
    };

    this.particles = null;
    this.particlesGeometry = null;
    this.particlesMaterial = null;
    this.sourceMeshes = [];

    // console.log(`Creating ${this.options.particleType} particle system for ${object.name}`);

    this.init();
  }

  init() {
    // Get all meshes that will have particles
    const meshes = this.extractMeshes();
    
    if (meshes.length === 0) {
      console.warn(`No meshes found in object: ${this.sourceObject.name}`);
      return;
    }

    // Create particle systems for each mesh
    meshes.forEach(mesh => {
      this.createParticlesForMesh(mesh);
      
      // Make mesh invisible by replacing its material
      if (this.options.hideMesh) {
        // Store original material(s) if needed later
        mesh.userData.originalMaterial = mesh.material;
        
        // Replace with invisible material
        mesh.material = new THREE.MeshBasicMaterial({
          visible: false
        });
      }
    });
  }

  extractMeshes() {
    const meshes = [];
    
    // First check if the object itself is a mesh
    if (this.sourceObject.isMesh && this.sourceObject.geometry) {
    //   console.log(`Found mesh: ${this.sourceObject.name}`);
      meshes.push(this.sourceObject);
    }
    
    // Then traverse children
    this.sourceObject.traverse((child) => {
      if (child !== this.sourceObject && child.isMesh && child.geometry) {
        // console.log(`Found child mesh: ${child.name}`);
        meshes.push(child);
      }
    });
    
    // If still no meshes, check parent's siblings
    if (meshes.length === 0 && this.sourceObject.parent) {
    //   console.log(`Checking siblings of ${this.sourceObject.name}`);
      this.sourceObject.parent.traverse((sibling) => {
        if (sibling.name && sibling.name.includes(this.sourceObject.name.replace('particle_', '')) && 
            sibling.isMesh && sibling.geometry) {
        //   console.log(`Found related mesh: ${sibling.name}`);
          meshes.push(sibling);
        }
      });
    }
    
    // console.log(`Total meshes found: ${meshes.length}`);
    return meshes;
  }

  createParticlesForMesh(mesh) {
    const geometry = mesh.geometry;
    const positionAttribute = geometry.attributes.position;
    
    if (!positionAttribute) {
    //   console.warn(`No position attribute in mesh: ${mesh.name}`);
      return;
    }

    const vertexCount = positionAttribute.count;
    // console.log(`Original vertex count: ${vertexCount} in ${mesh.name}`);

    // Deduplicate vertices that are in the same position
    const uniqueVertices = [];
    const vertexMap = new Map();
    const tolerance = 0.0001; // Tolerance for considering vertices as duplicates

    for (let i = 0; i < vertexCount; i++) {
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);
      const z = positionAttribute.getZ(i);
      
      // Create a key for this position (rounded to avoid floating point issues)
      const key = `${Math.round(x / tolerance) * tolerance}_${Math.round(y / tolerance) * tolerance}_${Math.round(z / tolerance) * tolerance}`;
      
      if (!vertexMap.has(key)) {
        vertexMap.set(key, uniqueVertices.length);
        uniqueVertices.push({ x, y, z, index: i });
      }
    }

    // console.log(`Unique vertices: ${uniqueVertices.length} (removed ${vertexCount - uniqueVertices.length} duplicates)`);

    // Store original positions for noise deformation
    if (this.options.deformMesh && !geometry.userData.originalPositions) {
      geometry.userData.originalPositions = positionAttribute.array.slice();
    }

    // Create geometry for unique vertices only
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(uniqueVertices.length * 3);
    
    // Fill position buffer with unique vertices
    uniqueVertices.forEach((vertex, i) => {
      positions[i * 3] = vertex.x;
      positions[i * 3 + 1] = vertex.y;
      positions[i * 3 + 2] = vertex.z;
    });
    
    particlesGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );

    // Create arrays for size and color
    const sizes = new Float32Array(uniqueVertices.length);
    const colors = new Float32Array(uniqueVertices.length * 3);

    // Fill arrays with random values
    for (let i = 0; i < uniqueVertices.length; i++) {
      // Size with more dramatic variation
      const sizeVariation = Math.random();
      
      // Use different distribution for more noticeable size differences
      // Some particles very small, some medium, some large
      let size;
      if (sizeVariation < 0.6) {
        // 60% small particles
        size = this.options.size.min + (this.options.size.max - this.options.size.min) * 0.2 * Math.random();
      } else if (sizeVariation < 0.9) {
        // 30% medium particles
        size = this.options.size.min + (this.options.size.max - this.options.size.min) * (0.3 + 0.3 * Math.random());
      } else {
        // 10% large particles
        size = this.options.size.min + (this.options.size.max - this.options.size.min) * (0.7 + 0.3 * Math.random());
      }
      
      sizes[i] = size;

      // Random color selection from predefined colors
      const colorChoice = this.options.colors[Math.floor(Math.random() * this.options.colors.length)];
      
      // Add slight variation to the chosen color
      const colorVariation = 0.1;
      colors[i * 3] = colorChoice.r + (Math.random() - 0.5) * colorVariation;
      colors[i * 3 + 1] = colorChoice.g + (Math.random() - 0.5) * colorVariation;
      colors[i * 3 + 2] = colorChoice.b + (Math.random() - 0.5) * colorVariation;
      
      // Clamp values between 0 and 1
      colors[i * 3] = Math.max(0, Math.min(1, colors[i * 3]));
      colors[i * 3 + 1] = Math.max(0, Math.min(1, colors[i * 3 + 1]));
      colors[i * 3 + 2] = Math.max(0, Math.min(1, colors[i * 3 + 2]));
    }

    // Add size and color attributes
    particlesGeometry.setAttribute(
      'size',
      new THREE.BufferAttribute(sizes, 1)
    );
    particlesGeometry.setAttribute(
      'color',
      new THREE.BufferAttribute(colors, 3)
    );

    // Store the vertex map for animation updates
    particlesGeometry.userData.vertexMap = vertexMap;
    particlesGeometry.userData.uniqueVertices = uniqueVertices;

    // Load texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      this.options.texture,
      (texture) => {
        this.createParticleSystemForMesh(mesh, particlesGeometry, texture);
      },
      () => {
        console.warn(`Could not load particle texture: ${this.options.texture}, using default`);
        const defaultTexture = this.createDefaultTexture();
        this.createParticleSystemForMesh(mesh, particlesGeometry, defaultTexture);
      }
    );
  }

  createDefaultTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");

    // Draw a soft white circle with gradient
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.5)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  createParticleSystemForMesh(mesh, geometry, texture) {
    // Shader material
    const vertexShader = `
      attribute float size;
      varying vec3 vColor;
      uniform float baseSize;
      
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        
        // More controllable size calculation
        float distance = length(mvPosition.xyz);
        float attenuation = 1.0 / (1.0 + 0.01 * distance);
        
        // Use baseSize as a multiplier for better control
        gl_PointSize = size * baseSize * attenuation * 100.0;
        
        // Clamp to reasonable values
        gl_PointSize = clamp(gl_PointSize, 0.1, 200.0);
        
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const fragmentShader = `
      uniform sampler2D pointTexture;
      uniform float opacity;
      varying vec3 vColor;
      
      void main() {
        vec4 textureColor = texture2D(pointTexture, gl_PointCoord);
        gl_FragColor = vec4(vColor, opacity) * textureColor;
        
        if (gl_FragColor.a < 0.01) discard;
      }
    `;

    // Create shader material with baseSize uniform
    const particlesMaterial = new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: { value: texture },
        opacity: { value: this.options.opacity },
        baseSize: { value: this.options.baseSize || 1.0 }
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      blending: this.options.blending,
      depthWrite: false,
      transparent: true,
      vertexColors: true,
    });

    // Create points
    const particles = new THREE.Points(geometry, particlesMaterial);
    
    // Set render order
    particles.renderOrder = 10;

    // Add particles as child of the mesh
    mesh.add(particles);

    // Store references
    if (!this.particles) {
      this.particles = particles; // Keep reference to first particle system
      this.particlesGeometry = geometry;
      this.particlesMaterial = particlesMaterial;
    }
    
    this.sourceMeshes.push({
      mesh: mesh,
      particles: particles,
      geometry: geometry,
      material: particlesMaterial
    });
  }

  // Improved smooth noise function using simplex-like approach
  noise3D(x, y, z) {
    // Create a more continuous noise using multiple octaves
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;
    
    // Use 3 octaves for smooth variation
    for (let i = 0; i < 3; i++) {
      value += this.simplexNoise(
        x * frequency,
        y * frequency,
        z * frequency
      ) * amplitude;
      
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    
    return value / maxValue;
  }
  
  // Simplified simplex-like noise
  simplexNoise(x, y, z) {
    // Use sine waves with different frequencies for smooth variation
    const n1 = Math.sin(x * 1.2 + y * 0.8 + z * 0.6);
    const n2 = Math.sin(x * 0.7 - y * 1.1 + z * 0.9) * 0.5;
    const n3 = Math.sin(x * 0.9 + y * 0.5 - z * 1.3) * 0.25;
    const n4 = Math.sin(x * 1.5 - y * 0.6 + z * 0.4) * 0.125;
    
    // Combine the waves for complex but smooth patterns
    return (n1 + n2 + n3 + n4) * 0.5;
  }
  
  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  animate(delta) {
    const time = Date.now() * 0.001 * this.options.noiseSpeed;
    
    this.sourceMeshes.forEach(({ mesh, particles, geometry }) => {
      if (!particles || !geometry) return;
      
      // For deduplicated vertices, we need to handle animation differently
      const uniqueVertices = geometry.userData.uniqueVertices;
      const positions = geometry.attributes.position;
      
      if (uniqueVertices) {
        // Update particle positions based on unique vertices
        const meshPositions = mesh.geometry.attributes.position;
        
        for (let i = 0; i < uniqueVertices.length; i++) {
          const vertex = uniqueVertices[i];
          const originalIndex = vertex.index;
          
          // Get the current position from the animated mesh
          let x = meshPositions.getX(originalIndex);
          let y = meshPositions.getY(originalIndex);
          let z = meshPositions.getZ(originalIndex);
          
          // Apply noise deformation if enabled
          if (this.options.deformMesh) {
            const noiseX = this.noise3D(
              x * this.options.noiseScale + time,
              y * this.options.noiseScale,
              z * this.options.noiseScale
            );
            const noiseY = this.noise3D(
              x * this.options.noiseScale,
              y * this.options.noiseScale + time,
              z * this.options.noiseScale
            );
            const noiseZ = this.noise3D(
              x * this.options.noiseScale,
              y * this.options.noiseScale,
              z * this.options.noiseScale + time
            );
            
            x += noiseX * this.options.noiseStrength;
            y += noiseY * this.options.noiseStrength;
            z += noiseZ * this.options.noiseStrength;
          }
          
          // Add floating motion
          const floatOffset = Math.sin(time * 1.5 + i * 0.1) * 0.002;
          const sideOffset = Math.cos(time * 1.2 + i * 0.15) * 0.001;
          
          // Update particle position
          positions.setXYZ(i, x + sideOffset, y + floatOffset, z);
        }
      } else {
        // Original animation code for non-deduplicated geometry
        // Deform mesh vertices with noise
        if (this.options.deformMesh && mesh.geometry.userData.originalPositions) {
          const meshPositions = mesh.geometry.attributes.position;
          const originalPositions = mesh.geometry.userData.originalPositions;
          
          for (let i = 0; i < meshPositions.count; i++) {
            const idx = i * 3;
            
            // Get original position
            const x = originalPositions[idx];
            const y = originalPositions[idx + 1];
            const z = originalPositions[idx + 2];
            
            // Calculate noise based on position and time
            const noiseX = this.noise3D(
              x * this.options.noiseScale + time,
              y * this.options.noiseScale,
              z * this.options.noiseScale
            );
            const noiseY = this.noise3D(
              x * this.options.noiseScale,
              y * this.options.noiseScale + time,
              z * this.options.noiseScale
            );
            const noiseZ = this.noise3D(
              x * this.options.noiseScale,
              y * this.options.noiseScale,
              z * this.options.noiseScale + time
            );
            
            // Apply deformation
            meshPositions.setXYZ(
              i,
              x + noiseX * this.options.noiseStrength,
              y + noiseY * this.options.noiseStrength,
              z + noiseZ * this.options.noiseStrength
            );
          }
          
          meshPositions.needsUpdate = true;
        }
        
        // Update particle positions
        const meshPositions = mesh.geometry.attributes.position;
        
        for (let i = 0; i < positions.count; i++) {
          // Get the current mesh vertex position
          const meshX = meshPositions.getX(i);
          const meshY = meshPositions.getY(i);
          const meshZ = meshPositions.getZ(i);
          
          // Add a small floating offset that varies per particle
          const floatOffset = Math.sin(time * 1.5 + i * 0.1) * 0.002;
          const sideOffset = Math.cos(time * 1.2 + i * 0.15) * 0.001;
          
          // Update particle position based on mesh position plus small offsets
          positions.setXYZ(
            i,
            meshX + sideOffset,
            meshY + floatOffset,
            meshZ
          );
        }
      }
      
      positions.needsUpdate = true;
    });
  }

  dispose() {
    // Dispose all particle systems
    this.sourceMeshes.forEach(({ mesh, particles, geometry, material }) => {
      if (particles) {
        mesh.remove(particles);
      }
      if (geometry) {
        geometry.dispose();
      }
      if (material) {
        material.dispose();
      }
      
      // Restore original material if it was replaced
      if (mesh.userData.originalMaterial) {
        mesh.material = mesh.userData.originalMaterial;
        delete mesh.userData.originalMaterial;
      }
    });
    
    this.sourceMeshes = [];
    this.particles = null;
    this.particlesGeometry = null;
    this.particlesMaterial = null;
  }
};

// Helper function to create dust particles for objects with "particle_" in their name
export function createVertexDustFromScene(scene) {
  const particleSystems = [];
  
  scene.traverse((object) => {
    if (object.name && object.name.includes("particle_")) {
    //   console.log(`\n--- Processing object: ${object.name} ---`);
    //   console.log(`Object type: ${object.type}`);
    //   console.log(`Has geometry: ${object.geometry ? 'Yes' : 'No'}`);
    //   console.log(`Children count: ${object.children.length}`);
      
      const dustSystem = new useVertexDustParticles(scene, object);
      particleSystems.push(dustSystem);
    }
  });
  
//   console.log(`\nCreated ${particleSystems.length} particle systems`);
  return particleSystems;
}