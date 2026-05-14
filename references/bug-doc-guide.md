# bug-doc-guide.md — BUG 写作指南

> 适用范围：`.axm/progress/<initiative>/bugs/**/*.md`。这是面向 AI 的通用 BUG 管理规范，不限技术栈与测试类型（API / UI / 单测 / 人工 / 生产事故复盘）。让任何 AI 接手"测出 / 修 / 验收 / 关闭 / 重开"都能从同一处文档拿到上下文。

## 0. 硬规则速查（违反任一条 = 错）

1. BUG 文档**必须**位于 `progress/<initiative>/bugs/`；禁止在 `progress/` 顶层另建 `bugs/`，禁止把 BUG 散在不带 initiative 的位置
2. axm-meta `initiative` 字段填**实际主题名**（如 `auth-redesign`、`quality`），**禁止填 `bugs`**
3. 文件名 `bug-<YYYY-MM-DD>-<short-slug>.md`，kebab-case，是 axm 日期前缀禁令的唯一豁免
4. 状态值必须在固定 8 个内（见 §3）；任何状态变更**只追加时间线**，禁止改写历史
5. BUG 关闭后**保留**文件，不删除
6. 没有归属主题时，**先新建 initiative** 再放 BUG（见 §1）

## 1. 目录与归属

```
progress/<initiative>/
├── index.md                 # 骨架 C（必须）
├── roadmap.md / specs/      # 该主题的开发计划（可选）
└── bugs/                    # 该主题 BUG（可选）
    ├── index.md             # 骨架 C
    ├── log.md               # 骨架 D, progress-type=roadmap，看板
    └── <bug-id>.md          # 骨架 D, progress-type=bug，单条 BUG
```

`bugs/` 只能与 `roadmap.md` / `specs/` 同级——这样闭合 initiative 时能连带审视未关闭 BUG，且 BUG 与所属业务天然强关联。

**找不到归属时**按以下顺序处理：

1. 优先归到现有 initiative（精确模块匹配 > 同子系统 > 同生命周期阶段）
2. 仍无法归属，新建 initiative 承载：
   - `progress/quality/` — 跨模块质量、回归、稳定性（默认收纳点）
   - `progress/ops/` 或 `progress/incidents/` — 生产事故 / 运维侧
   - `progress/<module-name>/` — 独立模块尚未启动 roadmap 但已有 BUG
3. 新建 initiative 必须含 `index.md`；`roadmap.md` 可选

> 跨主题 BUG 总览：不维护单一全局看板。需要时遍历各 `progress/*/bugs/log.md` 临时聚合。

## 2. 单条 BUG 骨架

```markdown
<!-- axm-meta
status: active
last-reviewed: 2026-05-14
owner: qa-team
progress-type: bug
initiative: auth-redesign        # 实际主题名，禁填 bugs
related:
  - ../roadmap.md
  - ../../../knowledge/<system>/overview.md
-->

# bug-2026-05-14-login-timeout — 登录接口在弱网下 30s 超时未提示

## 元信息

| 字段 | 值 |
|---|---|
| ID | `bug-2026-05-14-login-timeout`（= 文件名） |
| 所属 initiative | `auth-redesign`（与 axm-meta 一致） |
| 提交人 | api-tester（AI） |
| 提交时间 | 2026-05-14 |
| 优先级 | P1 |
| 严重度 | Major |
| 当前状态 | `open` |
| 影响模块 | `apps/web/auth`、`packages/api-client` |
| 影响版本 | `v1.4.2` |
| 关联 PR / commit | （修复后填） |
| 关联 spec / roadmap | `../specs/phase-2.md`（可选） |

## 复现步骤
（步骤化、能机械执行）

## 期望表现 / 实际表现
（两段都必须可观察）

## 影响范围
（用户面、数据面、是否引发支持工单等）

## 根因分析（如已定位）

## 修复验收标准

### AI 自动验收
- [ ] 测试文件 / 命令 / 静态检查（例：`pnpm test`、`pnpm typecheck` 全绿）

### 人类验收
- [ ] 交互路径、预期体验、人工确认点 / 截图

## 时间线

| 时间 | 状态 | 操作人 | 说明 |
|---|---|---|---|
| 2026-05-14 | open | api-tester | 提交 BUG |
```

骨架中的所有小节均**必填**；可观测但暂时未知的项写"待定位"，不能整段省略。

## 3. 优先级、严重度、生命周期

| 优先级 | 含义 | 时限 |    | 严重度 | 含义 |
|---|---|---|---|---|---|
| P0 | 阻断主流程 / 生产事故 | 立即（小时级） |    | Blocker | 系统不可用、数据丢失、安全漏洞 |
| P1 | 核心功能受损，有 workaround | 当前迭代 |    | Critical | 主功能完全失效 |
| P2 | 非核心功能 / 体验问题 | 下一迭代 |    | Major | 主功能部分失效或显著体验问题 |
| P3 | 极少触发 / 优化建议 | Backlog |    | Minor | 边缘场景小问题 |
|   |   |   |    | Trivial | 文案 / 排版 |

**两者独立**：高严重度 ≠ 高优先级（Critical 但极少触发的边缘缺陷可只配 P2）。

**生命周期 8 状态**（前驱 → 后继都在表里，不再画 ASCII）：

| 状态 | 何时使用 | 谁触发 | 进入要求 |
|---|---|---|---|
| `open` | 已提交、未排期 | 测试 agent / 人类 | 提交时默认 |
| `in-progress` | 已开始修 | 接单方 | 由 `open` 进入；测试 agent 不可自动接单 |
| `fixed` | 修复合入，AI 自动验收通过 | 开发 agent | 由 `in-progress` 进入；记录关联 commit/PR |
| `verified` | 人类验收通过 | 人类 / 验收 agent | 必须有 "by `<name>`" |
| `closed` | 跟踪期 ≥1 发布周期无回归 | 维护方 | 仅可由 `verified` 进入 |
| `reopened` | 验收失败或线上回归 | 任何发现回归者 | 必须写回归证据（复现步骤 / commit / 链接） |
| `wont-fix` | 明确不修 | 人类决策 | 必须写理由与替代方案；视同终态 |
| `duplicate` | 已有同等 BUG | 任何确认重复者 | 必须指向原 BUG ID；视同终态 |

`reopened` 后回到 `in-progress` 重走流程。归档大量旧 BUG 可整体改 axm-meta `status: deprecated`，文件保留。

## 4. 看板 `<initiative>/bugs/log.md`

骨架 D，`progress-type: roadmap`，`initiative` 与所在主题一致。结构固定三段：

- **状态分布**：每个状态当前数量
- **未关闭 BUG**：表格 `ID | 标题 | 优先级 | 状态 | 提交日 | 负责人`
- **最近关闭**：表格 `ID | 标题 | 关闭日 | 关闭原因`

事实唯一来源是单条 BUG 文档；与看板冲突时**以单条文档为准**。看板按需更新即可。

## 5. 角色与流程

| 角色 | 关键动作（按顺序） |
|---|---|
| **测试 agent**（提交） | ① 复现 ≥2 次（间歇复现写"N/M"）→ ② 选/建归属 initiative → ③ 确保 `bugs/{index,log}.md` 存在 → ④ 跨 initiative 查重 → ⑤ 创建 `<bug-id>.md`（骨架填齐）→ ⑥ 看板登记 → ⑦ `reindex.mjs --dry-run` 后落盘 → ⑧ `validate.mjs` 零 ERROR → ⑨ 状态停留 `open`，不自动接单 |
| **开发 agent**（修复） | ① 改状态 `in-progress` 并记时间线 → ② 在"根因分析"补全（更大设计开 spec）→ ③ 按"AI 自动验收"区块先写失败测试 → ④ 修复使其通过 → ⑤ 跑全套验收，状态 `fixed` 并记 commit/PR → ⑥ 不自动 `verified` |
| **验收 agent / 人类** | ① 拉修复后代码 → ② 跑 AI 自动验收并存输出 → ③ 跑人类验收并存截图 / 路径 → ④ 通过 → `verified`；不通过 → `reopened` 并写回归证据 |
| **维护方**（闭合） | ① 跟踪期 ≥1 发布周期无回归 → 状态 `closed` → ② 长期事实同步到 `knowledge/` → ③ 看板从"未关闭"移到"最近关闭"→ ④ 文件保留 → ⑤ `reindex.mjs` + `validate.mjs` |

## 6. 与其他文档的协同

| 场景 | 处理 |
|---|---|
| 修复涉及架构 / 接口变更 | 不在 BUG 里写设计，开 `<initiative>/specs/<spec>.md`，BUG 链接 spec |
| 暴露的系统事实需长期记录 | 关闭时沉淀到 `knowledge/<system>/<topic>.md`，BUG `related` 加链接 |
| 修复产生新回归测试 | 测试路径写入"AI 自动验收"；覆盖核心场景的同时写入 `project/coding.md` 或 `knowledge/` 测试约定 |
| 反映长期规范缺失 | 不把规则塞进 BUG；由人类决策后写入 `project/*.md` |

## 7. 自查清单（提交 / 关闭前过一遍）

- [ ] 路径在 `progress/<initiative>/bugs/`，文件名 `bug-YYYY-MM-DD-<slug>.md`
- [ ] axm-meta `progress-type: bug`，`initiative` 是真实主题名
- [ ] 元信息表 7 项齐全（ID / 所属 initiative / 提交人 / 优先级 / 严重度 / 当前状态 / 影响模块）
- [ ] 复现步骤、期望 / 实际表现、修复验收标准（AI + 人类）三段不为空
- [ ] 状态值在 8 个之内；时间线只追加未改写
- [ ] 已在所属 `<initiative>/bugs/log.md` 登记
- [ ] 若是新建的 initiative，已建 `<initiative>/index.md`
- [ ] 关闭时长期事实已同步到 `knowledge/`，文件保留未删

> 反模式即上述清单的反面：任何一项不符即为反模式，无需另列。最常见漏项是 §0 的 6 条硬规则——若违反，先回到 §0 重新判定。
