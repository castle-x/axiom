# Axiom

<p align="center">
  <strong>给项目一份给 AI 看的上下文目录。</strong>
</p>

<p align="center">
  <a href="README.md">English</a> ·
  简体中文
</p>

<p align="center">
  <a href="https://github.com/castle-x/axiom/stargazers">
    <img alt="GitHub stars" src="https://img.shields.io/github/stars/castle-x/axiom?style=flat-square" />
  </a>
  <img alt="Agent Skills" src="https://img.shields.io/badge/Agent%20Skills-axm--init%20%7C%20maintain%20%7C%20progress%20%7C%20preview-c8912d?style=flat-square" />
  <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-111827?style=flat-square" />
</p>

<p align="center">
  <img src="docs/assets/axiom-hero.png" alt="Axiom 营销海报：给 AI 看的项目上下文" />
</p>

Axiom 是一组 Anthropic Agent Skills，用来为项目创建、维护、审计 `.axm/` 知识库与根入口 `AGENTS.md`，并提供本地只读预览器。

它解决的是一个很日常的问题：每开一个新 AI 编程会话，AI 都要重新扫 `package.json`、目录结构、README，再猜你的架构约束。Axiom 把那份“你希望 AI 每次都已经知道的事情”沉淀成项目内的规范文档。

### 核心能力

| 能力 | 说明 |
| --- | --- |
| 项目上下文 | 生成 `.axm/` 知识库与 `AGENTS.md` Knowledge Index |
| 技能拆分 | `axm-init` / `axm-maintain` / `axm-progress` / `axm-health-check` / `axm-preview` |
| 机械校验 | 零 npm 依赖的 scaffold / validate / reindex 脚本 |
| 进度文档 | roadmap / spec / decision / BUG 统一使用 `doc-state` + `workflow-state` |
| 只读预览 | 本地查看 Markdown、axm-meta、校验结果、搜索、BUG 与 Knowledge Graph |

### Axiom Preview

<table>
  <tr>
    <td width="33%" align="center">
      <img src="docs/assets/axiom-preview.png" alt="Axiom Preview 基础界面" />
    </td>
    <td width="33%" align="center">
      <img src="docs/assets/axiom-preview-bugs.png" alt="Axiom Preview BUG 管理界面" />
    </td>
    <td width="33%" align="center">
      <img src="docs/assets/axiom-preview-graph.png" alt="Axiom Preview 知识图谱界面" />
    </td>
  </tr>
  <tr>
    <td align="center"><sub>基础界面</sub></td>
    <td align="center"><sub>BUG 管理</sub></td>
    <td align="center"><sub>知识图谱</sub></td>
  </tr>
</table>

### 安装

推荐安装整组技能：

```bash
git clone https://github.com/castle-x/axiom.git /tmp/axiom
node /tmp/axiom/scripts/install-skills.mjs --target=~/.claude/skills
```

安装到其他 Agent Skills 目录时，把 `--target` 换成对应目录，例如：

```bash
node /tmp/axiom/scripts/install-skills.mjs --target=~/.codex/skills
```

兼容安装仍然可用：把整个仓库 clone 到 `~/.claude/skills/axm/`，根目录 `SKILL.md` 会作为路由入口，把任务转到 `skills/axm-*`。

### 技能分工

| Skill | 用途 |
| --- | --- |
| `axm-init` | 初始化 `.axm/` 与 `AGENTS.md` |
| `axm-maintain` | 校验 axm-meta、同步 index、修 contract |
| `axm-progress` | 管理 roadmap / spec / decision / BUG |
| `axm-health-check` | 审计 `.axm/` 与当前代码是否事实一致 |
| `axm-preview` | 下载、启动、构建、发布只读预览器 |

### 用法

到项目根目录，对 AI 说：

```text
帮我初始化 axm
```

AI 会调用 `axm-init` 并按 5 阶段执行：

| 阶段 | 谁做 | 做什么 |
| --- | --- | --- |
| 1. Discover | AI | 扫源码、生成项目画像，给你确认 |
| 2. Scaffold | 脚本 | 释放 `.axm/universal/`、索引骨架与 `AGENTS.md` 骨架 |
| 3. Author | AI | 写项目架构、编码规范、知识文档，补全 Knowledge Index |
| 4. Validate | 脚本 | 校验 axm-meta、index、code-refs 与 AGENTS 路由 |
| 5. Handoff | AI | 输出完成清单与 TODO |

### 已有项目怎么接

- 已有 `AGENTS.md` 但没有 `.axm/`：直接走 5 阶段，scaffold 默认跳过 `AGENTS.md`，AI 后续手动补 Knowledge Index。
- 已有 `.axm/` 怀疑漂移：使用 `axm-maintain` 跑 validate，必要时修契约。
- 改过 `.axm/**/*.md` 后索引乱了：先 `reindex --dry-run`，确认后再写入并 validate。

### 管理开发进度与 BUG

- **roadmap / spec**：放在 `progress/<initiative>/{roadmap.md, specs/<spec>.md}`，用 axm-meta 的 `workflow-state` 表示当前流程状态。
- **BUG**：放在 `progress/<initiative>/bugs/bug-YYYY-MM-DD-<slug>.md`，包含优先级、严重度、复现、验收与生命周期状态。

对 AI 说“用 axm 提一个 BUG”或“把这个 spec 闭合掉”，AI 会调用 `axm-progress` 并遵循对应文档契约。

### 产物长什么样

```text
<your-project>/
├── AGENTS.md                       # AI 根入口（含 Knowledge Index）
└── .axm/
    ├── index.md
    ├── universal/                  # 跨项目通用规范
    │   ├── docs.md
    │   ├── devloop.md
    │   ├── quality.md
    │   ├── vcs.md
    │   └── review.md
    ├── project/                    # 项目特有规范（AI 写）
    │   ├── architecture.md
    │   └── coding.md
    ├── knowledge/                  # 项目知识（AI 写）
    │   └── <system>/overview.md
    └── progress/
        └── <initiative>/
            ├── roadmap.md
            ├── specs/<spec>.md
            └── bugs/bug-YYYY-MM-DD-<slug>.md
```

### Axiom Preview 只读预览器

`axiom-preview` 是 `.axm/` 的本地只读浏览器。它会启动一个 `127.0.0.1` 服务，用来查看：

- `AGENTS.md` 与 `.axm/` 文件树
- Markdown 正文、axm-meta、校验摘要与 code-refs
- 搜索结果、索引关系与 Knowledge Graph
- 顶部 BUG 统计与可搜索、可过滤、可跳转的 BUG 管理弹窗
- 最近打开项目的一键切换

最快启动方式：

```bash
npx @castle-xx/axm-preview --target=/path/to/project --port=8765
```

长期安装：

```bash
npm install -g @castle-xx/axm-preview
axiom-preview --target=/path/to/project --port=8765
```

从本仓库构建：

```bash
cd apps/axm-preview
make build
./bin/axiom-preview --target=/path/to/project --port=8765
```

预览器只展示 `AGENTS.md` 与 `.axm/` 文档、索引关系、axm-meta、校验摘要和 code-refs 路径；Web UI 不提供 scaffold / validate / reindex 执行入口，也不会写入目标仓库。

### 直接调用脚本

跳过 AI、放进 CI 或自动化时可独立使用：

```bash
# 释放骨架，默认拒绝覆盖，--force 才覆盖
node /path/to/axiom/scripts/scaffold.mjs \
  --owner=<team-or-name> --date=2026-06-02 \
  --project-name=<name> --target=<repo-root>

# 校验契约，exit 0 PASS / 1 error / 2 warn
node /path/to/axiom/scripts/validate.mjs --target=<repo-root>

# 同步 index，建议先 dry-run
node /path/to/axiom/scripts/reindex.mjs --target=<repo-root> --dry-run
node /path/to/axiom/scripts/reindex.mjs --target=<repo-root>
```

### 设计取舍

**AI 判断 + 脚本抄写。** 脚本负责跨项目逐字一致的内容，AI 负责必须读代码才写得对的内容。

**skill 脚本零 npm 依赖。** `scaffold` / `validate` / `reindex` 都只用 Node 内置模块。Axiom Preview 作为独立 Go embedded SPA app 放在 `apps/axm-preview/`。

**契约严一点，路由稳一点。** AI 基于确定字段做路由决策，契约越稳，推理越稳。

## Star History

<p align="center">
  <a href="https://www.star-history.com/#castle-x/axiom&Date">
    <img src="https://api.star-history.com/svg?repos=castle-x/axiom&type=Date" alt="Star History Chart" />
  </a>
</p>

## 许可证

MIT
