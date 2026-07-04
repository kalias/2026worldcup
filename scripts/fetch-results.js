#!/usr/bin/env node
/* ============================================================
 *  fetch-results.js
 *  从 ESPN 公开 API 抓取 2026 世界杯已完赛结果，
 *  据此更新 data.js 中对应比赛的比分/状态/晋级队。
 *
 *  - 只更新"已完赛"(ESPN status = STATUS_FINAL_*)的比赛
 *  - 未赛(STATUS_SCHEDULED)的比赛保持原状（可能是预测）
 *  - 保留 data.js 中的 rationale / note / 注释，只替换比分字段
 *  - 采用正则字段级替换，而非整体重写，保证 rationale 不被破坏
 *
 *  用法：
 *    node scripts/fetch-results.js            # 抓取并更新
 *    node scripts/fetch-results.js --dry-run  # 只打印变更，不写文件
 * ============================================================ */

const fs = require("fs");
const path = require("path");
const https = require("https");

const ROOT = path.resolve(__dirname, "..");
const DATA_FILE = path.join(ROOT, "data.js");
const DRY_RUN = process.argv.includes("--dry-run");

const ESPN_URL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719";

/* ---- ESPN 队名 → data.js 队名 映射 ----
 * ESPN 用的名字和我们 data.js 里的不完全一致，统一映射。 */
const TEAM_NAME_MAP = {
  "United States": "USA",
  "Congo DR": "DR Congo",
  "Bosnia-Herzegovina": "Bosnia",
  "Cape Verde Islands": "Cape Verde",
  "South Korea": "South Korea",
  // 其余队名一致，无需映射
};

const mapTeam = (name) => TEAM_NAME_MAP[name] || name;

/* ---- HTTP GET (返回 Promise) ---- */
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error("JSON 解析失败: " + e.message));
        }
      });
    }).on("error", reject);
  });
}

/* ---- 从 ESPN 数据构建 { matchupKey: { teamName: info } } 索引 ----
 *  key 用排序后的两队名拼接，顺序无关，便于匹配。
 *  值是 { 队名: {score, shootout, winner} }，按队名查比分，
 *  避免 home/away 方向和 data.js 的 a/b 不一致导致的错位。 */
function buildResultsIndex(events) {
  const idx = {};
  for (const e of events) {
    const comp = (e.competitions || [{}])[0];
    if (!comp) continue;
    const comps = comp.competitors || [];
    if (comps.length < 2) continue;

    // 按队名收集比分信息
    const teams = {};
    const names = [];
    for (const c of comps) {
      const name = mapTeam(c.team.displayName);
      teams[name] = {
        score: parseInt(c.score, 10),
        shootout: c.shootoutScore != null ? parseInt(c.shootoutScore, 10) : null,
        winner: c.winner === true,
      };
      names.push(name);
    }
    const key = matchupKey(names[0], names[1]);

    const statusName = (comp.status || {}).type || {};
    const state = statusName.name || "";
    const isFinished = state.startsWith("STATUS_FINAL") || state === "STATUS_FULL_TIME";

    idx[key] = {
      teams,
      names,
      isFinished,
      isPenalty: state === "STATUS_FINAL_PEN",
      isAET: state === "STATUS_FINAL_AET",
      state,
    };
  }
  return idx;
}

/* 两队名按字母序拼接成 key，与顺序无关 */
function matchupKey(a, b) {
  return [a, b].sort().join(" vs ");
}

/* ---- 加载现有 data.js，拿到 ROUNDS ---- */
function loadRounds(dataJsContent) {
  // data.js 是纯前端全局变量赋值（const FLAGS = ...; const ROUNDS = ...）
  // 用 eval 在函数作用域里执行，收集声明的变量
  const vars = {};
  const fn = new Function(`
    ${dataJsContent}
    return { ROUNDS, FLAGS, NAMES_CN, CHAMPION };
  `);
  Object.assign(vars, fn());
  return vars.ROUNDS;
}

/* ---- 主逻辑 ---- */
async function main() {
  console.log("📡 抓取 ESPN 赛果数据...");
  const data = await fetchJson(ESPN_URL);
  const events = data.events || [];
  console.log(`   获取到 ${events.length} 场比赛数据`);

  const resultsIdx = buildResultsIndex(events);

  // 读现有 data.js
  let content = fs.readFileSync(DATA_FILE, "utf8");
  const ROUNDS = loadRounds(content);
  if (!ROUNDS) throw new Error("无法从 data.js 解析出 ROUNDS");

  const changes = [];
  let newContent = content;

  for (const round of ROUNDS) {
    for (const m of round.matches) {
      const key = matchupKey(m.a, m.b);
      const r = resultsIdx[key];
      if (!r) {
        // ESPN 没有这场（可能是我们预测里虚构的对阵，或者名字不匹配）
        continue;
      }
      if (!r.isFinished) {
        // 未完赛，跳过（保留预测或现有状态）
        continue;
      }

      // 按队名取比分，避免 home/away 方向错位
      const ta = r.teams[m.a];
      const tb = r.teams[m.b];
      if (!ta || !tb) continue; // 队名未匹配，跳过

      const winner = ta.winner ? m.a : tb.winner ? m.b : null;
      if (!winner) continue; // 数据异常，跳过

      const needUpdate =
        m.status !== "done" ||
        m.sa !== ta.score ||
        m.sb !== tb.score ||
        m.winner !== winner ||
        !!m.pens !== r.isPenalty ||
        !!m.aet !== r.isAET;

      if (!needUpdate) continue;

      // 点球比分：胜者的 shootout 放前
      const pensStr = r.isPenalty
        ? (winner === m.a
            ? `${ta.shootout}-${tb.shootout}`
            : `${tb.shootout}-${ta.shootout}`)
        : undefined;

      // 字段级替换：在 newContent 里定位这场 match 对象并替换比分相关字段
      newContent = updateMatchInContent(newContent, m, round.key, {
        sa: ta.score,
        sb: tb.score,
        winner,
        status: "done",
        pens: pensStr,
        aet: r.isAET,
      });

      changes.push({
        round: round.title,
        match: `${m.a} vs ${m.b}`,
        old: `${m.status} ${m.sa != null ? m.sa : "?"}-${m.sb != null ? m.sb : "?"} winner=${m.winner}`,
        new: `done ${ta.score}-${tb.score} winner=${winner}${r.isPenalty ? " (点球 " + (winner === m.a ? `${ta.shootout}-${tb.shootout}` : `${tb.shootout}-${ta.shootout}`) + ")" : ""}${r.isAET ? " (加时)" : ""}`,
      });
    }
  }

  // 输出变更
  if (changes.length === 0) {
    console.log("✅ 无需更新，所有已完赛场次已是最新。");
    return;
  }
  console.log(`\n📝 共 ${changes.length} 处变更：`);
  for (const c of changes) {
    console.log(`  [${c.round}] ${c.match}`);
    console.log(`    旧: ${c.old}`);
    console.log(`    新: ${c.new}`);
  }

  if (DRY_RUN) {
    console.log("\n(dry-run 模式，不写文件)");
    return;
  }

  fs.writeFileSync(DATA_FILE, newContent, "utf8");
  console.log(`\n💾 已写入 ${path.relative(ROOT, DATA_FILE)}`);
}

/* ---- 在 data.js 文本中，定位指定 match 对象并替换比分字段 ----
 *  策略：用 "a: \"队A\"" + "b: \"队B\"" 作为锚点，找到包含这两个队名的
 *  {...} 对象块，在其内部替换 sa/sb/winner/status/pens/aet 字段。
 *  保留 rationale / note 等其余字段不动。 */
function updateMatchInContent(content, m, roundKey, updates) {
  // 转义队名用于正则
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // 匹配包含这两个队名的对象（顺序可能 a,b 或 b,a）
  const aPat = esc(m.a);
  const bPat = esc(m.b);

  // 找到 a: "X", b: "Y" 这一行（允许中间有其他字段）
  // 用宽松方式：定位 a: "队A" 出现的位置，从该处向前找最近的 { ，向后找匹配的 }
  const aIdx = content.indexOf(`a: "${m.a}"`);
  if (aIdx === -1) {
    // 尝试反向（b 在前）
    const bIdx = content.indexOf(`b: "${m.a}"`);
    if (bIdx === -1) {
      console.warn(`  ⚠ 定位失败: ${m.a} vs ${m.b}，跳过`);
      return content;
    }
  }

  // 重新定位：找包含 "队A" 和 "队B" 的最近 {...}
  const re = new RegExp(
    `\\{[^{}]*?a:\\s*"${aPat}"[^{}]*?b:\\s*"${bPat}"[^{}]*?\\}|\\{[^{}]*?b:\\s*"${aPat}"[^{}]*?a:\\s*"${bPat}"[^{}]*?\\}`,
    "s"
  );
  const match = re.exec(content);
  if (!match) {
    console.warn(`  ⚠ 正则定位失败: ${m.a} vs ${m.b}，跳过`);
    return content;
  }

  const block = match[0];
  let updated = block;

  // 替换 status
  updated = updated.replace(/status:\s*"[^"]*"/, `status: "${updates.status}"`);
  // 替换 sa
  updated = updated.replace(/(sa:\s*)[\d.]+/, `$1${updates.sa}`);
  // 替换 sb
  updated = updated.replace(/(sb:\s*)[\d.]+/, `$1${updates.sb}`);
  // 替换 winner
  updated = updated.replace(/winner:\s*"[^"]*"/, `winner: "${updates.winner}"`);

  // 处理 pens：有则设置，无则移除
  if (updates.pens) {
    if (/pens:\s*"[^"]*"/.test(updated)) {
      updated = updated.replace(/pens:\s*"[^"]*"/, `pens: "${updates.pens}"`);
    } else {
      // 加到 status 之后
      updated = updated.replace(/(status:\s*"[^"]*")/, `$1, pens: "${updates.pens}"`);
    }
  } else {
    // 移除 pens 字段（如果存在）
    updated = updated.replace(/,\s*pens:\s*"[^"]*"/, "");
  }

  // 处理 aet：true 则加，false 则移除
  if (updates.aet) {
    if (!/aet:\s*true/.test(updated)) {
      updated = updated.replace(/(status:\s*"[^"]*")/, `$1, aet: true`);
    }
  } else {
    updated = updated.replace(/,\s*aet:\s*true/, "");
  }

  return content.replace(block, updated);
}

main().catch((e) => {
  console.error("❌ 执行失败:", e.message);
  console.error(e.stack);
  process.exit(1);
});
