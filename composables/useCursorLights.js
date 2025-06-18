import * as THREE from "three";

export const useCursorLights = (scene, camera) => {
  // Light objects
  let cursorLight, cursorLightFar, cursorLightFar2;

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

    // Set initial position for far light (you can adjust this offset as needed)
    const farLightPosition = initialPosition.clone();
    farLightPosition.x += config.cursorLightFar.xOffset;
    farLightPosition.z = -config.cursorLightFar.depth;
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
    farLightPosition2.z = -config.cursorLightFar.depth;
    cursorLightFar2.position.copy(farLightPosition2);
    scene.add(cursorLightFar2);
  }

  // Update cursor light positions based on mouse event
  function updateCursorLightPosition(event, config) {
    if (!camera) return;

    // Convert mouse position to 3D world coordinates
    const mouse3D = new THREE.Vector3(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1,
      0.5
    );

    mouse3D.unproject(camera);
    const direction = mouse3D.sub(camera.position).normalize();

    // Update main cursor light
    if (cursorLight && config.cursorLight.enabled) {
      const targetPosition = camera.position
        .clone()
        .add(direction.clone().multiplyScalar(config.cursorLight.depth));
      cursorLight.position.lerp(targetPosition, config.cursorLight.smoothing);
    }

    // Update first far cursor light
    if (cursorLightFar && config.cursorLightFar.enabled) {
      const targetPositionFar = camera.position
        .clone()
        .add(direction.clone().multiplyScalar(config.cursorLightFar.depth));
      targetPositionFar.x += config.cursorLightFar.xOffset;
      cursorLightFar.position.lerp(
        targetPositionFar,
        config.cursorLightFar.smoothing
      );
    }

    // Update second far cursor light
    if (cursorLightFar2 && config.cursorLightFar.enabled) {
      const targetPositionFar2 = camera.position
        .clone()
        .add(direction.clone().multiplyScalar(config.cursorLightFar.depth));
      targetPositionFar2.x -= config.cursorLightFar.xOffset;
      cursorLightFar2.position.lerp(
        targetPositionFar2,
        config.cursorLightFar.smoothing
      );
    }
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
  };
};
