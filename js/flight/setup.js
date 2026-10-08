// Flight data page scripts. These files share variables, so they must load
// in the order listed at the bottom of flight_data.html (this one first).

// ---------- Setup ----------

const D = FLIGHT_DATA; // short name for the whole data object
const S = D.series; // S.alt_ft, S.accel, etc. - one value per second
const LAST = S.alt_ft.length - 1; // index of the final second (7698)

const METRICS = [
  {
    key: "alt_ft",
    label: "Altitude",
    unit: "ft",
    digits: 0,
    alt: (v) =>
      `${Math.round(v * 0.3048).toLocaleString()} m above sea level`,
  },
  {
    key: "accel",
    label: "Acceleration",
    unit: "m/s²",
    digits: 1,
    alt: (v) => `${(v / 9.80665).toFixed(1)} g`,
  },
  { key: "hum", label: "Humidity", unit: "%", digits: 1 },
  { key: "rot", label: "Rotation", unit: "°/s", digits: 0 },
  {
    key: "temp_f",
    label: "Temperature",
    unit: "°F",
    digits: 1,
    alt: (v) => `${(((v - 32) * 5) / 9).toFixed(1)} °C`,
  },
  { key: "pres", label: "Pressure", unit: "hPa", digits: 1 },
];

const metric = (key) => METRICS.find((m) => m.key === key);
const isMin = (m) => m.key === "hum" || m.key === "temp_f" || m.key === "pres";

// ---------- Formatting helpers ----------

const pad2 = (n) => String(n).padStart(2, "0");

// 5141 -> "T+1:25:41"
function formatT(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `T+${h}:${pad2(m)}:${pad2(s)}`;
}

// 5400 -> "1:30" (hours:minutes, for chart axes)
function formatClock(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}:${pad2(m)}`;
}

// Format a number with the right decimal places and thousands commas
function fmt(m, v) {
  return v.toLocaleString(undefined, {
    minimumFractionDigits: m.digits,
    maximumFractionDigits: m.digits,
  });
}

// Average each point with its neighbors (window = seconds on each side)
function smooth(data, window) {
  return data.map((_, i) => {
    const lo = Math.max(0, i - window);
    const hi = Math.min(data.length - 1, i + window);
    let sum = 0;
    for (let j = lo; j <= hi; j++) sum += data[j];
    return sum / (hi - lo + 1);
  });
}
