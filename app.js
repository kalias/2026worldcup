/* ============================================================
 *  App logic: render two-half bracket converging at center,
 *  wire tooltips.
 * ============================================================ */
(function () {
  "use strict";

  const bracketEl = document.getElementById("bracket");
  const tooltipEl = document.getElementById("tooltip");
  const scrollEl = document.getElementById("bracketScroll");

  // coarse-pointer (touch) detection — drives tooltip placement
  const isTouch =
    window.matchMedia && window.matchMedia("(hover: none) and (pointer: coarse)").matches;

  /* ---------- helpers ---------- */
  const flag = (name) => (typeof FLAGS !== "undefined" && FLAGS[name]) || "🏳️";
  const cn = (name) => (typeof NAMES_CN !== "undefined" && NAMES_CN[name]) || name;

  function teamRow(t, score, opts) {
    const cls = ["team"];
    if (opts.winner) cls.push("winner");
    if (opts.loser) cls.push("loser");
    const scoreText =
      score === null || score === undefined
        ? `<span class="score empty">—</span>`
        : `<span class="score">${score}</span>`;
    return `
      <div class="${cls.join(" ")}">
        <span class="flag">${flag(t)}</span>
        <span class="name">${cn(t)}</span>
        ${scoreText}
      </div>`;
  }

  function matchHTML(m) {
    const status = m.status;
    const cls = ["match", `is-${status}`];
    const tagHTML =
      status === "done"
        ? `<span class="match-tag done">已完赛</span>`
        : status === "pred"
        ? `<span class="match-tag pred">预测</span>`
        : "";

    const winnerA = m.winner === m.a;
    const winnerB = m.winner === m.b;
    const sa = m.sa ?? null;
    const sb = m.sb ?? null;

    return `
      <div class="${cls.join(" ")}" data-key="${m._key || ""}" data-status="${status}">
        ${tagHTML}
        ${teamRow(m.a, sa, { winner: winnerA, loser: winnerB && status !== "upcoming" })}
        ${teamRow(m.b, sb, { winner: winnerB, loser: winnerA && status !== "upcoming" })}
      </div>`;
  }

  /* decorate scores with aet/pen suffixes by reading ROUNDS data */
  function decorateScores(scope) {
    scope.querySelectorAll(".match").forEach((matchNode) => {
      const key = matchNode.getAttribute("data-key");
      if (!key) return;
      const [rk, idx] = key.split(":");
      const round = ROUNDS.find((r) => r.key === rk);
      if (!round) return;
      const m = round.matches[parseInt(idx, 10)];
      if (!m) return;
      const teams = matchNode.querySelectorAll(".team .name");
      if (!teams.length) return;
      if (m.aet && m.winner === m.a)
        teams[0].insertAdjacentHTML(
          "beforeend",
          ` <span style="color:var(--text-mute);font-size:11px;font-weight:500">加时</span>`
        );
      if (m.aet && m.winner === m.b)
        teams[1].insertAdjacentHTML(
          "beforeend",
          ` <span style="color:var(--text-mute);font-size:11px;font-weight:500">加时</span>`
        );
      if (m.pens && m.sa === m.sb) {
        const i2 = m.winner === m.a ? 0 : 1;
        teams[i2].insertAdjacentHTML(
          "beforeend",
          ` <span style="color:var(--text-mute);font-size:11px;font-weight:500">点球${m.pens}</span>`
        );
      }
    });
  }

  /* ---------- build a round column ---------- */
  function buildRound(round, extraClass) {
    round.matches.forEach((m, mIdx) => {
      m._key = `${round.key}:${mIdx}`;
    });
    const roundEl = document.createElement("div");
    roundEl.className = "round " + (extraClass || "");
    roundEl.innerHTML = `
      <div class="round-title">${round.title}</div>
      <div class="matches"></div>`;
    const matchesWrap = roundEl.querySelector(".matches");
    round.matches.forEach((m) => {
      const wrap = document.createElement("div");
      wrap.className = "match-slot";
      wrap.innerHTML = matchHTML(m);
      matchesWrap.appendChild(wrap);
    });
    return roundEl;
  }

  /* ============================================================
   *  Build the two-half layout
   *
   *  Structure:
   *    .bracket
   *      .half.left   →  R32(8)  R16(4)  QF(2)  SF(1)
   *      .center      →  FINAL   +   CHAMPION
   *      .half.right  →  SF(1)   QF(2)  R16(4)  R32(8)   [mirrored order]
   *
   *  Match pairing across rounds uses the index pairing of the
   *  source data (match[i] & match[i+1] → next match[i/2]),
   *  which is preserved when we slice halves.
   * ============================================================ */

  const r32 = ROUNDS.find((r) => r.key === "r32");
  const r16 = ROUNDS.find((r) => r.key === "r16");
  const qf = ROUNDS.find((r) => r.key === "qf");
  const sf = ROUNDS.find((r) => r.key === "sf");
  const finalRound = ROUNDS.find((r) => r.key === "final");

  // Left half = first 8 R32, first 4 R16, first 2 QF, first 1 SF
  const leftR32 = { key: "r32", title: "32强 · Round of 32", matches: r32.matches.slice(0, 8) };
  const leftR16 = { key: "r16", title: "16强 · Round of 16", matches: r16.matches.slice(0, 4) };
  const leftQF = { key: "qf", title: "1/4 决赛", matches: qf.matches.slice(0, 2) };
  const leftSF = { key: "sf", title: "半决赛", matches: sf.matches.slice(0, 1) };

  // Right half = last 8 R32, last 4 R16, last 2 QF, last 1 SF
  const rightR32 = { key: "r32", title: "32强 · Round of 32", matches: r32.matches.slice(8, 16) };
  const rightR16 = { key: "r16", title: "16强 · Round of 16", matches: r16.matches.slice(4, 8) };
  const rightQF = { key: "qf", title: "1/4 决赛", matches: qf.matches.slice(2, 4) };
  const rightSF = { key: "sf", title: "半决赛", matches: sf.matches.slice(1, 2) };

  // Build LEFT half (R32 → SF, left to right)
  const leftHalf = document.createElement("div");
  leftHalf.className = "half left";
  leftHalf.appendChild(buildRound(leftR32, "round-left"));
  leftHalf.appendChild(buildRound(leftR16, "round-left"));
  leftHalf.appendChild(buildRound(leftQF, "round-left"));
  leftHalf.appendChild(buildRound(leftSF, "round-left"));

  // Build CENTER (Final + Champion)
  const center = document.createElement("div");
  center.className = "center";
  center.innerHTML = `
    <div class="center-final-wrap">
      <div class="round-title">决赛 · Final</div>
    </div>
    <div class="final-slot" id="finalSlot"></div>
    <div class="center-divider"></div>
    <div class="champion is-pred" data-champion="1">
      <div class="trophy">🏆</div>
      <div class="label">PREDICTED CHAMPION</div>
      <div class="flag">${flag(CHAMPION)}</div>
      <div class="name">${cn(CHAMPION)}</div>
      <div class="pred-hint">悬停查看夺冠依据</div>
    </div>`;

  // Build RIGHT half (SF → R32, so it reads right-to-left toward center)
  const rightHalf = document.createElement("div");
  rightHalf.className = "half right";
  rightHalf.appendChild(buildRound(rightSF, "round-right"));
  rightHalf.appendChild(buildRound(rightQF, "round-right"));
  rightHalf.appendChild(buildRound(rightR16, "round-right"));
  rightHalf.appendChild(buildRound(rightR32, "round-right"));

  // Assemble
  bracketEl.style.position = "relative";
  bracketEl.appendChild(leftHalf);
  bracketEl.appendChild(center);
  bracketEl.appendChild(rightHalf);

  // Place final match into center slot
  finalRound.matches.forEach((m, i) => (m._key = `final:${i}`));
  const finalSlot = center.querySelector("#finalSlot");
  const finalWrap = document.createElement("div");
  finalWrap.className = "match-slot";
  finalWrap.innerHTML = matchHTML(finalRound.matches[0]);
  finalSlot.appendChild(finalWrap);

  // Decorate scores everywhere
  decorateScores(bracketEl);

  /* ============================================================
   *  Connector lines
   *  - Within each half: source match pair (j, j+1) → next round match (j/2)
   *  - Left half:   lines go left→right (into center)
   *  - Right half:  lines go right→left (into center)
   *  - SF → Final:  each half's SF connects to the center final card
   * ============================================================ */
  function drawConnectors() {
    bracketEl.querySelectorAll(".conn-line").forEach((n) => n.remove());
    const bracketRect = bracketEl.getBoundingClientRect();

    function pt(el) {
      const r = el.getBoundingClientRect();
      return {
        left: r.left - bracketRect.left,
        right: r.right - bracketRect.left,
        top: r.top - bracketRect.top,
        cy: r.top + r.height / 2 - bracketRect.top,
      };
    }
    function addLine(x, y, w, h) {
      if (w <= 0) return;
      const d = document.createElement("div");
      d.className = "conn-line";
      d.style.cssText = `position:absolute;left:${x}px;top:${y - 1}px;width:${w}px;height:${h}px;background:var(--line);pointer-events:none;`;
      bracketEl.appendChild(d);
    }
    function addVLine(x, y, w, h) {
      const d = document.createElement("div");
      d.className = "conn-line";
      d.style.cssText = `position:absolute;left:${x - 1}px;top:${y}px;width:${w}px;height:${h}px;background:var(--line);pointer-events:none;`;
      bracketEl.appendChild(d);
    }

    // Generic half connectors. dir = +1 (left→right) or -1 (right→left)
    function connectHalf(halfEl, dir) {
      const rounds = halfEl.querySelectorAll(".round");
      for (let i = 0; i < rounds.length - 1; i++) {
        const rA = rounds[i];
        const rB = rounds[i + 1];
        const slotsA = rA.querySelectorAll(".match-slot");
        const slotsB = rB.querySelectorAll(".match-slot");
        if (!slotsA.length || !slotsB.length) continue;
        for (let j = 0; j < slotsB.length; j++) {
          const a1 = slotsA[2 * j];
          const a2 = slotsA[2 * j + 1];
          if (!a1 || !a2) continue;
          const p1 = pt(a1);
          const p2 = pt(a2);
          const tb = pt(slotsB[j]);

          let x1, x2;
          if (dir > 0) {
            x1 = p1.right;
            x2 = tb.left;
          } else {
            x1 = p1.left;
            x2 = tb.right;
          }
          const y1 = p1.cy;
          const y2 = p2.cy;
          const ymid = (y1 + y2) / 2;
          const midX = x1 + (x2 - x1) / 2;
          const halfH = Math.abs(y1 - y2) / 2;

          addLine(x1, y1, midX - x1, 2);
          addLine(x1, y2, midX - x1, 2);
          addVLine(midX, Math.min(y1, y2), 2, halfH * 2);
          addLine(midX, ymid, x2 - midX, 2);
          addLine(midX, tb.cy, x2 - midX, 2);
        }
      }
    }

    connectHalf(leftHalf, +1);
    connectHalf(rightHalf, -1);

    // SF → Final (center)
    const leftSFSlot = leftHalf.querySelector(".round:last-child .match-slot");
    const rightSFSlot = rightHalf.querySelector(".round:first-child .match-slot");
    const finalCard = center.querySelector("#finalSlot .match");
    if (leftSFSlot && finalCard) {
      const p = pt(leftSFSlot);
      const fc = pt(finalCard);
      addLine(p.right, p.cy, fc.left - p.right, 2);
    }
    if (rightSFSlot && finalCard) {
      const p = pt(rightSFSlot);
      const fc = pt(finalCard);
      addLine(fc.right, fc.cy, p.left - fc.right, 2);
    }

    // Final → Champion
    const champCard = center.querySelector(".champion");
    if (finalCard && champCard) {
      const fc = pt(finalCard);
      const cc = pt(champCard);
      const x1 = fc.left + (fc.right - fc.left) / 2;
      addVLine(x1, fc.bottom, 2, cc.top - fc.bottom);
    }
  }

  requestAnimationFrame(drawConnectors);
  window.addEventListener("resize", () => requestAnimationFrame(drawConnectors));

  /* ---------- scroll-edge detection (for mobile fade hints) ---------- */
  function updateScrollEdges() {
    if (!scrollEl) return;
    const max = scrollEl.scrollWidth - scrollEl.clientWidth;
    const x = scrollEl.scrollLeft;
    scrollEl.classList.toggle("at-start", x <= 2);
    scrollEl.classList.toggle("at-end", x >= max - 2);
  }
  if (scrollEl) {
    scrollEl.addEventListener("scroll", updateScrollEdges, { passive: true });
    window.addEventListener("resize", updateScrollEdges);
    requestAnimationFrame(updateScrollEdges);
  }

  /* ---------- tooltip wiring ---------- */
  let currentTarget = null;

  // Position tooltip anchored to the triggering card, not the cursor —
  // prevents the panel from drifting onto a neighbouring match card.
  function showTooltip(html, anchorEl, clientX, clientY) {
    tooltipEl.innerHTML = html;
    tooltipEl.classList.add("show");
    tooltipEl.setAttribute("aria-hidden", "false");

    // Touch devices: bottom-fixed sheet, no anchoring
    if (isTouch) {
      tooltipEl.classList.add("is-mobile");
      tooltipEl.style.left = "";
      tooltipEl.style.top = "";
      return;
    }
    tooltipEl.classList.remove("is-mobile");

    const aRect = anchorEl.getBoundingClientRect();
    const ttRect = tooltipEl.getBoundingClientRect();
    const gap = 12;

    // prefer placing tooltip to the right of the card; else left; else below
    let left = aRect.right + gap;
    let top = aRect.top + aRect.height / 2 - ttRect.height / 2;
    if (left + ttRect.width > window.innerWidth - 8) {
      left = aRect.left - ttRect.width - gap;
    }
    if (left < 8) {
      // not enough horizontal room — place below, centered on card
      left = aRect.left + aRect.width / 2 - ttRect.width / 2;
      top = aRect.bottom + gap;
    }
    // clamp into viewport
    left = Math.max(8, Math.min(left, window.innerWidth - ttRect.width - 8));
    top = Math.max(8, Math.min(top, window.innerHeight - ttRect.height - 8));

    tooltipEl.style.left = left + "px";
    tooltipEl.style.top = top + "px";
  }

  function hideTooltip() {
    tooltipEl.classList.remove("show");
    tooltipEl.classList.remove("is-mobile");
    tooltipEl.setAttribute("aria-hidden", "true");
    currentTarget = null;
  }

  function rationaleHTML(r) {
    if (!r) return "";
    const points = (r.points || []).map((p) => `<li>${p}</li>`).join("");
    return `
      <div class="tt-header">
        <span class="tt-flag">⚽</span>
        <span>${r.title}</span>
      </div>
      <div class="tt-section">
        <div class="tt-section-title">结论</div>
        <div><strong>${r.verdict}</strong></div>
      </div>
      ${points ? `
      <div class="tt-section">
        <div class="tt-section-title">分析依据</div>
        <ul>${points}</ul>
      </div>` : ""}
      <div class="tt-rationale"><strong>🧠 </strong>${r.reasoning}</div>`;
  }

  function doneNoteHTML(m) {
    // structural score line: regular score, optionally (pen) shootout
    const isPenShootout = m.pens && m.sa === m.sb;
    const scoreLine = isPenShootout
      ? `${cn(m.a)} ${m.sa}-${m.sb}（点球 ${m.pens}）${cn(m.b)}`
      : `${cn(m.a)} ${m.sa}-${m.sb}${m.aet ? "（加时）" : ""} ${cn(m.b)}`;
    return `
      <div class="tt-header">
        <span class="tt-flag">${flag(m.winner)}</span>
        <span>${scoreLine}</span>
      </div>
      <div class="tt-section">
        <div class="tt-section-title">赛果（已完赛）</div>
        <div><strong>${cn(m.winner)}</strong> 晋级${isPenShootout ? "（点球大战）" : ""}</div>
      </div>
      ${m.note ? `<div class="tt-rationale">${m.note}</div>` : ""}`;
  }

  function findMatch(key) {
    const [rk, idx] = key.split(":");
    const round = ROUNDS.find((r) => r.key === rk);
    return round ? round.matches[parseInt(idx, 10)] : null;
  }

  // helper: show tooltip for a match or champion node (desktop hover)
  function showForNode(node, e) {
    const matchNode = node.closest ? node.closest(".match") : null;
    if (matchNode) {
      const key = matchNode.getAttribute("data-key");
      const status = matchNode.getAttribute("data-status");
      const m = findMatch(key);
      if (!m) return;
      if (status === "done") {
        showTooltip(doneNoteHTML(m), matchNode, e.clientX, e.clientY);
        currentTarget = matchNode;
      } else if (status === "pred" && m.rationale) {
        showTooltip(rationaleHTML(m.rationale), matchNode, e.clientX, e.clientY);
        currentTarget = matchNode;
      }
      return;
    }
    const champNode = node.closest ? node.closest(".champion") : null;
    if (champNode) {
      const fm = ROUNDS[ROUNDS.length - 1].matches[0];
      if (fm && fm.rationale) {
        showTooltip(rationaleHTML(fm.rationale), champNode, e.clientX, e.clientY);
        currentTarget = champNode;
      }
    }
  }

  bracketEl.addEventListener("mouseover", (e) => {
    if (isTouch) return; // touch uses click handler
    showForNode(e.target, e);
  });

  // no cursor-follow on mousemove: tooltip stays anchored to the card
  bracketEl.addEventListener("mousemove", () => {});

  bracketEl.addEventListener("mouseout", (e) => {
    if (isTouch) return; // touch closes via click-away
    const related = e.relatedTarget;
    if (related && bracketEl.contains(related)) return;
    hideTooltip();
  });

  bracketEl.addEventListener("click", (e) => {
    const matchNode = e.target.closest(".match");
    const champNode = e.target.closest(".champion");
    if (matchNode) {
      // tap the same card again to dismiss (touch-friendly)
      if (isTouch && currentTarget === matchNode) {
        hideTooltip();
        return;
      }
      const key = matchNode.getAttribute("data-key");
      const status = matchNode.getAttribute("data-status");
      const m = findMatch(key);
      if (!m) return;
      if (status === "done") showTooltip(doneNoteHTML(m), matchNode, e.clientX, e.clientY);
      else if (status === "pred" && m.rationale) showTooltip(rationaleHTML(m.rationale), matchNode, e.clientX, e.clientY);
      currentTarget = matchNode;
    } else if (champNode) {
      if (isTouch && currentTarget === champNode) {
        hideTooltip();
        return;
      }
      const fm = ROUNDS[ROUNDS.length - 1].matches[0];
      if (fm && fm.rationale) showTooltip(rationaleHTML(fm.rationale), champNode, e.clientX, e.clientY);
      currentTarget = champNode;
    } else {
      hideTooltip();
    }
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".match") && !e.target.closest(".champion") && !e.target.closest(".tooltip")) {
      hideTooltip();
    }
  });
})();
