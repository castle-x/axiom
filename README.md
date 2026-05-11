# axm

> 给任何新项目一份 **AI 专用的上下文目录** `.axm/` 与 **根入口** `AGENTS.md`。

axm 是一个 [Anthropic Agent Skill](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) 包。它让支持 Skills 的 AI（Claude Code、Codebuddy、Claude Desktop 等）能够：

1. **读懂**你的项目（扫 `package.json` / `Cargo.toml` / 目录结构）
2. **释放**跨项目通用的规范文档（DEVLOOP、文档契约、质量门禁、VCS 规范共 4 份）
3. **撰写**项目特有的架构、编码、知识文档
4. **管理**阶段性开发进度（roadmap、阶段 spec、验收状态）
5. **校验**文档契约（axm-meta 骨架、索引一致性、code-refs 真实性）
6. **交付**一份可复用、可演化的 AI 上下文库

## 设计哲学

**AI 判断 + 脚本抄写**。跨项目逐字一致的通用规范由脚本释放；项目特有的架构/知识由 AI 读完代码再写；可机械判定的契约由脚本校验。

- 纯脚本 CLI → 只能产出空壳，不懂你的项目
- 纯 AI 重写 → 每个项目通用规范都在漂移，且费 token
- **Skill 主导 + 三个零依赖 Node 脚本** → 各做自己擅长的事

## 安装

axm 是 Agent Skill，不需要 `npm install`。把本仓库放到 AI 客户端的 skills 目录即可：

### Claude Code

```bash
# 全局安装（跨所有项目可用）
git clone https://github.com/castle-x/axiom.git ~/.claude/skills/axm

# 或项目级安装（只对当前仓库可用）
cd <your-project>
git clone https://github.com/castle-x/axiom.git .claude/skills/axm
```

### Codebuddy / 其他支持 Skills 的客户端

参考该客户端关于 Skills 目录的文档，把本仓库放进去。

### 完全不用 AI（纯脚手架）

axm 的三个脚本本身也可以独立跑，见 [手动使用脚本](#手动使用脚本)。

## 使用（让 AI 调用）

安装好后，在任何新项目根目录下对 AI 说：

> "帮我初始化 axm。"

AI 会自动加载 `axm` skill、走完整 5 阶段 SOP：

| 阶段 | 执行方 | 做什么 |
|---|---|---|
| **Phase 1 Discover** | AI | 扫 `package.json` / `Cargo.toml` / 目录结构，输出项目画像给你确认 |
| **Phase 2 Scaffold** | 脚本 | 释放 `.axm/universal/*` 4 份规范 + 索引骨架 + `AGENTS.md` 骨架 |
| **Phase 3 Author** | AI | 基于项目画像写 `project/architecture.md` / `coding.md` / `knowledge/<system>/overview.md`，补全 `AGENTS.md` 的路由表 |
| **Phase 4 Validate** | 脚本 | 机械校验 axm-meta / index 一致性 / code-refs 真实性；有 error 回 Phase 3 |
| **Phase 5 Handoff** | AI | 输出完成清单 + 后续 TODO |

完成后你的仓库会多出：

```
<your-project>/
├── AGENTS.md                    # AI 根入口（含 .axm 召回声明、Knowledge Index）
└── .axm/
    ├── index.md                # 一级分区索引
    ├── universal/               # 跨项目通用规范（4 份 + index）
    │   ├── devloop.md          # DEVLOOP 状态机（意图 → 分级 → 分支 → 验证 → 交付）
    │   ├── quality.md          # 测试策略 + 质量门禁
    │   ├── docs.md             # 四套 axm-meta 骨架（A/B/C/D）契约
    │   └── vcs.md              # 分支策略 + 提交规范
    ├── project/                 # 项目特有规范（AI 按实际写）
    │   ├── architecture.md     # 模块划分、依赖方向、硬约束
    │   └── coding.md           # 工具链、语言风格
    ├── knowledge/               # 项目知识（AI 按实际写）
    │   └── <system>/
    │       └── overview.md
    └── progress/                # 开发进度（roadmap、spec、验收状态）
        └── <initiative>/
            ├── roadmap.md
            └── specs/
                └── <spec>.md
```

## 手动使用脚本

如果你不想让 AI 自动走 5 阶段，或要在 CI 里加校验，三个脚本都可独立调用：

### scaffold（释放通用规范）

```bash
node /path/to/axm/scripts/scaffold.mjs \
  --owner=<你的团队/个人标识> \
  --date=2026-05-07 \
  --project-name=<项目名> \
  --target=<项目根> \
  [--force]
```

默认拒绝覆盖已有文件。输出 manifest（created / skipped / overwritten）。

### validate（校验契约）

```bash
node /path/to/axm/scripts/validate.mjs --target=<项目根>
```

退出码：`0` 全 PASS / `1` 有 error / `2` 仅 warn。

四类检查：
- axm-meta 四套骨架（A/B/C/D）字段完整性 + 日期格式
- 每份 `index.md` 的 `entries` 与同目录实际 `.md`/子目录双向一致
- `knowledge/**` 的 `code-refs` 指向的源码真实存在
- `AGENTS.md` 的 Knowledge Index 表引用的 `.axm` 路径可达

### reindex（同步索引）

```bash
node /path/to/axm/scripts/reindex.mjs --target=<项目根> [--dry-run]
```

保留已有 `entries` 的顺序与 `title`/`when-to-read`，追加孤儿（标 TODO 占位），删除失效条目。原子写入（`.tmp` + `rename`）。

## 仓库结构

```
axm/
├── SKILL.md                 # Agent Skill 入口（name + description + 5 阶段 SOP）
├── README.md                # 本文件
├── AGENTS.md                # 本仓库自身的 AI 入口（自用验证）
├── .axm/                    # 本仓库自身的 .axm/（axm 初始化了自己，见自用验证章节）
├── references/              # AI Phase 3 按需加载的写作指南
│   ├── axm-meta-contracts.md
│   ├── project-spec-guide.md
│   ├── knowledge-doc-guide.md
│   ├── progress-doc-guide.md
│   └── agents-md-guide.md
├── templates/               # 脚本逐字释放的 .tpl 模板
│   ├── AGENTS.md.tpl
│   └── axm/
└── scripts/                 # 零依赖 Node 脚本
    ├── scaffold.mjs
    ├── validate.mjs
    ├── reindex.mjs
    └── _lib/                # 共享模块
        ├── frontmatter.mjs  # 极简 axm metadata 解析器
        ├── axm-walker.mjs
        └── logger.mjs
```

## 自用验证

本仓库自身的 `.axm/` 就是“用 axm 初始化一个叫 axm 的项目”的产物，也就是常说的 dogfooding：工具先用在自己身上，验证输出结构和规则是否可用。你可以直接读 `AGENTS.md` 和 `.axm/` 看看初始化结果长什么样。

想验证？

```bash
cd /path/to/axm
node scripts/validate.mjs --target=.
# Expected: Summary: 0 error(s), 0 warning(s)
```

## FAQ

### 我已经有 `AGENTS.md` 了，axm 会覆盖它吗？

不会。scaffold 默认拒绝覆盖任何已存在文件，会在 manifest 里列出 "skipped"。你需要 `--force` 才会覆盖。

### 为什么四套 axm-meta 骨架要搞得这么严格？

因为 `.axm/` 的目标读者是 **AI**。AI 基于确定的字段做路由决策，契约越严、推理越稳。对人类维护来说，写 axm-meta 的成本远低于每次读文档都要猜"这个字段该填什么"的成本。

### universal 4 份规范能改吗？

可以改，但**要改的是 `templates/axm/universal/*.md.tpl`**（skill 包本体），不是某个用户项目里的副本。理由：跨项目逐字一致是 universal 的核心价值。如果每个项目的 `devloop.md` 都长得不一样，AI 就得每次重新读。

### 脚本为什么要零 npm 依赖？

用户 `git clone` 后应该立即可用，无需 `npm install` / `pnpm install` 步骤。三个脚本加起来 ~600 行，Node 内置模块完全够用，不值得为 `js-yaml` / `commander` 等引入依赖地狱。

### 我想加一个 "axm upgrade" 命令同步 universal 升级

**目前不提供**。理由：升级场景相对低频，`git pull && node scripts/scaffold.mjs --force` 已经能解决 80% 的情况；剩下的边界情况让 AI 帮你做 diff 合并比脚本更可靠。真需要的话欢迎提 issue。

### validate 报了一堆 WARN，能忽略吗？

WARN（退出码 2）是"可接受但值得看一眼"的信号。最常见是"孤儿子项未登记到 entries"——跑一下 `reindex.mjs` 就好。长期 WARN 说明你 `.axm/` 有漂移，记得审查。

### 这和 Cursor 的 `.cursorrules` / Claude 的 `CLAUDE.md` 冲突吗？

不冲突。axm 用的是业界开放标准 `AGENTS.md`（Claude Code / Codebuddy / Codex 等默认识别）。如果你的客户端只吃 `CLAUDE.md` / `.cursorrules`，创建一个转发文件即可：

```md
# CLAUDE.md
See [AGENTS.md](./AGENTS.md) for the canonical AI context.
```

## 许可

MIT
