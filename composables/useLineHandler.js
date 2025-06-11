import * as THREE from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";

export const useLineHandler = class LineHandler {
  constructor(config = {}) {
    // Simplified configuration with defaults
    this.config = {
      // Line appearance
      lineWidth: config.lineWidth || 2,
      opacity: config.opacity || 1.0,

      // Wave animation
      waveAmplitude: config.waveAmplitude || 0.005,
      waveFrequency: config.waveFrequency || 6.0,
      waveSpeed: config.waveSpeed || 1.0,

      // Curve settings
      curveTension: config.curveTension || 0.1,
      minPointCount: config.minPointCount || 10,
      pointDensity: config.pointDensity || 2,

      // Phase offset settings
      randomizePhaseOffsets:
        config.randomizePhaseOffsets !== undefined
          ? config.randomizePhaseOffsets
          : true,
      maxPhaseOffset: config.maxPhaseOffset || Math.PI * 6,

      // Inside line settings
      insideLineWidth: config.insideLineWidth || 0.6,
      insideLineOpacity: config.insideLineOpacity || 0.9,

      // NEW: Trim path settings
      trimPath: {
        enabled: config.trimPath?.enabled || false,
        start: config.trimPath?.start || 0.0, // 0.0 to 1.0
        end: config.trimPath?.end || 1.0, // 0.0 to 1.0
        animateStart: config.trimPath?.animateStart || false,
        animateEnd: config.trimPath?.animateEnd || false,
        animationSpeed: config.trimPath?.animationSpeed || 1.0,
        animationDirection: config.trimPath?.animationDirection || "forward", // 'forward', 'backward', 'pingpong'
        staggerDelay: config.trimPath?.staggerDelay || 0.1, // Delay between lines for staggered animation
        fadeEdges: config.trimPath?.fadeEdges || true, // Fade opacity at trim edges
        fadeDistance: config.trimPath?.fadeDistance || 0.05, // How far to fade (0.0 to 0.5)
      },
    };

    // Define the color palette
    this.colorPalette = {
      purple: new THREE.Color(0xc337ff),
      pink: new THREE.Color(0xfcd2d8),
      magenta: new THREE.Color(0xfe016d),
      darkPurple: new THREE.Color(0x722fdf),
    };

    this.lineCurves = [];
    this.mainLines = [];
    this.insideLines = [];
    this.originalPositions = new Map();
    this.phaseOffsets = new Map();
    this.globalCenter = null;
    this.animationTime = 0;

    // NEW: Store original curve data for trim path
    this.originalCurveData = new Map();
    this.trimAnimationStates = new Map();
  }

  /**
   * Process an edge-only model to extract and create curves
   */
  createCurvesFromEdgeModel(modelScene) {
    const { vertices, mainLinePaths, insideLinePaths } =
      this.extractLinePaths(modelScene);

    this.processMainPaths(mainLinePaths, vertices.length);
    this.processInsidePaths(insideLinePaths, vertices.length);

    return this.lineCurves;
  }

  /**
   * Extract all line paths from a model
   */
  extractLinePaths(modelScene) {
    const allVertices = [];
    const processedVertexIndices = new Map();
    const mainLinePaths = new Map();
    const insideLinePaths = new Map();
    let vertexIndex = 0;

    modelScene.traverse((child) => {
      if (!(child.isMesh || child.isLine || child.isLineSegments)) {
        return;
      }

      const isMainLine = child.name.includes("line_");
      const isInsideLine = child.name.includes("inside_");

      if (!isMainLine && !isInsideLine) {
        return;
      }

      const geometry = child.geometry;
      const positions = geometry.attributes.position;
      const indices = geometry.index;
      const worldVertices = [];

      if (indices) {
        this.processIndexedGeometry(
          child,
          positions,
          indices,
          allVertices,
          processedVertexIndices,
          worldVertices,
          vertexIndex
        );
      } else {
        this.processNonIndexedGeometry(
          child,
          positions,
          allVertices,
          processedVertexIndices,
          worldVertices,
          vertexIndex
        );
      }

      if (isMainLine) {
        mainLinePaths.set(child.uuid, {
          object: child,
          vertices: worldVertices,
        });
      } else if (isInsideLine) {
        insideLinePaths.set(child.uuid, {
          object: child,
          vertices: worldVertices,
        });
      }
    });

    console.log(
      `Collected ${allVertices.length} unique vertices from line objects`
    );
    console.log(
      `Found ${mainLinePaths.size} main line paths and ${insideLinePaths.size} inside line paths`
    );

    return { vertices: allVertices, mainLinePaths, insideLinePaths };
  }

  processIndexedGeometry(
    child,
    positions,
    indices,
    allVertices,
    processedVertexIndices,
    worldVertices,
    vertexIndex
  ) {
    for (let i = 0; i < indices.count; i++) {
      const idx = indices.getX(i);
      const vertex = new THREE.Vector3(
        positions.getX(idx),
        positions.getY(idx),
        positions.getZ(idx)
      );

      const worldVertex = vertex.clone().applyMatrix4(child.matrixWorld);
      const vertexKey = `${worldVertex.x.toFixed(5)},${worldVertex.y.toFixed(
        5
      )},${worldVertex.z.toFixed(5)}`;

      if (!processedVertexIndices.has(vertexKey)) {
        processedVertexIndices.set(vertexKey, vertexIndex++);
        allVertices.push(worldVertex);
      }

      worldVertices.push({
        localPosition: vertex,
        worldPosition: worldVertex,
        globalIndex: processedVertexIndices.get(vertexKey),
      });
    }
  }

  processNonIndexedGeometry(
    child,
    positions,
    allVertices,
    processedVertexIndices,
    worldVertices,
    vertexIndex
  ) {
    for (let i = 0; i < positions.count; i++) {
      const vertex = new THREE.Vector3(
        positions.getX(i),
        positions.getY(i),
        positions.getZ(i)
      );

      const worldVertex = vertex.clone().applyMatrix4(child.matrixWorld);
      const vertexKey = `${worldVertex.x.toFixed(5)},${worldVertex.y.toFixed(
        5
      )},${worldVertex.z.toFixed(5)}`;

      if (!processedVertexIndices.has(vertexKey)) {
        processedVertexIndices.set(vertexKey, vertexIndex++);
        allVertices.push(worldVertex);
      }

      worldVertices.push({
        localPosition: vertex,
        worldPosition: worldVertex,
        globalIndex: processedVertexIndices.get(vertexKey),
      });
    }
  }

  processMainPaths(mainLinePaths, totalVertices) {
    let lineIndex = 0;
    mainLinePaths.forEach((pathData) => {
      const { object, vertices } = pathData;

      if (vertices.length >= 2) {
        const line = this.createSmoothCurve(
          object,
          vertices,
          totalVertices,
          false,
          lineIndex
        );
        this.mainLines.push(line);
        this.lineCurves.push(line);
        lineIndex++;
      }
    });

    console.log(`Created ${this.mainLines.length} main line curves`);
  }

  processInsidePaths(insideLinePaths, totalVertices) {
    let lineIndex = this.mainLines.length; // Continue numbering from main lines
    insideLinePaths.forEach((pathData) => {
      const { object, vertices } = pathData;

      if (vertices.length >= 2) {
        const line = this.createSmoothCurve(
          object,
          vertices,
          totalVertices,
          true,
          lineIndex
        );
        this.insideLines.push(line);
        this.lineCurves.push(line);
        lineIndex++;
      }
    });

    console.log(`Created ${this.insideLines.length} inside line curves`);
  }

  /**
   * Create a smooth curve for a line
   */
  createSmoothCurve(
    object,
    vertices,
    totalVertices,
    isInsideLine = false,
    lineIndex = 0
  ) {
    const points = vertices.map((v) => v.localPosition);

    let pathLength = 0;
    for (let i = 1; i < points.length; i++) {
      pathLength += points[i].distanceTo(points[i - 1]);
    }

    const curve = new THREE.CatmullRomCurve3(
      points,
      false,
      "catmullrom",
      this.config.curveTension
    );

    const lengthBasedCount = Math.ceil(pathLength * 15);
    const segmentBasedCount = points.length * this.config.pointDensity;
    const pointCount = Math.max(
      this.config.minPointCount,
      lengthBasedCount,
      segmentBasedCount
    );

    const curvePoints =
      points.length >= 3
        ? curve.getSpacedPoints(pointCount)
        : curve.getPoints(pointCount);

    // Store original curve data for trim path
    this.originalCurveData.set(object.uuid, {
      points: curvePoints,
      isInsideLine: isInsideLine,
      lineIndex: lineIndex,
    });

    // Initialize trim animation state
    this.trimAnimationStates.set(object.uuid, {
      currentStart: this.config.trimPath.start,
      currentEnd: this.config.trimPath.end,
      animationPhase: 0,
      staggerOffset: lineIndex * this.config.trimPath.staggerDelay,
    });

    const lineDetails = this.prepareLineDetails(curvePoints, isInsideLine);
    const line = this.createLine(
      object,
      lineDetails.positions,
      lineDetails.colors,
      isInsideLine
    );

    this.storeOriginalPositions(
      line,
      lineDetails.originalPositions,
      curvePoints.length
    );

    // Apply initial trim if enabled
    if (this.config.trimPath.enabled) {
      this.applyTrimPath(
        line,
        this.config.trimPath.start,
        this.config.trimPath.end
      );
    }

    return line;
  }

  /**
   * Apply trim path effect to a line
   */
  applyTrimPath(line, startTrim = 0, endTrim = 1) {
    const originalData = this.originalCurveData.get(line.uuid);
    if (!originalData) return;

    const { points, isInsideLine } = originalData;
    const totalPoints = points.length;

    // Calculate trim indices
    const startIndex = Math.floor(startTrim * (totalPoints - 1));
    const endIndex = Math.ceil(endTrim * (totalPoints - 1));

    // Extract trimmed segment
    const trimmedPoints = points.slice(startIndex, endIndex + 1);

    if (trimmedPoints.length < 2) {
      // Hide line if trim results in too few points
      line.visible = false;
      return;
    }

    line.visible = true;

    // Prepare new line data
    const lineDetails = this.prepareTrimmedLineDetails(
      trimmedPoints,
      isInsideLine,
      startTrim,
      endTrim,
      startIndex,
      totalPoints
    );

    // Update geometry
    line.geometry.setPositions(lineDetails.positions);
    line.geometry.setColors(lineDetails.colors);
    line.computeLineDistances();

    // Update stored positions for wave animation
    this.originalPositions.set(line.uuid, {
      positions: lineDetails.originalPositions,
      count: trimmedPoints.length,
      trimStart: startTrim,
      trimEnd: endTrim,
    });
  }

  /**
   * Prepare position and color arrays for a trimmed line
   */
  prepareTrimmedLineDetails(
    curvePoints,
    isInsideLine,
    startTrim,
    endTrim,
    startIndex,
    totalPoints
  ) {
    const positions = [];
    const colors = [];
    const originalPositions = [];

    let startColor, endColor;

    if (isInsideLine) {
      startColor = this.colorPalette.pink.clone();
      endColor = this.colorPalette.magenta.clone();
    } else {
      startColor = this.colorPalette.purple.clone();
      endColor = this.colorPalette.darkPurple.clone();
    }

    const fadeDistance = this.config.trimPath.fadeDistance;
    const fadeEdges = this.config.trimPath.fadeEdges;

    for (let i = 0; i < curvePoints.length; i++) {
      const point = curvePoints[i];

      originalPositions.push(point.x, point.y, point.z);
      positions.push(point.x, point.y, point.z);

      // Calculate color interpolation based on original curve position
      const globalAlpha = (startIndex + i) / (totalPoints - 1);
      const color = new THREE.Color().lerpColors(
        startColor,
        endColor,
        globalAlpha
      );

      // Apply fade at trim edges if enabled
      if (fadeEdges && curvePoints.length > 1) {
        const localAlpha = i / (curvePoints.length - 1);
        let fadeAlpha = 1.0;

        // Fade in at start
        if (localAlpha < fadeDistance) {
          fadeAlpha = localAlpha / fadeDistance;
        }
        // Fade out at end
        else if (localAlpha > 1.0 - fadeDistance) {
          fadeAlpha = (1.0 - localAlpha) / fadeDistance;
        }

        // Apply fade to color (this affects the alpha component indirectly)
        color.multiplyScalar(fadeAlpha);
      }

      colors.push(color.r, color.g, color.b);
    }

    return { positions, colors, originalPositions };
  }

  /**
   * Prepare position and color arrays for a line
   */
  prepareLineDetails(curvePoints, isInsideLine = false) {
    const positions = [];
    const colors = [];
    const originalPositions = [];

    let startColor, endColor;

    if (isInsideLine) {
      startColor = this.colorPalette.pink.clone();
      endColor = this.colorPalette.magenta.clone();
    } else {
      startColor = this.colorPalette.purple.clone();
      endColor = this.colorPalette.darkPurple.clone();
    }

    for (let i = 0; i < curvePoints.length; i++) {
      const point = curvePoints[i];

      originalPositions.push(point.x, point.y, point.z);
      positions.push(point.x, point.y, point.z);

      const alpha = i / (curvePoints.length - 1);
      const color = new THREE.Color().lerpColors(startColor, endColor, alpha);
      colors.push(color.r, color.g, color.b);
    }

    return { positions, colors, originalPositions };
  }

  /**
   * Create a Line2 object
   */
  createLine(object, positions, colors, isInsideLine = false) {
    const geometry = new LineGeometry();
    geometry.setPositions(positions);
    geometry.setColors(colors);

    const lineWidth = isInsideLine
      ? this.config.lineWidth * this.config.insideLineWidth
      : this.config.lineWidth;

    const opacity = isInsideLine
      ? this.config.opacity * this.config.insideLineOpacity
      : this.config.opacity;

    const material = new LineMaterial({
      color: 0xffffff,
      linewidth: lineWidth,
      vertexColors: true,
      worldUnits: false,
      alphaToCoverage: true,
      alphaTest: 0.0,
      resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
      opacity: opacity,
      transparent: true,
      dashed: false,
    });

    const line = new Line2(geometry, material);
    line.computeLineDistances();
    line.applyMatrix4(object.matrixWorld);

    if (this.config.randomizePhaseOffsets) {
      const phaseOffset = Math.random() * this.config.maxPhaseOffset;
      const additionalOffset = isInsideLine ? Math.PI * 0.25 : 0;
      this.phaseOffsets.set(line.uuid, phaseOffset + additionalOffset);
    } else {
      const defaultOffset = isInsideLine ? Math.PI * 0.25 : 0;
      this.phaseOffsets.set(line.uuid, defaultOffset);
    }

    return line;
  }

  storeOriginalPositions(line, originalPositions, pointCount) {
    this.originalPositions.set(line.uuid, {
      positions: originalPositions,
      count: pointCount,
    });
  }

  /**
   * Apply wave distortion to a point based on line direction
   */
  applyWaveDistortion(
    point,
    t,
    phaseOffset = 0,
    linePoints = null,
    currentIndex = 0
  ) {
    const distortedPoint = point.clone();

    const waveAmplitude = this.config.waveAmplitude || 0.3;
    const waveFrequency = this.config.waveFrequency || 5.0;
    const waveSpeed = this.config.waveSpeed || 1.0;

    const wavePhase = this.animationTime * waveSpeed + phaseOffset;
    const waveValue = Math.sin(t * Math.PI * waveFrequency + wavePhase);

    // Calculate amplitude factor (fade at ends)
    let amplitudeFactor = 1.0;
    if (t < 0.3) {
      amplitudeFactor = this.smoothStep(0, 0.3, t);
    } else if (t > 0.7) {
      amplitudeFactor = 1 - this.smoothStep(0.7, 1.0, t);
    }

    const smoothedWaveValue = waveValue * amplitudeFactor * waveAmplitude;

    // Calculate wave direction based on line direction
    let waveDirection = new THREE.Vector3(0, 1, 0); // Default fallback

    if (
      linePoints &&
      linePoints.length > 1 &&
      currentIndex < linePoints.length
    ) {
      // Calculate local line direction
      let lineDirection = new THREE.Vector3();

      if (currentIndex === 0) {
        // First point: use direction to next point
        const nextPoint = new THREE.Vector3(
          linePoints[1],
          linePoints[2],
          linePoints[3]
        );
        lineDirection.subVectors(nextPoint, point).normalize();
      } else if (currentIndex === Math.floor(linePoints.length / 3) - 1) {
        // Last point: use direction from previous point
        const prevPoint = new THREE.Vector3(
          linePoints[(currentIndex - 1) * 3],
          linePoints[(currentIndex - 1) * 3 + 1],
          linePoints[(currentIndex - 1) * 3 + 2]
        );
        lineDirection.subVectors(point, prevPoint).normalize();
      } else {
        // Middle points: average direction from previous to next
        const prevPoint = new THREE.Vector3(
          linePoints[(currentIndex - 1) * 3],
          linePoints[(currentIndex - 1) * 3 + 1],
          linePoints[(currentIndex - 1) * 3 + 2]
        );
        const nextPoint = new THREE.Vector3(
          linePoints[(currentIndex + 1) * 3],
          linePoints[(currentIndex + 1) * 3 + 1],
          linePoints[(currentIndex + 1) * 3 + 2]
        );
        lineDirection.subVectors(nextPoint, prevPoint).normalize();
      }

      // Calculate perpendicular direction for wave (in XZ plane primarily)
      // Create a perpendicular vector by crossing with up vector
      const upVector = new THREE.Vector3(0, 1, 0);
      waveDirection = new THREE.Vector3().crossVectors(lineDirection, upVector);

      // If line is too vertical, use a different reference vector
      if (waveDirection.length() < 0.1) {
        const rightVector = new THREE.Vector3(1, 0, 0);
        waveDirection = new THREE.Vector3().crossVectors(
          lineDirection,
          rightVector
        );
      }

      waveDirection.normalize();

      // Add some vertical component for more interesting movement
      waveDirection.y += 0.3;
      waveDirection.normalize();
    }

    // Apply wave displacement
    distortedPoint.add(waveDirection.multiplyScalar(smoothedWaveValue));

    return distortedPoint;
  }

  smoothStep(min, max, value) {
    if (value <= min) return 0;
    if (value >= max) return 1;

    value = (value - min) / (max - min);
    return value * value * (3 - 2 * value);
  }

  /**
   * Updated animate method with proper line direction calculation
   */
  animate(deltaTime) {
    this.animationTime += deltaTime * this.config.waveSpeed;

    // Update trim path animations if enabled
    if (
      this.config.trimPath.enabled &&
      (this.config.trimPath.animateStart || this.config.trimPath.animateEnd)
    ) {
      this.updateTrimPathAnimations(deltaTime);
    }

    // Update wave animations
    this.lineCurves.forEach((line) => {
      const originalData = this.originalPositions.get(line.uuid);
      if (!originalData) return;

      const { positions: originalPositions, count } = originalData;
      const newPositions = [];
      const phaseOffset = this.phaseOffsets.get(line.uuid) || 0;

      for (let i = 0; i < count; i++) {
        const idx = i * 3;
        const origPoint = new THREE.Vector3(
          originalPositions[idx],
          originalPositions[idx + 1],
          originalPositions[idx + 2]
        );

        const t = i / (count - 1);

        // Pass original positions and current index for direction calculation
        const distortedPoint = this.applyWaveDistortion(
          origPoint,
          t,
          phaseOffset,
          originalPositions,
          i
        );

        newPositions.push(distortedPoint.x, distortedPoint.y, distortedPoint.z);
      }

      line.geometry.setPositions(newPositions);
      line.computeLineDistances();
    });
  }

  /**
   * Update trim path animations
   */
  updateTrimPathAnimations(deltaTime) {
    this.lineCurves.forEach((line) => {
      const animState = this.trimAnimationStates.get(line.uuid);
      if (!animState) return;

      // Update animation phase with stagger offset
      const totalTime = this.animationTime + animState.staggerOffset;
      animState.animationPhase =
        totalTime * this.config.trimPath.animationSpeed;

      let newStart = this.config.trimPath.start;
      let newEnd = this.config.trimPath.end;

      // Animate start position
      if (this.config.trimPath.animateStart) {
        switch (this.config.trimPath.animationDirection) {
          case "forward":
            newStart = (Math.sin(animState.animationPhase) * 0.5 + 0.5) * 0.8;
            break;
          case "backward":
            newStart = (Math.sin(-animState.animationPhase) * 0.5 + 0.5) * 0.8;
            break;
          case "pingpong":
            newStart = Math.abs(Math.sin(animState.animationPhase)) * 0.8;
            break;
        }
      }

      // Animate end position
      if (this.config.trimPath.animateEnd) {
        switch (this.config.trimPath.animationDirection) {
          case "forward":
            newEnd =
              0.2 +
              (Math.sin(animState.animationPhase + Math.PI * 0.5) * 0.5 + 0.5) *
                0.8;
            break;
          case "backward":
            newEnd =
              0.2 +
              (Math.sin(-animState.animationPhase + Math.PI * 0.5) * 0.5 +
                0.5) *
                0.8;
            break;
          case "pingpong":
            newEnd =
              0.2 +
              Math.abs(Math.sin(animState.animationPhase + Math.PI * 0.5)) *
                0.8;
            break;
        }
      }

      // Ensure start is always less than end
      if (newStart >= newEnd) {
        const temp = newStart;
        newStart = Math.max(0, newEnd - 0.1);
        newEnd = Math.min(1, temp + 0.1);
      }

      // Apply trim if values changed
      if (
        Math.abs(animState.currentStart - newStart) > 0.001 ||
        Math.abs(animState.currentEnd - newEnd) > 0.001
      ) {
        animState.currentStart = newStart;
        animState.currentEnd = newEnd;
        this.applyTrimPath(line, newStart, newEnd);
      }
    });
  }

  /**
   * Update the resolution for all line materials
   */
  updateResolution(width, height) {
    this.lineCurves.forEach((curve) => {
      if (curve.material) {
        curve.material.resolution.set(width, height);
      }
    });
  }

  /**
   * Update all line properties including trim path
   */
  updateSettings(params = {}) {
    if (!params) return;

    // Update existing properties
    if (params.lineWidth !== undefined)
      this.config.lineWidth = params.lineWidth;
    if (params.opacity !== undefined) this.config.opacity = params.opacity;
    if (params.insideLineWidth !== undefined)
      this.config.insideLineWidth = params.insideLineWidth;
    if (params.insideLineOpacity !== undefined)
      this.config.insideLineOpacity = params.insideLineOpacity;
    if (params.waveAmplitude !== undefined)
      this.config.waveAmplitude = params.waveAmplitude;
    if (params.waveFrequency !== undefined)
      this.config.waveFrequency = params.waveFrequency;
    if (params.waveSpeed !== undefined)
      this.config.waveSpeed = params.waveSpeed;
    if (params.randomizePhaseOffsets !== undefined)
      this.config.randomizePhaseOffsets = params.randomizePhaseOffsets;
    if (params.maxPhaseOffset !== undefined)
      this.config.maxPhaseOffset = params.maxPhaseOffset;
    if (params.curveTension !== undefined)
      this.config.curveTension = params.curveTension;
    if (params.minPointCount !== undefined)
      this.config.minPointCount = params.minPointCount;
    if (params.pointDensity !== undefined)
      this.config.pointDensity = params.pointDensity;

    // Update trim path settings
    if (params.trimPath) {
      Object.assign(this.config.trimPath, params.trimPath);

      // Apply trim path to all lines if enabled
      if (this.config.trimPath.enabled) {
        this.lineCurves.forEach((line) => {
          this.applyTrimPath(
            line,
            this.config.trimPath.start,
            this.config.trimPath.end
          );
        });
      } else {
        // Reset to full lines if disabled
        this.lineCurves.forEach((line) => {
          const originalData = this.originalCurveData.get(line.uuid);
          if (originalData) {
            const lineDetails = this.prepareLineDetails(
              originalData.points,
              originalData.isInsideLine
            );
            line.geometry.setPositions(lineDetails.positions);
            line.geometry.setColors(lineDetails.colors);
            line.computeLineDistances();
            line.visible = true;
          }
        });
      }
    }

    // Update material properties
    this.lineCurves.forEach((line) => {
      if (!line || !line.material) return;

      const isInsideLine = this.insideLines.includes(line);

      if (params.lineWidth !== undefined) {
        line.material.linewidth = isInsideLine
          ? params.lineWidth * this.config.insideLineWidth
          : params.lineWidth;
      }

      if (params.opacity !== undefined) {
        line.material.opacity = isInsideLine
          ? params.opacity * this.config.insideLineOpacity
          : params.opacity;
      }
    });
  }

  /**
   * Animate trim path with specific parameters
   */
  animateTrimPath(
    startTrim = 0,
    endTrim = 1,
    duration = 2000,
    easing = "easeInOut",
    stagger = 100
  ) {
    const startTime = Date.now();

    this.lineCurves.forEach((line, index) => {
      const delay = index * stagger;

      const animateFrame = () => {
        const elapsed = Date.now() - startTime - delay;
        if (elapsed < 0) {
          requestAnimationFrame(animateFrame);
          return;
        }

        const progress = Math.min(elapsed / duration, 1);
        let easedProgress = progress;

        // Apply easing
        switch (easing) {
          case "easeIn":
            easedProgress = progress * progress;
            break;
          case "easeOut":
            easedProgress = 1 - (1 - progress) * (1 - progress);
            break;
          case "easeInOut":
            easedProgress =
              progress < 0.5
                ? 2 * progress * progress
                : 1 - 2 * (1 - progress) * (1 - progress);
            break;
        }

        const currentStart = startTrim * easedProgress;
        const currentEnd = startTrim + (endTrim - startTrim) * easedProgress;

        this.applyTrimPath(line, currentStart, currentEnd);

        if (progress < 1) {
          requestAnimationFrame(animateFrame);
        }
      };

      requestAnimationFrame(animateFrame);
    });
  }

  regeneratePhaseOffsets(force = false) {
    if (!this.config.randomizePhaseOffsets && !force) return;

    for (let i = 0; i < this.lineCurves.length; i++) {
      const line = this.lineCurves[i];
      const isInsideLine = this.insideLines.includes(line);

      const mainPhase = Math.random() * this.config.maxPhaseOffset;
      this.phaseOffsets.set(
        line.uuid,
        isInsideLine ? mainPhase + Math.PI * 0.25 : mainPhase
      );
    }
  }

  getLineCurves() {
    return this.lineCurves;
  }

  getMainLines() {
    return this.mainLines;
  }

  getInsideLines() {
    return this.insideLines;
  }
};
