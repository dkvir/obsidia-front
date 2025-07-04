import * as THREE from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";

export const useEnvLineHandler = class EnvLineHandler {
  constructor(config = {}) {
    this.config = {
      lineWidth: config.lineWidth || 2,
      opacity: config.opacity || 0.2,
      startColor: config.startColor || new THREE.Color(0xc337ff), // purple
      endColor: config.endColor || new THREE.Color(0x722fdf), // dark purple
      spiralRadius: config.spiralRadius || 0.01, // radius of spiral offset
      spiralTurns: config.spiralTurns || 3, // number of complete rotations
      createSpirals: config.createSpirals !== false, // default true
      // Energy flow settings
      flowSpeed: config.flowSpeed || 0.2, // speed of energy flow
      flowDirection: config.flowDirection || -1, // 1 for forward, -1 for reverse
      pulseIntensity: config.pulseIntensity || 0.1, // how much the energy pulses (0-1)
      glowIntensity: config.glowIntensity || 2.0, // brightness multiplier for energy
      energyColor: config.energyColor || new THREE.Color(0x00ffff), // cyan energy
      waveCount: config.waveCount || 1, // number of energy waves
      enableEnergyFlow: config.enableEnergyFlow !== false, // default true
      pulseWidth: config.pulseWidth || 0.01, // width of each energy pulse (0-1)
      trailLength: config.trailLength || 0.3, // length of trailing glow (0-1)
      energyOnly: config.energyOnly || true, // if true, only show energy pulses, hide base line
    };

    this.lines = [];
    this.lineData = []; // Store additional data for each line
    this.time = 0;
    this.animating = false;
  }

  /**
   * Process a GLB scene and create lines from objects with "env_line" in their name
   */
  createLinesFromGLBScene(gltfScene) {
    const createdLines = [];
    
    gltfScene.traverse((child) => {
      if (child.name && child.name.includes("env_line")) {
        child.visible = false;
        
        if (child.geometry && child.geometry.attributes.position) {
          const lines = this.createLinesFromObject(child);
          if (lines && lines.length > 0) {
            createdLines.push(...lines);
            this.lines.push(...lines);
          }
        }
      }
    });
    
    // Start animation if energy flow is enabled
    if (this.config.enableEnergyFlow && !this.animating) {
      this.startAnimation();
    }
    
    return createdLines;
  }

  /**
   * Create a line from an object with optional spiral companions
   */
  createLinesFromObject(object) {
    const lines = [];
    
    // Create the main line
    const mainLine = this.createLineFromObject(object, 0);
    if (!mainLine) return lines;
    
    lines.push(mainLine);
    
    // Create spiral offset lines if enabled
    if (this.config.createSpirals) {
      const spiralLines = this.createSpiralOffsetLines(object);
      lines.push(...spiralLines);
    }
    
    return lines;
  }

  /**
   * Create spiral offset lines around the original path
   */
  createSpiralOffsetLines(object) {
    const spiralLines = [];
    const geometry = object.geometry;
    const posAttr = geometry.attributes.position;
    const vertexCount = posAttr.count;
    
    if (vertexCount < 2) return spiralLines;
    
    // Extract original positions
    const originalPositions = [];
    for (let i = 0; i < vertexCount; i++) {
      const vertex = new THREE.Vector3(
        posAttr.getX(i),
        posAttr.getY(i),
        posAttr.getZ(i)
      );
      vertex.applyMatrix4(object.matrixWorld);
      originalPositions.push(vertex);
    }
    
    // Calculate tangent vectors for the path
    const tangents = this.calculateTangents(originalPositions);
    const normals = this.calculateNormals(originalPositions, tangents);
    const binormals = this.calculateBinormals(tangents, normals);
    
    // Create two spiral lines
    for (let spiralIndex = 0; spiralIndex < 2; spiralIndex++) {
      const positions = [];
      const colors = [];
      const phaseOffset = spiralIndex * Math.PI; // 180 degrees apart
      
      for (let i = 0; i < vertexCount; i++) {
        // Calculate spiral angle based on position along the line
        const t = vertexCount > 1 ? i / (vertexCount - 1) : 0;
        const angle = t * this.config.spiralTurns * Math.PI * 2 + phaseOffset;
        
        // Calculate offset using Frenet frame
        const offsetX = Math.cos(angle) * this.config.spiralRadius;
        const offsetY = Math.sin(angle) * this.config.spiralRadius;
        
        // Apply offset in the normal/binormal plane
        const offset = new THREE.Vector3()
          .addScaledVector(normals[i], offsetX)
          .addScaledVector(binormals[i], offsetY);
        
        // Final position
        const finalPos = originalPositions[i].clone().add(offset);
        positions.push(finalPos.x, finalPos.y, finalPos.z);
        
        // Calculate color gradient
        const color = new THREE.Color().lerpColors(
          this.config.startColor,
          this.config.endColor,
          t
        );
        colors.push(color.r, color.g, color.b);
      }
      
      // Create Line2 geometry
      const lineGeometry = new LineGeometry();
      lineGeometry.setPositions(positions);
      lineGeometry.setColors(colors);
      
      // Create material with custom shader for energy effect
      const material = this.createEnergyMaterial(
        this.config.lineWidth * 0.8,
        this.config.opacity * 0.7,
        spiralIndex + 1 // Phase offset for variety
      );
      
      const line = new Line2(lineGeometry, material);
      line.computeLineDistances();
      
      // Store line data for animation
      this.lineData.push({
        line: line,
        baseColors: [...colors],
        phaseOffset: spiralIndex + 1,
        vertexCount: vertexCount
      });
      
      spiralLines.push(line);
    }
    
    return spiralLines;
  }

  /**
   * Calculate tangent vectors for a path
   */
  calculateTangents(positions) {
    const tangents = [];
    const count = positions.length;
    
    for (let i = 0; i < count; i++) {
      let tangent;
      
      if (i === 0) {
        // First point: use forward difference
        tangent = positions[1].clone().sub(positions[0]).normalize();
      } else if (i === count - 1) {
        // Last point: use backward difference
        tangent = positions[i].clone().sub(positions[i - 1]).normalize();
      } else {
        // Middle points: use central difference
        tangent = positions[i + 1].clone().sub(positions[i - 1]).normalize();
      }
      
      tangents.push(tangent);
    }
    
    return tangents;
  }

  /**
   * Calculate normal vectors for a path
   */
  calculateNormals(positions, tangents) {
    const normals = [];
    const up = new THREE.Vector3(0, 1, 0);
    
    for (let i = 0; i < tangents.length; i++) {
      let normal;
      
      // Try to use up vector as reference
      const tangent = tangents[i];
      const dot = Math.abs(tangent.dot(up));
      
      if (dot > 0.999) {
        // Tangent is parallel to up, use a different reference
        normal = new THREE.Vector3(1, 0, 0).cross(tangent).normalize();
      } else {
        normal = up.clone().cross(tangent).normalize();
      }
      
      // Ensure continuity by checking against previous normal
      if (i > 0 && normal.dot(normals[i - 1]) < 0) {
        normal.multiplyScalar(-1);
      }
      
      normals.push(normal);
    }
    
    return normals;
  }

  /**
   * Calculate binormal vectors for a path
   */
  calculateBinormals(tangents, normals) {
    const binormals = [];
    
    for (let i = 0; i < tangents.length; i++) {
      const binormal = tangents[i].clone().cross(normals[i]).normalize();
      binormals.push(binormal);
    }
    
    return binormals;
  }

  /**
   * Create a line from an object (original method)
   */
  createLineFromObject(object, phaseOffset = 0) {
    const positions = [];
    const colors = [];
    
    const geometry = object.geometry;
    const posAttr = geometry.attributes.position;
    const vertexCount = posAttr.count;
    
    if (vertexCount < 2) return null;
    
    // Extract positions and create gradient colors
    for (let i = 0; i < vertexCount; i++) {
      // Get position
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const z = posAttr.getZ(i);
      
      // Transform to world space
      const vertex = new THREE.Vector3(x, y, z);
      vertex.applyMatrix4(object.matrixWorld);
      
      positions.push(vertex.x, vertex.y, vertex.z);
      
      // Calculate color gradient
      const t = vertexCount > 1 ? i / (vertexCount - 1) : 0;
      const color = new THREE.Color().lerpColors(
        this.config.startColor,
        this.config.endColor,
        t
      );
      colors.push(color.r, color.g, color.b);
    }
    
    // Create Line2 geometry
    const lineGeometry = new LineGeometry();
    lineGeometry.setPositions(positions);
    lineGeometry.setColors(colors);
    
    // Create material with energy effect
    const material = this.createEnergyMaterial(
      this.config.lineWidth,
      this.config.opacity,
      phaseOffset
    );
    
    const line = new Line2(lineGeometry, material);
    line.computeLineDistances();
    
    // Store line data for animation
    this.lineData.push({
      line: line,
      baseColors: [...colors],
      phaseOffset: phaseOffset,
      vertexCount: vertexCount
    });
    
    return line;
  }

  /**
   * Create material with energy flow shader
   */
  createEnergyMaterial(linewidth, opacity, phaseOffset) {
    const material = new LineMaterial({
      color: 0xffffff,
      linewidth: linewidth,
      vertexColors: true,
      worldUnits: false,
      resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
      opacity: opacity,
      transparent: true,
      blending: THREE.AdditiveBlending, // For glowing effect
    });
    
    // Store phase offset for animation
    material.userData.phaseOffset = phaseOffset;
    
    return material;
  }

  /**
   * Start the energy flow animation
   */
  startAnimation() {
    this.animating = true;
  }

  /**
   * Stop the energy flow animation
   */
  stopAnimation() {
    this.animating = false;
  }

  /**
   * Animation update - call this from your main animation loop
   * @param {number} delta - Time since last frame in seconds
   */
  animate(delta = 0.016) {
    if (!this.animating || !this.config.enableEnergyFlow) return;
    
    this.time += delta;
    this.updateEnergyFlow();
  }

  /**
   * Update energy flow effect
   */
  updateEnergyFlow() {
    this.lineData.forEach((data) => {
      const { line, baseColors, phaseOffset, vertexCount } = data;
      const colors = [];
      
      for (let i = 0; i < vertexCount; i++) {
        const t = vertexCount > 1 ? i / (vertexCount - 1) : 0;
        
        // Calculate energy wave positions - directional flow
        let energyIntensity = 0;
        
        // Create multiple energy pulses that travel along the line
        for (let w = 0; w < this.config.waveCount; w++) {
          // Each wave is offset in time
          const waveOffset = w / this.config.waveCount;
          
          // Calculate the current position of this energy pulse (0 to 1)
          let pulsePosition;
          if (this.config.flowDirection > 0) {
            // Forward flow: 0 to 1
            pulsePosition = ((this.time * this.config.flowSpeed + waveOffset + phaseOffset * 0.1) % 1);
          } else {
            // Reverse flow: 1 to 0
            pulsePosition = 1 - ((this.time * this.config.flowSpeed + waveOffset + phaseOffset * 0.1) % 1);
          }
          
          // Calculate distance from current vertex to the pulse
          const distance = Math.abs(t - pulsePosition);
          
          // Create a sharp energy pulse with configurable width
          const pulseWidth = this.config.pulseWidth; // Width of each energy pulse
          const falloff = 2.0; // How quickly the energy falls off
          
          // Calculate intensity based on distance from pulse center
          if (distance < pulseWidth) {
            const normalizedDistance = distance / pulseWidth;
            const intensity = Math.exp(-falloff * normalizedDistance * normalizedDistance);
            energyIntensity = Math.max(energyIntensity, intensity);
          }
        }
        
        // Add a subtle trailing glow effect
        for (let w = 0; w < this.config.waveCount; w++) {
          const waveOffset = w / this.config.waveCount;
          let pulsePosition;
          if (this.config.flowDirection > 0) {
            // Forward flow: 0 to 1
            pulsePosition = ((this.time * this.config.flowSpeed + waveOffset + phaseOffset * 0.1) % 1);
          } else {
            // Reverse flow: 1 to 0
            pulsePosition = 1 - ((this.time * this.config.flowSpeed + waveOffset + phaseOffset * 0.1) % 1);
          }
          
          // Trail appears behind the pulse based on flow direction
          const shouldShowTrail = this.config.flowDirection > 0 ? 
            (t < pulsePosition) : 
            (t > pulsePosition);
          
          if (shouldShowTrail) {
            const trailDistance = Math.abs(pulsePosition - t);
            const trailLength = this.config.trailLength; // Length of the trailing glow
            
            if (trailDistance < trailLength) {
              const trailIntensity = (1 - trailDistance / trailLength) * 0.3;
              energyIntensity = Math.max(energyIntensity, trailIntensity);
            }
          }
        }
        
        // Apply pulse effect for overall brightness variation
        const globalPulse = Math.sin(this.time * 2 + phaseOffset) * 0.2 + 0.8;
        energyIntensity *= globalPulse;
        
        // Mix base color with energy color based on intensity
        const baseColor = new THREE.Color(
          baseColors[i * 3],
          baseColors[i * 3 + 1],
          baseColors[i * 3 + 2]
        );
        
        // Create the final color
        let finalColor;
        
        if (this.config.energyOnly) {
          // Energy-only mode: only show where there's energy
          if (energyIntensity > 0.01) {
            // Use pure energy color with intensity-based opacity
            finalColor = this.config.energyColor.clone();
            const glowMultiplier = energyIntensity * this.config.glowIntensity;
            finalColor.multiplyScalar(glowMultiplier);
          } else {
            // Make completely transparent/black where there's no energy
            finalColor = new THREE.Color(0, 0, 0);
          }
        } else {
          // Normal mode: blend base color with energy
          if (energyIntensity > 0.01) {
            // Blend between base color and energy color
            finalColor = baseColor.clone().lerp(
              this.config.energyColor,
              Math.min(energyIntensity, 0.9)
            );
            
            // Apply glow intensity for bright spots
            const glowMultiplier = 1 + energyIntensity * this.config.glowIntensity;
            finalColor.multiplyScalar(glowMultiplier);
          } else {
            // Use base color when no energy present
            finalColor = baseColor.clone();
          }
        }
        
        colors.push(finalColor.r, finalColor.g, finalColor.b);
      }
      
      // Update line colors
      line.geometry.setColors(colors);
      
      // Handle opacity for energy-only mode
      if (this.config.energyOnly) {
        // In energy-only mode, we'll use full opacity to let the color intensity control visibility
        line.material.opacity = 1.0;
        line.material.depthWrite = false; // Better transparency handling
      } else {
        // Normal opacity pulsing
        const opacityPulse = Math.sin(this.time * 1.5) * 0.05 + 1;
        line.material.opacity = line.material.userData.baseOpacity || line.material.opacity;
        if (!line.material.userData.baseOpacity) {
          line.material.userData.baseOpacity = line.material.opacity;
        }
        line.material.opacity = line.material.userData.baseOpacity * opacityPulse;
      }
    });
  }

  /**
   * Update settings for all lines
   */
  updateSettings(params = {}) {
    if (!params) return;

    // Update config
    Object.keys(params).forEach(key => {
      if (this.config.hasOwnProperty(key)) {
        this.config[key] = params[key];
      }
    });

    // Update all lines
    this.lines.forEach((line, index) => {
      // Determine if this is a main line or spiral line
      const isMainLine = index % 3 === 0;
      
      // Update material properties
      if (params.lineWidth !== undefined) {
        line.material.linewidth = isMainLine ? 
          params.lineWidth : 
          params.lineWidth * 0.8;
      }
      if (params.opacity !== undefined) {
        line.material.opacity = isMainLine ? 
          params.opacity : 
          params.opacity * 0.7;
        line.material.userData.baseOpacity = line.material.opacity;
      }

      // Update base colors if color params changed
      if (params.startColor || params.endColor) {
        const lineDataIndex = this.lineData.findIndex(d => d.line === line);
        if (lineDataIndex !== -1) {
          const data = this.lineData[lineDataIndex];
          const baseColors = [];
          
          for (let i = 0; i < data.vertexCount; i++) {
            const t = data.vertexCount > 1 ? i / (data.vertexCount - 1) : 0;
            const color = new THREE.Color().lerpColors(
              this.config.startColor,
              this.config.endColor,
              t
            );
            baseColors.push(color.r, color.g, color.b);
          }
          
          data.baseColors = baseColors;
        }
      }
    });

    // Handle animation state changes
    if (params.enableEnergyFlow !== undefined) {
      if (params.enableEnergyFlow && !this.animating) {
        this.startAnimation();
      } else if (!params.enableEnergyFlow) {
        this.stopAnimation();
      }
    }
  }

  /**
   * Set flow direction
   * @param {number} direction - 1 for forward, -1 for reverse
   */
  setFlowDirection(direction) {
    this.config.flowDirection = direction;
  }

  /**
   * Set energy-only mode
   * @param {boolean} energyOnly - true to show only energy, false for normal mode
   */
  setEnergyOnly(energyOnly) {
    this.config.energyOnly = energyOnly;
  }

  /**
   * Toggle energy-only mode
   */
  toggleEnergyOnly() {
    this.config.energyOnly = !this.config.energyOnly;
  }

  /**
   * Update resolution on window resize
   */
  updateResolution(width, height) {
    this.lines.forEach((line) => {
      if (line.material) {
        line.material.resolution.set(width, height);
      }
    });
  }

  /**
   * Get all lines
   */
  getLines() {
    return this.lines;
  }

  /**
   * Dispose of resources
   */
  dispose() {
    this.stopAnimation();
    this.lines.forEach((line) => {
      line.geometry.dispose();
      line.material.dispose();
    });
    this.lines = [];
    this.lineData = [];
  }
};