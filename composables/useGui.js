export const useGui = (config, toggleFinalMode) => {
  const { $dat } = useNuxtApp();
  const gui = new $dat.GUI({ width: 200 });
  gui
    .add(config, "final")
    .name("Final")
    .onChange((value) => {
      toggleFinalMode(value);
    });

  // Add far light color control
  const farLightColorControl = {
    color: config.cursorLightFar.finalColor,
  };

  gui
    .addColor(farLightColorControl, "color")
    .name("Far Light Color")
    .onChange((value) => {
      if (cursorLightFar) {
        cursorLightFar.color.setHex(value);
        // Update the config values
        if (config.final) {
          config.cursorLightFar.finalColor = value;
        } else {
          config.cursorLightFar.nonFinalColor = value;
        }
      }
      if (cursorLightFar2) {
        cursorLightFar2.color.setHex(value);
      }
    });
};
