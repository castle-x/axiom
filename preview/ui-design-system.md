# UI 设计规范

> 从 Understand-Anything 项目提炼的设计语言，与业务无关，可直接复用。
> 目标：所有 UI 元素遵循同一套节奏，视觉自然对齐，无需逐个调试。

---

## 一、间距节奏（Spacing Scale）

系统只使用以下几档，禁止使用其他随意数值：

| Token | px | 用途 |
|---|---|---|
| `space-1` | 4px | 图标与文字之间、最紧密的元素内部 |
| `space-1.5` | 6px | 按钮内图标与文字、列表条目内部元素 |
| `space-2` | 8px | 同组元素之间（badge 组、按钮组） |
| `space-2.5` | 10px | 下拉行内间距 |
| `space-3` | 12px | 卡片内容区 padding（紧凑） |
| `space-4` | 16px | 面板 padding、Section 之间 |
| `space-5` | 20px | 主内容区 padding（宽松） |

**原则：**
- 同一组件内部用 `space-1` ～ `space-2`
- 组件之间用 `space-2` ～ `space-4`
- 页面区块之间用 `space-4` ～ `space-5`
- **不跳档**：不要在 4px 旁边出现 7px，选最近的档位

---

## 二、圆角层级（Border Radius Scale）

四级制，语义对应元素体量：

| 级别 | Token | px | 适用元素 |
|---|---|---|---|
| 最大 | `rounded-full` | 9999px | 胶囊 Tag、色板圆点、进度条、状态指示点 |
| 大 | `rounded-lg` | 8px | 卡片、输入框、下拉面板、主操作按钮、模态框 |
| 中 | `rounded-md` | 6px | 分段控件单项、Tab 按钮 |
| 小 | `rounded` | 4px | Badge 标签、Checkbox、小型内联按钮 |

**原则：**
- 容器（面板/卡片）用 `rounded-lg`
- 容器内部的子按钮降一级用 `rounded-md`
- 独立的小标注元素用 `rounded`
- 表示"状态"或"颜色"的点状元素一律 `rounded-full`

---

## 三、组件高度节奏（Height Rhythm）

交互元素统一三档高度，同一页面区域内只使用同一档：

| 档位 | 高度 | padding 组合 | 字号 | 适用 |
|---|---|---|---|---|
| **大** | ~36px | `py-2` + `text-sm`（14px） | 14px | 主输入框、主操作按钮 |
| **中** | ~32px | `py-1.5` + `text-sm`（14px） | 14px | 常规按钮、Tab 按钮 |
| **小** | ~28px | `py-1` + `text-xs`（12px） | 12px | 分段控件项、次要按钮 |
| **微** | ~24px | `py-1` + `text-[10px]`（10px） | 10px | 内联动作、Badge 按钮 |

**原则：**
- Header 工具栏内统一用「小」档（28px），保持工具栏高度紧凑
- 表单区域统一用「大」或「中」档
- 同一行内所有按钮必须同档
- 垂直分割线高度跟随行内元素：工具栏用 `h-5`（20px），表单行用 `h-6`（24px）

---

## 四、图标尺寸系统（Icon Scale）

| 尺寸 | Token | 搭配 | 用途 |
|---|---|---|---|
| 14px | `w-3.5 h-3.5` | 微型按钮内 | 勾选图标、极小场景 |
| 16px | `w-4 h-4` | 「小/中」档按钮 | 常规操作图标 |
| 20px | `w-5 h-5` | 独立图标按钮 | 帮助、关闭等点击区域 |
| 24px | `w-6 h-6` | 色板/状态点 | 可点击的圆形色块 |

**原则：**
- 图标大小跟按钮高度档位绑定，不单独决定
- 同一行内所有图标必须同尺寸
- 纯装饰性指示点用 `w-2 h-2`（8px）

---

## 五、文字层级（Typography Scale）

七档字号，每档有固定语义，不随意混用：

| 档位 | 字号 | 字重 | 其他修饰 | 语义 |
|---|---|---|---|---|
| T1 | 18px `text-lg` | `font-heading` | `tracking-wide` | 页面/面板主标题 |
| T2 | 16px `text-base` | `font-heading` | `tracking-wide` | 次级标题 |
| T3 | 14px `text-sm` | `font-normal` | `leading-relaxed` | 正文、摘要、标签文字 |
| T4 | 12px `text-xs` | `font-semibold` | `uppercase tracking-wider` | Section 标题、分区标注 |
| T5 | 11px `text-[11px]` | `font-normal` | — | 次要说明文字、小 Tag |
| T6 | 10px `text-[10px]` | `font-semibold` | `uppercase tracking-wider` | 类型标签、按钮文字（微档） |
| T7 | 9px `text-[9px]` | `font-semibold` | `uppercase tracking-wider` | 极小嵌套标签（子元素内） |

**原则：**
- T4 / T6 / T7 必须配合 `uppercase tracking-wider`，否则过小的字号难以辨认
- 正文（T3）固定 `leading-relaxed`（行高 1.625）
- 代码、路径文字一律 `font-mono`，继承父级字号
- 标题字体（T1/T2）用 `font-heading`，其余用 `font-sans`

---

## 六、边框与分割线系统（Border System）

两种强度，对应两种语义：

| 类型 | Token | 透明度 | 用途 |
|---|---|---|---|
| 细 | `border-subtle` | `rgba(accent, 0.12)` | 容器边框、列表条目边框、分割线 |
| 中 | `border-medium` | `rgba(accent, 0.25)` | 模态框、强调边框、焦点态 |

**三种分割线形态：**

```
水平分割线（区块间）：  border-b border-subtle       高度 = 1px
垂直分割线（行内间）：  w-px h-5 bg-border-subtle    宽 1px，高 20px
卡片边框（包围式）：    border border-subtle rounded-lg
```

**原则：**
- 同级别元素之间用水平分割线
- 同一行内不同区域之间用垂直分割线
- 卡片/面板外框用包围式边框
- 悬停/选中强调用 `border-medium` 或直接用 accent 色边框

---

## 七、颜色应用规则（Color Application）

### 透明度体系（Opacity Scale）

所有颜色叠加透明度时，只使用以下几档：

| 用途 | 透明度 | 示例 |
|---|---|---|
| 极淡背景（激活区域底色） | `/5` ~ `/10` | `bg-accent/10`、`bg-node-file/10` |
| 边框配合色块 | `/20` ~ `/30` | `border-accent/20`、`border-node-file/30` |
| 标准激活背景 | `/15` ~ `/20` | `bg-accent/15`、`bg-accent/20` |
| 悬停强调背景 | `/30` | `hover:bg-gold/30` |
| 遮罩层 | `/65` | `bg-black/65` |
| 元素淡出（非焦点） | `opacity-20` ~ `opacity-25` | 未选中节点 |

### 交互状态规则

每个可交互元素必须定义以下三态：

| 状态 | 处理方式 |
|---|---|
| **默认** | `text-text-secondary bg-elevated` 或 `text-text-muted` |
| **悬停** | `hover:text-text-primary hover:bg-elevated` 或 `hover:text-accent` |
| **激活/选中** | `bg-accent/15 text-accent` 或 `bg-accent/20 text-accent` |

**激活态一律不用实心背景**，用 `/15`～`/20` 的半透明背景 + 对应文字色，保持层次感。

### Badge 配色公式

所有类型 Badge 遵循同一公式：
```
text-{type}   +   border border-{type}/30   +   bg-{type}/10
```
例：`text-node-file border border-node-file/30 bg-node-file/10`

---

## 八、浮层层级系统（Z-index）

| 层 | 值 | 内容 |
|---|---|---|
| 基础内容 | 0 | 页面正文 |
| 悬浮工具栏 | z-10 | 固定在图区角落的提示 |
| 下拉/搜索结果 | z-30 | SearchBar 下拉 |
| 浮层面板 | z-50 | Filter、ThemePicker、PathFinder |
| 模态框 | z-50 | CodeViewer 全屏 |
| 全局遮罩 | z-9999 | 噪点纹理、全局遮盖（pointer-events: none）|

---

## 九、动效规范（Motion）

只使用以下三种过渡，不自行发明动画：

| 场景 | 规则 |
|---|---|
| 所有颜色/背景切换 | `transition-colors duration-200`（200ms ease） |
| 复合属性变化（阴影+透明度） | `transition-[box-shadow,opacity,filter] duration-200` |
| 浮层/下拉出现 | `animate-fade-slide-in`（`translateY 8px → 0, opacity 0 → 1, 300ms ease-out`）|
| 代码面板底部滑起 | `animate-slide-up`（`translateY 100% → 0, 300ms ease-out`）|
| 选中节点呼吸 | `animate-accent-pulse`（`box-shadow 0→20px, 2s ease-in-out infinite`）|
| 主题背景色切换 | `html { transition: background-color 0.2s, color 0.2s }` |
| 色板圆点悬停 | `hover:scale-110`（无 duration，使用默认 150ms）|

**原则：**
- 功能性交互（颜色变化）：150～200ms
- 内容进入动画：300ms
- 循环动画：2s+
- 所有动画只用 `ease` 或 `ease-out`，不用 `linear`

---

## 十、分段控件（Segmented Control）标准结构

项目中高频出现，单独定义标准：

```
[容器]  bg-elevated  rounded-lg  p-0.5
  [按钮]  px-3 py-1  text-xs  font-medium  rounded-md  transition-colors
    激活：bg-accent/20 text-accent
    默认：text-text-muted hover:text-text-secondary
```

**原则：**
- 容器比按钮大一圈：容器 `rounded-lg`（8px），按钮 `rounded-md`（6px）
- 容器内边距固定 `p-0.5`（2px），让按钮填满但不贴边
- 最多 3 个选项，超过 3 个改用下拉

---

## 十一、对齐基准（Alignment Rules）

### 行内对齐
- 所有行内元素统一 `items-center`，不使用 `items-baseline`
- 图标与文字对齐靠 `gap`，不用 `margin`

### 左右分布
- 标题/主要内容靠左，动作按钮靠右：`flex justify-between items-center`
- Section 标题与内容左对齐，无缩进

### 网格对齐
- 同组按钮用 `flex gap-{n}`，不用绝对定位
- Badge 组用 `flex flex-wrap gap-1.5`
- 列表条目宽度 100%（`w-full`），不用固定宽度

### 文字截断
- 单行截断：`truncate`（`overflow-hidden text-ellipsis whitespace-nowrap`）
- 多行截断：`line-clamp-2`（正文摘要最多 2 行）
- 不要让文字溢出容器，宁可截断也不换行

---

## 快速核对清单

在实现任意 UI 组件前，对照检查：

- [ ] 高度是否落在四档（36 / 32 / 28 / 24px）之一？
- [ ] 圆角是否在四级（full / lg / md / rounded）内？
- [ ] 间距是否只用了 8 档之一（4/6/8/10/12/16/20px）？
- [ ] 图标是否与按钮高度档位匹配（14/16/20/24px）？
- [ ] 文字是否落在七级字号之一，且该级别的字重/大写规则是否应用？
- [ ] 三态（默认/悬停/激活）是否都定义了？
- [ ] 激活态背景是否用了半透明（`/15`~`/20`），而非实心色？
- [ ] Badge 是否遵循 `text + border/30 + bg/10` 公式？
- [ ] 动效是否只用了规范内的三种（colors / fade-slide-in / slide-up）？
- [ ] 同一行内所有元素高度和图标尺寸是否一致？
