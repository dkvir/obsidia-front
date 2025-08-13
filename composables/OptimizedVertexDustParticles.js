import * as THREE from "three";
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';

// Optimized Vertex Dust Particles with GPU-based animation
export class OptimizedVertexDustParticles {
  constructor(scene, objects, options = {}) {
    this.scene = scene;
    this.objects = Array.isArray(objects) ? objects : [objects];
    this.disposed = false;
    
    // Performance settings
    this.LOD_DISTANCES = {
      high: 50,
      medium: 100,
      low: 200,
      hide: 300
    };
    
    // Particle configuration based on type
    this.particleTypes = {
      big: {
        size: { min: 0.01, max: 0.9 },
        baseSize: 1.5,
        opacity: 0.01,
        noiseScale: 0.6,
        noiseStrength: 0.5,
        noiseSpeed: 0.2,
        densityFactor: 0.5
      },
      normal: {
        size: { min: 0.1, max: 1.0 },
        baseSize: 1.0,
        opacity: 0.01,
        noiseScale: 0.5,
        noiseStrength: 0.1,
        noiseSpeed: 0.3,
        densityFactor: 0.7
      },
      small: {
        size: { min: 0.5, max: 0.7 },
        baseSize: 0.5,
        opacity: 0.02,
        noiseScale: 1.0,
        noiseStrength: 0.2,
        noiseSpeed: 0.7,
        densityFactor: 1.0
      }
    };
    
    // Merged options
    this.options = this.getMergedOptions(options);
    
    // Particle system components
    this.instancedMesh = null;
    this.material = null;
    this.lod = null;
    this.textureCache = new Map();
    
    this.init();
  }
  
  getMergedOptions(customOptions) {
    // Determine particle type from object names
    let particleType = 'normal';
    
    for (const obj of this.objects) {
      if (obj.name && obj.name.includes("particle_")) {
        if (obj.name.includes("big")) {
          particleType = 'big';
          break;
        } else if (obj.name.includes("small")) {
          particleType = 'small';
          break;
        }
      }
    }
    
    const preset = this.particleTypes[particleType];
    
    return {
      ...preset,
      ...customOptions,
      particleType,
      colors: [
        new THREE.Color(1, 0.6, 0.2), // Orange
        new THREE.Color(1, 0.8, 0.4), // Light Orange
        new THREE.Color(1, 1, 1),      // White
      ],
      hideMesh: true,
      deformMesh: true,
      texture: "./images/dust_particle.png"
    };
  }
  
  init() {
    if (this.disposed) return;
    
    // Extract and process meshes
    const meshData = this.extractAndProcessMeshes();
    
    if (meshData.length === 0) {
      console.warn('No valid meshes found for particle system');
      return;
    }
    
    // Create LOD system
    this.createLODParticleSystem(meshData);
    
    // Hide original meshes if needed
    if (this.options.hideMesh) {
      this.hideOriginalMeshes(meshData);
    }
  }
  
  extractAndProcessMeshes() {
    const meshData = [];
    const processedMeshes = new Set();
    
    const processMesh = (mesh) => {
      if (processedMeshes.has(mesh)) return;
      processedMeshes.add(mesh);
      
      if (mesh.isMesh && mesh.geometry && mesh.geometry.attributes.position) {
        // Clone geometry to avoid modifying original
        const geometry = mesh.geometry.clone();
        geometry.applyMatrix4(mesh.matrixWorld);
        
        // Deduplicate vertices efficiently
        const mergedGeometry = BufferGeometryUtils.mergeVertices(geometry, 0.0001);
        
        meshData.push({
          mesh: mesh,
          geometry: mergedGeometry,
          vertexCount: mergedGeometry.attributes.position.count
        });
      }
    };
    
    // Process all objects and their children
    this.objects.forEach(obj => {
      if (obj.isMesh) {
        processMesh(obj);
      }
      obj.traverse(child => {
        if (child.isMesh && child !== obj) {
          processMesh(child);
        }
      });
    });
    
    return meshData;
  }
  
  createLODParticleSystem(meshData) {
    // Merge all geometries
    const geometries = meshData.map(data => data.geometry);
    const mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries);
    const totalVertexCount = mergedGeometry.attributes.position.count;
    
    // Clean up individual geometries
    geometries.forEach(g => g.dispose());
    
    // Create LOD
    this.lod = new THREE.LOD();
    
    // Load or create texture
    this.loadParticleTexture((texture) => {
      // Create different detail levels
      const detailLevels = [
        { factor: 1.0, distance: this.LOD_DISTANCES.high },    // High detail
        { factor: 0.5, distance: this.LOD_DISTANCES.medium },  // Medium detail
        { factor: 0.2, distance: this.LOD_DISTANCES.low },     // Low detail
      ];
      
      detailLevels.forEach(level => {
        const particleSystem = this.createParticleLevel(
          mergedGeometry,
          totalVertexCount,
          level.factor,
          texture
        );
        this.lod.addLevel(particleSystem, level.distance);
      });
      
      // Add empty object for far distance (hide completely)
      this.lod.addLevel(new THREE.Object3D(), this.LOD_DISTANCES.hide);
      
      this.scene.add(this.lod);
      
      // Clean up merged geometry after using it
      mergedGeometry.dispose();
    });
  }
  
  createParticleLevel(sourceGeometry, vertexCount, densityFactor, texture) {
    const instanceCount = Math.floor(vertexCount * densityFactor * this.options.densityFactor);
    
    // Create instanced buffer geometry
    const particleGeometry = new THREE.PlaneGeometry(0.1, 0.1);
    
    // Create shader material with GPU-based animation
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        particleTexture: { value: texture },
        baseOpacity: { value: this.options.opacity },
        baseSize: { value: this.options.baseSize },
        noiseScale: { value: this.options.noiseScale },
        noiseStrength: { value: this.options.noiseStrength },
        noiseSpeed: { value: this.options.noiseSpeed }
      },
      vertexShader: `
        attribute vec3 instancePosition;
        attribute float instanceScale;
        attribute vec3 instanceColor;
        attribute float instanceRandom;
        
        uniform float time;
        uniform float baseSize;
        uniform float noiseScale;
        uniform float noiseStrength;
        uniform float noiseSpeed;
        
        varying vec3 vColor;
        varying float vOpacity;
        
        // Optimized GPU noise function
        vec3 noise3D(vec3 p, float t) {
          float nt = t * noiseSpeed;
          return vec3(
            sin(p.x * noiseScale * 1.2 + p.y * noiseScale * 0.8 + nt),
            sin(p.y * noiseScale * 1.1 + p.z * noiseScale * 0.9 + nt * 0.8),
            sin(p.z * noiseScale * 1.3 + p.x * noiseScale * 0.6 + nt * 1.2)
          ) * noiseStrength;
        }
        
        void main() {
          vColor = instanceColor;
          
          // Animate opacity
          vOpacity = 0.3 + sin(time * 2.0 + instanceRandom * 6.28) * 0.7;
          
          // Apply noise deformation
          vec3 noiseOffset = noise3D(instancePosition, time);
          vec3 animatedPosition = instancePosition + noiseOffset;
          
          // Add floating motion
          float floatOffset = sin(time * 1.5 + instanceRandom * 3.14) * 0.02;
          animatedPosition.y += floatOffset;
          
          // Calculate final position
          vec3 transformed = position * instanceScale * baseSize + animatedPosition;
          
          vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          // Size attenuation
          gl_PointSize = (instanceScale * baseSize * 100.0) / -mvPosition.z;
          gl_PointSize = clamp(gl_PointSize, 1.0, 100.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D particleTexture;
        uniform float baseOpacity;
        
        varying vec3 vColor;
        varying float vOpacity;
        
        void main() {
          vec2 uv = gl_PointCoord;
          vec4 texColor = texture2D(particleTexture, uv);
          
          float finalOpacity = baseOpacity * vOpacity * texColor.a;
          gl_FragColor = vec4(vColor * texColor.rgb, finalOpacity);
          
          if (gl_FragColor.a < 0.001) discard;
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    });
    
    // Create instanced mesh
    const instancedMesh = new THREE.InstancedMesh(particleGeometry, material, instanceCount);
    instancedMesh.frustumCulled = true;
    
    // Setup instance attributes
    const positions = new Float32Array(instanceCount * 3);
    const scales = new Float32Array(instanceCount);
    const colors = new Float32Array(instanceCount * 3);
    const randoms = new Float32Array(instanceCount);
    
    const positionAttribute = sourceGeometry.attributes.position;
    const vertexIndices = new Uint32Array(instanceCount);
    
    // Generate random vertex indices for better distribution
    for (let i = 0; i < instanceCount; i++) {
      vertexIndices[i] = Math.floor(Math.random() * vertexCount);
    }
    
    // Setup instance data
    for (let i = 0; i < instanceCount; i++) {
      const vertexIndex = vertexIndices[i];
      
      // Position from vertex
      positions[i * 3] = positionAttribute.getX(vertexIndex);
      positions[i * 3 + 1] = positionAttribute.getY(vertexIndex);
      positions[i * 3 + 2] = positionAttribute.getZ(vertexIndex);
      
      // Random scale with variation
      const scaleRandom = Math.random();
      if (scaleRandom < 0.6) {
        scales[i] = this.options.size.min + (this.options.size.max - this.options.size.min) * 0.2 * Math.random();
      } else if (scaleRandom < 0.9) {
        scales[i] = this.options.size.min + (this.options.size.max - this.options.size.min) * 0.5 * Math.random();
      } else {
        scales[i] = this.options.size.min + (this.options.size.max - this.options.size.min) * Math.random();
      }
      
      // Random color from palette
      const color = this.options.colors[Math.floor(Math.random() * this.options.colors.length)];
      const colorVariation = 0.1;
      
      colors[i * 3] = THREE.MathUtils.clamp(color.r + (Math.random() - 0.5) * colorVariation, 0, 1);
      colors[i * 3 + 1] = THREE.MathUtils.clamp(color.g + (Math.random() - 0.5) * colorVariation, 0, 1);
      colors[i * 3 + 2] = THREE.MathUtils.clamp(color.b + (Math.random() - 0.5) * colorVariation, 0, 1);
      
      // Random value for animation variation
      randoms[i] = Math.random();
    }
    
    // Add instance attributes
    instancedMesh.geometry.setAttribute('instancePosition', new THREE.InstancedBufferAttribute(positions, 3));
    instancedMesh.geometry.setAttribute('instanceScale', new THREE.InstancedBufferAttribute(scales, 1));
    instancedMesh.geometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(colors, 3));
    instancedMesh.geometry.setAttribute('instanceRandom', new THREE.InstancedBufferAttribute(randoms, 1));
    
    // Store material reference for animation
    if (!this.material) {
      this.material = material;
    }
    
    return instancedMesh;
  }
  
  loadParticleTexture(callback) {
    const cachedTexture = this.textureCache.get(this.options.texture);
    
    if (cachedTexture) {
      callback(cachedTexture);
      return;
    }
    
    const textureLoader = new THREE.TextureLoader();
    
    textureLoader.load(
      this.options.texture,
      (texture) => {
        // Optimize texture settings
        texture.minFilter = THREE.LinearMipMapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = true;
        
        this.textureCache.set(this.options.texture, texture);
        callback(texture);
      },
      undefined,
      (error) => {
        console.warn(`Failed to load particle texture: ${this.options.texture}`, error);
        const defaultTexture = this.createDefaultTexture();
        this.textureCache.set('default', defaultTexture);
        callback(defaultTexture);
      }
    );
  }
  
  createDefaultTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");

    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.4, "rgba(255, 255, 255, 0.8)");
    gradient.addColorStop(0.8, "rgba(255, 255, 255, 0.2)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    return texture;
  }
  
  hideOriginalMeshes(meshData) {
    meshData.forEach(({ mesh }) => {
      // Store original material for potential restoration
      if (!mesh.userData.originalMaterial) {
        mesh.userData.originalMaterial = mesh.material;
      }
      
      // Make mesh invisible
      mesh.visible = false;
    });
  }
  
  animate(delta) {
    if (this.disposed || !this.material) return;
    
    // Update time uniform for GPU animation
    this.material.uniforms.time.value += delta;
    
    // Update LOD based on camera distance
    if (this.lod && this.scene.camera) {
      this.lod.update(this.scene.camera);
    }
  }
  
  dispose() {
    if (this.disposed) return;
    
    this.disposed = true;
    
    // Dispose LOD and its levels
    if (this.lod) {
      this.lod.traverse((child) => {
        if (child.isMesh || child.isPoints) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (child.material.uniforms && child.material.uniforms.particleTexture) {
              const texture = child.material.uniforms.particleTexture.value;
              if (texture && texture.dispose) texture.dispose();
            }
            child.material.dispose();
          }
        }
      });
      
      if (this.lod.parent) {
        this.lod.parent.remove(this.lod);
      }
    }
    
    // Clear texture cache
    this.textureCache.forEach(texture => {
      if (texture && texture.dispose) texture.dispose();
    });
    this.textureCache.clear();
    
    // Restore original meshes
    if (this.options.hideMesh) {
      this.objects.forEach(obj => {
        obj.traverse(child => {
          if (child.isMesh && child.userData.originalMaterial) {
            child.material = child.userData.originalMaterial;
            child.visible = true;
            delete child.userData.originalMaterial;
          }
        });
      });
    }
    
    // Clear references
    this.instancedMesh = null;
    this.material = null;
    this.lod = null;
  }
}

// Optimized helper function to create particle systems from scene
export function createVertexDustFromScene(scene) {
  const particleSystems = [];
  const particleObjects = new Map(); // Group by type
  
  // Group objects by particle type
  scene.traverse((object) => {
    if (object.name && object.name.includes("particle_")) {
      let type = 'normal';
      
      if (object.name.includes("big")) {
        type = 'big';
      } else if (object.name.includes("small")) {
        type = 'small';
      }
      
      if (!particleObjects.has(type)) {
        particleObjects.set(type, []);
      }
      
      particleObjects.get(type).push(object);
    }
  });
  
  // Create a single particle system for each type
  particleObjects.forEach((objects, type) => {
    if (objects.length > 0) {
      const particleSystem = new OptimizedVertexDustParticles(scene, objects);
      particleSystems.push(particleSystem);
    }
  });
  
  return particleSystems;
}