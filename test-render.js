// Headless render test: load index.html in jsdom, execute scripts, assert DOM
const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");

const dir = "/Users/kalias/Documents/project/2026worldcup";
const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
const dataJs = fs.readFileSync(path.join(dir, "data.js"), "utf8");
const appJs = fs.readFileSync(path.join(dir, "app.js"), "utf8");

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  pretendToBeVisual: true,
});
const { window } = dom;
window.HTMLElement.prototype.getBoundingClientRect = function () {
  return { left: 0, top: 0, right: 100, bottom: 50, width: 100, height: 50 };
};
window.requestAnimationFrame = () => {};
window.console = console;
// mock matchMedia as DESKTOP (no coarse pointer) — tooltip follows cursor
window.matchMedia = (q) => ({
  matches: false,
  media: q,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
});

// load data.js then app.js into the window via injected script element
const scriptEl = window.document.createElement("script");
scriptEl.textContent = dataJs + "\n" + appJs;
window.document.body.appendChild(scriptEl);

const doc = window.document;

let failures = 0;
function assert(cond, msg) {
  if (!cond) { console.error("❌ FAIL:", msg); failures++; }
  else console.log("✅", msg);
}

// 1. layout structure: two halves + center
const halves = doc.querySelectorAll(".bracket .half");
assert(halves.length === 2, `2 halves rendered (got ${halves.length})`);
const center = doc.querySelector(".bracket .center");
assert(!!center, "center column present");
assert(!!doc.querySelector(".scroll-hint"), "scroll-hint element in DOM (hidden via CSS on desktop)");
// 8 round columns total (4 left + 4 right)
const rounds = doc.querySelectorAll(".bracket .round");
assert(rounds.length === 8, `8 round columns (got ${rounds.length})`);

// team names rendered in Chinese
const firstTeamName = doc.querySelector(".match .team .name");
assert(firstTeamName && firstTeamName.textContent === "巴西", `first team name in 中文 = ${firstTeamName && firstTeamName.textContent}`);

// 2. matches count
const matches = doc.querySelectorAll(".match");
assert(matches.length === 16 + 8 + 4 + 2 + 1, `${matches.length} matches (32+16+8+4+1)`);

// 3. predicted matches have rationale
const predMatches = Array.from(doc.querySelectorAll(".match.is-pred"));
assert(predMatches.length === 15, `${predMatches.length} predicted matches`);

// 4. champion rendered with Argentina
const champ = doc.querySelector(".champion .name");
assert(champ && champ.textContent === "阿根廷", `Champion (中文) = ${champ && champ.textContent}`);

// 5. done matches count (16 r32)
const done = doc.querySelectorAll(".match.is-done");
assert(done.length === 16, `${done.length} completed matches`);

// 6. final match is in center, key = final:0
const finalMatch = doc.querySelector('.match[data-key="final:0"]');
assert(!!finalMatch, "final match present with key final:0");
const finalInCenter = doc.querySelector(".center .match");
assert(!!finalInCenter && finalInCenter.getAttribute("data-key") === "final:0", "final is inside center column");

// 7. verify all FLAGS resolve (no default flag) — read ROUNDS from window context
const missingFlags = window.eval(`(function(){
  const miss = [];
  ROUNDS.forEach(function(r){ r.matches.forEach(function(m){
    [m.a, m.b].forEach(function(t){ if (!FLAGS[t]) miss.push(t); });
  }); });
  return miss;
})()`);
assert(missingFlags.length === 0, `all flags resolve (missing: ${missingFlags.join(",") || "none"})`);

// 8. verify bracket wiring: r32 winner feeds correct r16 slot
const r16 = window.eval("ROUNDS[1].matches");
assert(r16[0].a === "Brazil" && r16[0].b === "Norway", `r16[0] = ${r16[0].a} vs ${r16[0].b}`);
assert(r16[1].a === "Morocco" && r16[1].b === "Canada", `r16[1] pairing`);

// 9. each predicted match has rationale with title/verdict/points/reasoning
const rationalesOk = window.eval(`(function(){
  var ok = true;
  ROUNDS.forEach(function(r){ r.matches.forEach(function(m){
    if (m.status === "pred") {
      if (!m.rationale || !m.rationale.verdict || !m.rationale.reasoning || !Array.isArray(m.rationale.points)) {
        ok = false;
      }
    }
  }); });
  return ok;
})()`);
assert(rationalesOk, "all predicted matches have full rationale");

// 10. tooltip element exists
assert(!!doc.getElementById("tooltip"), "tooltip element present");

console.log(failures === 0 ? "\n🎉 ALL CHECKS PASSED" : `\n💥 ${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
