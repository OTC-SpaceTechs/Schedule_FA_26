// ---------- Flight events ----------

const latestEl = document.getElementById("latest-event");
const eventButtons = D.events.map((ev) => {
  const li = document.createElement("li");
  li.innerHTML = `
    <button type="button" class="event">
      <span class="event-time">${formatT(ev.t)}</span>
      <span class="event-title">${ev.title}</span>
      <span class="event-detail">${ev.detail}</span>
    </button>
  `;
  const button = li.querySelector("button");
  button.addEventListener("click", () => jumpTo(ev.t));
  document.getElementById("events").append(li);
  return button;
});

// Index of the most recent event at second i
function latestEventAt(i) {
  let latest = 0;
  D.events.forEach((ev, n) => {
    if (ev.t <= i) latest = n;
  });
  return latest;
}
let shownEvent = -1; // so the text only changes when the event does
