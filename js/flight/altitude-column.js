// ---------- Altitude column ----------
// A tall picture of the flight path: time runs left to right, altitude
// bottom to top, with the balloon (then parachute) riding along it.

const COL = {
  w: 170,
  h: 360,
  left: 8,
  right: 162,
  top: 34,
  seaLevel: 336,
};
const ALT_TOP = 100000; // ft at the top of the column
const colX = (t) => COL.left + (t / LAST) * (COL.right - COL.left);
const colY = (ft) =>
  COL.seaLevel - (ft / ALT_TOP) * (COL.seaLevel - COL.top);

// Flight path, one point every 30 seconds
let trail = "";
for (let t = 0; t <= LAST; t += 30) {
  trail += `${t === 0 ? "M" : "L"}${colX(t).toFixed(1)},${colY(S.alt_ft[t]).toFixed(1)}`;
}

// Events that mark a height get a dashed line across the column
// (short names here so the labels fit the narrow column)
const LINE_EVENTS = {
  Burst: "Burst",
  "Into the stratosphere": "Stratosphere",
  "Coldest reading": "Coldest",
};
const lineEvents = D.events
  .filter((ev) => ev.title in LINE_EVENTS)
  .map((ev) => ({
    ft: S.alt_ft[ev.t],
    label: `${LINE_EVENTS[ev.title]} · ${fmt(metric("alt_ft"), S.alt_ft[ev.t])} ft`,
  }));
const launchFt = S.alt_ft[0]; // launch site height above sea level
const eventLines = lineEvents
  .map(
    (ev) => `
      <line class="event-line" x1="${COL.left}" x2="${COL.right}" y1="${colY(ev.ft)}" y2="${colY(ev.ft)}" />
      <text x="${COL.left}" y="${colY(ev.ft) - 4}">${ev.label}</text>`,
  )
  .join("");

document.getElementById("alt-column").innerHTML = `
  <svg viewBox="0 0 ${COL.w} ${COL.h}" role="img" aria-label="Flight path: the balloon rose to ${fmt(metric("alt_ft"), D.extremes.alt_ft.v)} feet, burst, and parachuted back down">
    <defs>
      <clipPath id="trail-clip">
        <rect id="trail-rect" x="0" y="0" width="0" height="${COL.h}" />
      </clipPath>
    </defs>
    ${eventLines}
    <line class="ground" x1="0" x2="${COL.w}" y1="${colY(launchFt)}" y2="${colY(launchFt)}" />
    <text x="${COL.left}" y="${colY(launchFt) + 14}">Launch site · ${fmt(metric("alt_ft"), launchFt)} ft</text>
    <path class="trail-ahead" d="${trail}" />
    <path class="trail" d="${trail}" clip-path="url(#trail-clip)" />
    ${D.events
      .map(
        (ev) =>
          `<circle class="event-dot" cx="${colX(ev.t)}" cy="${colY(S.alt_ft[ev.t])}" r="3" />`,
      )
      .join("")}

    <g id="craft">
      <g id="balloon">
        <line x1="0" y1="-4" x2="0" y2="-14" stroke="rgba(234,242,255,0.6)" />
        <circle cx="0" cy="-22" r="8" fill="#f4f6fb" />
      </g>
      <g id="chute">
        <path d="M-11,-15 A11,9 0 0 1 11,-15 Z" fill="#e05252" />
        <line x1="-11" y1="-15" x2="0" y2="-4" stroke="rgba(234,242,255,0.6)" />
        <line x1="11" y1="-15" x2="0" y2="-4" stroke="rgba(234,242,255,0.6)" />
      </g>
      <rect x="-4" y="-4" width="8" height="8" rx="1" fill="#f08a3c" />
    </g>
  </svg>
`;

const craft = document.getElementById("craft");
const balloon = document.getElementById("balloon");
const chute = document.getElementById("chute");
const trailRect = document.getElementById("trail-rect");
const eventDots = [
  ...document.querySelectorAll("#alt-column .event-dot"),
];
