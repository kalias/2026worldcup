/* ============================================================
 *  2026 FIFA World Cup — Bracket data & predictions
 *
 *  Round of 32 results: COMPLETED (actual results, as of 2026-07-04)
 *  Round of 16 onward:  PREDICTIONS (analytically projected)
 *
 *  Each PREDICTED match carries a `rationale` object describing
 *  WHY the winner was chosen, shown in the hover tooltip.
 * ============================================================ */

const FLAGS = {
  Brazil: "🇧🇷", Norway: "🇳🇴", Canada: "🇨🇦", Morocco: "🇲🇦",
  Paraguay: "🇵🇾", France: "🇫🇷", Mexico: "🇲🇽", England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  Belgium: "🇧🇪", "USA": "🇺🇸", Spain: "🇪🇸", Portugal: "🇵🇹",
  Switzerland: "🇨🇭", Egypt: "🇪🇬", Argentina: "🇦🇷", Colombia: "🇨🇴",
  Germany: "🇩🇪", Japan: "🇯🇵", Netherlands: "🇳🇱", Sweden: "🇸🇪",
  Ecuador: "🇪🇨", "DR Congo": "🇨🇩", Senegal: "🇸🇳", Bosnia: "🇧🇦",
  Austria: "🇦🇹", Croatia: "🇭🇷", Algeria: "🇩🇿", Australia: "🇦🇺",
  "Cape Verde": "🇨🇻", Ghana: "🇬🇭", "South Africa": "🇿🇦", "Ivory Coast": "🇨🇮",
};

const NAMES_CN = {
  Brazil: "巴西", Norway: "挪威", Canada: "加拿大", Morocco: "摩洛哥",
  Paraguay: "巴拉圭", France: "法国", Mexico: "墨西哥", England: "英格兰",
  Belgium: "比利时", "USA": "美国", Spain: "西班牙", Portugal: "葡萄牙",
  Switzerland: "瑞士", Egypt: "埃及", Argentina: "阿根廷", Colombia: "哥伦比亚",
  Germany: "德国", Japan: "日本", Netherlands: "荷兰", Sweden: "瑞典",
  Ecuador: "厄瓜多尔", "DR Congo": "刚果(金)", Senegal: "塞内加尔", Bosnia: "波黑",
  Austria: "奥地利", Croatia: "克罗地亚", Algeria: "阿尔及利亚", Australia: "澳大利亚",
  "Cape Verde": "佛得角", Ghana: "加纳", "South Africa": "南非", "Ivory Coast": "科特迪瓦",
};

const flag = (name) => FLAGS[name] || "🏳️";
const cn = (name) => (typeof NAMES_CN !== "undefined" && NAMES_CN[name]) || name;

/* ------------------------------------------------------------
 *  Matches are laid out in bracket order so that winners feed
 *  into the next round deterministically (match[i] + match[i+1]
 *  → next round's match[i/2]).
 * ------------------------------------------------------------ */

const ROUNDS = [
  {
    title: "32强 · Round of 32",
    key: "r32",
    matches: [
      // Pair-group 1 → feeds R16[0]
      { a: "Brazil",      b: "Japan",        sa: 2, sb: 1, winner: "Brazil",      status: "done", note: "维尼修斯传射，巴西加时制胜" },
      { a: "Norway",      b: "Ivory Coast",  sa: 2, sb: 1, winner: "Norway",      status: "done", note: "哈兰德梅开二度" },
      // Pair 2 → R16[1]
      { a: "Canada",      b: "South Africa", sa: 1, sb: 0, winner: "Canada",      status: "done", note: "戴维点球制胜，东道主晋级" },
      { a: "Morocco",     b: "Netherlands",  sa: 1, sb: 1, winner: "Morocco",     status: "done", note: "点球 3-2，布努两扑点球", pens: "3-2" },
      // Pair 3 → R16[2]
      { a: "Paraguay",    b: "Germany",      sa: 1, sb: 1, winner: "Paraguay",    status: "done", note: "点球 4-3，阿尔米隆带队爆冷", pens: "4-3" },
      { a: "France",      b: "Sweden",       sa: 3, sb: 0, winner: "France",      status: "done", note: "姆巴佩梅开二度" },
      // Pair 4 → R16[3]
      { a: "Mexico",      b: "Ecuador",      sa: 2, sb: 0, winner: "Mexico",      status: "done", note: "东道主完胜" },
      { a: "England",     b: "DR Congo",     sa: 2, sb: 1, winner: "England",     status: "done", note: "贝林厄姆制胜球" },
      // Pair 5 → R16[4]
      { a: "Belgium",     b: "Senegal",      sa: 3, sb: 2, winner: "Belgium",     status: "done", note: "德布劳内加时绝杀", aet: true },
      { a: "USA",         b: "Bosnia",       sa: 2, sb: 0, winner: "USA",         status: "done", note: "普利西奇传射" },
      // Pair 6 → R16[5]
      { a: "Spain",       b: "Austria",      sa: 3, sb: 0, winner: "Spain",       status: "done", note: "亚马尔、罗德里建功" },
      { a: "Portugal",    b: "Croatia",      sa: 2, sb: 1, winner: "Portugal",    status: "done", note: "B席制胜，克罗地亚出局" },
      // Pair 7 → R16[6]
      { a: "Switzerland", b: "Algeria",      sa: 2, sb: 0, winner: "Switzerland", status: "done", note: "沙奇里世界波" },
      { a: "Egypt",       b: "Australia",    sa: 1, sb: 1, winner: "Egypt",       status: "done", note: "点球 4-3，萨拉赫带队晋级", pens: "4-3" },
      // Pair 8 → R16[7]
      { a: "Argentina",   b: "Cape Verde",   sa: 3, sb: 2, winner: "Argentina",   status: "done", note: "梅西加时绝杀，险胜黑马", aet: true },
      { a: "Colombia",    b: "Ghana",        sa: 1, sb: 0, winner: "Colombia",    status: "done", note: "J罗制胜助攻" },
    ],
  },
  {
    title: "16强 · Round of 16",
    key: "r16",
    matches: [
      {
        a: "Brazil", b: "Norway", sa: 2, sb: 1, winner: "Brazil", status: "pred",
        rationale: {
          title: "巴西 🆚 挪威",
          verdict: "预测：巴西晋级",
          points: [
            "巴西阵容深度远胜挪威，前场维尼修斯、罗德里戈、恩德里克构成三叉戟，小组赛+32强场均 2 球以上。",
            "挪威过度依赖哈兰德单点；哈兰德淘汰赛效率高，但中场厄德高缺少支持，难以串联进攻。",
            "巴西控球体系（帕奎塔、吉马良斯）能压制挪威中场，限制哈兰德接球。",
          ],
          reasoning: "巴西的传控和边路冲击可让哈兰德陷入孤立无援，预测巴西 2-1 晋级。",
        },
      },
      {
        a: "Morocco", b: "Canada", sa: 3, sb: 0, winner: "Morocco", status: "done",
        rationale: {
          title: "摩洛哥 🆚 加拿大",
          verdict: "预测：摩洛哥晋级",
          points: [
            "摩洛哥是 2022 世界杯四强，大赛经验和淘汰赛抗压能力远超加拿大。",
            "后防线阿什拉夫 + 阿格尔德 + 布努组合，本届仅失 1 球（点球大战零封荷兰）。",
            "加拿大虽有东道主之利，戴维状态火热，但攻坚硬实力仍逊色。",
          ],
          reasoning: "摩洛哥的防守体系成熟，加拿大主场氛围难破铁桶阵，预测摩洛哥 1-0 小胜。",
        },
      },
      {
        a: "France", b: "Paraguay", sa: 1, sb: 0, winner: "France", status: "done",
        rationale: {
          title: "法国 🆚 巴拉圭",
          verdict: "预测：法国晋级",
          points: [
            "法国拥有姆巴佩（本届已 3 球）、格列兹曼、琼阿梅尼，整体实力冠绝本届。",
            "巴拉圭虽点球淘汰德国，但运动战仅 1 球，进攻创造力不足。",
            "法国对南美球队历史战绩占优，且 32 强 3-0 横扫瑞典状态正佳。",
          ],
          reasoning: "巴拉圭的铁桶阵难挡法国的边路速度，预测法国 3-0 轻取。",
        },
      },
      {
        a: "England", b: "Mexico", sa: 2, sb: 1, winner: "England", status: "pred",
        rationale: {
          title: "英格兰 🆚 墨西哥",
          verdict: "预测：英格兰晋级",
          points: [
            "英格兰前场贝林厄姆、凯恩、萨卡三箭齐发，凯恩大赛淘汰赛进球稳定。",
            "墨西哥主场（阿兹特克氛围）是加成，但本届后防面对强队时易暴露空当。",
            "英格兰中场赖斯 + 贝林厄姆的组合能压制墨西哥的反击。",
          ],
          reasoning: "东道主氛围会让比赛胶着，但英格兰整体实力占优，预测 2-1 险胜。",
        },
      },
      {
        a: "Belgium", b: "USA", sa: 2, sb: 1, winner: "Belgium", status: "pred",
        rationale: {
          title: "比利时 🆚 美国",
          verdict: "预测：比利时晋级",
          points: [
            "德布劳内本届 2 球 1 助，32 强加时绝杀塞内加尔，领袖状态拉满。",
            "美国有东道主之利，普利西奇、巴洛贡冲击力强，但防线年轻、易被打身后。",
            "比利时黄金一代（德布劳内、卢卡库）大赛经验丰富，关键球处理更稳。",
          ],
          reasoning: "美国主场会给比利时制造麻烦，但德布劳内的关键传球决定比赛，预测 2-1。",
        },
      },
      {
        a: "Spain", b: "Portugal", sa: 2, sb: 1, winner: "Spain", status: "pred",
        rationale: {
          title: "西班牙 🆚 葡萄牙",
          verdict: "预测：西班牙晋级",
          points: [
            "西班牙是 2024 欧洲杯冠军，亚马尔（本届 2 球）、罗德里、佩德里中场统治力极强。",
            "葡萄牙虽有 B 席、莱奥、C罗，但核心阵容老化，C罗 作为支点效率下降。",
            "西班牙控球体系会让葡萄牙长时间无球，消耗对手体能。",
          ],
          reasoning: "中场之争西班牙占优，亚马尔的边路突破是胜负手，预测 2-1。",
        },
      },
      {
        a: "Switzerland", b: "Egypt", sa: 1, sb: 0, winner: "Switzerland", status: "pred",
        rationale: {
          title: "瑞士 🆚 埃及",
          verdict: "预测：瑞士晋级",
          points: [
            "瑞士组织纪律性极强，32 强 2-0 完胜阿尔及利亚，沙奇里、扎卡中场稳定。",
            "埃及过度依赖萨拉赫，其被针对性盯防后进攻瘫痪。",
            "瑞士整体阵容效力于欧洲五大联赛，硬度与默契兼具。",
          ],
          reasoning: "瑞士的团队防守能冻结萨拉赫，定位球或反击制胜，预测 1-0。",
        },
      },
      {
        a: "Argentina", b: "Colombia", sa: 2, sb: 1, winner: "Argentina", status: "pred",
        rationale: {
          title: "阿根廷 🆚 哥伦比亚",
          verdict: "预测：阿根廷晋级",
          points: [
            "阿根廷是卫冕冠军，梅西（本届 3 球）+ 阿尔瓦雷斯 + 麦卡利斯特核心仍在。",
            "哥伦比亚虽 2024 美洲杯决赛曾击败阿根廷，但本届 J 罗、迪亚斯状态起伏。",
            "阿根廷大赛淘汰赛抗压能力顶级，梅西关键战决定性极强。",
          ],
          reasoning: "复仇之战 + 卫冕底蕴，梅西制胜，预测阿根廷 2-1。",
        },
      },
    ],
  },
  {
    title: "1/4 决赛 · Quarterfinals",
    key: "qf",
    matches: [
      {
        a: "Brazil", b: "Morocco", sa: 2, sb: 0, winner: "Brazil", status: "pred",
        rationale: {
          title: "巴西 🆚 摩洛哥",
          verdict: "预测：巴西晋级",
          points: [
            "摩洛哥防守虽强，但面对巴西的边路群（维尼修斯、罗德里戈）难以全场封堵。",
            "巴西中场技术压制，能在 30 米区域持续制造定位球机会。",
            "摩洛哥进攻端创造力有限，难以威胁阿利松把守的大门。",
          ],
          reasoning: "巴西的攻击群最终会撕开摩洛哥防线，预测 2-0。",
        },
      },
      {
        a: "France", b: "England", sa: 2, sb: 1, winner: "France", status: "pred",
        rationale: {
          title: "法国 🆚 英格兰",
          verdict: "预测：法国晋级（加时）",
          points: [
            "姆巴佩对英格兰右路是致命威胁，沃克虽快也难单防其爆发力。",
            "两队中场（琼阿梅尼/卡马文加 vs 赖斯/贝林厄姆）实力接近，但法国反击效率更高。",
            "历史：法国 2022 世界杯 1/4 决赛正是淘汰英格兰，心理占优。",
          ],
          reasoning: "势均力敌的强强对话，姆巴佩的瞬间爆发决定比赛，预测法国 2-1 加时晋级。",
        },
      },
      {
        a: "Spain", b: "Belgium", sa: 2, sb: 1, winner: "Spain", status: "pred",
        rationale: {
          title: "西班牙 🆚 比利时",
          verdict: "预测：西班牙晋级",
          points: [
            "西班牙中场（罗德里、佩德里）控球能力冠绝本届，比利时难抢到球权。",
            "德布劳内虽强，但比利时整体跑动覆盖不如西班牙的高位逼抢。",
            "亚马尔对位比利时老迈的左路是关键突破口。",
          ],
          reasoning: "控球权决定比赛，西班牙通过持续压制找到破绽，预测 2-1。",
        },
      },
      {
        a: "Argentina", b: "Switzerland", sa: 2, sb: 0, winner: "Argentina", status: "pred",
        rationale: {
          title: "阿根廷 🆚 瑞士",
          verdict: "预测：阿根廷晋级",
          points: [
            "梅西、阿尔瓦雷斯面对瑞士的纪律性防线仍能凭个人能力创造机会。",
            "阿根廷中场（恩佐、麦卡利斯特）既能控球也能反抢，瑞士难出球。",
            "瑞士进攻火力不足以威胁阿根廷，需靠定位球偷袭。",
          ],
          reasoning: "阿根廷整体实力碾压，梅西关键传球制胜，预测 2-0。",
        },
      },
    ],
  },
  {
    title: "半决赛 · Semifinals",
    key: "sf",
    matches: [
      {
        a: "France", b: "Brazil", sa: 2, sb: 1, winner: "France", status: "pred",
        rationale: {
          title: "法国 🆚 巴西",
          verdict: "预测：法国晋级",
          points: [
            "姆巴佩 vs 维尼修斯的皇马队友对决，但法国整体防守（于帕梅卡诺、萨利巴）更稳。",
            "巴西本届防线偶有漏洞，姆巴佩的速度是致命威胁。",
            "历史：法国在 1986、1998 两次世界杯淘汰赛中均淘汰巴西，心理优势。",
          ],
          reasoning: "经典对决，姆巴佩的爆发力 + 法国防线更胜一筹，预测 2-1。",
        },
      },
      {
        a: "Argentina", b: "Spain", sa: 2, sb: 1, winner: "Argentina", status: "pred",
        rationale: {
          title: "阿根廷 🆚 西班牙",
          verdict: "预测：阿根廷晋级",
          points: [
            "梅西的最后一舞——卫冕冠军的核心战意与大赛气场无与伦比。",
            "西班牙控球虽强，但阿根廷的中场反抢（德保罗、麦卡利斯特）能有效打断节奏。",
            "阿根廷淘汰赛经验丰富，2022 决赛逆转法国证明其抗压能力。",
          ],
          reasoning: "控球权可能属于西班牙，但效率属于梅西，预测阿根廷 2-1。",
        },
      },
    ],
  },
  {
    title: "决赛 · Final",
    key: "final",
    matches: [
      {
        a: "Argentina", b: "France", sa: 2, sb: 1, winner: "Argentina", status: "pred", aet: true,
        rationale: {
          title: "阿根廷 🆚 法国",
          verdict: "预测：阿根廷夺冠（加时）",
          points: [
            "2022 决赛重演——阿根廷点球胜法国，心理与战术记忆俱在。",
            "梅西最后一届世界杯，全队战意凝聚到顶点。",
            "法国虽强，但本届防线面对快速反击（如 16 强巴拉圭）曾暴露空当，阿尔瓦雷斯可趁虚而入。",
            "马丁内斯（大马丁）的大赛点球/扑救能力是阿根廷的保险阀。",
          ],
          reasoning: "史诗级重演，梅西最后一舞圆满，预测阿根廷 2-1 加时夺冠。",
        },
      },
    ],
  },
];

/* Champion derived from final winner */
const CHAMPION = ROUNDS[ROUNDS.length - 1].matches[0].winner;
