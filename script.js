const canvas = document.querySelector("#marsCanvas");
const ctx = canvas.getContext("2d");

const marsState = {
  rotationX: -10,
  rotationY: 18,
  velocityX: 0.08,
  velocityY: 0.04,
  dragging: false,
  lastX: 0,
  lastY: 0,
  craterMap: [
    [-42, -14, 0.08],
    [-24, 22, 0.13],
    [4, -32, 0.1],
    [26, 10, 0.16],
    [45, -18, 0.07],
    [58, 28, 0.11],
    [-62, 34, 0.09],
    [12, 44, 0.08],
    [-8, 2, 0.18],
  ],
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const toRad = (degrees) => (degrees * Math.PI) / 180;

function projectPoint(latitude, longitude, radius) {
  const lat = toRad(latitude + marsState.rotationX);
  const lon = toRad(longitude + marsState.rotationY);
  const x = radius * Math.cos(lat) * Math.sin(lon);
  const y = radius * Math.sin(lat);
  const z = radius * Math.cos(lat) * Math.cos(lon);

  return { x, y, z };
}

function renderMarsGlobe() {
  const size = canvas.width;
  const center = size / 2;
  const radius = size * 0.38;

  ctx.clearRect(0, 0, size, size);

  const halo = ctx.createRadialGradient(center, center, radius * 0.55, center, center, radius * 1.35);
  halo.addColorStop(0, "rgba(226, 88, 62, 0.34)");
  halo.addColorStop(1, "rgba(226, 88, 62, 0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(center, center, radius * 1.35, 0, Math.PI * 2);
  ctx.fill();

  const body = ctx.createRadialGradient(center - radius * 0.34, center - radius * 0.28, radius * 0.1, center, center, radius);
  body.addColorStop(0, "#ffb36f");
  body.addColorStop(0.42, "#df6040");
  body.addColorStop(1, "#67221d");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.clip();

  marsState.craterMap.forEach(([lat, lon, scale]) => {
    const point = projectPoint(lat, lon, radius);
    if (point.z < -radius * 0.25) return;

    const depth = (point.z + radius) / (radius * 2);
    const craterRadius = radius * scale * (0.5 + depth * 0.8);
    ctx.globalAlpha = 0.28 + depth * 0.28;
    ctx.fillStyle = "#441714";
    ctx.beginPath();
    ctx.ellipse(center + point.x, center - point.y, craterRadius * 1.25, craterRadius * 0.74, toRad(lon), 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.16 + depth * 0.22;
    ctx.strokeStyle = "#ffd19f";
    ctx.lineWidth = 3;
    ctx.stroke();
  });

  ctx.globalAlpha = 0.24;
  ctx.strokeStyle = "#ffc07f";
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.ellipse(center + radius * 0.08, center + radius * 0.12, radius * 0.9, radius * 0.2, toRad(-18 + marsState.rotationY * 0.12), 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
  ctx.globalAlpha = 1;

  const shade = ctx.createLinearGradient(center - radius, center - radius, center + radius, center + radius);
  shade.addColorStop(0, "rgba(255, 255, 255, 0.18)");
  shade.addColorStop(0.58, "rgba(0, 0, 0, 0)");
  shade.addColorStop(1, "rgba(0, 0, 0, 0.42)");
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.fill();

  if (!marsState.dragging) {
    marsState.rotationY += marsState.velocityX;
    marsState.rotationX = clamp(marsState.rotationX + marsState.velocityY, -78, 78);
    marsState.velocityX *= 0.992;
    marsState.velocityY *= 0.992;

    if (Math.abs(marsState.velocityX) < 0.035) marsState.velocityX = 0.035;
  }

  requestAnimationFrame(renderMarsGlobe);
}

function handlePointerDown(event) {
  marsState.dragging = true;
  marsState.lastX = event.clientX;
  marsState.lastY = event.clientY;
  canvas.setPointerCapture(event.pointerId);
}

function handlePointerMove(event) {
  if (!marsState.dragging) return;

  const deltaX = event.clientX - marsState.lastX;
  const deltaY = event.clientY - marsState.lastY;
  marsState.rotationY += deltaX * 0.28;
  marsState.rotationX = clamp(marsState.rotationX - deltaY * 0.28, -78, 78);
  marsState.velocityX = deltaX * 0.04;
  marsState.velocityY = -deltaY * 0.04;
  marsState.lastX = event.clientX;
  marsState.lastY = event.clientY;
}

function handlePointerUp(event) {
  marsState.dragging = false;
  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
}

function animateCounter(element) {
  const target = Number(element.dataset.counter);
  const decimals = Number(element.dataset.decimals || 0);
  const duration = 1200;
  const start = performance.now();

  function tick(now) {
    const progress = clamp((now - start) / duration, 0, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = (target * eased).toFixed(decimals);
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

function initRevealEffects() {
  const counters = new Set();
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");

        entry.target.querySelectorAll("[data-counter]").forEach((counter) => {
          if (counters.has(counter)) return;
          counters.add(counter);
          animateCounter(counter);
        });
      });
    },
    { threshold: 0.18 }
  );

  document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
}

function initCabinSelection() {
  const cards = [...document.querySelectorAll(".cabin-card")];
  cards.forEach((card) => {
    card.querySelector("button").addEventListener("click", () => {
      cards.forEach((item) => {
        item.classList.remove("is-active");
        item.querySelector("button").textContent = "Select";
      });
      card.classList.add("is-active");
      card.querySelector("button").textContent = "Selected";
    });
  });
}

function initBookingForm() {
  const form = document.querySelector(".booking-form");
  const note = document.querySelector(".form-note");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = new FormData(form).get("email");
    note.textContent = `${email} has been added to the launch manifest.`;
    form.reset();
  });
}

canvas.addEventListener("pointerdown", handlePointerDown);
canvas.addEventListener("pointermove", handlePointerMove);
canvas.addEventListener("pointerup", handlePointerUp);
canvas.addEventListener("pointercancel", handlePointerUp);

renderMarsGlobe();
initRevealEffects();
initCabinSelection();
initBookingForm();
