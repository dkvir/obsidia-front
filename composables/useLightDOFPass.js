import * as THREE from 'three';
import { Pass } from 'three/examples/jsm/postprocessing/Pass.js';

export class useLightDOFPass extends Pass {
  constructor(scene, camera, params = {}) {
    super();

    this.scene = scene;
    this.camera = camera;
    this.needsSwap = true;

    // Simplified parameters for performance
    this.params = {
      focus: params.focus || 10.0,
      aperture: params.aperture || 0.025,
      maxblur: params.maxblur || 0.01
    };

    // Use lower resolution for blur passes (significant performance boost)
    const sizeDivider = params.sizeDivider || 2;
    const width = (params.width || window.innerWidth) / sizeDivider;
    const height = (params.height || window.innerHeight) / sizeDivider;

    // Single depth texture (reuse scene depth if available)
    this.depthMaterial = new THREE.MeshDepthMaterial();
    this.depthMaterial.depthPacking = THREE.RGBADepthPacking;
    this.depthMaterial.blending = THREE.NoBlending;

    // Render targets
    this.renderTargetDepth = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat
    });

    this.renderTargetBlur = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat
    });

    // Simple blur material - horizontal pass
    this.blurMaterialH = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        tDepth: { value: null },
        focus: { value: this.params.focus },
        aperture: { value: this.params.aperture },
        maxblur: { value: this.params.maxblur },
        nearClip: { value: camera.near },
        farClip: { value: camera.far },
        resolution: { value: new THREE.Vector2(width, height) },
        direction: { value: new THREE.Vector2(1.0, 0.0) }
      },

      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,

      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform sampler2D tDepth;
        uniform float focus;
        uniform float aperture;
        uniform float maxblur;
        uniform float nearClip;
        uniform float farClip;
        uniform vec2 resolution;
        uniform vec2 direction;

        varying vec2 vUv;

        float unpackDepth(vec4 rgbaDepth) {
          const vec4 bitShift = vec4(1.0, 1.0/256.0, 1.0/(256.0*256.0), 1.0/(256.0*256.0*256.0));
          return dot(rgbaDepth, bitShift);
        }

        float getViewZ(float depth) {
          return nearClip + (farClip - nearClip) * depth;
        }

        void main() {
          float depth = unpackDepth(texture2D(tDepth, vUv));
          float viewZ = getViewZ(depth);
          
          // Simple CoC calculation
          float coc = aperture * abs(viewZ - focus) / viewZ;
          coc = clamp(coc, -maxblur, maxblur);
          
          // Skip blur for in-focus areas
          if (abs(coc) < 0.001) {
            gl_FragColor = texture2D(tDiffuse, vUv);
            return;
          }
          
          // 5-tap Gaussian blur (much faster than multi-ring sampling)
          vec2 texelSize = direction / resolution;
          vec3 result = texture2D(tDiffuse, vUv).rgb * 0.227027;
          
          vec2 offset1 = texelSize * 1.3846153846 * abs(coc);
          vec2 offset2 = texelSize * 3.2307692308 * abs(coc);
          
          result += texture2D(tDiffuse, vUv + offset1).rgb * 0.3162162162;
          result += texture2D(tDiffuse, vUv - offset1).rgb * 0.3162162162;
          result += texture2D(tDiffuse, vUv + offset2).rgb * 0.0702702703;
          result += texture2D(tDiffuse, vUv - offset2).rgb * 0.0702702703;
          
          gl_FragColor = vec4(result, 1.0);
        }
      `,
      depthWrite: false
    });

    // Vertical blur pass
    this.blurMaterialV = this.blurMaterialH.clone();
    this.blurMaterialV.uniforms.direction.value = new THREE.Vector2(0.0, 1.0);

    // Final composite material
    this.compositeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tOriginal: { value: null },
        tBlurred: { value: null },
        tDepth: { value: null },
        focus: { value: this.params.focus },
        aperture: { value: this.params.aperture },
        maxblur: { value: this.params.maxblur },
        nearClip: { value: camera.near },
        farClip: { value: camera.far }
      },

      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,

      fragmentShader: `
        uniform sampler2D tOriginal;
        uniform sampler2D tBlurred;
        uniform sampler2D tDepth;
        uniform float focus;
        uniform float aperture;
        uniform float maxblur;
        uniform float nearClip;
        uniform float farClip;

        varying vec2 vUv;

        float unpackDepth(vec4 rgbaDepth) {
          const vec4 bitShift = vec4(1.0, 1.0/256.0, 1.0/(256.0*256.0), 1.0/(256.0*256.0*256.0));
          return dot(rgbaDepth, bitShift);
        }

        float getViewZ(float depth) {
          return nearClip + (farClip - nearClip) * depth;
        }

        void main() {
          vec3 original = texture2D(tOriginal, vUv).rgb;
          vec3 blurred = texture2D(tBlurred, vUv).rgb;
          
          float depth = unpackDepth(texture2D(tDepth, vUv));
          float viewZ = getViewZ(depth);
          
          // Calculate blur amount
          float coc = aperture * abs(viewZ - focus) / viewZ;
          float blur = smoothstep(0.0, maxblur, abs(coc));
          
          // Mix based on depth
          vec3 final = mix(original, blurred, blur);
          
          gl_FragColor = vec4(final, 1.0);
        }
      `,
      depthWrite: false
    });

    // Create fullscreen quads
    const geometry = new THREE.PlaneGeometry(2, 2);
    
    this.fsQuadH = new THREE.Mesh(geometry, this.blurMaterialH);
    this.fsQuadV = new THREE.Mesh(geometry, this.blurMaterialV);
    this.fsQuadComp = new THREE.Mesh(geometry, this.compositeMaterial);
    
    this.quadScene = new THREE.Scene();
    this.quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  render(renderer, writeBuffer, readBuffer) {
    const originalRenderTarget = renderer.getRenderTarget();
    const originalAutoClear = renderer.autoClear;
    renderer.autoClear = false;

    // 1. Render depth
    this.scene.overrideMaterial = this.depthMaterial;
    renderer.setRenderTarget(this.renderTargetDepth);
    renderer.clear();
    renderer.render(this.scene, this.camera);
    this.scene.overrideMaterial = null;

    // 2. Horizontal blur pass
    this.blurMaterialH.uniforms.tDiffuse.value = readBuffer.texture;
    this.blurMaterialH.uniforms.tDepth.value = this.renderTargetDepth.texture;
    
    renderer.setRenderTarget(this.renderTargetBlur);
    renderer.clear();
    this.quadScene.add(this.fsQuadH);
    renderer.render(this.quadScene, this.quadCamera);
    this.quadScene.remove(this.fsQuadH);

    // 3. Vertical blur pass (blur the blurred result)
    this.blurMaterialV.uniforms.tDiffuse.value = this.renderTargetBlur.texture;
    this.blurMaterialV.uniforms.tDepth.value = this.renderTargetDepth.texture;
    
    renderer.setRenderTarget(this.renderTargetBlur);
    renderer.clear();
    this.quadScene.add(this.fsQuadV);
    renderer.render(this.quadScene, this.quadCamera);
    this.quadScene.remove(this.fsQuadV);

    // 4. Final composite
    this.compositeMaterial.uniforms.tOriginal.value = readBuffer.texture;
    this.compositeMaterial.uniforms.tBlurred.value = this.renderTargetBlur.texture;
    this.compositeMaterial.uniforms.tDepth.value = this.renderTargetDepth.texture;

    if (this.renderToScreen) {
      renderer.setRenderTarget(null);
    } else {
      renderer.setRenderTarget(writeBuffer);
      if (this.clear) renderer.clear();
    }

    this.quadScene.add(this.fsQuadComp);
    renderer.render(this.quadScene, this.quadCamera);
    this.quadScene.remove(this.fsQuadComp);

    renderer.autoClear = originalAutoClear;
    renderer.setRenderTarget(originalRenderTarget);
  }

  setSize(width, height) {
    const sizeDivider = 2; // Keep blur at half resolution
    const blurWidth = width / sizeDivider;
    const blurHeight = height / sizeDivider;
    
    this.renderTargetDepth.setSize(blurWidth, blurHeight);
    this.renderTargetBlur.setSize(blurWidth, blurHeight);
    
    this.blurMaterialH.uniforms.resolution.value.set(blurWidth, blurHeight);
    this.blurMaterialV.uniforms.resolution.value.set(blurWidth, blurHeight);
  }

  updateFocus(value) {
    this.params.focus = value;
    this.blurMaterialH.uniforms.focus.value = value;
    this.blurMaterialV.uniforms.focus.value = value;
    this.compositeMaterial.uniforms.focus.value = value;
  }

  updateAperture(value) {
    this.params.aperture = value;
    this.blurMaterialH.uniforms.aperture.value = value;
    this.blurMaterialV.uniforms.aperture.value = value;
    this.compositeMaterial.uniforms.aperture.value = value;
  }

  updateMaxBlur(value) {
    this.params.maxblur = value;
    this.blurMaterialH.uniforms.maxblur.value = value;
    this.blurMaterialV.uniforms.maxblur.value = value;
    this.compositeMaterial.uniforms.maxblur.value = value;
  }

  dispose() {
    this.renderTargetDepth.dispose();
    this.renderTargetBlur.dispose();
    this.blurMaterialH.dispose();
    this.blurMaterialV.dispose();
    this.compositeMaterial.dispose();
    this.fsQuadH.geometry.dispose();
    this.fsQuadV.geometry.dispose();
    this.fsQuadComp.geometry.dispose();
  }
}