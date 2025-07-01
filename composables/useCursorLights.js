import * as THREE from "three";

export const useCursorLights = (scene, camera) => {
  // Light objects
  let cursorLight, cursorLightFar, cursorLightFar2;
  let raycaster = new THREE.Raycaster();
  let mouse = new THREE.Vector2();
  
  // Create cursor lights with provided config
  function createCursorLights(config) {
    // Define the initial position you want
    const initialPosition = new THREE.Vector3(
      -1.4627038684521625,
      -0.5280486146263911,
      0.04583145543954181
    );
    
    // Main cursor light
    cursorLight = new THREE.PointLight(
      config.cursorLight.color,
      config.cursorLight.intensity,
      config.cursorLight.distance,
      config.cursorLight.decay
    );
    cursorLight.position.copy(initialPosition);
    scene.add(cursorLight);
    
    // First far cursor light
    cursorLightFar = new THREE.PointLight(
      config.cursorLightFar.color,
      config.cursorLightFar.intensity,
      config.cursorLightFar.distance,
      config.cursorLightFar.decay
    );
    // Set initial position for far light
    const farLightPosition = initialPosition.clone();
    farLightPosition.x += config.cursorLightFar.xOffset;
    farLightPosition.z -= config.cursorLightFar.depth;
    cursorLightFar.position.copy(farLightPosition);
    scene.add(cursorLightFar);
    
    // Second far cursor light (mirrored)
    cursorLightFar2 = new THREE.PointLight(
      config.cursorLightFar.color,
      config.cursorLightFar.intensity,
      config.cursorLightFar.distance,
      config.cursorLightFar.decay
    );
    // Set initial position for second far light (mirrored)
    const farLightPosition2 = initialPosition.clone();
    farLightPosition2.x -= config.cursorLightFar.xOffset;
    farLightPosition2.z -= config.cursorLightFar.depth;
    cursorLightFar2.position.copy(farLightPosition2);
    scene.add(cursorLightFar2);
  }
  
  // Update cursor light positions based on mouse event
  function updateCursorLightPosition(event, config) {
    if (!camera) return;
    
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Update the raycaster with camera and mouse position
    raycaster.setFromCamera(mouse, camera);
    
    // Get the ray direction
    const rayDirection = raycaster.ray.direction.normalize();
    
    // Update main cursor light
    if (cursorLight && config.cursorLight.enabled) {
      // Position the light at a fixed distance from camera along the ray
      const lightDistance = config.cursorLight.depth;
      const targetPosition = camera.position.clone().add(
        rayDirection.clone().multiplyScalar(lightDistance)
      );
      
      // Smooth the movement
      cursorLight.position.lerp(targetPosition, config.cursorLight.smoothing);
    }
    
    // Update first far cursor light
    if (cursorLightFar && config.cursorLightFar.enabled) {
      const farDistance = config.cursorLightFar.depth;
      const targetPositionFar = camera.position.clone().add(
        rayDirection.clone().multiplyScalar(farDistance)
      );
      
      // Calculate right vector for offset
      const cameraRight = new THREE.Vector3();
      camera.getWorldDirection(cameraRight);
      cameraRight.cross(camera.up).normalize();
      
      // Apply horizontal offset
      targetPositionFar.add(
        cameraRight.clone().multiplyScalar(config.cursorLightFar.xOffset)
      );
      
      cursorLightFar.position.lerp(
        targetPositionFar,
        config.cursorLightFar.smoothing
      );
    }
    
    // Update second far cursor light
    if (cursorLightFar2 && config.cursorLightFar.enabled) {
      const farDistance = config.cursorLightFar.depth;
      const targetPositionFar2 = camera.position.clone().add(
        rayDirection.clone().multiplyScalar(farDistance)
      );
      
      // Calculate right vector for offset
      const cameraRight = new THREE.Vector3();
      camera.getWorldDirection(cameraRight);
      cameraRight.cross(camera.up).normalize();
      
      // Apply horizontal offset (negative for opposite side)
      targetPositionFar2.add(
        cameraRight.clone().multiplyScalar(-config.cursorLightFar.xOffset)
      );
      
      cursorLightFar2.position.lerp(
        targetPositionFar2,
        config.cursorLightFar.smoothing
      );
    }
  }
  
  // Alternative implementation using screen space projection
  function updateCursorLightPositionAlternative(event, config) {
    if (!camera) return;
    
    const canvas = event.target;
    const rect = canvas.getBoundingClientRect();
    
    // Get mouse position relative to canvas
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Create a vector in clip space
    const clipSpacePosition = new THREE.Vector3(x, y, 0.5); // z=0.5 for mid-depth
    
    // Transform to world space
    const worldPosition = clipSpacePosition.unproject(camera);
    
    // Get direction from camera to world position
    const direction = worldPosition.sub(camera.position).normalize();
    
    // Update lights similar to above but with this direction
    if (cursorLight && config.cursorLight.enabled) {
      const targetPosition = camera.position.clone().add(
        direction.multiplyScalar(config.cursorLight.depth)
      );
      cursorLight.position.lerp(targetPosition, config.cursorLight.smoothing);
    }
    
    // Similar updates for far lights...
  }
  
  // Debug helper to visualize light positions
  function createDebugHelpers() {
    const sphereGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    
    const mainHelper = new THREE.Mesh(
      sphereGeometry,
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    scene.add(mainHelper);
    
    const farHelper1 = new THREE.Mesh(
      sphereGeometry,
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    scene.add(farHelper1);
    
    const farHelper2 = new THREE.Mesh(
      sphereGeometry,
      new THREE.MeshBasicMaterial({ color: 0x0000ff })
    );
    scene.add(farHelper2);
    
    // Update helper positions in animation loop
    return {
      update: () => {
        if (cursorLight) mainHelper.position.copy(cursorLight.position);
        if (cursorLightFar) farHelper1.position.copy(cursorLightFar.position);
        if (cursorLightFar2) farHelper2.position.copy(cursorLightFar2.position);
      }
    };
  }
  
  // Get light references
  function getLights() {
    return {
      cursorLight,
      cursorLightFar,
      cursorLightFar2,
    };
  }
  
  return {
    createCursorLights,
    updateCursorLightPosition,
    getLights,
    createDebugHelpers, // Optional: for debugging
  };
};