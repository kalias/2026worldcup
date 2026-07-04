# scripts/ — 赛果自动更新

## fetch-results.js

从 ESPN 公开 API 抓取 2026 世界杯已完赛结果，自动更新 `data.js` 中的比分/状态/晋级队。

### 工作原理
1. 请求 ESPN scoreboard API（覆盖整个赛事期 6/11–7/19）
2. 解析每场比赛的队名、常规比分、点球比分（`shootoutScore`）、状态（完赛/点球/加时）
3. 用「队名→队名」映射匹配 `data.js` 中的对阵（ESPN 的 "United States" 映射到我们的 "USA" 等）
4. 对已完赛场次做**字段级替换**（sa/sb/winner/status/pens/aet），保留 rationale/note 不动
5. 未完赛场次（含预测）保持原状

### 用法

```bash
# 只看会改什么，不写文件
node scripts/fetch-results.js --dry-run

# 实际抓取并更新 data.js
node scripts/fetch-results.js
```

### 队名映射

ESPN 与 `data.js` 队名不一致的在脚本顶部的 `TEAM_NAME_MAP` 维护：

| ESPN 名称 | data.js 名称 |
|---|---|
| United States | USA |
| Congo DR | DR Congo |
| Bosnia-Herzegovina | Bosnia |
| Cape Verde Islands | Cape Verde |

如果后续出现新的不一致，在这里加一行即可。

### 自动化

`.github/workflows/daily-update.yml` 每天北京时间 12:00 自动运行此脚本，有变更则提交推送，Cloudflare 随后自动重新部署。

也可在 GitHub 仓库的 **Actions** 页面点 "Run workflow" 手动触发。
