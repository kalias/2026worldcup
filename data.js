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
        a: "Brazil", b: "Norway", sa: 1, sb: 2, winner: "Norway", status: "done",
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
        a: "England", b: "Mexico", sa: 3, sb: 2, winner: "England", status: "done",
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
        a: "Belgium", b: "USA", sa: 4, sb: 1, winner: "Belgium", status: "done",
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
        a: "Spain", b: "Portugal", sa: 1, sb: 0, winner: "Spain", status: "done",
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
        a: "Egypt", b: "Argentina", sa: 2, sb: 3, winner: "Argentina", status: "done",
        rationale: {
          title: "埃及 🆚 阿根廷",
          verdict: "预测：阿根廷晋级",
          points: [
            "阿根廷是卫冕冠军，梅西（本届 3 球）+ 阿尔瓦雷斯 + 麦卡利斯特核心仍在，32 强加时险胜佛得角展现韧性。",
            "埃及过度依赖萨拉赫单点，其被针对性盯防后进攻创造力骤降；32 强虽点球淘汰澳大利亚但运动战仅 1 球。",
            "阿根廷中后场（恩佐、罗梅罗、马丁内斯）硬度足以压制埃及的反击。",
          ],
          reasoning: "实力差距明显，萨拉赫孤掌难鸣，梅西关键传球制胜，预测阿根廷 2-1 晋级。",
        },
      },
      {
        a: "Colombia", b: "Switzerland", sa: 0, sb: 0, winner: "Switzerland", status: "done", pens: "4-3",
        rationale: {
          title: "哥伦比亚 🆚 瑞士",
          verdict: "预测：瑞士晋级",
          points: [
            "瑞士组织纪律性极强，32 强 2-0 完胜阿尔及利亚，沙奇里、扎卡中场稳定，防线本届仅失 1 球。",
            "哥伦比亚虽有 J 罗、迪亚斯，但本届进攻效率一般，32 强仅 1-0 小胜加纳，攻坚硬仗能力存疑。",
            "瑞士整体阵容效力于欧洲五大联赛，战术素养与默契兼具，淘汰赛抗压经验丰富。",
          ],
          reasoning: "瑞士的团队防守能限制哥伦比亚的反击，定位球或反击制胜，预测瑞士 2-1 晋级。",
        },
      },
    ],
  },
  {
    title: "1/4 决赛 · Quarterfinals",
    key: "qf",
    matches: [
      {
        a: "Morocco", b: "France", sa: 0, sb: 2, winner: "France", status: "done",
        rationale: {
          title: "摩洛哥 🆚 法国",
          verdict: "预测：法国晋级",
          points: [
            "摩洛哥防守体系稳固（16 强 3-0 横扫加拿大），但法国攻击线姆巴佩+格列兹曼+登贝莱个人能力极强，能撕开任何防线。",
            "法国 16 强 1-0 力克巴拉圭展现防守稳健，坎特/琼阿梅尼的中场拦截能切断摩洛哥的反击发起点。",
            "历史：2022 世界杯半决赛法国 2-0 淘汰摩洛哥，心理与战术记忆俱在。",
          ],
          reasoning: "摩洛哥的铁桶阵难挡法国的锋线天赋，姆巴佩的速度是胜负手，预测法国 2-1 晋级。",
        },
      },
      {
        a: "Belgium", b: "Spain", sa: 1, sb: 2, winner: "Spain", status: "done",
        rationale: {
          title: "比利时 🆚 西班牙",
          verdict: "预测：西班牙晋级",
          points: [
            "比利时 16 强 4-1 大胜美国，德布劳内状态火热（本届 3 球 2 助），但整体阵容老化、跑动覆盖不足。",
            "西班牙中场（罗德里、佩德里、法比安）控球能力冠绝本届，16 强 1-0 稳健淘汰葡萄牙。",
            "亚马尔的边路突破是关键，比利时老迈的边防线难以招架其冲击。",
          ],
          reasoning: "控球权将属于西班牙，德布劳内虽能制造威胁但独木难支，预测西班牙 2-1 晋级。",
        },
      },
      {
        a: "England", b: "Norway", sa: 2, sb: 1, winner: "England", status: "done", aet: true,
        rationale: {
          title: "英格兰 🆚 挪威",
          verdict: "预测：英格兰晋级",
          points: [
            "挪威爆冷淘汰巴西（16 强 2-1），哈兰德状态爆棚，但中场厄德高支持有限，整体阵容深度不足。",
            "英格兰 16 强 3-2 力克墨西哥，凯恩、贝林厄姆、萨卡三叉戟火力全开，攻击点更分散。",
            "英格兰后防线（斯通斯、沃克）对哈兰德有英超内战经验，针对性布置更成熟。",
          ],
          reasoning: "哈兰德的冲击力会制造进球，但英格兰整体实力和攻击深度更胜一筹，预测 2-1 险胜。",
        },
      },
      {
        a: "Argentina", b: "Switzerland", sa: 3, sb: 1, winner: "Argentina", status: "done", aet: true,
        rationale: {
          title: "阿根廷 🆚 瑞士",
          verdict: "预测：阿根廷晋级",
          points: [
            "阿根廷 16 强 3-2 险胜埃及，梅西、阿尔瓦雷斯均有进球，攻击端状态在线，但连失 2 球暴露中卫转身慢的隐患。",
            "瑞士 16 强点球 4-3 淘汰哥伦比亚，常规时间 0-0 运动战乏术，攻坚创造力不足是软肋。",
            "阿根廷中场（恩佐、麦卡利斯特）控球+反抢能力远胜瑞士，能持续压制；梅西的关键传球足以撕破瑞士的铁桶阵。",
          ],
          reasoning: "瑞士防守纪律性能撑一段时间，但阿根廷的个人闪光终将决定比赛，预测阿根廷 2-1 晋级。",
        },
      },
    ],
  },
  {
    title: "半决赛 · Semifinals",
    key: "sf",
    matches: [
      {
        a: "France", b: "Spain", sa: 0, sb: 2, winner: "Spain", status: "done",
        rationale: {
          title: "法国 🆚 西班牙",
          verdict: "赛果：西班牙晋级",
          points: [
            "西班牙爆冷 2-0 完胜法国，亚马尔、法比安建功，控球+反击效率俱佳。",
            "法国锋线姆巴佩被西班牙中场（罗德里、佩德里）切断输送，整场哑火。",
            "西班牙高位防线本场的身后空当被中场反抢补上，法国反击无从施展。",
          ],
          reasoning: "西班牙用控球压制了法国的反击，并抓住法国防线失误两度破门，爆冷晋级决赛。",
        },
      },
      {
        a: "England", b: "Argentina", sa: 1, sb: 2, winner: "Argentina", status: "done",
        rationale: {
          title: "英格兰 🆚 阿根廷",
          verdict: "预测：阿根廷晋级",
          points: [
            "阿根廷 1/4 决赛 3-1 加时击败瑞士，梅西策动+阿尔瓦雷斯破门，加时赛展现体能与韧性，但连续两场加时（32强、QF）体能存隐患。",
            "英格兰 1/4 决赛 2-1 加时险胜挪威，凯恩制胜球救主，但被哈兰德先破门暴露中卫转身慢的问题，同样打满加时体能消耗大。",
            "梅西的最后一舞——卫冕冠军淘汰赛关键战决定性极强（本届已 4 球）；马丁内斯（大马丁）的点球扑救能力是半决赛保险阀。",
            "历史情结：1998、2002 世界杯英阿大战皆是经典，阿根廷在马拉多纳/梅西时代大赛底蕴更深。",
          ],
          reasoning: "火星撞地球的对攻战，两队体能都打满加时有消耗，但阿根廷的大赛底蕴和梅西的瞬间闪光更致命，预测阿根廷 2-1 晋级。",
        },
      },
    ],
  },
  {
    title: "决赛 · Final",
    key: "final",
    matches: [
      {
        a: "Argentina", b: "Spain", sa: 0, sb: 1, winner: "Spain", status: "done", aet: true,
        rationale: {
          title: "阿根廷 🆚 西班牙",
          verdict: "赛果：西班牙夺冠（加时 1-0）",
          points: [
            "西班牙加时 1-0 击败阿根廷，时隔 14 年再夺世界杯冠军，成为 2024 欧洲杯 + 2026 世界杯双冠王。",
            "阿根廷连续四场淘汰赛打满加时/点球（32强、QF、SF、决赛），体能透支严重，决赛下半场明显跟不上西班牙节奏。",
            "西班牙中场罗德里、佩德里全场控球压制，亚马尔本届赛事大放异彩，加时赛一锤定音。",
            "梅西最后一舞未能圆梦，全场被西班牙中场切断与队友联系，阿根廷进攻效率不足。",
          ],
          reasoning: "西班牙用控球和体能优势拖垮了疲惫的阿根廷，加时赛一球制胜，实至名归登顶世界之巅。",
        },
      },
    ],
  },
];

/* Champion derived from final winner */
const CHAMPION = ROUNDS[ROUNDS.length - 1].matches[0].winner;
