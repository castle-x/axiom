# Understand-Anything：图组件与配色系统完整复刻指南

> 来源项目：`Understand-Anything`（开源代码理解工具）
> 适用场景：AI 根据本文档在新项目中完整复刻其有向图与配色系统

---

## 第一部分：有向图实现

### 技术栈

| 层次 | 库 | 版本 | 用途 |
|---|---|---|---|
| 渲染引擎 | `@xyflow/react` | ^12.0.0 | 节点/边渲染、交互、缩放平移 |
| 主布局算法 | `elkjs` | ^0.9.3 | 层次化自动布局，在 Web Worker 中运行 |
| 备用布局 | `@dagrejs/dagre` | ^2.0.4 | 有向无环图布局 |
| 力导向布局 | `d3-force` | ^3.0.0 | 物理模拟布局 |
| 图数据结构 | `graphology` | ^0.25.4 | 图计算、社区检测 |
| 社区聚类 | `graphology-communities-louvain` | ^2.0.1 | Louvain 算法自动分组 |
| 状态管理 | `zustand` | ^5.0.0 | 全局图状态 |

### 安装

```bash
npm install @xyflow/react elkjs @dagrejs/dagre d3-force graphology graphology-communities-louvain zustand
# 必须同时引入 React Flow 的样式
```

### 自定义节点类型体系

项目定义了 5 种自定义节点，注册方式如下：

```tsx
import { ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

const nodeTypes = {
  custom: CustomNode,           // 普通代码节点（文件/函数/类等）
  "layer-cluster": LayerClusterNode,  // 架构层分组容器
  portal: PortalNode,           // 跨层引用传送门
  container: ContainerNode,     // 模块包裹容器
  // domain-cluster: DomainClusterNode  // 领域聚类（视图切换时使用）
};

<ReactFlow
  nodeTypes={nodeTypes}
  nodes={nodes}
  edges={edges}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  fitView
>
  <Background variant={BackgroundVariant.Dots} />
  <Controls />
  <MiniMap />
</ReactFlow>
```

### CustomNode 实现（核心节点）

节点结构：左侧 4px 彩色竖条（标识节点类型）+ 内容区（类型标签、文件名、摘要）。

```tsx
// CustomNode.tsx
import { memo } from "react";
import { Handle, Position } from "@xyflow/react";

export interface CustomNodeData {
  label: string;
  nodeType: string;       // 对应节点类型 token
  summary: string;
  complexity: string;     // "simple" | "moderate" | "complex"
  isHighlighted: boolean;
  searchScore?: number;
  isSelected: boolean;
  isTourHighlighted: boolean;
  isDiffChanged: boolean;
  isDiffAffected: boolean;
  isDiffFaded: boolean;
  isNeighbor: boolean;
  isSelectionFaded: boolean;
  tags?: string[];
}

// 节点类型 → CSS 变量映射
const typeColors: Record<string, string> = {
  file:      "var(--color-node-file)",
  function:  "var(--color-node-function)",
  class:     "var(--color-node-class)",
  module:    "var(--color-node-module)",
  concept:   "var(--color-node-concept)",
  config:    "var(--color-node-config)",
  document:  "var(--color-node-document)",
  service:   "var(--color-node-service)",
  table:     "var(--color-node-table)",
  endpoint:  "var(--color-node-endpoint)",
  pipeline:  "var(--color-node-pipeline)",
  schema:    "var(--color-node-schema)",
  resource:  "var(--color-node-resource)",
  // 别名
  domain:    "var(--color-node-concept)",
  flow:      "var(--color-node-pipeline)",
  step:      "var(--color-node-function)",
  // 知识图谱节点
  article:   "var(--color-node-article)",
  entity:    "var(--color-node-entity)",
  topic:     "var(--color-node-topic)",
  claim:     "var(--color-node-claim)",
  source:    "var(--color-node-source)",
};

function CustomNodeComponent({ id, data }) {
  const barColor = typeColors[data.nodeType] ?? typeColors.file;

  // 状态样式逻辑
  let extraClass = "";
  if (data.isSelected) {
    extraClass = "ring-2 ring-accent node-glow";
  } else if (data.isTourHighlighted) {
    extraClass = "ring-2 ring-accent-dim animate-accent-pulse";
  } else if (data.isHighlighted) {
    const score = data.searchScore ?? 1;
    extraClass = score <= 0.1
      ? "ring-2 ring-accent-bright"
      : score <= 0.3
        ? "ring-2 ring-accent"
        : "ring-1 ring-accent-dim/60";
  }
  if (data.isDiffChanged)      extraClass += " ring-2 ring-[var(--color-diff-changed)] diff-changed-glow";
  else if (data.isDiffAffected) extraClass += " ring-1 ring-[var(--color-diff-affected)] diff-affected-glow";
  else if (data.isDiffFaded)    extraClass += " diff-faded";
  if (data.isSelectionFaded)   extraClass += " opacity-20";
  else if (data.isNeighbor)    extraClass += " ring-1 ring-accent-dim/50";

  return (
    <div className={`relative rounded-lg bg-elevated border border-border-subtle
      ${extraClass} min-w-[180px] max-w-[220px] overflow-hidden
      transition-[box-shadow,outline,opacity,filter] duration-200
      cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.3)]`}
    >
      {/* 左侧类型色条 */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
        style={{ backgroundColor: barColor }} />

      <Handle type="target" position={Position.Top} className="!bg-text-muted !w-2 !h-2" />

      <div className="pl-4 pr-3 py-2">
        {/* 类型标签行 */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: barColor }}>
            {data.nodeType}
          </span>
          <span className="text-[9px] font-mono text-text-secondary">
            {data.complexity}
          </span>
        </div>
        {/* 节点名称 */}
        <div className="text-sm font-heading text-text-primary truncate">
          {data.label}
        </div>
        {/* 摘要 */}
        <div className="text-[11px] text-text-secondary mt-1 line-clamp-2 leading-tight">
          {data.summary}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-text-muted !w-2 !h-2" />
    </div>
  );
}

export default memo(CustomNodeComponent);
```

### ELK 自动布局（核心）

ELK 布局在 Web Worker 中运行，避免阻塞主线程：

```ts
// elk-layout.ts
import ELK from "elkjs/lib/elk.bundled.js";

const elk = new ELK();

export const ELK_DEFAULT_LAYOUT_OPTIONS = {
  "elk.algorithm": "layered",
  "elk.direction": "DOWN",
  "elk.layered.spacing.nodeNodeBetweenLayers": "80",
  "elk.spacing.nodeNode": "40",
  "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
  "elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
};

// 将 ReactFlow nodes/edges 转换为 ELK 输入格式，运行布局，再转换回来
export async function applyElkLayout(input: ElkInput): Promise<ElkLayoutResult> {
  const result = await elk.layout(input);
  return result;
}
```

---

## 第二部分：配色系统

### 系统架构概述

配色系统由三层叠加构成，全部通过 CSS 自定义属性（CSS Variables）实现运行时切换：

```
第一层：Preset（预设底色）  →  定义背景层次 + 节点类型固定色
第二层：Accent Swatch（强调色板）  →  定义品牌主色及三个变体
第三层：Derived（动态派生）  →  从 Accent 自动计算边框、发光、玻璃效果等
```

所有变量注入到 `document.documentElement.style`，Tailwind v4 通过 `@theme` 声明默认值。

### 预设列表

| ID | 名称 | 底色 | 默认强调色 | 风格 |
|---|---|---|---|---|
| `dark-gold` | Dark Gold | `#0a0a0a` | gold | 暗色·金奢 |
| `dark-ocean` | Dark Ocean | `#0a0e14` | ocean | 暗色·深海 |
| `dark-forest` | Dark Forest | `#0a100a` | emerald | 暗色·森林 |
| `dark-rose` | Dark Rose | `#100a0a` | rose | 暗色·玫瑰 |
| `light-minimal` | Light Minimal | `#f5f3f0` | indigo | 亮色·极简 |

---

## 第三部分：完整色板 Token 色值

### 3.1 背景层次（所有暗色主题通用结构，以 dark-gold 为例）

```
Token                  dark-gold    dark-ocean   dark-forest  dark-rose    light-minimal
--color-root           #0a0a0a      #0a0e14      #0a100a      #100a0a      #f5f3f0
--color-surface        #111111      #111820      #111811      #181111      #eae7e3
--color-elevated       #1a1a1a      #1a222c      #1a241a      #221a1a      #ffffff
--color-panel          #141414      #141c24      #141c14      #1c1414      #f0ede9
```

> **层次语义**：`root`（页面背景）→ `surface`（卡片/面板背景）→ `elevated`（节点背景）→ `panel`（侧边栏）

### 3.2 文字颜色

```
Token                  dark-gold    light-minimal
--color-text-primary   #f5f0eb      #1a1a1a
--color-text-secondary #a39787      #6b6b6b
--color-text-muted     #6b5f53      #a0a0a0
```

### 3.3 强调色板（Accent Swatches）

#### 暗色主题可选强调色（8 种）

```
id        accent    accentDim   accentBright   语义
gold      #d4a574   #c9a96e     #e8c49a        金色（默认）
ocean     #5ba4cf   #4e93ba     #7abce0        海蓝
emerald   #5ea67a   #4e9468     #78c492        翡翠绿
rose      #cf7a8a   #b96e7e     #e094a4        玫瑰
purple    #9b7abf   #876bb0     #b494d4        紫罗兰
amber     #c9963a   #b5862e     #ddb05c        琥珀
teal      #4aab9a   #3d9686     #68c4b4        青绿
silver    #a0a8b0   #8e959c     #b8bfc6        银灰
```

#### 亮色主题可选强调色（8 种）

```
id        accent    accentDim   accentBright   语义
indigo    #4a6fa5   #3d5f8f     #6088bf        靛蓝（默认）
ocean     #3a8ab5   #2e7aa0     #55a0cc        海蓝
emerald   #3a8a5c   #2e7a4e     #55a878        翡翠绿
rose      #a5566a   #8f4a5c     #bf6e82        玫瑰
purple    #6b5a9e   #5c4d8a     #8474b5        紫罗兰
amber     #9e7a30   #8a6a28     #b5923e        琥珀
teal      #2e8a7a   #267a6c     #45a595        青绿
slate     #5a6570   #4e5860     #6e7a85        岩灰
```

### 3.4 节点类型颜色（代码图节点，暗/亮通用结构，具体值因主题略有差异）

#### 暗色主题节点色

```
Token                    色值        语义
--color-node-file        #4a7c9b    文件 · 钢蓝
--color-node-function    #5a9e6f    函数 · 绿
--color-node-class       #8b6fb0    类 · 紫
--color-node-module      #c9a06c    模块 · 琥珀
--color-node-concept     #b07a8a    概念 · 玫瑰
--color-node-config      #5eead4    配置 · 青（亮）
--color-node-document    #7dd3fc    文档 · 天蓝
--color-node-service     #a78bfa    服务 · 薰衣草紫
--color-node-table       #6ee7b7    数据表 · 薄荷绿
--color-node-endpoint    #fdba74    接口端点 · 橙
--color-node-pipeline    #fda4af    流水线 · 粉红
--color-node-schema      #fcd34d    Schema · 黄
--color-node-resource    #a5b4fc    资源 · 淡紫蓝
```

#### 亮色主题节点色（light-minimal，颜色更饱和）

```
Token                    色值        语义
--color-node-file        #3a6a87    文件 · 深钢蓝
--color-node-function    #488a5b    函数 · 深绿
--color-node-class       #755d99    类 · 深紫
--color-node-module      #a88a56    模块 · 深琥珀
--color-node-concept     #966674    概念 · 深玫瑰
--color-node-config      #14b8a6    配置 · 青
--color-node-document    #38bdf8    文档 · 天蓝
--color-node-service     #8b5cf6    服务 · 深紫
--color-node-table       #34d399    数据表 · 翠绿
--color-node-endpoint    #fb923c    接口端点 · 深橙
--color-node-pipeline    #fb7185    流水线 · 深粉红
--color-node-schema      #facc15    Schema · 深黄
--color-node-resource    #818cf8    资源 · 深靛蓝
```

### 3.5 知识图谱节点颜色（与代码图共用 CSS 变量体系）

```
Token                    暗色值      语义
--color-node-article     #d4a574    文章 · 金（与默认 accent 同色）
--color-node-entity      #7ba4c9    实体 · 钢蓝
--color-node-topic       #c9b06c    话题 · 琥珀
--color-node-claim       #6fb07a    观点 · 绿
--color-node-source      #8a8a8a    来源 · 中性灰
```

### 3.6 从 Accent 动态派生的变量

以下变量由 `applyTheme()` 在运行时根据当前 accent 色自动计算，无需手动维护：

```
变量名                          计算规则（isDark=true 为例）
--color-border-subtle           rgba(accent_rgb, 0.12)
--color-border-medium           rgba(accent_rgb, 0.25)
--glass-bg                      rgba(20,20,20,0.8)
--glass-bg-heavy                rgba(20,20,20,0.95)
--glass-border                  rgba(accent_rgb, 0.10)
--glass-border-heavy            rgba(accent_rgb, 0.15)
--scrollbar-thumb               rgba(accent_rgb, 0.20)
--scrollbar-thumb-hover         rgba(accent_rgb, 0.35)
--glow-accent                   rgba(accent_rgb, 0.15)
--glow-accent-strong            rgba(accent_rgb, 0.40)
--glow-accent-pulse             rgba(accent_rgb, 0.60)
--color-edge                    rgba(accent_rgb, 0.30)   ← 图中连线颜色
--color-edge-dim                rgba(accent_rgb, 0.08)
--color-edge-dot                rgba(accent_rgb, 0.15)
--color-accent-overlay-bg       rgba(accent_rgb, 0.05)
--color-accent-overlay-border   rgba(accent_rgb, 0.25)
--kbd-bg                        rgba(accent_rgb, 0.10)
```

> **亮色主题时**，rgba 透明度系数略低（约 ×0.8），`glass-bg` 改为 `rgba(255,255,255,0.8)`。

### 3.7 Diff 状态颜色（固定，不随主题变化）

```
Token                       色值                    语义
--color-diff-changed        #e05252                 已变更节点（红）
--color-diff-affected       #d4a030                 受影响节点（琥珀）
--color-diff-changed-dim    rgba(224,82,82,0.25)    变更节点背景遮罩
--color-diff-affected-dim   rgba(212,160,48,0.25)   受影响节点背景遮罩
```

### 3.8 字体系统

```css
--font-serif:   'DM Serif Display', Georgia, serif       /* 标题 */
--font-mono:    'JetBrains Mono', 'Fira Code', monospace  /* 代码 */
--font-sans:    'Inter', system-ui, sans-serif            /* UI 正文 */
--font-heading: var(--font-serif)                         /* 默认标题字体，可运行时切换 */
```

---

## 第四部分：主题系统实现

### 主题引擎（theme-engine.ts）

```ts
export function applyTheme(config: ThemeConfig): void {
  const preset = getPreset(config.presetId);
  const accent = getAccent(preset, config.accentId);
  const style = document.documentElement.style;

  // 1. 注入 preset 基底色（root/surface/elevated/panel/text/node-*）
  for (const [key, value] of Object.entries(preset.colors)) {
    style.setProperty(`--color-${key}`, value);
  }

  // 2. 注入强调色三变体
  style.setProperty("--color-accent",        accent.accent);
  style.setProperty("--color-accent-dim",    accent.accentDim);
  style.setProperty("--color-accent-bright", accent.accentBright);

  // 3. 从 accent 派生所有半透明变量
  const derived = deriveFromAccent(accent.accent, preset.isDark);
  for (const [key, value] of Object.entries(derived)) {
    style.setProperty(`--${key}`, value);
  }

  // 4. 设置 data-theme 属性，供 CSS 选择器使用
  document.documentElement.setAttribute(
    "data-theme",
    preset.isDark ? "dark" : "light"
  );

  // 5. 设置标题字体
  const fontMap = { serif: "var(--font-serif)", sans: "var(--font-sans)", mono: "var(--font-mono)" };
  style.setProperty("--font-heading", fontMap[config.headingFont ?? "serif"]);
}
```

### ThemeProvider 使用方式

```tsx
import { ThemeProvider, DEFAULT_THEME_CONFIG } from "./themes";

// 包裹根组件，主题持久化在 localStorage（key: "ua-theme"）
function App() {
  return (
    <ThemeProvider metaTheme={DEFAULT_THEME_CONFIG}>
      <Dashboard />
    </ThemeProvider>
  );
}

// 在子组件中切换主题
function ThemeSwitcher() {
  const { setPreset, setAccent } = useTheme();
  return (
    <>
      <button onClick={() => setPreset("dark-gold")}>暗金</button>
      <button onClick={() => setPreset("light-minimal")}>亮色</button>
      <button onClick={() => setAccent("ocean")}>切换为海蓝</button>
    </>
  );
}
```

### ThemeConfig 数据结构

```ts
interface ThemeConfig {
  presetId: "dark-gold" | "dark-ocean" | "dark-forest" | "dark-rose" | "light-minimal";
  accentId: string;          // 对应 AccentSwatch.id
  headingFont?: "serif" | "sans" | "mono";
}

// 默认值
const DEFAULT_THEME_CONFIG: ThemeConfig = {
  presetId: "dark-gold",
  accentId: "gold",
};
```

---

## 第五部分：CSS 工具类与视觉效果

### 核心工具类（index.css 中定义）

```css
/* 玻璃拟态 */
.glass       { background: var(--glass-bg);       border: 1px solid var(--glass-border);       backdrop-filter: blur(12px); }
.glass-heavy { background: var(--glass-bg-heavy); border: 1px solid var(--glass-border-heavy); backdrop-filter: blur(16px); }

/* 节点选中发光 */
.node-glow   { box-shadow: 0 0 20px var(--glow-accent); }

/* Diff 效果 */
.diff-changed-glow  { box-shadow: 0 0 16px rgba(224, 82, 82, 0.25); }
.diff-affected-glow { box-shadow: 0 0 12px rgba(212, 160, 48, 0.20); }
.diff-faded         { opacity: 0.25; filter: saturate(0.3); transition: opacity 0.3s ease, filter 0.3s ease; }

/* 背景噪点纹理（增加质感，3% 透明度） */
.noise-overlay::before {
  content: '';
  position: fixed; inset: 0;
  opacity: 0.03;
  pointer-events: none;
  z-index: 9999;
  background-image: url("data:image/svg+xml,..."); /* SVG fractalNoise */
}
```

### 动画关键帧

```css
/* 节点进入动画 */
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* 强调色呼吸发光（选中状态） */
@keyframes accentPulse {
  0%, 100% { box-shadow: 0 0  8px var(--glow-accent-strong); }
  50%       { box-shadow: 0 0 20px var(--glow-accent-pulse);  }
}

.animate-fade-slide-in  { animation: fadeSlideIn 0.3s ease-out forwards; }
.animate-accent-pulse   { animation: accentPulse 2s ease-in-out infinite; }
```

### React Flow 样式覆盖

```css
/* 将 React Flow 背景色对接主题变量 */
.react-flow__background {
  background-color: var(--color-root) !important;
}

/* 自定义细滚动条 */
::-webkit-scrollbar       { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--scrollbar-thumb-hover); }
```

---

## 第六部分：Tailwind v4 接入方式

项目使用 Tailwind CSS v4，通过 `@theme` 指令声明默认 CSS 变量，使 Tailwind 工具类直接引用主题 token：

```css
/* index.css */
@import "tailwindcss";
@source "./**/*.{ts,tsx}";

@theme {
  --color-root:     #0a0a0a;
  --color-surface:  #111111;
  --color-elevated: #1a1a1a;
  --color-accent:   #d4a574;
  /* ... 其余所有变量 ... */
}
```

这样在组件中可以直接使用如 `bg-elevated`、`text-text-primary`、`ring-accent`、`border-border-subtle` 等工具类，且随 `applyTheme()` 的 CSS 变量注入自动响应主题切换。

---

## 快速复刻检查清单

- [ ] 安装 `@xyflow/react`，引入 `@xyflow/react/dist/style.css`
- [ ] 安装 `elkjs`，在 Web Worker 中运行布局
- [ ] 定义 5 种 CustomNode 类型，注册到 `nodeTypes`
- [ ] 实现左侧 4px 色条 + Handle + 内容区的节点 UI 结构
- [ ] 创建 `presets.ts`，填入上方 **3.1～3.7** 所有色值
- [ ] 创建 `theme-engine.ts`，实现 `applyTheme()` 三步注入
- [ ] 创建 `ThemeContext.tsx`，包裹根组件，持久化到 localStorage
- [ ] 在 `index.css` 中用 `@theme` 声明 Tailwind 默认值
- [ ] 添加 `.glass`、`.node-glow`、`.diff-*`、`animate-*` 工具类
- [ ] 覆盖 `.react-flow__background` 对接 `--color-root`
