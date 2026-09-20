/* Refracts the live scene without pixel readback (also works with tainted media).
 * Only the two small panel surfaces are redrawn, at a capped frame rate. */
(() => {
  const page = document.querySelector('.sphere-page');
  const source = document.getElementById('sphereCanvas');
  if (!page || !source) return;
  const reduced = matchMedia('(prefers-reduced-transparency: reduce)');
  const panels = [...page.querySelectorAll('.sphere-topbar, .sphere-footer-nav')].map(el => {
    const canvas = document.createElement('canvas');
    canvas.className = 'liquid-refraction';
    canvas.setAttribute('aria-hidden', 'true');
    el.prepend(canvas);
    return {el, canvas, ctx: canvas.getContext('2d'), key: '', mesh: []};
  }).filter(p => p.ctx);

  // Distance and normal of a capsule: the optical bend follows its rounded rim.
  function refract(x, y, w, h) {
    const radius = Math.min(w, h) / 2;
    const cx = Math.max(radius, Math.min(w - radius, x));
    const dx = x - cx, dy = y - h / 2;
    const length = Math.hypot(dx, dy);
    const depth = Math.max(0, radius - length);
    const edge = Math.max(0, 1 - depth / Math.min(18, radius));
    const bend = Math.sin(edge * Math.PI / 2) * Math.min(12, radius * 0.42);
    return {
      x: w / 2 + (x - w / 2) / 1.025 - dx / (length || 1) * bend,
      y: h / 2 + (y - h / 2) / 1.025 - dy / (length || 1) * bend
    };
  }

  function draw(panel, bounds) {
    const {canvas, ctx} = panel;
    const w = bounds.width, h = bounds.height;
    const pixelRatio = Math.min(devicePixelRatio || 1, 1.5);
    const key = `${w}:${h}:${pixelRatio}`;
    if (panel.key !== key) {
      panel.key = key;
      canvas.width = Math.ceil(w * pixelRatio);
      canvas.height = Math.ceil(h * pixelRatio);
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      panel.mesh = [];
      // Fine vertical sampling makes the long upper/lower rims smoothly curved.
      for (let y = 0; y < h; y += 2) {
        for (let x = 0; x < w; x += 8) {
          const tw = Math.min(8, w - x), th = Math.min(2, h - y);
          const p = refract(x + tw / 2, y + th / 2, w, h);
          panel.mesh.push({x, y, tw, th, sx: p.x - tw / 2, sy: p.y - th / 2});
        }
      }
    }
    const scaleX = source.width / innerWidth, scaleY = source.height / innerHeight;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    for (const t of panel.mesh) {
      ctx.drawImage(source, (bounds.left + t.sx) * scaleX,
        (bounds.top + t.sy) * scaleY, t.tw * scaleX, t.th * scaleY,
        t.x, t.y, t.tw + 0.15, t.th + 0.15);
    }
  }

  let last = -Infinity, budget = 1000 / 30;
  function frame(now) {
    requestAnimationFrame(frame);
    const enabled = !document.hidden && !reduced.matches && source.width > 0 &&
      !page.classList.contains('is-project') && !page.classList.contains('is-cv');
    if (!enabled) {
      panels.forEach(p => p.el.classList.remove('has-refraction'));
      return;
    }
    if (now - last < budget) return;
    last = now;
    const started = performance.now();
    for (const p of panels) {
      const bounds = p.el.getBoundingClientRect();
      if (bounds.width <= 0 || bounds.height <= 0) continue;
      try {
        draw(p, bounds);
        p.el.classList.add('has-refraction');
      } catch {
        // Keep the CSS glass usable when the scene cannot be sampled.
        p.el.classList.remove('has-refraction');
      }
    }
    // Back off on slower devices instead of stealing time from sphere gestures.
    budget = performance.now() - started > 12 ? 1000 / 20 : 1000 / 30;
  }
  requestAnimationFrame(frame);
})();
