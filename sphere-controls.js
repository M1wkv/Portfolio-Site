(() => {
  const viewport = document.getElementById("sphereViewport");
  const embed = document.getElementById("sphere-embed");
  const sizeRange = document.getElementById("sphereSizeRange");
  const scaleRange = document.getElementById("elementScaleRange");
  const sizeDial = document.getElementById("sphereSizeDial");
  const scaleDial = document.getElementById("elementScaleDial");
  const sizeValue = document.getElementById("sphereSizeValue");
  const scaleValue = document.getElementById("elementScaleValue");

  const state = {
    sphereSize: Number(sizeRange.value),
    elementScale: Number(scaleRange.value)
  };

  function progress(input) {
    const min = Number(input.min);
    const max = Number(input.max);
    return (Number(input.value) - min) / (max - min);
  }

  function sphereZoom(displayValue) {
    return 0.6 + displayValue;
  }

  function formatSphereSize(value) {
    return value >= 1 ? "1.0" : value.toFixed(1);
  }

  function postConfigToEmbed() {
    const iframe = embed.querySelector("iframe");
    if (!iframe || !iframe.contentWindow) return;

    const payload = {
      sphereSize: state.sphereSize,
      elementScale: state.elementScale
    };

    // The current public embed accepts assets via postMessage. These config
    // messages are kept isolated here so future renderer support can use them
    // without touching the original embed snippet.
    [
      { type: "sphere:set-config", ...payload },
      { type: "sphere:set-settings", settings: payload },
      { type: "sphere:set-options", options: payload }
    ].forEach((message) => {
      iframe.contentWindow.postMessage(message, "https://sphere.5heads.ai");
    });
  }

  function update() {
    state.sphereSize = Number(sizeRange.value);
    state.elementScale = Number(scaleRange.value);

    viewport.style.setProperty("--sphere-zoom", sphereZoom(state.sphereSize).toFixed(3));
    sizeDial.style.setProperty("--progress", progress(sizeRange).toFixed(4));
    scaleDial.style.setProperty("--progress", progress(scaleRange).toFixed(4));
    sizeValue.textContent = formatSphereSize(state.sphereSize);
    scaleValue.textContent = state.elementScale.toFixed(2);

    postConfigToEmbed();
  }

  sizeRange.addEventListener("input", update);
  scaleRange.addEventListener("input", update);
  window.addEventListener("message", (event) => {
    if (event.origin === "https://sphere.5heads.ai" && event.data?.type === "sphere:ready") {
      postConfigToEmbed();
    }
  });

  update();
})();

