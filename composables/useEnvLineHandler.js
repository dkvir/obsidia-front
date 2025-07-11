import * as THREE from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";

export const useEnvLineHandler = class EnvLineHandler {
  constructor(config = {}) {
    // Default settings for env_line objects
    this.envLineConfig = {
      lineWidth: config.envLineConfig?.lineWidth || config.lineWidth || 10,
      opacity: config.envLineConfig?.opacity || config.opacity || 1,
      startColor: config.envLineConfig?.startColor || config.startColor || new THREE.Color(0xc337ff),
      endColor: config.envLineConfig?.endColor || config.endColor || new THREE.Color(0x722fdf),
      spiralRadius: config.envLineConfig?.spiralRadius || config.spiralRadius || 0.01,
      spiralTurns: config.envLineConfig?.spiralTurns || config.spiralTurns || 3,
      createSpirals: config.envLineConfig?.createSpirals !== undefined ? config.envLineConfig.createSpirals : (config.createSpirals !== false),
      
      // Energy flow settings for env_line
      flowSpeed: config.envLineConfig?.flowSpeed || config.flowSpeed || 0.1,
      flowDirection: config.envLineConfig?.flowDirection || config.flowDirection || 1,
      pulseIntensity: config.envLineConfig?.pulseIntensity || config.pulseIntensity || 0.1,
      glowIntensity: config.envLineConfig?.glowIntensity || config.glowIntensity || 4,
      energyColor: config.envLineConfig?.energyColor || config.energyColor || new THREE.Color(0xff00e0),
      waveCount: config.envLineConfig?.waveCount || config.waveCount || 4,
      enableEnergyFlow: config.envLineConfig?.enableEnergyFlow !== undefined ? config.envLineConfig.enableEnergyFlow : (config.enableEnergyFlow !== false),
      pulseWidth: config.envLineConfig?.pulseWidth || config.pulseWidth || 0.05,
      trailLength: config.envLineConfig?.trailLength || config.trailLength || 0.6,
      energyOnly: config.envLineConfig?.energyOnly !== undefined ? config.envLineConfig.energyOnly : (config.energyOnly !== undefined ? config.energyOnly : true),
    };

    // Default settings for env_main objects
    this.envMainConfig = {
      lineWidth: config.envMainConfig?.lineWidth || config.lineWidth || 4,
      opacity: config.envMainConfig?.opacity || config.opacity || 1,
      startColor: config.envMainConfig?.startColor || config.startColor || new THREE.Color(0x6b2fbf),
      endColor: config.envMainConfig?.endColor || config.endColor || new THREE.Color(0x6b2fbf),
      spiralRadius: config.envMainConfig?.spiralRadius || config.spiralRadius || 0.015,
      spiralTurns: config.envMainConfig?.spiralTurns || config.spiralTurns || 2,
      createSpirals: config.envMainConfig?.createSpirals !== undefined ? config.envMainConfig.createSpirals : (config.createSpirals !== false),
      
      // Spiral offset colors for env_main
      spiralColors: config.envMainConfig?.spiralColors || [
        { start: new THREE.Color(0x9b59ff), end: new THREE.Color(0x6b2fbf) }, // Purple
        { start: new THREE.Color(0x59b3ff), end: new THREE.Color(0x2f6bbf) }  // Blue
      ],
      spiralEnergyColors: config.envMainConfig?.spiralEnergyColors || [
        new THREE.Color(0xff59ff), // Pink energy for purple spiral
        new THREE.Color(0x2f6bbf)  // Cyan energy for blue spiral
      ],
      
      // Energy flow settings for env_main
      flowSpeed: config.envMainConfig?.flowSpeed || config.flowSpeed || 0.15,
      flowDirection: config.envMainConfig?.flowDirection || config.flowDirection || 1,
      pulseIntensity: config.envMainConfig?.pulseIntensity || config.pulseIntensity || 0.2,
      glowIntensity: config.envMainConfig?.glowIntensity || config.glowIntensity || 0.7,
      energyColor: config.envMainConfig?.energyColor || config.energyColor || new THREE.Color(0x6b2fbf),
      waveCount: config.envMainConfig?.waveCount || config.waveCount || 2,
      enableEnergyFlow: config.envMainConfig?.enableEnergyFlow !== undefined ? config.envMainConfig.enableEnergyFlow : (config.enableEnergyFlow !== false),
      pulseWidth: config.envMainConfig?.pulseWidth || config.pulseWidth || 0.05,
      trailLength: config.envMainConfig?.trailLength || config.trailLength || 0.4,
      energyOnly: config.envMainConfig?.energyOnly !== undefined ? config.envMainConfig.energyOnly : (config.energyOnly !== undefined ? config.energyOnly : false),
      
      // Trim settings (only for env_main)
      trimEnabled: config.envMainConfig?.trimEnabled !== undefined ? config.envMainConfig.trimEnabled : (config.trimEnabled !== undefined ? config.trimEnabled : true),
      trimStart: config.envMainConfig?.trimStart !== undefined ? config.envMainConfig.trimStart : (config.trimStart !== undefined ? config.trimStart : 0.0),
      trimEnd: config.envMainConfig?.trimEnd !== undefined ? config.envMainConfig.trimEnd : (config.trimEnd !== undefined ? config.trimEnd : 0.0),
      trimSpeed: config.envMainConfig?.trimSpeed !== undefined ? config.envMainConfig.trimSpeed : (config.trimSpeed !== undefined ? config.trimSpeed : 0.3),
      trimLoop: config.envMainConfig?.trimLoop !== undefined ? config.envMainConfig.trimLoop : (config.trimLoop !== undefined ? config.trimLoop : true),
      trimDirection: config.envMainConfig?.trimDirection || config.trimDirection || 1,
      trimEasing: config.envMainConfig?.trimEasing || config.trimEasing || 'linear',
      trimFadeWidth: config.envMainConfig?.trimFadeWidth || config.trimFadeWidth || 0.05,
      trimPingPong: config.envMainConfig?.trimPingPong || config.trimPingPong || false,
      trimSync: config.envMainConfig?.trimSync !== undefined ? config.envMainConfig.trimSync : (config.trimSync !== undefined ? config.trimSync : true),
    };

    // Store original config for backwards compatibility
    this.config = config;

    this.lines = [];
    this.lineData = [];
    this.time = 0;
    this.trimTime = 0;
    this.animating = false;
    this.trimAnimating = false;
    this.trimPingPongDirection = 1;
  }

  /**
   * Get config based on line type
   */
  getConfigForLineType(lineType) {
    return lineType === 'env_main' ? this.envMainConfig : this.envLineConfig;
  }

  /**
   * Process a GLB scene and create lines from objects with "env_line" or "env_main" in their name
   */
  createLinesFromGLBScene(gltfScene) {
    const createdLines = [];
    
    gltfScene.traverse((child) => {
      if (child.name && (child.name.includes("env_line") || child.name.includes("env_main"))) {
        child.visible = false;
        
        if (child.geometry && child.geometry.attributes.position) {
          const lineType = child.name.includes("env_main") ? 'env_main' : 'env_line';
          const lines = this.createLinesFromObject(child, lineType);
          if (lines && lines.length > 0) {
            createdLines.push(...lines);
            this.lines.push(...lines);
          }
        }
      }
    });
    
    // Start animations if any lines have energy flow enabled
    const hasEnergyFlow = this.envLineConfig.enableEnergyFlow || this.envMainConfig.enableEnergyFlow;
    if (hasEnergyFlow && !this.animating) {
      this.startAnimation();
    }
    
    // Start trim animation if enabled for env_main
    if (this.envMainConfig.trimEnabled && this.envMainConfig.trimSpeed > 0 && !this.trimAnimating) {
      this.startTrimAnimation();
    }
    
    return createdLines;
  }

  /**
   * Create a line from an object with optional spiral companions
   */
  createLinesFromObject(object, lineType = 'env_line') {
    const lines = [];
    const config = this.getConfigForLineType(lineType);
    
    // Create the main line
    const mainLine = this.createLineFromObject(object, 0, lineType);
    if (!mainLine) return lines;
    
    lines.push(mainLine);
    
    // Create spiral offset lines if enabled
    if (config.createSpirals) {
      const spiralLines = this.createSpiralOffsetLines(object, lineType);
      lines.push(...spiralLines);
    }
    
    return lines;
  }

  /**
   * Create spiral offset lines around the original path
   */
  createSpiralOffsetLines(object, lineType = 'env_line') {
    const spiralLines = [];
    const config = this.getConfigForLineType(lineType);
    const geometry = object.geometry;
    const posAttr = geometry.attributes.position;
    const vertexCount = posAttr.count;
    
    if (vertexCount < 2) return spiralLines;
    
    // Check if the curve is closed
    const firstX = posAttr.getX(0);
    const firstY = posAttr.getY(0);
    const firstZ = posAttr.getZ(0);
    
    const lastX = posAttr.getX(vertexCount - 1);
    const lastY = posAttr.getY(vertexCount - 1);
    const lastZ = posAttr.getZ(vertexCount - 1);
    
    const distance = Math.sqrt(
      Math.pow(lastX - firstX, 2) + 
      Math.pow(lastY - firstY, 2) + 
      Math.pow(lastZ - firstZ, 2)
    );
    
    const isClosed = distance < 0.0001;
    const actualVertexCount = isClosed ? vertexCount - 1 : vertexCount;
    
    // Extract original positions
    const originalPositions = [];
    for (let i = 0; i < actualVertexCount; i++) {
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
      const phaseOffset = spiralIndex * Math.PI;
      
      // Get spiral colors based on line type
      let spiralStartColor, spiralEndColor;
      if (lineType === 'env_main' && config.spiralColors && config.spiralColors[spiralIndex]) {
        spiralStartColor = config.spiralColors[spiralIndex].start;
        spiralEndColor = config.spiralColors[spiralIndex].end;
      } else {
        // For env_line or if spiral colors not defined, use the regular colors
        spiralStartColor = config.startColor;
        spiralEndColor = config.endColor;
      }
      
      for (let i = 0; i < actualVertexCount; i++) {
        const t = actualVertexCount > 1 ? i / (actualVertexCount - 1) : 0;
        const angle = t * config.spiralTurns * Math.PI * 2 + phaseOffset;
        
        const offsetX = Math.cos(angle) * config.spiralRadius;
        const offsetY = Math.sin(angle) * config.spiralRadius;
        
        const offset = new THREE.Vector3()
          .addScaledVector(normals[i], offsetX)
          .addScaledVector(binormals[i], offsetY);
        
        const finalPos = originalPositions[i].clone().add(offset);
        positions.push(finalPos.x, finalPos.y, finalPos.z);
        
        const color = new THREE.Color().lerpColors(
          spiralStartColor,
          spiralEndColor,
          t
        );
        colors.push(color.r, color.g, color.b);
      }
      
      const lineGeometry = new LineGeometry();
      lineGeometry.setPositions(positions);
      lineGeometry.setColors(colors);
      
      const material = this.createEnergyMaterial(
        config.lineWidth * 0.8,
        config.opacity * 0.7,
        spiralIndex + 1
      );
      
      const line = new Line2(lineGeometry, material);
      line.computeLineDistances();
      
      // Store the spiral colors in line data
      this.lineData.push({
        line: line,
        lineType: lineType,
        baseColors: [...colors],
        phaseOffset: spiralIndex + 1,
        vertexCount: actualVertexCount,
        trimOffset: Math.random() * 0.3,
        applyTrim: lineType === 'env_main',
        isSpiral: true,
        spiralIndex: spiralIndex,
        spiralStartColor: spiralStartColor,
        spiralEndColor: spiralEndColor
      });
      
      spiralLines.push(line);
    }
    
    return spiralLines;
  }

  /**
   * Create a line from an object
   */
  createLineFromObject(object, phaseOffset = 0, lineType = 'env_line') {
    const positions = [];
    const colors = [];
    const config = this.getConfigForLineType(lineType);
    
    const geometry = object.geometry;
    const posAttr = geometry.attributes.position;
    let vertexCount = posAttr.count;
    
    if (vertexCount < 2) return null;
    
    const firstX = posAttr.getX(0);
    const firstY = posAttr.getY(0);
    const firstZ = posAttr.getZ(0);
    
    const lastX = posAttr.getX(vertexCount - 1);
    const lastY = posAttr.getY(vertexCount - 1);
    const lastZ = posAttr.getZ(vertexCount - 1);
    
    const distance = Math.sqrt(
      Math.pow(lastX - firstX, 2) + 
      Math.pow(lastY - firstY, 2) + 
      Math.pow(lastZ - firstZ, 2)
    );
    
    const isClosed = distance < 0.0001;
    const actualVertexCount = isClosed ? vertexCount - 1 : vertexCount;
    
    for (let i = 0; i < actualVertexCount; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const z = posAttr.getZ(i);
      
      const vertex = new THREE.Vector3(x, y, z);
      vertex.applyMatrix4(object.matrixWorld);
      
      positions.push(vertex.x, vertex.y, vertex.z);
      
      const t = actualVertexCount > 1 ? i / (actualVertexCount - 1) : 0;
      const color = new THREE.Color().lerpColors(
        config.startColor,
        config.endColor,
        t
      );
      colors.push(color.r, color.g, color.b);
    }
    
    const lineGeometry = new LineGeometry();
    lineGeometry.setPositions(positions);
    lineGeometry.setColors(colors);
    
    const material = this.createEnergyMaterial(
      config.lineWidth,
      config.opacity,
      phaseOffset
    );
    
    const line = new Line2(lineGeometry, material);
    line.computeLineDistances();
    
    this.lineData.push({
      line: line,
      lineType: lineType,
      baseColors: [...colors],
      phaseOffset: phaseOffset,
      vertexCount: actualVertexCount,
      trimOffset: 0,
      applyTrim: lineType === 'env_main',
      isSpiral: false,
      spiralIndex: -1
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
      blending: THREE.AdditiveBlending,
    });
    
    material.userData.phaseOffset = phaseOffset;
    
    return material;
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
        tangent = positions[1].clone().sub(positions[0]).normalize();
      } else if (i === count - 1) {
        tangent = positions[i].clone().sub(positions[i - 1]).normalize();
      } else {
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
      const tangent = tangents[i];
      const dot = Math.abs(tangent.dot(up));
      
      if (dot > 0.999) {
        normal = new THREE.Vector3(1, 0, 0).cross(tangent).normalize();
      } else {
        normal = up.clone().cross(tangent).normalize();
      }
      
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
   * Start the trim animation
   */
  startTrimAnimation() {
    this.trimAnimating = true;
  }

  /**
   * Stop the trim animation
   */
  stopTrimAnimation() {
    this.trimAnimating = false;
  }

  /**
   * Apply easing function to value
   */
  applyEasing(t, easing) {
    switch (easing) {
      case 'easeIn':
        return t * t;
      case 'easeOut':
        return t * (2 - t);
      case 'easeInOut':
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      case 'linear':
      default:
        return t;
    }
  }

  /**
   * Animation update - call this from your main animation loop
   */
  animate(delta = 0.016) {
    if (!this.animating && !this.envMainConfig.trimEnabled) return;
    
    this.time += delta;
    
    if (this.trimAnimating && this.envMainConfig.trimEnabled) {
      this.trimTime += delta * this.envMainConfig.trimSpeed * this.trimPingPongDirection * this.envMainConfig.trimDirection;
      
      if (this.envMainConfig.trimPingPong) {
        if (this.trimTime >= 1 || this.trimTime <= 0) {
          this.trimPingPongDirection *= -1;
          this.trimTime = Math.max(0, Math.min(1, this.trimTime));
        }
      } else if (this.envMainConfig.trimLoop) {
        this.trimTime = this.trimTime % 1;
        if (this.trimTime < 0) this.trimTime += 1;
      } else {
        this.trimTime = Math.max(0, Math.min(1, this.trimTime));
      }
    }
    
    this.updateEnergyFlow();
  }

  /**
   * Update energy flow effect with trim
   */
  updateEnergyFlow() {
    this.lineData.forEach((data) => {
      const { line, lineType, baseColors, phaseOffset, vertexCount, trimOffset, applyTrim, isSpiral, spiralIndex } = data;
      const config = this.getConfigForLineType(lineType);
      const colors = [];
      
      // Determine which energy color to use
      let effectiveEnergyColor = config.energyColor;
      if (isSpiral && lineType === 'env_main' && config.spiralEnergyColors && config.spiralEnergyColors[spiralIndex]) {
        effectiveEnergyColor = config.spiralEnergyColors[spiralIndex];
      }
      
      // Calculate trim values for this line
      let trimStart = config.trimStart !== undefined ? config.trimStart : 0;
      let trimEnd = config.trimEnd !== undefined ? config.trimEnd : 1;
      
      // Only apply auto-animation if trimSpeed > 0 and it's an env_main line
      if (applyTrim && config.trimEnabled && this.trimAnimating && config.trimSpeed > 0) {
        const trimProgress = this.applyEasing(this.trimTime, config.trimEasing);
        const effectiveProgress = config.trimSync ? 
          trimProgress : 
          (trimProgress + trimOffset) % 1;
        
        if (config.trimLoop) {
          const trimRange = 0.2;
          trimStart = Math.max(0, effectiveProgress - trimRange / 2);
          trimEnd = Math.min(1, effectiveProgress + trimRange / 2);
        } else {
          trimStart = 0;
          trimEnd = effectiveProgress;
        }
      } else if (!applyTrim) {
        trimStart = 0;
        trimEnd = 1;
      }
      
      // Calculate total line length for segment interpolation
      const segmentLengths = [];
      let totalLength = 0;
      
      if (applyTrim && config.trimEnabled && vertexCount > 1) {
        const positions = line.geometry.attributes.instanceStart.array;
        
        for (let i = 0; i < vertexCount - 1; i++) {
          const x1 = positions[i * 3];
          const y1 = positions[i * 3 + 1];
          const z1 = positions[i * 3 + 2];
          
          const x2 = positions[(i + 1) * 3];
          const y2 = positions[(i + 1) * 3 + 1];
          const z2 = positions[(i + 1) * 3 + 2];
          
          const segmentLength = Math.sqrt(
            (x2 - x1) ** 2 + (y2 - y1) ** 2 + (z2 - z1) ** 2
          );
          
          totalLength += segmentLength;
          segmentLengths.push(totalLength);
        }
      }
      
      for (let i = 0; i < vertexCount; i++) {
        let t;
        if (totalLength > 0 && i > 0) {
          t = segmentLengths[i - 1] / totalLength;
        } else {
          t = vertexCount > 1 ? i / (vertexCount - 1) : 0;
        }
        
        // Calculate trim visibility
        let trimVisibility = 1.0;
        
        if (applyTrim && config.trimEnabled) {
          if (i === 0) {
            if (trimStart > 0 || trimEnd <= 0) {
              trimVisibility = 0.0;
            } else if (vertexCount > 1) {
              const nextT = segmentLengths.length > 0 ? segmentLengths[0] / totalLength : 1 / (vertexCount - 1);
              if (trimEnd < nextT) {
                trimVisibility = trimEnd / nextT;
              } else {
                trimVisibility = 1.0;
              }
            }
          } else if (i === vertexCount - 1) {
            if (trimStart >= 1 || trimEnd < t) {
              trimVisibility = 0.0;
            } else if (vertexCount > 1) {
              const prevT = segmentLengths.length > 1 ? 
                segmentLengths[segmentLengths.length - 2] / totalLength : 
                (vertexCount - 2) / (vertexCount - 1);
              if (trimStart > prevT) {
                trimVisibility = (1 - trimStart) / (1 - prevT);
              } else {
                trimVisibility = t <= trimEnd ? 1.0 : 0.0;
              }
            }
          } else {
            const prevT = i > 0 && segmentLengths.length > 0 ? 
              (i === 1 ? 0 : segmentLengths[i - 2] / totalLength) : 
              (i - 1) / (vertexCount - 1);
            const currentT = segmentLengths.length > 0 ? 
              segmentLengths[i - 1] / totalLength : 
              i / (vertexCount - 1);
            const nextT = i < vertexCount - 1 && segmentLengths.length > i ? 
              segmentLengths[i] / totalLength : 
              (i + 1) / (vertexCount - 1);
            
            if (currentT < trimStart) {
              if (nextT > trimStart) {
                const segmentT = (trimStart - currentT) / (nextT - currentT);
                trimVisibility = 1.0 - segmentT;
              } else {
                trimVisibility = 0.0;
              }
            } else if (currentT > trimEnd) {
              if (prevT < trimEnd) {
                const segmentT = (trimEnd - prevT) / (currentT - prevT);
                trimVisibility = segmentT;
              } else {
                trimVisibility = 0.0;
              }
            } else {
              trimVisibility = 1.0;
              
              const fadeWidth = config.trimFadeWidth || 0.05;
              
              if (currentT < trimStart + fadeWidth && trimStart > 0) {
                const fadeT = (currentT - trimStart) / fadeWidth;
                trimVisibility = this.applyEasing(fadeT, 'easeOut');
              }
              
              if (currentT > trimEnd - fadeWidth && trimEnd < 1) {
                const fadeT = (trimEnd - currentT) / fadeWidth;
                trimVisibility = Math.min(trimVisibility, this.applyEasing(fadeT, 'easeIn'));
              }
            }
          }
        }
        
        // Calculate energy wave positions
        let energyIntensity = 0;
        
        if (trimVisibility > 0 && config.enableEnergyFlow) {
          for (let w = 0; w < config.waveCount; w++) {
            const waveOffset = w / config.waveCount;
            
            let pulsePosition;
            if (config.flowDirection > 0) {
              pulsePosition = ((this.time * config.flowSpeed + waveOffset + phaseOffset * 0.1) % 1);
            } else {
              pulsePosition = 1 - ((this.time * config.flowSpeed + waveOffset + phaseOffset * 0.1) % 1);
            }
            
            const distance = Math.abs(t - pulsePosition);
            
            const pulseWidth = config.pulseWidth;
            const falloff = 2.0;
            
            if (distance < pulseWidth) {
              const normalizedDistance = distance / pulseWidth;
              const intensity = Math.exp(-falloff * normalizedDistance * normalizedDistance);
              energyIntensity = Math.max(energyIntensity, intensity);
            }
          }
          
          // Add trailing glow effect
          for (let w = 0; w < config.waveCount; w++) {
            const waveOffset = w / config.waveCount;
            let pulsePosition;
            if (config.flowDirection > 0) {
              pulsePosition = ((this.time * config.flowSpeed + waveOffset + phaseOffset * 0.1) % 1);
            } else {
              pulsePosition = 1 - ((this.time * config.flowSpeed + waveOffset + phaseOffset * 0.1) % 1);
            }
            
            const shouldShowTrail = config.flowDirection > 0 ? 
              (t < pulsePosition) : 
              (t > pulsePosition);
            
            if (shouldShowTrail) {
              const trailDistance = Math.abs(pulsePosition - t);
              const trailLength = config.trailLength;
              
              if (trailDistance < trailLength) {
                const trailIntensity = (1 - trailDistance / trailLength) * 0.3;
                energyIntensity = Math.max(energyIntensity, trailIntensity);
              }
            }
          }
          
          const globalPulse = Math.sin(this.time * 2 + phaseOffset) * 0.2 + 0.8;
          energyIntensity *= globalPulse;
        }
        
        energyIntensity *= trimVisibility;
        
        const baseColor = new THREE.Color(
          baseColors[i * 3],
          baseColors[i * 3 + 1],
          baseColors[i * 3 + 2]
        );
        
        let finalColor;
        
        if (config.energyOnly) {
          if (energyIntensity > 0.01) {
            finalColor = effectiveEnergyColor.clone();
            const glowMultiplier = energyIntensity * config.glowIntensity;
            finalColor.multiplyScalar(glowMultiplier);
          } else {
            finalColor = new THREE.Color(0, 0, 0);
          }
        } else {
          if (energyIntensity > 0.01) {
            finalColor = baseColor.clone().lerp(
              effectiveEnergyColor,
              Math.min(energyIntensity, 0.9)
            );
            
            const glowMultiplier = 1 + energyIntensity * config.glowIntensity;
            finalColor.multiplyScalar(glowMultiplier);
          } else {
            finalColor = baseColor.clone();
            finalColor.multiplyScalar(trimVisibility);
          }
        }
        
        colors.push(finalColor.r, finalColor.g, finalColor.b);
      }
      
      line.geometry.setColors(colors);
      
      if (config.energyOnly) {
        line.material.opacity = 1.0;
        line.material.depthWrite = false;
      } else {
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
   * Update settings for specific line type
   */
  updateSettings(lineType, params = {}) {
    if (!params) return;

    // Update the appropriate config
    const config = lineType === 'env_main' ? this.envMainConfig : this.envLineConfig;
    
    Object.keys(params).forEach(key => {
      if (config.hasOwnProperty(key)) {
        config[key] = params[key];
      }
    });

    // Update affected lines
    this.lineData.forEach((data, index) => {
      if (data.lineType === lineType) {
        const line = data.line;
        const isMainLine = index % 3 === 0;
        
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

        if (params.startColor || params.endColor || params.spiralColors) {
          const baseColors = [];
          
          // Determine colors based on whether this is a spiral line
          let startColor, endColor;
          if (!data.isSpiral) {
            // Main line uses regular colors
            startColor = config.startColor;
            endColor = config.endColor;
          } else {
            // Spiral lines might use special colors for env_main
            if (data.lineType === 'env_main' && config.spiralColors && config.spiralColors[data.spiralIndex]) {
              startColor = config.spiralColors[data.spiralIndex].start;
              endColor = config.spiralColors[data.spiralIndex].end;
            } else {
              startColor = config.startColor;
              endColor = config.endColor;
            }
          }
          
          for (let i = 0; i < data.vertexCount; i++) {
            const t = data.vertexCount > 1 ? i / (data.vertexCount - 1) : 0;
            const color = new THREE.Color().lerpColors(startColor, endColor, t);
            baseColors.push(color.r, color.g, color.b);
          }
          
          data.baseColors = baseColors;
        }
      }
    });

    // Handle animation state changes
    if (params.enableEnergyFlow !== undefined) {
      const hasEnergyFlow = this.envLineConfig.enableEnergyFlow || this.envMainConfig.enableEnergyFlow;
      if (hasEnergyFlow && !this.animating) {
        this.startAnimation();
      } else if (!hasEnergyFlow) {
        this.stopAnimation();
      }
    }

    if (lineType === 'env_main' && params.trimEnabled !== undefined) {
      if (params.trimEnabled && !this.trimAnimating) {
        this.startTrimAnimation();
      } else if (!params.trimEnabled) {
        this.stopTrimAnimation();
      }
    }
  }

  /**
   * Update all settings (backwards compatibility)
   */
  updateAllSettings(params = {}) {
    // Update both configs
    if (params.envLineConfig) {
      this.updateSettings('env_line', params.envLineConfig);
    }
    if (params.envMainConfig) {
      this.updateSettings('env_main', params.envMainConfig);
    }
    
    // Handle global settings for backwards compatibility
    const globalKeys = Object.keys(params).filter(key => 
      key !== 'envLineConfig' && key !== 'envMainConfig'
    );
    
    if (globalKeys.length > 0) {
      const globalParams = {};
      globalKeys.forEach(key => {
        globalParams[key] = params[key];
      });
      
      // Apply to both types
      this.updateSettings('env_line', globalParams);
      this.updateSettings('env_main', globalParams);
    }
  }

  /**
   * Set flow direction for specific line type
   */
  setFlowDirection(lineType, direction) {
    const config = this.getConfigForLineType(lineType);
    config.flowDirection = direction;
  }

  /**
   * Set energy-only mode for specific line type
   */
  setEnergyOnly(lineType, energyOnly) {
    const config = this.getConfigForLineType(lineType);
    config.energyOnly = energyOnly;
  }

  /**
   * Toggle energy-only mode for specific line type
   */
  toggleEnergyOnly(lineType) {
    const config = this.getConfigForLineType(lineType);
    config.energyOnly = !config.energyOnly;
  }

  /**
   * Set trim values (only affects env_main)
   */
  setTrim(start, end) {
    this.envMainConfig.trimStart = Math.max(0, Math.min(1, start));
    this.envMainConfig.trimEnd = Math.max(0, Math.min(1, end));
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
   * Get lines by type
   */
  getLinesByType(lineType) {
    return this.lineData
      .filter(data => data.lineType === lineType)
      .map(data => data.line);
  }

  /**
   * Dispose of resources
   */
  dispose() {
    this.stopAnimation();
    this.stopTrimAnimation();
    this.lines.forEach((line) => {
      line.geometry.dispose();
      line.material.dispose();
    });
    this.lines = [];
    this.lineData = [];
  }
};