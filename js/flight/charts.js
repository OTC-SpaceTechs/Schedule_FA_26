// ---------- Charts ----------

const cursors = []; // one per chart, moved by update()

// Pick round-number gridlines, e.g. 0, 50, 100, 150
function niceTicks(lo, hi, count = 4) {
  const rough = (hi - lo) / count;
  const mag = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10].map((n) => n * mag).find((s) => s >= rough);
  const ticks = [];
  for (let v = Math.floor(lo / step) * step; v < hi + step; v += step) {
    ticks.push(v);
  }
  return ticks;
}

function makeChart(m, wide = false) {
  const data = S[m.key];

  // Acceleration and rotation are spiky, so draw a 30-second average
  // on top of the faint raw readings.
  const noisy = m.key === "accel" || m.key === "rot";
  const lineData = noisy ? smooth(data, 15) : data;

  // 1. Gridlines, and the y-range they cover
  const ticks = niceTicks(Math.min(0, ...data), Math.max(...data));
  const yMin = ticks[0];
  const yMax = ticks[ticks.length - 1];

  // 2. Data -> drawing coordinates (the SVG is 1000 wide, 100 tall)
  const x = (t) => (t / LAST) * 1000;
  const y = (v) => 100 - ((v - yMin) / (yMax - yMin)) * 100;
  const pct = (t) => (t / LAST) * 100; // same thing, as a CSS %

  // 3. One path through every point: "M x,y L x,y L x,y ..."
  const toPath = (arr) =>
    arr
      .map(
        (v, t) =>
          `${t === 0 ? "M" : "L"}${x(t).toFixed(1)},${y(v).toFixed(2)}`,
      )
      .join("");
  const d = toPath(lineData);
  const area = `${d}L1000,100L0,100Z`; // same line, closed along the bottom

  // 4. Pieces of the chart, built as HTML strings
  const gridLines = ticks
    .map(
      (v) =>
        `<line class="grid" x1="0" x2="1000" y1="${y(v)}" y2="${y(v)}" />`,
    )
    .join("");

  const yLabels = ticks
    .map(
      (v) =>
        `<span class="y-label" style="top: ${y(v)}%">${v.toLocaleString()}</span>`,
    )
    .join("");

  const xTicks = [0, 1800, 3600, 5400, 7200]; // every 30 minutes
  const xLabels = xTicks
    .map((t) => `<span style="left: ${pct(t)}%">${formatClock(t)}</span>`)
    .join("");

  // The record point, labeled; flip the label so it stays inside the chart
  const ex = D.extremes[m.key];
  const exClass =
    (pct(ex.t) > 70 ? " flip-x" : "") + (y(ex.v) < 25 ? " below" : "");

  // 5. Put it together
  const id = m.key; // SVG ids must be unique on the page
  const fig = document.createElement("figure");
  fig.className = wide ? "chart wide" : "chart";
  fig.innerHTML = `
    <h3>${m.label} <small>${m.unit}</small></h3>
    <div class="plot">
      <div class="phase-band" style="left: ${pct(D.burst)}%; right: ${100 - pct(D.landing)}%"></div>
      <span class="phase-tag" style="left: 0">Ascent</span>
      <span class="phase-tag" style="left: ${pct(D.burst)}%">Descent</span>
      <svg viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="fill-${id}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style="stop-color: var(--teal); stop-opacity: 0.35" />
            <stop offset="1" style="stop-color: var(--teal); stop-opacity: 0" />
          </linearGradient>
          <clipPath id="played-${id}">
            <rect class="played-rect" x="0" y="-10" width="0" height="120" />
          </clipPath>
        </defs>
        ${gridLines}
        ${noisy ? `<path class="raw" d="${toPath(data)}" />` : ""}
        <path d="${area}" fill="url(#fill-${id})" />
        <path class="line ahead" d="${d}" />
        <path class="line" d="${d}" clip-path="url(#played-${id})" />
      </svg>
      <span class="ex-dot" style="left: ${pct(ex.t)}%; top: ${y(ex.v)}%"></span>
      <span class="ex-label${exClass}" style="left: ${pct(ex.t)}%; top: ${y(ex.v)}%">
        ${isMin(m) ? "Min" : "Max"} ${fmt(m, ex.v)}
      </span>
      ${yLabels}
      <div class="cursor"><span class="cursor-dot"></span></div>
      <div class="hover"></div>
      <span class="tooltip" hidden></span>
    </div>
    <div class="x-axis">${xLabels}</div>
  `;

  // 6. Remember this chart's cursor so playback can move it
  cursors.push({
    line: fig.querySelector(".cursor"),
    dot: fig.querySelector(".cursor-dot"),
    played: fig.querySelector(".played-rect"),
    data: lineData,
    y: y,
  });

  // 7. Hover shows the exact reading; click jumps playback there
  const plot = fig.querySelector(".plot");
  const hover = fig.querySelector(".hover");
  const tip = fig.querySelector(".tooltip");
  const timeAt = (e) => {
    const box = plot.getBoundingClientRect();
    const frac = (e.clientX - box.left) / box.width;
    return Math.round(Math.min(Math.max(frac, 0), 1) * LAST);
  };

  plot.addEventListener("pointermove", (e) => {
    const t = timeAt(e);
    hover.style.display = "block";
    hover.style.left = `${pct(t)}%`;
    tip.hidden = false;
    tip.style.left = `${pct(t)}%`;
    tip.classList.toggle("flip-x", pct(t) > 70);
    tip.textContent = `${formatT(t)} · ${fmt(m, data[t])} ${m.unit}`;
  });
  plot.addEventListener("pointerleave", () => {
    hover.style.display = "none";
    tip.hidden = true;
  });
  plot.addEventListener("click", (e) => update(timeAt(e)));

  return fig;
}

// Altitude leads (full width) and pressure closes; the rest pair up
const chartsEl = document.getElementById("charts");
chartsEl.append(makeChart(metric("alt_ft"), true));
for (const key of ["accel", "rot", "hum", "temp_f"]) {
  chartsEl.append(makeChart(metric(key)));
}
chartsEl.append(makeChart(metric("pres"), true));
