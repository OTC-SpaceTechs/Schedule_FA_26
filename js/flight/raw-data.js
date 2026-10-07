// ---------- Raw data ----------

document.getElementById("launch-ft").textContent = fmt(
  metric("alt_ft"),
  S.alt_ft[0],
);
document.getElementById("launch-second").textContent =
  `time_s = ${D.launchLogSecond}`;

// Table view of the flight, every 5 minutes plus the landing moment
const tableTimes = [];
for (let t = 0; t < D.landing; t += 300) tableTimes.push(t);
tableTimes.push(D.landing);

document.getElementById("table-head").innerHTML = `
  <tr>
    <th scope="col">Time</th>
    ${METRICS.map((m) => `<th scope="col">${m.label} (${m.unit})</th>`).join("")}
  </tr>
`;
document.getElementById("table-body").innerHTML = tableTimes
  .map(
    (t) => `
      <tr>
        <th scope="row">${formatT(t)}</th>
        ${METRICS.map((m) => `<td>${fmt(m, S[m.key][t])}</td>`).join("")}
      </tr>`,
  )
  .join("");
