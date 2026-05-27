import { expect, test, type Locator, type Page } from "@playwright/test"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

test.describe.configure({ mode: "serial" })

test("preview shell supports core reading workflows", async ({ page }) => {
  const consoleErrors: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text())
  })

  await page.goto("/")
  await expect(page.getByText("Axiom Preview").first()).toBeVisible()
  await expect(page.getByRole("textbox", { name: /search docs|搜索文档/i })).toBeVisible()
  await expect(page.getByText("Knowledge Graph")).toBeVisible()
  await expect(page.getByText("All issues")).toBeVisible()
  await expect(page.getByText("C / index")).toBeVisible()
  await expect(page.getByText("checked 9 .axm doc files + AGENTS.md")).toBeVisible()
  await expect(page.locator("[data-validation-section='current'] [data-validation-empty]")).toHaveText("0 error(s), 0 warning(s)")
  await expect(page.getByRole("button", { name: "Open knowledge graph drawer" })).toBeVisible()
  await expect(page.getByRole("button", { name: /Expand knowledge graph|Collapse knowledge graph|展开知识图谱|收起知识图谱/i })).toHaveCount(0)
  await expect(page.getByRole("button", { name: /Close knowledge graph drawer|关闭知识图谱抽屉|折叠知识图谱抽屉/i })).toHaveCount(0)
  await expect(page.getByRole("button", { name: /^(Path|路径)$/i })).toHaveCount(0)
  await expect(page.getByText("Deprecated Doc")).toHaveCount(0)
  await expect(page.getByText("Closed Bug")).toHaveCount(0)

  const rootEntryTags = await metaTagTexts(page, "entries")
  expect(rootEntryTags).toEqual(["universal/ · Universal", "progress/ · Progress"])

  await page.locator("aside.file-sidebar").getByRole("button", { name: "Docs", exact: true }).click()
  const lightThemeRendering = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement)
    const tableHead = document.querySelector(".markdown th")
    const inlineCode = document.querySelector(".markdown p code")
    const codeBlock = document.querySelector(".markdown pre")
    const activeTreeRow = document.querySelector(".tree-row.is-active")
    const viewerPath = document.querySelector(".viewer-header .text-accent")
    if (
      !(tableHead instanceof HTMLElement) ||
      !(inlineCode instanceof HTMLElement) ||
      !(codeBlock instanceof HTMLElement) ||
      !(activeTreeRow instanceof HTMLElement) ||
      !(viewerPath instanceof HTMLElement)
    ) {
      throw new Error("expected markdown table head, inline code, code block, active tree row, and viewer path")
    }
    return {
      accent: root.getPropertyValue("--color-accent").trim(),
      tableHeadBg: getComputedStyle(tableHead).backgroundColor,
      inlineCodeBg: getComputedStyle(inlineCode).backgroundColor,
      inlineCodeColor: getComputedStyle(inlineCode).color,
      codeBlockBg: getComputedStyle(codeBlock).backgroundColor,
      activeTreeColor: getComputedStyle(activeTreeRow).color,
      viewerPathColor: getComputedStyle(viewerPath).color,
    }
  })
  expect(lightThemeRendering.accent).toBe("#d4a574")
  expect(lightThemeRendering.tableHeadBg).not.toBe("rgb(255, 255, 255)")
  expect(lightThemeRendering.inlineCodeBg).not.toBe("rgb(255, 255, 255)")
  expect(lightThemeRendering.codeBlockBg).not.toBe("rgb(255, 255, 255)")
  expect(rgbLuma(lightThemeRendering.inlineCodeColor), "inline code text should use a darker readable accent").toBeLessThan(130)
  expect(rgbLuma(lightThemeRendering.activeTreeColor), "active tree text should use a darker readable accent").toBeLessThan(130)
  expect(rgbLuma(lightThemeRendering.viewerPathColor), "viewer path text should use a darker readable accent").toBeLessThan(130)
  expect(await metaTagTexts(page, "code-refs")).toEqual([
    "README.md",
    "src/super-long-directory-name/another-long-segment/preview-fixture-reference-with-a-very-long-name.ts",
  ])
  const codeRefsLayout = await page.evaluate(() => {
    const label = Array.from(document.querySelectorAll("dt")).find((node) => node.textContent?.trim() === "code-refs")
    const value = label?.nextElementSibling
    const tags = Array.from(value?.querySelectorAll("[data-meta-tag]") ?? [])
    return tags.map((tag) => {
      const tagBox = tag.getBoundingClientRect()
      const valueBox = value?.getBoundingClientRect()
      const styles = window.getComputedStyle(tag)
      return {
        width: tagBox.width,
        valueWidth: valueBox?.width ?? 0,
        whiteSpace: styles.whiteSpace,
        wordBreak: styles.wordBreak,
        text: tag.textContent?.trim(),
      }
    })
  })
  expect(codeRefsLayout).toHaveLength(2)
  expect(codeRefsLayout[1].width, "long code-ref tag should fit inside the metadata value column").toBeLessThanOrEqual(codeRefsLayout[1].valueWidth + 1)
  expect(codeRefsLayout[1].whiteSpace, "long code-ref tag should allow wrapping").toBe("normal")
  expect(codeRefsLayout[1].wordBreak, "long code-ref tag should break long path segments").toBe("break-all")

  await page.locator("aside.file-sidebar").getByRole("button", { name: "E2E Bug", exact: true }).click()
  await expect(page.getByRole("heading", { name: "E2E Bug" })).toBeVisible()
  const metaTags = await page.evaluate(() => {
    const tagTexts = (key: string) => {
      const label = Array.from(document.querySelectorAll("dt")).find((node) => node.textContent?.trim() === key)
      const value = label?.nextElementSibling
      return Array.from(value?.querySelectorAll("[data-meta-tag]") ?? []).map((node) => node.textContent?.trim())
    }
    return {
      docState: tagTexts("doc-state"),
      workflowState: tagTexts("workflow-state"),
      stateUpdated: tagTexts("state-updated"),
      related: tagTexts("related"),
      entities: tagTexts("entities"),
    }
  })
  expect(metaTags.docState).toEqual(["current"])
  expect(metaTags.workflowState).toEqual(["open"])
  expect(metaTags.stateUpdated).toEqual(["2026-05-25"])
  expect(metaTags.related).toEqual(["../roadmap.md", "../specs/process-lifecycle.md"])
  expect(metaTags.entities).toEqual(["PreviewShell", "BugInventory"])
  expect(await validationSections(page)).toEqual([
    { section: "summary", status: "warn", hasIcon: true },
    { section: "current", status: "pass", hasIcon: true },
    { section: "all", status: "warn", hasIcon: true },
  ])
  await expect(page.locator("[data-validation-section='current'] [data-validation-empty]")).toHaveText("0 error(s), 0 warning(s)")
  await expect(page.locator("[data-validation-section='all'] [data-validation-empty]")).toHaveCount(0)

  await page.getByRole("textbox", { name: /search docs|搜索文档/i }).fill("docs")
  await expect(page.getByText(".axm/universal/docs.md").first()).toBeVisible()
  await page.keyboard.press(process.platform === "darwin" ? "Meta+K" : "Control+K")
  await expect(page.getByRole("textbox", { name: /search docs|搜索文档/i })).toBeFocused()

  await page.getByRole("button", { name: /Language|语言/i }).click()
  await expect(page.locator("aside.file-sidebar").getByText("文件", { exact: true })).toHaveCount(0)
  await expect(page.getByRole("button", { name: /打开问题清单/i })).toBeVisible()
  await expect(page.locator("header").getByText("BUG", { exact: true })).toHaveCount(0)
  await expect(page.getByText("文档属性")).toBeVisible()
  expect(await metaLabelTexts(page)).toEqual(expect.arrayContaining(["文档状态", "最近核对", "维护者", "进度类型", "主题", "工作流状态", "状态更新时间", "优先级", "严重程度", "相关文档", "实体", "类型"]))
  expect(await metaTagTexts(page, "文档状态")).toEqual(["当前"])
  expect(await metaTagTexts(page, "工作流状态")).toEqual(["未关闭"])
  await expect(page.locator("[data-meta-field='进度类型']")).toHaveText("问题")
  await expect(page.locator("[data-validation-section='current'] [data-validation-empty]")).toHaveText("0 错误，0 警告")
  await page.getByRole("textbox", { name: /search docs|搜索文档/i }).fill("")
  await page.locator("aside.file-sidebar").getByRole("button", { name: /显示废弃文档|Show deprecated/i }).click()
  await expect(page.locator("aside.file-sidebar").getByRole("button", { name: "Deprecated Doc", exact: true })).toBeVisible()
  await expect(page.locator("aside.file-sidebar").getByRole("button", { name: "Closed Bug", exact: true })).toBeVisible()
  await page.getByRole("button", { name: /Theme|主题/i }).click()
  await expect(page.locator("html")).toHaveClass(/dark/)

  await page.getByRole("button", { name: /打开问题清单|Open bug inventory/i }).click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await page.keyboard.press("Escape")

  await page.getByRole("button", { name: /Open knowledge graph drawer|展开知识图谱抽屉/i }).click()
  await expect(page.getByRole("button", { name: /Toggle knowledge graph drawer|切换知识图谱抽屉/i })).toBeVisible()
  await expect(page.getByRole("button", { name: /Close knowledge graph drawer|关闭知识图谱抽屉|折叠知识图谱抽屉/i })).toHaveCount(0)
  await page.getByRole("radio", { name: /全部|All/i }).click()
  await page.getByRole("button", { name: /代码引用|code-ref/i }).click()
  await page.getByRole("button", { name: /隐藏图例|Hide legend/i }).click()
  await expect(page.getByText(/图例|Legend/i)).toHaveCount(0)
  await page.getByRole("button", { name: /显示图例|Show legend/i }).click()
  await expect(page.getByText(/图例|Legend/i)).toBeVisible()
  await page.getByRole("button", { name: /切换知识图谱抽屉|Toggle knowledge graph drawer/i }).click()

  const primaryTarget = await page.evaluate(async () => {
    const response = await fetch("/api/model")
    const model = await response.json()
    return model.target as { path: string; name: string }
  })
  const secondaryTarget = createTargetFixture("secondary")
  try {
    await switchTarget(page, secondaryTarget.path)
    await expect(page.locator("aside.file-sidebar").getByRole("button", { name: secondaryTarget.name })).toBeVisible()
    await expect(page.locator("aside.file-sidebar").getByRole("button", { name: "Secondary Doc", exact: true })).toBeVisible()
    await expect(page.locator("[data-validation-section='all'] [data-validation-empty]")).toHaveText("0 错误，0 警告")
    await expect(page.locator("[data-state-badge='pass']")).toHaveText("通过")

    await page.locator("aside.file-sidebar").getByRole("button", { name: secondaryTarget.name }).click()
    await expect(page.getByText(/最近项目|Recent projects/i)).toBeVisible()
    await page.getByRole("button", { name: new RegExp(`${escapeRegExp(primaryTarget.name)}.*${escapeRegExp(primaryTarget.path)}`) }).click()
    await expect(page.locator("aside.file-sidebar").getByRole("button", { name: primaryTarget.name })).toBeVisible()
    await expect(page.locator("aside.file-sidebar").getByRole("button", { name: "Root", exact: true })).toBeVisible()

    const stalePath = path.join(os.tmpdir(), "axiom-preview-missing-recent")
    await page.evaluate(
      ({ current, stale }) => {
        localStorage.setItem("axmPreview:recentProjects", JSON.stringify([{}, { path: "", name: "Empty" }, { path: stale, name: "Missing Project" }, current]))
      },
      { current: primaryTarget, stale: stalePath },
    )
    await page.reload()
    await page.locator("aside.file-sidebar").getByRole("button", { name: primaryTarget.name }).click()
    await expect(page.getByText("Missing Project")).toBeVisible()
    await page.getByRole("button", { name: new RegExp(`Missing Project.*${escapeRegExp(stalePath)}`) }).click()
    await expect(page.getByText(/Project path is not a directory|\.axm directory not found/)).toBeVisible()
  } finally {
    fs.rmSync(secondaryTarget.path, { recursive: true, force: true })
  }

  expect(consoleErrors.filter((message) => !message.includes("status of 400"))).toEqual([])
})

test("header search stays usable inside the compact toolbar rhythm", async ({ page }) => {
  const primaryTarget = await currentTarget(page)
  const layoutTarget = createLayoutFixture("header")
  try {
    await switchTarget(page, layoutTarget.path)

    const search = page.locator("#searchInput")
    const searchShell = page.locator("[data-testid='search-shell']")
    await expect(search).toBeVisible()

    const header = page.locator("header")
    const headerBox = await requiredBox(header)
    const controls = [
      search,
      page.getByRole("button", { name: /Open bug inventory|打开问题清单/i }),
      page.getByRole("button", { name: /Theme|主题/i }),
      page.getByRole("button", { name: /Language|语言/i }),
    ]

    await search.fill("layout")
    await expect(search).toHaveValue("layout")
    await expect(page.getByText(layoutTarget.longDocPath).first()).toBeVisible()

    for (const control of controls) {
      const box = await requiredBox(control)
      expect(box.height, `toolbar control height should use the compact header rhythm`).toBeGreaterThanOrEqual(24)
      expect(box.height, `toolbar control height should use the compact header rhythm`).toBeLessThanOrEqual(32)
      expect(box.y, `toolbar control should stay inside the header`).toBeGreaterThanOrEqual(headerBox.y)
      expect(box.y + box.height, `toolbar control should stay inside the header`).toBeLessThanOrEqual(headerBox.y + headerBox.height)
    }

    const searchShellBox = await requiredBox(searchShell)
    const headerCenter = headerBox.x + headerBox.width / 2
    const searchCenter = searchShellBox.x + searchShellBox.width / 2
    expect(searchShellBox.width, "header search should be narrower than the old full-width middle rail").toBeLessThanOrEqual(480)
    expect(Math.abs(searchCenter - headerCenter), "header search should be centered in the topbar").toBeLessThanOrEqual(24)
    await expect(page.locator("header").getByRole("button", { name: /^(Open|打开)$/i })).toHaveCount(0)
    const sidebarOpenButton = page.locator("aside.file-sidebar").getByRole("button", { name: /^(Open|打开)$/i })
    const deprecatedToggle = page.locator("aside.file-sidebar").getByRole("button", { name: /显示废弃文档|Show deprecated/i })
    await expect(sidebarOpenButton).toBeVisible()
    await expect(deprecatedToggle).toBeVisible()
    const openButtonBox = await requiredBox(sidebarOpenButton)
    const deprecatedToggleBox = await requiredBox(deprecatedToggle)
    expect(openButtonBox.x + openButtonBox.width + 4, "sidebar action buttons should not overlap").toBeLessThanOrEqual(deprecatedToggleBox.x)
    await sidebarOpenButton.hover()
    await expect(page.getByRole("tooltip", { name: /^(Open|打开)$/i })).toBeVisible()
    await deprecatedToggle.hover()
    await expect(page.getByRole("tooltip", { name: /显示废弃文档|Show deprecated/i })).toBeVisible()

    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    expect(hasHorizontalOverflow, "search input should not force page-level horizontal overflow").toBe(false)
  } finally {
    await switchTarget(page, primaryTarget.path)
    fs.rmSync(layoutTarget.path, { recursive: true, force: true })
  }
})

test("file tree rows keep icons and long labels on a single non-overlapping line", async ({ page }) => {
  const primaryTarget = await currentTarget(page)
  const layoutTarget = createLayoutFixture("tree")
  try {
    await switchTarget(page, layoutTarget.path)

    const longTitle = page.locator("aside.file-sidebar").getByRole("button", { name: new RegExp(escapeRegExp(layoutTarget.longTitle)) })
    await expect(longTitle).toBeVisible()

    const rowMetrics = await longTitle.evaluate((row) => {
      const icon = row.querySelector("svg")
      const label = row.querySelector("span:last-child")
      if (!(icon instanceof SVGElement) || !(label instanceof HTMLElement)) {
        throw new Error("expected a tree row SVG icon and text label")
      }
      const rowBox = row.getBoundingClientRect()
      const iconBox = icon.getBoundingClientRect()
      const labelBox = label.getBoundingClientRect()
      const styles = window.getComputedStyle(label)
      return {
        rowHeight: rowBox.height,
        rowWidth: rowBox.width,
        scrollWidth: row.scrollWidth,
        clientWidth: row.clientWidth,
        iconRight: iconBox.right,
        labelLeft: labelBox.left,
        labelRight: labelBox.right,
        whiteSpace: styles.whiteSpace,
        overflow: styles.overflow,
        textOverflow: styles.textOverflow,
      }
    })

    expect(rowMetrics.whiteSpace).toBe("nowrap")
    expect(rowMetrics.overflow).toBe("hidden")
    expect(rowMetrics.textOverflow).toBe("ellipsis")
    expect(rowMetrics.iconRight, "tree icon must not overlap the file label").toBeLessThanOrEqual(rowMetrics.labelLeft)
    expect(rowMetrics.labelRight, "tree label must stay inside the row").toBeLessThanOrEqual(rowMetrics.rowWidth + 1)
    expect(rowMetrics.rowHeight, "tree row must remain single-line height").toBeLessThanOrEqual(34)
    expect(rowMetrics.scrollWidth, "tree row should truncate instead of expanding horizontally").toBeLessThanOrEqual(rowMetrics.clientWidth + 1)
  } finally {
    await switchTarget(page, primaryTarget.path)
    fs.rmSync(layoutTarget.path, { recursive: true, force: true })
  }
})

test("markdown preview scrolls independently for long documents", async ({ page }) => {
  const primaryTarget = await currentTarget(page)
  const layoutTarget = createLayoutFixture("scroll")
  try {
    await switchTarget(page, layoutTarget.path)
    await page.locator("aside.file-sidebar").getByRole("button", { name: new RegExp(escapeRegExp(layoutTarget.longTitle)) }).click()

    const article = page.locator("article").filter({ hasText: layoutTarget.longTitle })
    const viewport = article.locator("[data-radix-scroll-area-viewport]").first()
    await expect(viewport).toBeVisible()

    const before = await scrollMetrics(viewport)
    expect(before.clientHeight, "markdown viewport should be constrained so long documents can scroll inside it").toBeLessThan(before.scrollHeight - 300)

    await viewport.evaluate((element) => {
      element.scrollTop = element.scrollHeight
    })
    await expect.poll(async () => (await scrollMetrics(viewport)).scrollTop, { message: "markdown preview viewport should accept vertical scrolling" }).toBeGreaterThan(200)

    const after = await scrollMetrics(viewport)
    expect(after.pageScrollY, "scrolling markdown should not scroll the whole app shell").toBe(0)
  } finally {
    await switchTarget(page, primaryTarget.path)
    fs.rmSync(layoutTarget.path, { recursive: true, force: true })
  }
})

test("graph panel can collapse like a drawer while the main reading area remains usable", async ({ page }) => {
  const primaryTarget = await currentTarget(page)
  const layoutTarget = createLayoutFixture("drawer")
  try {
    await switchTarget(page, layoutTarget.path)

    await expect(page.getByText(/Knowledge Graph|知识图谱/i)).toBeVisible()
    const workspaceBox = await requiredBox(page.locator("main.workspace"))
    const openGraphBox = await requiredBox(page.locator("[data-testid='graph-panel']"))
    expect(openGraphBox.x, "graph drawer should start at the workspace left edge, spanning under the file tree").toBeCloseTo(workspaceBox.x, 1)
    expect(openGraphBox.width, "graph drawer should span the full workspace width").toBeGreaterThanOrEqual(workspaceBox.width - 2)

    await page.getByRole("button", { name: /Open knowledge graph drawer|展开知识图谱抽屉/i }).click()
    const expandedGraphBox = await requiredBox(page.locator("[data-testid='graph-panel']"))
    const viewportSize = page.viewportSize()
    expect(viewportSize).not.toBeNull()
    expect(expandedGraphBox.height, "expanded graph drawer should occupy the viewport below the header").toBeGreaterThanOrEqual(viewportSize!.height * 0.9)
    expect(expandedGraphBox.height, "expanded graph drawer should leave the compact app header visible").toBeLessThanOrEqual(viewportSize!.height)
    await expect(page.getByRole("button", { name: /Expand knowledge graph|Collapse knowledge graph|展开知识图谱|收起知识图谱/i })).toHaveCount(0)

    const collapseGraph = page.locator("[data-testid='graph-panel']").getByRole("button", { name: /Toggle knowledge graph drawer|切换知识图谱抽屉|Open knowledge graph drawer|展开知识图谱抽屉/i })
    await expect(collapseGraph).toBeVisible()
    await collapseGraph.click()

    await expect(page.getByRole("button", { name: /Expand graph|Open (knowledge )?graph drawer|展开图谱|打开图谱|Show graph|显示图谱|openGraphDrawer/i })).toBeVisible()
    await expect(page.getByText(layoutTarget.longTitle)).toBeVisible()

    const search = page.locator("#searchInput")
    await search.fill("topic")
    await expect(page.getByText(".axm/knowledge/topic-01.md").first()).toBeVisible()

    const graphBox = await requiredBox(page.getByText(/Knowledge Graph|知识图谱/i).locator("xpath=ancestor::section[1]"))
    expect(graphBox.height, "collapsed graph drawer should not consume the main preview height").toBeLessThanOrEqual(72)
  } finally {
    await switchTarget(page, primaryTarget.path)
    fs.rmSync(layoutTarget.path, { recursive: true, force: true })
  }
})

test("graph nodes expose stable boxes and avoid large overlaps", async ({ page }) => {
  const primaryTarget = await currentTarget(page)
  const layoutTarget = createLayoutFixture("graph")
  try {
    await switchTarget(page, layoutTarget.path)
    await page.getByRole("button", { name: /Open knowledge graph drawer|展开知识图谱抽屉/i }).click()
    await page.getByRole("radio", { name: /All|全部/i }).click()

    const graphNodes = page.locator('[data-testid="graph-node"], [data-graph-node], .react-flow__node')
    await expect.poll(async () => await graphNodes.count(), { message: "graph should expose inspectable node boxes" }).toBeGreaterThanOrEqual(8)
    await expect(page.locator(".graph-node-bar")).toHaveCount(0)

    const boxes = await graphNodes.evaluateAll((nodes) =>
      nodes
        .map((node) => node.getBoundingClientRect())
        .filter((box) => box.width > 0 && box.height > 0)
        .map((box) => ({ x: box.x, y: box.y, width: box.width, height: box.height })),
    )
    expect(boxes.length, "visible graph nodes should have non-empty bounding boxes").toBeGreaterThanOrEqual(8)
    expect(maxOverlapRatio(boxes), "graph nodes should not overlap more than 20% of either node").toBeLessThan(0.2)

    const nodeVisuals = await page.evaluate(() =>
      Array.from(document.querySelectorAll<SVGGElement>(".graph-node")).map((node) => {
        const card = node.querySelector<SVGRectElement>(".graph-node-card")
        return {
          type: node.getAttribute("data-node-type"),
          stroke: card ? getComputedStyle(card).stroke : "",
          strokeWidth: card ? getComputedStyle(card).strokeWidth : "",
        }
      }),
    )
    expect(new Set(nodeVisuals.map((node) => node.stroke)).size, "node type should be communicated with colored card outlines").toBeGreaterThanOrEqual(2)

    const overflowingText = await page.evaluate(() =>
      Array.from(document.querySelectorAll<SVGGElement>(".graph-node")).flatMap((node) => {
        return Array.from(node.querySelectorAll<HTMLElement>(".graph-node-title, .graph-node-subtitle, .graph-node-kind"))
          .filter((text) => text.scrollWidth > text.clientWidth + 1 && getComputedStyle(text).textOverflow !== "ellipsis")
          .map((text) => text.textContent ?? "")
      }),
    )
    expect(overflowingText, "graph node text should be clipped with ellipsis instead of spilling outside the card").toEqual([])

    const targetNode = page.locator(`[data-graph-node="${layoutTarget.longDocPath}"]`)
    await expect(targetNode).toBeVisible()
    const beforeClickX = await graphNodeX(targetNode)
    await targetNode.click()
    await expect(targetNode).toHaveClass(/is-selected/)
    const afterClickX = await graphNodeX(targetNode)
    expect(Math.abs(afterClickX - beforeClickX), "selecting a node should not pin it to the left edge").toBeLessThanOrEqual(24)
    const selectedVisual = await targetNode.evaluate((node) => {
      const card = node.querySelector(".graph-node-card")
      if (!(card instanceof SVGRectElement)) throw new Error("expected selected node card")
      const styles = getComputedStyle(card)
      return { strokeWidth: styles.strokeWidth, filter: styles.filter }
    })
    expect(parseFloat(selectedVisual.strokeWidth), "selected node outline should be visibly heavier").toBeGreaterThanOrEqual(1.4)
    expect(selectedVisual.filter).toContain("drop-shadow")
    await expect(page.getByRole("dialog", { name: /Graph node details|图谱节点详情/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /Open in viewer|在阅读区打开/i })).toBeVisible()
    await page.getByRole("button", { name: /Open in viewer|在阅读区打开/i }).click()
    await expect(page.getByRole("button", { name: /Open knowledge graph drawer|展开知识图谱抽屉/i })).toBeVisible()
    await expect(page.locator(".viewer-header .text-accent")).toHaveText(layoutTarget.longDocPath)
    await page.getByRole("button", { name: /Open knowledge graph drawer|展开知识图谱抽屉/i }).click()
    await page.getByRole("radio", { name: /All|全部/i }).click()

    const viewport = page.locator("[data-graph-viewport]")
    await expect(viewport).toBeVisible()
    const graphScroll = page.locator(".graph-scroll")
    const beforeWheelTransform = await viewport.getAttribute("transform")
    await graphScroll.evaluate((element) => {
      const box = element.getBoundingClientRect()
      element.dispatchEvent(new WheelEvent("wheel", {
        deltaY: -320,
        clientX: box.left + box.width / 2,
        clientY: box.top + box.height / 2,
        bubbles: true,
        cancelable: true,
      }))
    })
    await expect.poll(async () => await viewport.getAttribute("transform"), { message: "mouse wheel should zoom the graph canvas" }).not.toBe(beforeWheelTransform)

    const afterWheelTransform = await viewport.getAttribute("transform")
    const graphBox = await requiredBox(graphScroll)
    await page.mouse.move(graphBox.x + graphBox.width / 2, graphBox.y + graphBox.height / 2)
    await page.mouse.down()
    await page.mouse.move(graphBox.x + graphBox.width / 2 + 80, graphBox.y + graphBox.height / 2 + 52)
    await page.mouse.up()
    await expect.poll(async () => await viewport.getAttribute("transform"), { message: "dragging should pan the graph canvas" }).not.toBe(afterWheelTransform)
  } finally {
    await switchTarget(page, primaryTarget.path)
    fs.rmSync(layoutTarget.path, { recursive: true, force: true })
  }
})

test("header statistic pills share one consistent height", async ({ page }) => {
  await page.goto("/")

  const heights = await page.locator("header").evaluate((header) => {
    const labels = ["docs", "errors", "warnings", "文档", "错误", "警告"]
    const values: number[] = []
    const walker = document.createTreeWalker(header, NodeFilter.SHOW_TEXT)
    let node = walker.nextNode()
    while (node) {
      const label = node.textContent?.trim()
      if (label && labels.includes(label)) {
        const pill = node.parentElement?.closest("div")
        if (pill) values.push(pill.getBoundingClientRect().height)
      }
      node = walker.nextNode()
    }
    return values.slice(0, 3)
  })

  expect(heights, "docs/errors/warnings stat pills should all be present").toHaveLength(3)
  const [first, ...rest] = heights
  expect(first, "stat pill height should use the compact small-control rhythm").toBeGreaterThanOrEqual(28)
  expect(first, "stat pill height should use the compact small-control rhythm").toBeLessThanOrEqual(32)
  for (const height of rest) {
    expect(Math.abs(height - first), "stat pill heights should match").toBeLessThanOrEqual(1)
  }
})

function createTargetFixture(label: string) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `axiom-preview-e2e-${label}-`))
  write(root, "AGENTS.md", "# AGENTS.md\n\n## Knowledge Index\n\n| Task | Read |\n| --- | --- |\n| Secondary | `.axm/universal/secondary.md` |\n")
  write(root, "README.md", "# Secondary\n")
  write(root, ".axm/index.md", meta(`doc-state: current
last-reviewed: 2026-05-25
owner: e2e
entries:
  - path: universal/
    title: Universal
    when-to-read: Universal docs
  - path: progress/
    title: Progress
    when-to-read: Progress docs`)+"\n# Secondary Root\n")
  write(root, ".axm/universal/index.md", meta(`doc-state: current
last-reviewed: 2026-05-25
owner: e2e
entries:
  - path: secondary.md
    title: Secondary Doc
    when-to-read: Secondary docs`)+"\n# Universal\n")
  write(root, ".axm/universal/secondary.md", meta(`doc-state: current
last-reviewed: 2026-05-25
owner: e2e
applies-to: [universal]`)+"\n# Secondary Doc\n\nProject switching target.\n")
  write(root, ".axm/progress/index.md", meta(`doc-state: current
last-reviewed: 2026-05-25
owner: e2e
entries:
  - path: core/
    title: Core
    when-to-read: Core progress`)+"\n# Progress\n")
  write(root, ".axm/progress/core/index.md", meta(`doc-state: current
last-reviewed: 2026-05-25
owner: e2e
entries:
  - path: bugs/
    title: Bugs
    when-to-read: Bugs`)+"\n# Core\n")
  write(root, ".axm/progress/core/bugs/index.md", meta(`doc-state: current
last-reviewed: 2026-05-25
owner: e2e
entries: []`)+"\n# Bugs\n")
  return { path: root, name: path.basename(root) }
}

function createLayoutFixture(label: string) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `axiom-preview-e2e-layout-${label}-`))
  const longTitle = "Extremely Long Knowledge Document Title That Must Truncate Beside Its File Icon Without Wrapping Or Colliding"
  const longName = "extremely-long-knowledge-document-title-that-must-truncate-beside-its-file-icon-without-wrapping-or-colliding.md"
  const related = Array.from({ length: 10 }, (_, index) => `.axm/knowledge/topic-${String(index + 1).padStart(2, "0")}.md`)
  const longBody = Array.from({ length: 80 }, (_, index) => `Paragraph ${index + 1}: this long preview body exists so the markdown reader must scroll inside its own panel without moving the whole application shell.`).join("\n\n")

  write(root, "AGENTS.md", "# AGENTS.md\n\n## Knowledge Index\n\n| Task | Read |\n| --- | --- |\n| Layout | `.axm/universal/" + longName + "` |\n")
  write(root, "README.md", "# Layout Fixture\n")
  write(root, ".axm/index.md", meta(`doc-state: current
last-reviewed: 2026-05-25
owner: e2e
entries:
  - path: universal/
    title: Universal
    when-to-read: Universal docs
  - path: knowledge/
    title: Knowledge
    when-to-read: Knowledge docs`)+"\n# Layout Root\n")
  write(root, ".axm/universal/index.md", meta(`doc-state: current
last-reviewed: 2026-05-25
owner: e2e
entries:
  - path: ${longName}
    title: ${longTitle}
    when-to-read: Layout stress doc`)+"\n# Universal\n")
  write(root, `.axm/universal/${longName}`, meta(`doc-state: current
last-reviewed: 2026-05-25
owner: e2e
applies-to: [layout]
related:
${related.map((item) => `  - ${item}`).join("\n")}
code-refs:
  - src/layout.ts
  - src/graph.ts`)+`\n# ${longTitle}\n\n${longBody}\n`)
  write(root, ".axm/knowledge/index.md", meta(`doc-state: current
last-reviewed: 2026-05-25
owner: e2e
entries:
${related.map((item, index) => `  - path: topic-${String(index + 1).padStart(2, "0")}.md\n    title: Graph Topic ${index + 1}\n    when-to-read: Graph topic ${index + 1}`).join("\n")}`)+"\n# Knowledge\n")
  related.forEach((item, index) => {
    write(root, item, meta(`doc-state: current
last-reviewed: 2026-05-25
owner: e2e
applies-to: [layout]`)+`\n# Graph Topic ${index + 1}\n\nA graph fixture topic used for overlap checks.\n`)
  })
  write(root, "src/layout.ts", "export const layout = true\n")
  write(root, "src/graph.ts", "export const graph = true\n")

  return { path: root, name: path.basename(root), longTitle, longDocPath: `.axm/universal/${longName}` }
}

async function currentTarget(page: Page) {
  const response = await page.request.get("/api/model")
  expect(response.ok()).toBeTruthy()
  const model = await response.json()
  return model.target as { path: string; name: string }
}

async function switchTarget(page: Page, targetPath: string) {
  const response = await page.request.post("/api/target", { data: { path: targetPath } })
  expect(response.ok()).toBeTruthy()
  await page.goto("/")
  await expect.poll(async () => (await currentTarget(page)).path).toBe(targetPath)
}

async function requiredBox(locator: Locator) {
  const box = await locator.boundingBox()
  expect(box).not.toBeNull()
  return box!
}

async function graphNodeX(locator: Locator) {
  return locator.evaluate((node) => {
    const transform = node.getAttribute("transform") ?? ""
    const match = transform.match(/translate\(([-\d.]+)[ ,]([-\d.]+)/)
    if (!match) throw new Error(`expected translate transform, got ${transform}`)
    return Number(match[1])
  })
}

async function scrollMetrics(locator: Locator) {
  return locator.evaluate((element) => ({
    scrollTop: element.scrollTop,
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight,
    pageScrollY: window.scrollY,
  }))
}

async function metaTagTexts(page: Page, key: string) {
  return page.evaluate((metaKey) => {
    const label = Array.from(document.querySelectorAll("dt")).find((node) => node.textContent?.trim() === metaKey)
    const value = label?.nextElementSibling
    return Array.from(value?.querySelectorAll("[data-meta-tag]") ?? []).map((node) => node.textContent?.trim())
  }, key)
}

async function metaLabelTexts(page: Page) {
  return page.evaluate(() => Array.from(document.querySelectorAll("dt")).map((node) => node.textContent?.trim()))
}

async function validationSections(page: Page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll("[data-validation-section]")).map((section) => ({
      section: section.getAttribute("data-validation-section"),
      status: section.getAttribute("data-validation-status"),
      hasIcon: Boolean(section.querySelector("[data-validation-icon]")),
    })),
  )
}

function maxOverlapRatio(boxes: Array<{ x: number; y: number; width: number; height: number }>) {
  let max = 0
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const left = Math.max(boxes[i].x, boxes[j].x)
      const right = Math.min(boxes[i].x + boxes[i].width, boxes[j].x + boxes[j].width)
      const top = Math.max(boxes[i].y, boxes[j].y)
      const bottom = Math.min(boxes[i].y + boxes[i].height, boxes[j].y + boxes[j].height)
      if (right <= left || bottom <= top) continue
      const overlapArea = (right - left) * (bottom - top)
      const smallerArea = Math.min(boxes[i].width * boxes[i].height, boxes[j].width * boxes[j].height)
      max = Math.max(max, overlapArea / smallerArea)
    }
  }
  return max
}

function meta(body: string) {
  return "<!-- axm-meta\n" + body + "\n-->\n"
}

function write(root: string, rel: string, content: string) {
  const abs = path.join(root, rel)
  fs.mkdirSync(path.dirname(abs), { recursive: true })
  fs.writeFileSync(abs, content, "utf8")
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function rgbLuma(value: string) {
  const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!match) throw new Error(`expected rgb color, got ${value}`)
  const [, r, g, b] = match.map(Number)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
