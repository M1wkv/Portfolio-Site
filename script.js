const canvas = document.getElementById("sphereCanvas");
const ctx = canvas.getContext("2d");

const assetInput = document.getElementById("assetInput");
const assetCount = document.getElementById("assetCount");
const countButton = document.getElementById("countButton");
const speedButton = document.getElementById("speedButton");
const speedValue = document.getElementById("speedValue");
const renderButton = document.getElementById("renderButton");
const embedButton = document.getElementById("embedButton");
const embedModal = document.getElementById("embedModal");
const closeEmbed = document.getElementById("closeEmbed");
const embedCode = document.getElementById("embedCode");
const copyEmbed = document.getElementById("copyEmbed");
const lightbox = document.getElementById("lightbox");
const closeLightbox = document.getElementById("closeLightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxTitle = document.getElementById("lightboxTitle");
const directionPad = document.getElementById("directionPad");
const padHandle = document.getElementById("padHandle");

const colors = [
  ["#ececec", "#272727", "#c7ff57"],
  ["#d6f7ff", "#172026", "#ffffff"],
  ["#ffe6d4", "#24110a", "#ff7a59"],
  ["#e8e0ff", "#17101f", "#bda6ff"],
  ["#fff6c9", "#201c10", "#f7d94f"],
  ["#d9fff1", "#102019", "#61ffbd"],
  ["#f4f4f4", "#0f0f0f", "#bdbdbd"],
  ["#cfe1ff", "#101620", "#5da0ff"],
  ["#ffd8e4", "#1f1017", "#ff78a3"],
  ["#e6ffd6", "#131f10", "#9dff65"],
  ["#ffffff", "#151515", "#ffffff"],
  ["#d8d8d8", "#020202", "#888888"]
];

let assets = colors.map((palette, index) => ({
  title: `Work ${String(index + 1).padStart(2, "0")}`,
  src: createCard(palette, index + 1)
}));

let images = [];
let width = 0;
let height = 0;
let dpr = 1;
let radius = 360;
let elementScale = 0.62;
let sphereSize = 0.82;
let speed = 4;
let visibleCount = 12;
let direction = { x: 0.65, y: -0.35 };
let rotation = { x: -0.16, y: 0.38 };
let velocity = { x: 0.0009, y: 0.0015 };
let dragging = false;
let pointer = { x: 0, y: 0 };
let projected = [];

function createCard(palette, number) {
  const c = document.createElement("canvas");
  const g = c.getContext("2d");
  c.width = 520;
  c.height = 650;

  g.fillStyle = palette[1];
  g.fillRect(0, 0, c.width, c.height);

  const grad = g.createRadialGradient(330, 210, 20, 300, 260, 390);
  grad.addColorStop(0, palette[0]);
  grad.addColorStop(0.45, palette[2]);
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, c.height);

  g.strokeStyle = "rgba(255,255,255,.28)";
  g.lineWidth = 2;
  for (let i = 0; i < 8; i += 1) {
    g.beginPath();
    g.arc(260, 325, 70 + i * 34, 0.18 * i, Math.PI * 1.5 + 0.22 * i);
    g.stroke();
  }

  g.fillStyle = palette[0];
  g.font = "700 84px Arial";
  g.fillText(String(number).padStart(2, "0"), 38, 116);
  g.font = "500 26px Arial";
  g.fillText("PORTFOLIO", 40, 588);
  g.fillText("CASE", 40, 620);

  return c.toDataURL("image/png");
}

function loadImages() {
  images = assets.map((asset, index) => {
    const img = new Image();
    img.src = asset.src;
    img.alt = asset.title;
    return { ...asset, img, index };
  });
  assetCount.textContent = String(Math.min(assets.length, 25));
  visibleCount = Math.min(visibleCount, assets.length, 25);
  countButton.textContent = String(visibleCount);
}

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  radius = Math.min(width, height) * 0.42 * sphereSize;
}

function fibonacciPoint(index, total) {
  const offset = 2 / total;
  const increment = Math.PI * (3 - Math.sqrt(5));
  const y = index * offset - 1 + offset / 2;
  const r = Math.sqrt(1 - y * y);
  const phi = index * increment;
  return {
    x: Math.cos(phi) * r,
    y,
    z: Math.sin(phi) * r
  };
}

function rotate(point) {
  const cosY = Math.cos(rotation.y);
  const sinY = Math.sin(rotation.y);
  const cosX = Math.cos(rotation.x);
  const sinX = Math.sin(rotation.x);

  const x1 = point.x * cosY - point.z * sinY;
  const z1 = point.x * sinY + point.z * cosY;
  const y1 = point.y * cosX - z1 * sinX;
  const z2 = point.y * sinX + z1 * cosX;

  return { x: x1, y: y1, z: z2 };
}

function drawBackground() {
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.strokeStyle = "rgba(255,255,255,.055)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i += 1) {
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * (0.34 + i * 0.12), radius * 0.18, rotation.y + i * 0.18, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, 0, radius * 1.05, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,.11)";
  ctx.stroke();
  ctx.restore();
}

function drawImage(item, x, y, z, scale) {
  const baseW = 132 * elementScale * scale;
  const baseH = 164 * elementScale * scale;
  const alpha = 0.24 + ((z + 1) / 2) * 0.76;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate((x - width / 2) * 0.00055);
  ctx.shadowColor = "rgba(255,255,255,.25)";
  ctx.shadowBlur = z > 0.35 ? 18 : 2;

  roundedRect(-baseW / 2, -baseH / 2, baseW, baseH, 12 * scale);
  ctx.clip();
  ctx.drawImage(item.img, -baseW / 2, -baseH / 2, baseW, baseH);
  ctx.restore();

  if (z > 0.42) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, (z - 0.42) * 1.7);
    ctx.fillStyle = "#fff";
    ctx.font = `${10 + scale * 2}px IBM Plex Mono, monospace`;
    ctx.textAlign = "center";
    ctx.fillText(item.title, x, y + baseH / 2 + 18);
    ctx.restore();
  }

  return { x, y, w: baseW, h: baseH, item, z };
}

function roundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function render() {
  drawBackground();

  if (!dragging) {
    rotation.x += velocity.x * speed;
    rotation.y += velocity.y * speed;
    velocity.x += direction.y * 0.0000012;
    velocity.y += direction.x * 0.0000012;
    velocity.x *= 0.996;
    velocity.y *= 0.996;
  }

  const total = Math.min(visibleCount, images.length, 25);
  projected = [];

  const sorted = images.slice(0, total).map((item, index) => {
    const point = rotate(fibonacciPoint(index, total));
    return { item, point };
  }).sort((a, b) => a.point.z - b.point.z);

  sorted.forEach(({ item, point }) => {
    const depth = (point.z + 1) / 2;
    const scale = 0.65 + depth * 0.82;
    const x = width / 2 + point.x * radius;
    const y = height / 2 + point.y * radius;
    projected.push(drawImage(item, x, y, point.z, scale));
  });

  requestAnimationFrame(render);
}

assetInput.addEventListener("change", () => {
  const files = [...assetInput.files].slice(0, 25);
  if (!files.length) return;

  assets = files.map((file, index) => ({
    title: file.name.replace(/\.[^.]+$/, "").slice(0, 28) || `Work ${index + 1}`,
    src: URL.createObjectURL(file)
  }));
  loadImages();
});

canvas.addEventListener("pointerdown", (event) => {
  dragging = true;
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", (event) => {
  if (!dragging) return;
  const dx = event.clientX - pointer.x;
  const dy = event.clientY - pointer.y;
  rotation.y += dx * 0.005;
  rotation.x += dy * 0.005;
  velocity.y = dx * 0.00016;
  velocity.x = dy * 0.00016;
  pointer.x = event.clientX;
  pointer.y = event.clientY;
});

canvas.addEventListener("pointerup", (event) => {
  dragging = false;
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
});

canvas.addEventListener("click", (event) => {
  const hit = projected
    .filter((p) => Math.abs(event.clientX - p.x) <= p.w / 2 && Math.abs(event.clientY - p.y) <= p.h / 2)
    .sort((a, b) => b.z - a.z)[0];
  if (!hit) return;
  lightboxImage.src = hit.item.src;
  lightboxTitle.textContent = hit.item.title;
  lightbox.hidden = false;
});

directionPad.addEventListener("pointerdown", updateDirection);
directionPad.addEventListener("pointermove", (event) => {
  if (event.buttons) updateDirection(event);
});

function updateDirection(event) {
  const rect = directionPad.getBoundingClientRect();
  const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
  const y = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
  direction.x = (x / rect.width - 0.5) * 2;
  direction.y = (y / rect.height - 0.5) * 2;
  padHandle.style.left = `${x - 8}px`;
  padHandle.style.top = `${y - 8}px`;
}

speedButton.addEventListener("click", () => {
  speed = speed >= 10 ? 1 : speed + 1;
  speedValue.textContent = String(speed).padStart(2, "0");
});

countButton.addEventListener("click", () => {
  const next = Math.min(25, images.length);
  visibleCount = visibleCount >= next ? 1 : visibleCount + 1;
  countButton.textContent = String(visibleCount);
});

renderButton.addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "portfolio-sphere.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});

embedButton.addEventListener("click", () => {
  embedCode.value = `<iframe src="${location.href}" title="Portfolio Sphere" style="width:100%;height:720px;border:0;background:#000"></iframe>`;
  embedModal.hidden = false;
});

copyEmbed.addEventListener("click", async () => {
  await navigator.clipboard.writeText(embedCode.value);
  copyEmbed.textContent = "COPIED";
  setTimeout(() => {
    copyEmbed.textContent = "COPY";
  }, 1200);
});

closeLightbox.addEventListener("click", () => {
  lightbox.hidden = true;
});

closeEmbed.addEventListener("click", () => {
  embedModal.hidden = true;
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    lightbox.hidden = true;
    embedModal.hidden = true;
  }
});

window.addEventListener("resize", resize);

loadImages();
resize();
render();

