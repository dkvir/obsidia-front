export const useGui = (config, cursorLightFar, cursorLightFar2) => {
  const { $dat } = useNuxtApp();
  const gui = new $dat.GUI({ width: 200 });

  // Add far light color control
  const farLightColorControl = {
    color: config.cursorLightFar.color,
  };

  gui
    .addColor(farLightColorControl, "color")
    .name("Far Light Color")
    .onChange((value) => {
      if (cursorLightFar) {
        cursorLightFar.color.setHex(value);
        config.cursorLightFar.color = value;
      }
      if (cursorLightFar2) {
        cursorLightFar2.color.setHex(value);
      }
    });
};
