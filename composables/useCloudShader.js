import * as THREE from "three";

export const useCloudShader = class CloudShaderHandler {
  constructor(config) {
    this.plane = null;
    this.material = null;
    this.uniforms = null;
    this.clock = new THREE.Clock();
    this.isInitialized = false;
    this.config = config;
  }

  // Create the enhanced volumetric cloud shader material with transparent background
  createShaderMaterial() {
    const vertexShader = `
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float iTime;
      uniform vec2 iResolution;
      varying vec2 vUv;

      // High-quality hash function for better randomness
      vec3 hash3(vec2 p) {
          vec3 q = vec3(dot(p, vec2(127.1, 311.7)), 
                        dot(p, vec2(269.5, 183.3)), 
                        dot(p, vec2(419.2, 371.9)));
          return fract(sin(q) * 43758.5453);
      }

      vec2 hash2(vec2 p) {
          return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), 
                                dot(p, vec2(269.5, 183.3)))) * 43758.5453);
      }

      // Quintic interpolation for ultra-smooth transitions
      vec2 quintic(vec2 t) {
          return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
      }

      // High-quality gradient noise with quintic interpolation
      float gradientNoise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          
          // Quintic interpolation
          vec2 u = quintic(f);
          
          // Generate gradients at four corners
          vec2 ga = hash2(i + vec2(0.0, 0.0)) * 2.0 - 1.0;
          vec2 gb = hash2(i + vec2(1.0, 0.0)) * 2.0 - 1.0;
          vec2 gc = hash2(i + vec2(0.0, 1.0)) * 2.0 - 1.0;
          vec2 gd = hash2(i + vec2(1.0, 1.0)) * 2.0 - 1.0;
          
          // Calculate dot products
          float va = dot(ga, f - vec2(0.0, 0.0));
          float vb = dot(gb, f - vec2(1.0, 0.0));
          float vc = dot(gc, f - vec2(0.0, 1.0));
          float vd = dot(gd, f - vec2(1.0, 1.0));
          
          // Interpolate
          return mix(mix(va, vb, u.x), mix(vc, vd, u.x), u.y) * 0.5 + 0.5;
      }

      // Improved Fractal Brownian Motion with better frequency distribution
      float fbm(vec2 p, int octaves) {
          float value = 0.0;
          float amplitude = 0.5;
          float frequency = 1.0;
          float maxValue = 0.0;
          
          for (int i = 0; i < octaves; i++) {
              value += amplitude * gradientNoise(p * frequency);
              maxValue += amplitude;
              frequency *= 2.17; // Non-integer multiplier to avoid repetition
              amplitude *= 0.47; // Slightly lower persistence for smoother result
          }
          
          return value / maxValue; // Normalize
      }

      // Enhanced Worley noise with smoother falloff
      float worleyNoise(vec2 p) {
          vec2 id = floor(p);
          vec2 f = fract(p);
          
          float minDist1 = 1.0;
          float minDist2 = 1.0;
          
          for (int y = -1; y <= 1; y++) {
              for (int x = -1; x <= 1; x++) {
                  vec2 offset = vec2(float(x), float(y));
                  vec2 r = offset + hash2(id + offset) - f;
                  float d = dot(r, r);
                  
                  if (d < minDist1) {
                      minDist2 = minDist1;
                      minDist1 = d;
                  } else if (d < minDist2) {
                      minDist2 = d;
                  }
              }
          }
          
          // Return smooth falloff based on distance difference
          return 1.0 - smoothstep(0.0, 0.8, sqrt(minDist1));
      }

      void main() {
          // High-precision UV coordinates with subpixel precision
          vec2 uv = vUv;
          vec2 aspectUV = uv;
          aspectUV.x *= iResolution.x / iResolution.y;
          
          // Adjustable animation speed - increase multiplier for faster animation
          float time = iTime * 2.0; // Change this value: 0.5 = slow, 1.0 = normal, 2.0 = fast
          
          // Center coordinates for cloud positioning
          vec2 center = vec2(iResolution.x / iResolution.y * 0.5, 0.6);
          vec2 centered = aspectUV - center;
          
          // Base cloud shape with smooth falloff
          float ellipse = length(centered * vec2(0.8, 1.2)); // Adjust cloud proportions
          float cloudMask = 1.0 - smoothstep(0.25, 0.45, ellipse);
          
          // Multi-layer noise distortion for organic shape
          vec2 warp1 = vec2(
              fbm(centered * 1.8 + vec2(time * 0.1, 0.0), 4) - 0.5,
              fbm(centered * 1.8 + vec2(0.0, time * 0.1), 4) - 0.5
          ) * 0.15;
          
          vec2 warp2 = vec2(
              fbm(centered * 3.5 + warp1 + vec2(time * 0.05, 0.0), 3) - 0.5,
              fbm(centered * 3.5 + warp1 + vec2(0.0, time * 0.03), 3) - 0.5
          ) * 0.08;
          
          vec2 distortedPos = centered + warp1 + warp2;
          
          // Recalculate cloud mask with distortion
          ellipse = length(distortedPos * vec2(0.8, 1.2));
          cloudMask = 1.0 - smoothstep(0.2, 0.5, ellipse);
          
          // Multi-octave cloud density
          float cloudDensity = 0.0;
          
          // Large scale structure
          cloudDensity += fbm(aspectUV * 2.5 + vec2(time * 0.02, 0.0), 6) * 0.6;
          
          // Medium details
          cloudDensity += fbm(aspectUV * 6.0 + warp1 + vec2(time * 0.1, time * 0.15), 4) * 0.3;
          
          // Fine cellular details
          cloudDensity += worleyNoise(aspectUV * 4.0 + warp2 + vec2(time * 0.1, 0.0)) * 0.2;
          
          // Small scale turbulence
          cloudDensity += fbm(aspectUV * 12.0 + warp1 * 2.0, 3) * 0.1;
          
          // Apply cloud mask with smooth edges
          cloudDensity *= cloudMask;
          
          // Enhanced contrast curve for better definition
          cloudDensity = pow(max(0.0, cloudDensity - 0.15), 1.2) * 1.8;
          cloudDensity = smoothstep(0.1, 0.85, cloudDensity);
          
          // Volumetric cloud color with purple tint
          // Base color now has a purple tint instead of pure gray

          vec3 cloudColor = vec3(0.5, 0.2, 0.4); // Subtle purple tint (more red and blue than green)
          
          // Add subtle depth shading - reduced intensity
          float depthNoise = fbm(aspectUV * 3.0 + vec2(time * 0.1, 0.0), 4);
          float heightGradient = (distortedPos.y + 10.3) * 0.4;
          
          // Color variation maintains purple tone
          cloudColor *= vec3(
              1.0 - depthNoise * 0.05 - heightGradient * 0.03,
              1.0 - depthNoise * 0.03 - heightGradient * 0.02,
              1.0 - depthNoise * 0.02
          );
          
          // Rim lighting with subtle purple highlight
          float rimLight = pow(1.0 - cloudDensity, 3.0) * cloudDensity * 0.1;
          cloudColor += vec3(rimLight * 0.4, rimLight * 0.3, rimLight * 0.5); // More purple in highlights
          
          // Gamma correction for proper color space
          cloudColor = pow(cloudColor, vec3(1.0/2.2));
          
          // VERY LOW OPACITY - reduce cloud density significantly
          float finalAlpha = cloudDensity * 0.003; // Multiply by 0.15 for very low opacity
          
          // Output with transparency - cloud density becomes alpha
          gl_FragColor = vec4(cloudColor, finalAlpha);
      }
    `;

    // Create uniforms for the shader
    this.uniforms = {
      iTime: { value: 0.0 },
      iResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
    };

    // Create the shader material with enhanced transparency settings
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true,
      // side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
      depthWrite: false,
      depthTest: true,
      alphaTest: 0.001, // Very low alpha test for subtle transparency
    });

    return this.material;
  }

  // Create the plane geometry and mesh
  createPlane() {
    const geometry = new THREE.PlaneGeometry(
      this.config.size.width,
      this.config.size.height
    );

    this.plane = new THREE.Mesh(geometry, this.material);

    // Set position
    this.plane.position.set(
      this.config.position.x,
      this.config.position.y,
      this.config.position.z
    );

    // Set rotation
    this.plane.rotation.set(
      this.config.rotation.x,
      this.config.rotation.y,
      this.config.rotation.z
    );

    return this.plane;
  }

  // Initialize the cloud shader plane
  init(scene) {
    this.createShaderMaterial();
    this.createPlane();

    scene.add(this.plane);

    this.isInitialized = true;
    return this.plane;
  }

  // Update shader uniforms (call this in your animation loop)
  update(delta) {
    if (!this.isInitialized || !this.uniforms) return;

    // Update time uniform
    this.uniforms.iTime.value += delta * this.config.timeSpeed;

    // Update resolution if window was resized
    if (this.uniforms.iResolution) {
      this.uniforms.iResolution.value.set(
        window.innerWidth,
        window.innerHeight
      );
    }
  }

  // Get the plane mesh
  getPlane() {
    return this.plane;
  }

  // Method to adjust cloud opacity at runtime
  setCloudOpacity(opacity) {
    if (!this.material) return;

    // This affects the overall opacity multiplier
    // You can modify the shader to use a uniform for this
    this.material.opacity = Math.max(0.0, Math.min(1.0, opacity));
  }
};