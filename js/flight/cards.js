// ---------- Flight record cards ----------

const cardsEl = document.getElementById("cards");

for (const m of METRICS) {
  const ex = D.extremes[m.key]; // { t: when, v: value }

  const card = document.createElement("button"); // a button so it can be clicked
  card.type = "button";
  card.className = "card";
  card.innerHTML = `
    <span class="card-label">${isMin(m) ? "Min" : "Max"} ${m.label}</span>
    <span class="card-value">${fmt(m, ex.v)} <small>${m.unit}</small></span>
    ${m.alt ? `<span class="card-alt">${m.alt(ex.v)}</span>` : ""}
    <span class="card-time">at ${formatT(ex.t)}</span>
  `;
  card.addEventListener("click", () => jumpTo(ex.t));
  cardsEl.append(card);
}
