const canvas = document.querySelector("#marsCanvas");
const ctx = canvas.getContext("2d");
const particleCanvas = document.querySelector("#particleCanvas");
const particleCtx = particleCanvas.getContext("2d");
const companion = document.querySelector("[data-alien-companion]");
const companionSprite = companion.querySelector(".alien-companion__sprite");

const alienSprites = {
  idle: "assets/alien.png",
  curious: "assets/alien_curious.png",
  happy: "assets/alien_happy.png",
  thumbsup: "assets/alien_thumbsup.png",
  fly: "assets/alien_fly.png",
  walk: "assets/alien_walk.gif",
};

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

const particleState = {
  width: 0,
  height: 0,
  dpr: 1,
  particles: [],
  fallAngle: toRad(105),
};

function resizeParticleCanvas() {
  particleState.dpr = Math.min(window.devicePixelRatio || 1, 2);
  particleState.width = window.innerWidth;
  particleState.height = window.innerHeight;
  particleCanvas.width = Math.floor(particleState.width * particleState.dpr);
  particleCanvas.height = Math.floor(particleState.height * particleState.dpr);
  particleCanvas.style.width = `${particleState.width}px`;
  particleCanvas.style.height = `${particleState.height}px`;
  particleCtx.setTransform(particleState.dpr, 0, 0, particleState.dpr, 0, 0);

  const count = Math.floor(clamp((particleState.width * particleState.height) / 15000, 42, 110));
  particleState.particles = Array.from({ length: count }, createParticle);
}

function createParticle() {
  return {
    x: Math.random() * (particleState.width + 180) - 90,
    y: Math.random() * (particleState.height + 180) - 90,
    length: 10 + Math.random() * 26,
    speed: 0.45 + Math.random() * 1.1,
    alpha: 0.18 + Math.random() * 0.42,
    width: 0.7 + Math.random() * 1.4,
  };
}

function resetParticle(particle) {
  particle.x = Math.random() * (particleState.width + 220) - 160;
  particle.y = -40 - Math.random() * 180;
  particle.length = 10 + Math.random() * 26;
  particle.speed = 0.45 + Math.random() * 1.1;
  particle.alpha = 0.18 + Math.random() * 0.42;
  particle.width = 0.7 + Math.random() * 1.4;
}

function renderParticles() {
  const dx = Math.cos(particleState.fallAngle);
  const dy = Math.sin(particleState.fallAngle);

  particleCtx.clearRect(0, 0, particleState.width, particleState.height);
  particleCtx.lineCap = "round";

  particleState.particles.forEach((particle) => {
    particle.x += dx * particle.speed;
    particle.y += dy * particle.speed;

    if (particle.y > particleState.height + 80 || particle.x < -120) {
      resetParticle(particle);
    }

    particleCtx.globalAlpha = particle.alpha;
    particleCtx.lineWidth = particle.width;
    particleCtx.strokeStyle = "#eef7ff";
    particleCtx.beginPath();
    particleCtx.moveTo(particle.x, particle.y);
    particleCtx.lineTo(particle.x - dx * particle.length, particle.y - dy * particle.length);
    particleCtx.stroke();
  });

  particleCtx.globalAlpha = 1;
  requestAnimationFrame(renderParticles);
}

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
        item.querySelector("button").textContent = "選擇";
      });
      card.classList.add("is-active");
      card.querySelector("button").textContent = "已選擇";
    });
  });
}

function initBookingForm() {
  const form = document.querySelector(".booking-form");
  const note = document.querySelector(".form-note");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = new FormData(form).get("email");
    note.textContent = `${email} 已加入發射名單。`;
    form.reset();
  });
}

function initAlienCompanion() {
  const state = {
    dragging: false,
    hovered: false,
    pointerId: null,
    offsetX: 0,
    offsetY: 0,
    lastX: 0,
    lastY: 0,
    x: companion.offsetLeft,
    y: companion.offsetTop,
    settleTimer: null,
    thumbsupTimer: null,
    randomWalkTimer: null,
    walkFrame: null,
    suppressNextClick: false,
  };

  Object.values(alienSprites).forEach((src) => {
    const image = new Image();
    image.src = src;
  });

  function setSprite(name) {
    const nextSrc = alienSprites[name];
    if (companionSprite.getAttribute("src") !== nextSrc) {
      companionSprite.setAttribute("src", nextSrc);
    }
  }

  function setFacing(deltaX) {
    if (deltaX < -1) {
      companion.style.setProperty("--alien-facing", "-1");
    } else if (deltaX > 1) {
      companion.style.setProperty("--alien-facing", "1");
    }
  }

  function moveTo(x, y) {
    const maxX = window.innerWidth - companion.offsetWidth;
    const maxY = window.innerHeight - companion.offsetHeight;
    state.x = clamp(x, 8, maxX - 8);
    state.y = clamp(y, 76, maxY - 8);
    companion.style.left = `${state.x}px`;
    companion.style.top = `${state.y}px`;
  }

  function clearTimers() {
    window.clearTimeout(state.settleTimer);
    window.clearTimeout(state.thumbsupTimer);
    window.cancelAnimationFrame(state.walkFrame);
    state.walkFrame = null;
  }

  function settleAfterWalk(delay = 900) {
    state.settleTimer = window.setTimeout(() => {
      setSprite(state.hovered ? "curious" : "idle");
    }, delay);
  }

  function scheduleRandomWalk() {
    window.clearTimeout(state.randomWalkTimer);
    state.randomWalkTimer = window.setTimeout(() => {
      if (state.dragging || state.walkFrame) {
        scheduleRandomWalk();
        return;
      }

      const targetX = 16 + Math.random() * Math.max(1, window.innerWidth - companion.offsetWidth - 32);
      const targetY = 92 + Math.random() * Math.max(1, window.innerHeight - companion.offsetHeight - 108);
      walkTo(targetX, targetY, { celebrate: false, reschedule: true });
    }, 2600 + Math.random() * 3600);
  }

  function walkTo(targetX, targetY, options = {}) {
    const { celebrate = true, reschedule = false } = options;
    window.cancelAnimationFrame(state.walkFrame);
    window.clearTimeout(state.settleTimer);

    const startX = state.x;
    const startY = state.y;
    const deltaX = targetX - startX;
    const deltaY = targetY - startY;
    const distance = Math.hypot(deltaX, deltaY);
    const duration = clamp(distance * 6, 450, 1600);
    const startTime = performance.now();

    setFacing(deltaX);
    setSprite("walk");

    function step(now) {
      const progress = clamp((now - startTime) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      moveTo(startX + deltaX * eased, startY + deltaY * eased);

      if (progress < 1) {
        state.walkFrame = requestAnimationFrame(step);
        return;
      }

      state.walkFrame = null;
      setSprite(celebrate ? "thumbsup" : state.hovered ? "curious" : "idle");
      settleAfterWalk(celebrate ? 900 : 1200);
      if (reschedule) scheduleRandomWalk();
    }

    state.walkFrame = requestAnimationFrame(step);
  }

  companion.addEventListener("pointerenter", () => {
    state.hovered = true;
    if (!state.dragging) setSprite("curious");
  });

  companion.addEventListener("pointerleave", () => {
    state.hovered = false;
    if (!state.dragging) setSprite("idle");
  });

  companion.addEventListener("pointerdown", (event) => {
    clearTimers();
    window.clearTimeout(state.randomWalkTimer);
    state.dragging = true;
    state.pointerId = event.pointerId;
    state.offsetX = event.clientX - state.x;
    state.offsetY = event.clientY - state.y;
    state.lastX = event.clientX;
    state.lastY = event.clientY;
    state.suppressNextClick = true;
    companion.classList.add("is-dragging");
    companion.setPointerCapture(event.pointerId);
    setSprite("fly");
  });

  companion.addEventListener("pointermove", (event) => {
    if (!state.dragging || event.pointerId !== state.pointerId) return;

    const deltaX = event.clientX - state.lastX;
    moveTo(event.clientX - state.offsetX, event.clientY - state.offsetY);
    setFacing(deltaX);
    state.lastX = event.clientX;
    state.lastY = event.clientY;
  });

  function finishDrag(event) {
    if (!state.dragging || event.pointerId !== state.pointerId) return;

    state.dragging = false;
    state.pointerId = null;
    companion.classList.remove("is-dragging");
    if (companion.hasPointerCapture(event.pointerId)) {
      companion.releasePointerCapture(event.pointerId);
    }

    setSprite("walk");
    settleAfterWalk(850);
    scheduleRandomWalk();
  }

  companion.addEventListener("pointerup", finishDrag);
  companion.addEventListener("pointercancel", finishDrag);
  window.addEventListener("pointerup", finishDrag);
  window.addEventListener("pointercancel", finishDrag);

  companion.addEventListener("dblclick", () => {
    clearTimers();
    window.clearTimeout(state.randomWalkTimer);
    setSprite("happy");
    state.thumbsupTimer = window.setTimeout(() => setSprite("thumbsup"), 780);
    settleAfterWalk(1600);
    scheduleRandomWalk();
  });

  document.addEventListener("click", (event) => {
    if (state.suppressNextClick) {
      state.suppressNextClick = false;
      return;
    }

    if (event.target.closest(".alien-companion, a, button, input, form")) {
      return;
    }

    clearTimers();
    window.clearTimeout(state.randomWalkTimer);
    const targetX = event.clientX - companion.offsetWidth / 2;
    const targetY = event.clientY - companion.offsetHeight / 2;
    walkTo(targetX, targetY);
    scheduleRandomWalk();
  });

  window.addEventListener("resize", () => moveTo(state.x, state.y));
  moveTo(state.x, state.y);
  scheduleRandomWalk();
}

canvas.addEventListener("pointerdown", handlePointerDown);
canvas.addEventListener("pointermove", handlePointerMove);
canvas.addEventListener("pointerup", handlePointerUp);
canvas.addEventListener("pointercancel", handlePointerUp);
window.addEventListener("resize", resizeParticleCanvas);

resizeParticleCanvas();
renderParticles();
renderMarsGlobe();
initRevealEffects();
initCabinSelection();
initBookingForm();
initAlienCompanion();
