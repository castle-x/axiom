# bugs/ BUG 管理写作指南

> 本文指导 AI（含测试 agent）在 `.axm/progress/bugs/**/*.md` 下管理项目级 BUG。这是面向 AI 的**通用** BUG 管理规范，不限技术栈与测试类型：API 测试、UI 测试、单元测试、人工探索测试、生产事故复盘，凡是产出"缺陷"事实的场景都走这套规范。
>
> 设计目标：让任何 AI 接手"测出/修/验收/关闭/重开 BUG"任务时，都能从同一处文档结构中拿到上下文，不会因为提交人或工具不同而漂移。

## 目录定位

`progress/bugs/` 与 `progress/<initiative>/` 同级：

| 维度 | bugs/ | <initiative>/ |
|---|---|---|
| 关注点 | 单点缺陷（事实） | 阶段开发（计划） |
| 文档形状 | 一 BUG 一文件 + 一个看板 log | roadmap + specs |
| 进入条件 | 测试 agent / 人类发现可复现的缺陷 | 用户明确开始一个开发主题 |
| 退出条件 | BUG `closed` 或 `wont-fix` / `duplicate` | initiative 闭合 |

BUG 不应混入某个 `<initiative>/` 内部——它是横切关注点，由测试 agent 独立提交，由开发 agent / 人类消费。

## 建议结构

```
progress/bugs/
├── index.md                # 骨架 C：BUG 入口索引
├── log.md                  # 骨架 D, progress-type=roadmap：BUG 看板汇总
└── <bug-id>.md             # 骨架 D, progress-type=bug：单条 BUG
```

- `bugs/index.md`：登记 `log.md` 与所有 `<bug-id>.md`。`reindex.mjs` 会自动同步。
- `bugs/log.md`：BUG 看板，列出所有未关闭 BUG（状态分布、优先级分布、Top N 待修），相当于 roadmap。
- `<bug-id>.md`：每条 BUG 一份独立文档；**关闭后不删除**，作为历史证据。

## BUG ID 与文件命名

强制规则：

- 文件名 **kebab-case**，禁止空格、下划线、中文
- 推荐格式：`bug-<YYYY-MM-DD>-<short-slug>.md`
  - 示例：`bug-2026-05-14-login-timeout.md`、`bug-2026-05-14-api-rate-limit-500.md`
- short-slug 用 3-6 个英文词，能从文件名一眼看出问题域
- 同一天多条同主题 BUG，slug 加序号后缀：`-2`、`-3`
- BUG ID（正文 `id` 字段）= 文件名去掉 `.md`

> 注意：尽管命名包含日期，仍属于 axm 的"日期前缀"禁令豁免——BUG 是带时间属性的事实记录，与"plan 类"日期前缀（被禁）语义不同。但**仅限 `bugs/<bug-id>.md`**；其他文档不享受此豁免。

## 单条 BUG 文档骨架

```markdown
<!-- axm-meta
status: active
last-reviewed: 2026-05-14
owner: qa-team
progress-type: bug
initiative: bugs
related:
  - ../../knowledge/<system>/overview.md
-->

# bug-2026-05-14-login-timeout — 登录接口在弱网下 30s 超时未提示

## 元信息

| 字段 | 值 |
|---|---|
| ID | `bug-2026-05-14-login-timeout` |
| 提交人 | api-tester（AI） |
| 提交时间 | 2026-05-14 |
| 优先级 | P1 |
| 严重度 | Major |
| 当前状态 | `open` |
| 影响模块 | `apps/web/auth`、`packages/api-client` |
| 影响版本 | `v1.4.2` |
| 关联 PR / commit | （修复后填） |
| 关联 spec / roadmap | `../auth-redesign/specs/phase-2.md`（可选） |

## 复现步骤

1. 在 Chrome DevTools 设置 Slow 3G
2. 打开 `/login`
3. 输入合法凭据并点击"登录"
4. 等待 35 秒

## 期望表现

- 15 秒内显示"网络较慢，正在重试"或失败提示
- 客户端最多重试 2 次后给出明确错误

## 实际表现

- 客户端无任何加载/失败提示，30 秒后才静默返回 `Network Error`
- 用户无法判断是凭据错误还是网络问题

## 影响范围

- 所有弱网环境用户（约占 8% 日活）
- 引发支持工单激增（关联 issue：…）

## 根因分析（如已定位）

- `packages/api-client/src/http.ts` 的 axios 实例未配置 `timeout`
- UI 层未订阅 `loading` 状态

## 修复验收标准

### AI 自动验收

- [ ] 新增单元测试：`http.timeout.test.ts` 覆盖 15s 超时分支
- [ ] 新增集成测试：`e2e/login-slow-network.spec.ts` 在限速场景下 20s 内出现错误提示
- [ ] `pnpm test` 全绿
- [ ] `pnpm typecheck` 全绿

### 人类验收

- [ ] 在 Chrome DevTools Slow 3G 下手动复现，确认 15-20s 内看到加载/失败提示
- [ ] 真机弱信号场景下，登录失败时文案明确

## 当前进度

- 2026-05-14 提交 by api-tester
- （后续状态变更追加在下方时间线）

## 时间线

| 时间 | 状态 | 操作人 | 说明 |
|---|---|---|---|
| 2026-05-14 | open | api-tester | 提交 BUG |
```

## 必填字段（缺一不可）

| 区块 | 字段 | 写什么 |
|---|---|---|
| axm-meta | `progress-type: bug` | 固定值 |
| axm-meta | `initiative: bugs` | 固定值 |
| 元信息 | ID | 与文件名一致 |
| 元信息 | 提交人 | AI agent 名或人名 |
| 元信息 | 优先级 | P0 / P1 / P2 / P3 |
| 元信息 | 严重度 | Blocker / Critical / Major / Minor / Trivial |
| 元信息 | 当前状态 | 见生命周期 |
| 元信息 | 影响模块 | 至少一个路径或子系统名 |
| 正文 | 复现步骤 | 步骤化，能机械执行 |
| 正文 | 期望表现 | 可观察 |
| 正文 | 实际表现 | 可观察 |
| 正文 | 修复验收标准 | 分 AI 自动验收 + 人类验收 |
| 正文 | 时间线 | 状态变更追加，禁止覆盖删除历史 |

## 优先级与严重度

**优先级**（修的紧迫性，决定排期）：

| 级别 | 含义 | 修复时限参考 |
|---|---|---|
| **P0** | 阻断主流程或生产事故 | 立即（小时级） |
| **P1** | 核心功能受损，存在 workaround | 当前迭代 |
| **P2** | 非核心功能受损或体验问题 | 下一迭代 |
| **P3** | 极少触发的细节问题 / 优化建议 | Backlog，不承诺修复时限 |

**严重度**（缺陷本身的破坏力，决定修复方案深度）：

| 级别 | 含义 |
|---|---|
| Blocker | 系统不可用、数据丢失、安全漏洞 |
| Critical | 主功能完全失效 |
| Major | 主功能部分失效或显著体验问题 |
| Minor | 边缘场景小问题 |
| Trivial | 文案 / 排版 / 极小细节 |

**两者独立**：高严重度不等于高优先级（例：一个 Critical 但极少触发的边缘缺陷可能只配 P2）。

## BUG 生命周期与状态

固定 8 个状态，状态机如下：

```
                ┌──────────┐
                │   open   │  ← 测试 agent / 人类提交
                └────┬─────┘
                     │ 开发 agent 接单
                     ▼
              ┌──────────────┐
              │ in-progress  │
              └──────┬───────┘
                     │ 修复并自验通过
                     ▼
                ┌──────────┐    人类验收失败    ┌────────────┐
                │  fixed   ├──────────────────▶│  reopened  │──┐
                └────┬─────┘                   └────────────┘  │
                     │ 人类验收通过                              │
                     ▼                                          │
                ┌──────────┐                                    │
                │ verified │                                    │
                └────┬─────┘                                    │
                     │ 跟踪期内无回归                            │
                     ▼                                          │
                ┌──────────┐◀──────────────────────────────────┘
                │  closed  │
                └──────────┘

  分支终态：
  - wont-fix   （明确不修，需写明理由与替代方案）
  - duplicate  （指向另一条 BUG，关闭本条）
```

### 状态字典

| 状态 | 何时使用 | 谁可以触发 |
|---|---|---|
| `open` | 已提交、未排期或未开始修 | 测试 agent / 人类提交时默认 |
| `in-progress` | 开发 agent 或人类已开始修 | 接单方 |
| `fixed` | 修复代码已合入，AI 自动验收通过 | 开发 agent |
| `verified` | 人类验收通过 | 人类 / 验收 agent |
| `closed` | 跟踪期（≥1 个发布周期）无回归 | 维护方 |
| `reopened` | 验收失败或线上回归 | 任何发现回归者 |
| `wont-fix` | 明确不修，必须写理由 | 人类决策 |
| `duplicate` | 已有同等 BUG，关闭本条并指向原 BUG ID | 任何确认重复者 |

### 状态变更规则

1. **任何状态变更必须在"时间线"表追加一行**，禁止改写历史行
2. **`fixed` → `verified`** 必须有人类验收记录（即使是开发者自己人工验收，也要明确写"by <name>"）
3. **`reopened`** 必须写明回归证据（复现步骤、链接、commit）
4. **`wont-fix` / `duplicate`** 必须写理由或重复指向；这两个终态视同 `closed`，但保留语义区分
5. **关闭后不删除文件**；如需归档大量旧 BUG，可整体改 `status: deprecated`，但文件保留

## BUG 看板 `bugs/log.md`

`log.md` 是 BUG 总览，骨架 D，`progress-type: roadmap`，`initiative: bugs`。

```markdown
<!-- axm-meta
status: active
last-reviewed: 2026-05-14
owner: qa-team
progress-type: roadmap
initiative: bugs
-->

# BUG 看板

## 状态分布

| 状态 | 数量 |
|---|---|
| open | 3 |
| in-progress | 2 |
| fixed（待验收） | 1 |
| verified（跟踪中） | 1 |

## 未关闭 BUG（按优先级）

| ID | 标题 | 优先级 | 状态 | 提交日 | 负责人 |
|---|---|---|---|---|---|
| [bug-2026-05-14-login-timeout](./bug-2026-05-14-login-timeout.md) | 登录弱网超时无提示 | P1 | open | 2026-05-14 | unassigned |
| [bug-2026-05-13-api-rate-limit-500](./bug-2026-05-13-api-rate-limit-500.md) | 限流应返 429 实返 500 | P1 | in-progress | 2026-05-13 | backend-dev |

## 最近关闭

| ID | 标题 | 关闭日 | 关闭原因 |
|---|---|---|---|
| bug-2026-05-10-search-empty | 搜索空结果未提示 | 2026-05-12 | closed |

## 规则提醒

- 新增 BUG：测试 agent 在本目录创建 `<bug-id>.md`，并在本看板登记一行
- 状态变更：同步更新本看板与 `<bug-id>.md` 时间线
- BUG 关闭后 1 个发布周期无回归方可移到"最近关闭"
```

`log.md` 不是事实唯一来源，单条 BUG 文档才是。看板由 AI/人类按需更新；如发现看板与单条文档不一致，**以单条文档为准**。

## BUG 与其他文档的关系

| 场景 | 处理 |
|---|---|
| BUG 修复涉及架构/接口变更 | 不要在 BUG 文档里写设计；开一份 `progress/<initiative>/specs/<spec>.md` 走正常 spec 流程，BUG 文档关联 spec 链接 |
| BUG 暴露的系统事实需要长期记录 | 关闭时把事实沉淀到 `knowledge/<system>/<topic>.md`，BUG 文档 `related` 加链接 |
| BUG 修复产生新回归测试 | 测试代码路径写入 BUG 的"AI 自动验收"区块；同时如该测试覆盖核心场景，写入 `project/coding.md` 或 `knowledge/` 测试约定 |
| BUG 反映长期规范缺失 | 不要把规则塞进 BUG 文档；由人类决策后写入 `project/*.md` |
| 用户问"现在有哪些 BUG" | 读 `bugs/log.md`；如需详情再读对应 `<bug-id>.md` |

## 测试 agent 提交 BUG 的标准流程

测试 agent（如 API Tester、UI Tester 等）发现缺陷后：

1. **复现确认**：至少独立复现 2 次；若只能间歇复现，必须在文档中写"间歇复现率 N/M"
2. **查重**：在 `bugs/` 下用文件名 / 标题搜索，确认非 `duplicate`
3. **创建文件**：按命名规则生成 `<bug-id>.md`，骨架完整填齐
4. **登记看板**：在 `bugs/log.md` 的"未关闭 BUG"表追加一行
5. **更新索引**：跑 `node <skill-path>/scripts/reindex.mjs --target=<项目根> --dry-run`，确认无误后落盘
6. **校验契约**：跑 `node <skill-path>/scripts/validate.mjs --target=<项目根>`，确保零 ERROR
7. **不擅自接单**：测试 agent 提交即可，不要把状态从 `open` 直接改为 `in-progress`（除非用户/team-lead 明确分派）

## 开发 agent 修复 BUG 的标准流程

1. **接单**：把 `<bug-id>.md` 元信息中"当前状态"改为 `in-progress`，时间线追加一行
2. **定位根因**：在"根因分析"补全；若需要更大设计，开 spec 而非把设计塞进 BUG
3. **写测试**：先按 BUG 的"AI 自动验收"区块补/写失败测试（红）
4. **修复**：实现，让测试通过（绿）
5. **自验**：跑全套验收命令；通过后状态改为 `fixed`，记录关联 commit/PR
6. **不擅自 `verified`**：等人类（或独立验收 agent）确认

## 验收 agent / 人类验收流程

1. 拉取修复后的代码
2. 执行"AI 自动验收"全部命令，记录输出
3. 执行"人类验收"步骤，记录截图 / 路径
4. 全部通过：状态 `verified`，时间线追加；否则 `reopened`，写明回归证据

## 闭合 BUG

当 `verified` 跟踪期满（建议 ≥ 1 个发布周期）且无回归：

1. 状态改 `closed`，时间线追加关闭说明
2. 长期事实若未同步，补到 `knowledge/`
3. `bugs/log.md` 把该 BUG 从"未关闭"移到"最近关闭"
4. 文件**保留**不删除
5. 跑 `reindex.mjs` 与 `validate.mjs`

## 反模式（禁止）

- ❌ 把多条 BUG 合并在一个文件里
- ❌ 用"修复中、待发布、灰度中"等非状态机词替代 8 个标准状态
- ❌ 直接覆盖时间线历史
- ❌ BUG 关闭就删除文件
- ❌ 在 BUG 文档里写架构设计（应另开 spec）
- ❌ 让 BUG 看板与单条文档长期不一致
- ❌ 把"未复现 / 描述不清"的反馈当 BUG 提交——这类先放在外部 issue tracker 或根目录草稿，确认可复现后再进 `bugs/`
- ❌ 修改 `wont-fix` / `duplicate` 文档的元信息却不更新看板

## 自查清单

- [ ] 文件名符合 `bug-YYYY-MM-DD-<slug>.md` 模式
- [ ] axm-meta `progress-type: bug` 且 `initiative: bugs`
- [ ] 元信息表至少含 ID / 提交人 / 优先级 / 严重度 / 当前状态 / 影响模块
- [ ] 复现步骤可机械执行
- [ ] 期望表现与实际表现都可观察
- [ ] 修复验收标准分 AI 自动验收 + 人类验收
- [ ] 时间线追加而非覆盖
- [ ] 状态值在 8 个标准状态内
- [ ] 已在 `bugs/log.md` 登记
- [ ] `bugs/index.md` entries 与实际文件一致（必要时跑 reindex）
- [ ] 关闭时长期事实已同步到 `knowledge/`
