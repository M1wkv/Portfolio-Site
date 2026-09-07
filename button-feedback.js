(() => {
  const selector = '#cvOpen, #projectsNav, .project-index-button, #projectBack, #projectCvOpen, #cvBack, #cvWorks, #cvContactLinks a';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const minimumPressMs = 140;
  let press = null;
  let releaseTimer = null;

  function clearPress() {
    clearTimeout(releaseTimer);
    releaseTimer = null;
    if (press) press.button.classList.remove('is-pressed');
    press = null;
  }

  function startPress(event, input) {
    const button = event.target.closest?.(selector);
    if (reducedMotion.matches || !button?.closest('.sphere-page') ||
        button.matches(':disabled, [aria-disabled="true"]')) return;
    clearPress();
    button.setAttribute('data-press-managed', '');
    button.classList.add('is-pressed');
    press = {
      button, input, started: performance.now(),
      pointerId: event.pointerId, x: event.clientX, y: event.clientY,
    };
  }

  function releasePress() {
    if (!press) return;
    // Keep a quick tap visible without delaying the button's actual action.
    releaseTimer = setTimeout(clearPress,
      Math.max(0, minimumPressMs - (performance.now() - press.started)));
  }

  const options = { capture: true, passive: true };
  document.addEventListener('pointerdown', (event) => {
    if (event.isPrimary === false || event.button !== 0) return;
    startPress(event, 'pointer');
  }, options);
  document.addEventListener('pointerup', (event) => {
    if (press?.input === 'pointer' && press.pointerId === event.pointerId) releasePress();
  }, options);
  document.addEventListener('pointermove', (event) => {
    if (press?.input !== 'pointer' || press.pointerId !== event.pointerId) return;
    if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > 10) clearPress();
  }, options);
  document.addEventListener('pointercancel', (event) => {
    if (press?.pointerId === event.pointerId) clearPress();
  }, options);
  document.addEventListener('keydown', (event) => {
    if (event.repeat || (event.key !== 'Enter' && event.key !== ' ')) return;
    if (event.key === ' ' && event.target.closest?.('a')) return;
    startPress(event, event.key);
  }, options);
  document.addEventListener('keyup', (event) => {
    if (press?.input === event.key) releasePress();
  }, options);
  document.addEventListener('focusout', (event) => {
    if (event.target === press?.button) clearPress();
  }, options);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearPress();
  });
  window.addEventListener('blur', clearPress);
  reducedMotion.addEventListener('change', clearPress);
})();
