// Mobile-specific render test: mock touch device, assert mobile UX elements
const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");

const dir = "/Users/kalias/Documents/project/2026worldcup";
const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
const dataJs = fs.readFileSync(path.join(dir, "data.js"), "utf8");
const appJs = fs.readFileSync(path.join(dir, "app.js"), "utf8");

const dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true });
const { window } = dom;
window.HTMLElement.prototype.getBoundingClientRect = function () {
  return { left: 0, top: 0, right: 100, bottom: 50, width: 100, height: 50 };
};
window.requestAnimationFrame = () => {};
window.console = console;

// mock matchMedia as a TOUCH device
window.matchMedia = (q) => ({
  matches: q.includes("coarse"),
  media: q,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
});

const scriptEl = window.document.createElement("script");
scriptEl.textContent = dataJs + "\n" + appJs;
window.document.body.appendChild(scriptEl);

const doc = window.document;
let failures = 0;
function assert(cond, msg) {
  if (!cond) { console.error("❌ FAIL:", msg); failures++; }
  else console.log("✅", msg);
}

// 1. scroll-hint element present
assert(!!doc.querySelector(".scroll-hint"), "scroll-hint bar present in DOM");

// 2. bracketScroll has id for scroll-edge logic
assert(!!doc.getElementById("bracketScroll"), "bracketScroll container has id");

// 3. click a predicted match → tooltip shows with is-mobile class
const predMatch = doc.querySelector('.match.is-pred[data-key="r16:0"]');
assert(!!predMatch, "predicted r16:0 match exists");
predMatch.dispatchEvent(new window.MouseEvent("click", { bubbles: true, clientX: 10, clientY: 10 }));
const tt = doc.getElementById("tooltip");
assert(tt.classList.contains("show"), "tooltip shown after tap");
assert(tt.classList.contains("is-mobile"), "tooltip has is-mobile class (bottom-fixed)");

// 4. tap same match again → dismissed
predMatch.dispatchEvent(new window.MouseEvent("click", { bubbles: true, clientX: 10, clientY: 10 }));
assert(!tt.classList.contains("show"), "tooltip dismissed on second tap of same card");

// 5. tap champion → tooltip is-mobile
const champ = doc.querySelector(".champion");
champ.dispatchEvent(new window.MouseEvent("click", { bubbles: true, clientX: 10, clientY: 10 }));
assert(tt.classList.contains("show") && tt.classList.contains("is-mobile"), "champion tap shows mobile tooltip");

// 6. scroll-edge classes toggle: simulate scrollLeft
const scrollEl = doc.getElementById("bracketScroll");
Object.defineProperty(scrollEl, "scrollWidth", { value: 1000, configurable: true });
Object.defineProperty(scrollEl, "clientWidth", { value: 300, configurable: true });
Object.defineProperty(scrollEl, "scrollLeft", { value: 0, configurable: true });
scrollEl.dispatchEvent(new window.Event("scroll"));
assert(scrollEl.classList.contains("at-start"), "at-start at scrollLeft 0");
Object.defineProperty(scrollEl, "scrollLeft", { value: 700, configurable: true });
scrollEl.dispatchEvent(new window.Event("scroll"));
assert(scrollEl.classList.contains("at-end"), "at-end near max scroll");

console.log(failures === 0 ? "\n🎉 MOBILE CHECKS PASSED" : `\n💥 ${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
