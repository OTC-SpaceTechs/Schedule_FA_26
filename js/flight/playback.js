// ---------- Playback ----------

const scrubber = document.getElementById("scrubber");
const clockEl = document.getElementById("clock");
const playBtn = document.getElementById("play-btn");
const speedSel = document.getElementById("speed");
const phaseEl = document.getElementById("phase");
const readoutsEl = document.getElementById("readouts");

scrubber.max = LAST;
document.getElementById("end-label").textContent = formatT(LAST);

// One readout box per metric; keep a handle on each value <span>
const readoutValues = {};
for (const m of METRICS) {
  const box = document.createElement("div");
  box.className = "readout";
  box.innerHTML = `
    <span class="readout-label">${m.label}</span>
    <span class="readout-value"></span>
  `;
  readoutValues[m.key] = box.querySelector(".readout-value");
  readoutsEl.append(box);
}

let t = 0; // current playback time in seconds (can be fractional)
let playing = false;
let lastFrame = null; // timestamp of the previous animation frame

// The one function that moves everything to time `newT`
function update(newT) {
  t = Math.min(Math.max(newT, 0), LAST);
  const i = Math.round(t); // array index for this second

  clockEl.textContent = formatT(i);
  scrubber.value = i;
  scrubber.setAttribute(
    "aria-valuetext",
    `${formatT(i)}, altitude ${fmt(metric("alt_ft"), S.alt_ft[i])} feet`,
  );

  for (const m of METRICS) {
    readoutValues[m.key].innerHTML =
      `${fmt(m, S[m.key][i])} <small>${m.unit}</small>`;
  }

  if (i < D.burst) phaseEl.textContent = "Ascending";
  else if (i < D.landing) phaseEl.textContent = "Descending";
  else phaseEl.textContent = "Landed";

  for (const c of cursors) {
    c.line.style.left = `${(t / LAST) * 100}%`;
    c.dot.style.top = `${c.y(c.data[i])}%`;
    c.played.setAttribute("width", (t / LAST) * 1000);
  }

  // Altitude column: move the craft, swap balloon -> parachute at burst
  craft.setAttribute(
    "transform",
    `translate(${colX(t)}, ${colY(S.alt_ft[i])})`,
  );
  balloon.style.display = i < D.burst ? "" : "none";
  chute.style.display = i >= D.burst && i < D.landing ? "" : "none";
  trailRect.setAttribute("width", colX(t));

  // Highlight the latest event everywhere it appears
  const n = latestEventAt(i);
  if (n !== shownEvent) {
    shownEvent = n;
    const ev = D.events[n];
    latestEl.innerHTML = `<strong>${ev.title}</strong> · ${formatT(ev.t)}<br />${ev.detail}`;
    eventButtons.forEach((b, k) => b.classList.toggle("active", k === n));
    eventDots.forEach((d, k) => d.classList.toggle("active", k === n));
  }
}

// Runs ~60 times a second while playing
function frame(now) {
  if (!playing) return;
  if (lastFrame === null) lastFrame = now; // first frame: nothing elapsed yet
  const elapsed = (now - lastFrame) / 1000; // real seconds since last frame
  lastFrame = now;
  update(t + elapsed * Number(speedSel.value));

  if (t >= LAST) setPlaying(false);
  else requestAnimationFrame(frame);
}

function setPlaying(on) {
  playing = on;
  playBtn.textContent = on ? "Pause" : "Play";
  if (on) {
    if (t >= LAST) update(0); // at the end? start over
    lastFrame = null;
    requestAnimationFrame(frame);
  }
}

// Used by the cards: jump to a moment and bring playback into view
function jumpTo(sec) {
  update(sec);
  const reduceMotion = matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  document
    .getElementById("playback")
    .scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
}

playBtn.addEventListener("click", () => setPlaying(!playing));
scrubber.addEventListener("input", () => update(Number(scrubber.value)));

update(0);
