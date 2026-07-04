// E2E browser test: load page in real headless Chrome, hover right-half R32
// cards, assert tooltips show the CORRECT match (regression for data-key
// collision bug that made right-half tooltips show left-half matches).
const { chromium } = require("playwright");
const path = require("path");
const http = require("http");
const fs = require("fs");

const dir = path.resolve(__dirname);
let server, failures = 0;

function assert(cond, msg) {
  if (!cond) { console.error("❌ FAIL:", msg); failures++; }
  else console.log("✅", msg);
}

async function run() {
  // serve files
  server = http.createServer((req, res) => {
    let file = path.join(dir, req.url === "/" ? "index.html" : req.url);
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); res.end("not found"); return; }
      res.writeHead(200); res.end(data);
    });
  });
  await new Promise((r) => server.listen(7654, r));

  const browser = await chromium.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

  await page.goto("http://localhost:7654/", { waitUntil: "networkidle" });
  await page.waitForSelector(".match");

  // 1. no JS console errors (favicon 404 is harmless, ignore)
  const realErrors = errors.filter((e) => !e.includes("404") && !e.includes("favicon"));
  assert(realErrors.length === 0, `no JS console errors (got ${realErrors.length}: ${realErrors.join("; ")})`);

  // 2. all data-keys unique
  const keyUniq = await page.evaluate(() => {
    const ks = Array.from(document.querySelectorAll(".match")).map((n) => n.getAttribute("data-key"));
    return { total: ks.length, uniq: new Set(ks).size };
  });
  assert(keyUniq.total === keyUniq.uniq, `all ${keyUniq.total} match keys unique (uniq=${keyUniq.uniq})`);

  // helper: hover a card identified by a key, read tooltip text
  async function hoverAndRead(key) {
    const card = await page.$(`.match[data-key="${key}"]`);
    if (!card) return { found: false };
    await card.hover();
    await page.waitForTimeout(250); // tooltip show transition
    const tt = await page.$("#tooltip.show");
    if (!tt) return { found: true, ttText: null };
    const txt = await tt.evaluate((el) => el.innerText);
    return { found: true, ttText: txt };
  }

  // 3. Portugal (right half R32) — key should be r32:11
  //    The card whose .name includes 葡萄牙 AND data-key starts r32:
  const portugalKey = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.match[data-key^="r32:"]'));
    const p = cards.find((n) => {
      const names = Array.from(n.querySelectorAll(".name")).map((e) => e.textContent);
      return names.includes("葡萄牙");
    });
    return p ? p.getAttribute("data-key") : null;
  });
  assert(!!portugalKey, `Portugal R32 card found, key=${portugalKey}`);

  if (portugalKey) {
    const r = await hoverAndRead(portugalKey);
    assert(r.ttText && r.ttText.includes("葡萄牙"), `Portugal tooltip mentions 葡萄牙 (text: ${r.ttText || "null"})`);
    assert(r.ttText && r.ttText.includes("克罗地亚"), `Portugal tooltip mentions 克罗地亚`);
    assert(!r.ttText || !r.ttText.includes("点球"), `Portugal tooltip has NO 点球 (text: ${(r.ttText||"").slice(0,60)})`);
  }

  // 4. Switzerland (right half R32) — should resolve to Switzerland 2-0 Algeria, no pens
  const swissKey = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.match[data-key^="r32:"]'));
    const p = cards.find((n) => {
      const names = Array.from(n.querySelectorAll(".name")).map((e) => e.textContent);
      return names.includes("瑞士");
    });
    return p ? p.getAttribute("data-key") : null;
  });
  assert(!!swissKey, `Switzerland R32 card found, key=${swissKey}`);
  if (swissKey) {
    const r = await hoverAndRead(swissKey);
    assert(r.ttText && r.ttText.includes("瑞士"), `Switzerland tooltip mentions 瑞士`);
    assert(!r.ttText || !r.ttText.includes("点球"), `Switzerland tooltip has NO 点球`);
  }

  // 5. Morocco (left half, r32:3) — SHOULD show 点球 (genuine shootout)
  const moroccoR = await hoverAndRead("r32:3");
  assert(moroccoR.ttText && moroccoR.ttText.includes("摩洛哥"), `Morocco tooltip mentions 摩洛哥`);
  assert(moroccoR.ttText && moroccoR.ttText.includes("点球"), `Morocco tooltip DOES show 点球 (genuine shootout)`);

  // 6. Belgium (right half, first R32 card) — key r32:8, should NOT show Brazil's data
  const belgiumR = await hoverAndRead("r32:8");
  assert(belgiumR.ttText && belgiumR.ttText.includes("比利时"), `Belgium (r32:8) tooltip mentions 比利时 (not Brazil)`);

  await browser.close();
  server.close();
  console.log(failures === 0 ? "\n🎉 E2E PASSED" : `\n💥 ${failures} FAILURES`);
  process.exit(failures === 0 ? 0 : 1);
}

run().catch((e) => { console.error("E2E CRASH:", e); server && server.close(); process.exit(2); });
