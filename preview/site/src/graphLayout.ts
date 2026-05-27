import type { GraphEdge, GraphModel, GraphNode } from "./types"

export type GraphLayoutVariant = "auto" | "layered" | "radial" | "columns"
export type GraphMode = "overview" | "focus" | "all"
export type EdgeToggles = Record<string, boolean>

export interface GraphLink extends GraphEdge {
  source: string
  target: string
}

export interface VisibleGraph {
  nodes: GraphNode[]
  links: GraphLink[]
}

export interface GraphLayoutOptions {
  variant?: GraphLayoutVariant
  selectedNodeId?: string | null
  nodeWidth?: number
  nodeHeight?: number
  columnGap?: number
  rowGap?: number
  padding?: number
}

export interface GraphLayoutPoint {
  x: number
  y: number
}

export interface LayoutGraphNode {
  id: string
  node: GraphNode
  x: number
  y: number
  width: number
  height: number
  layer: number
  order: number
}

export interface LayoutNode extends GraphNode {
  x: number
  y: number
  width: number
  height: number
  depth: number
}

export interface LayoutGraphEdge {
  id: string
  edge: GraphEdge
  from: string
  to: string
  points: GraphLayoutPoint[]
  labelPoint: GraphLayoutPoint
}

export interface LayoutEdge extends GraphLink {
  sourceNode: LayoutNode
  targetNode: LayoutNode
}

export interface GraphLayoutResult {
  nodes: LayoutGraphNode[]
  edges: LayoutGraphEdge[]
  width: number
  height: number
  viewBox: string
  variant: Exclude<GraphLayoutVariant, "auto">
}

export interface GraphLayout {
  nodes: LayoutNode[]
  edges: LayoutEdge[]
  width: number
  height: number
  viewBox: string
  variant: Exclude<GraphLayoutVariant, "auto">
}

interface LayoutMetrics {
  nodeWidth: number
  nodeHeight: number
  columnGap: number
  rowGap: number
  padding: number
}

export const defaultEdgeToggles: EdgeToggles = {
  entries: true,
  related: true,
  "code-ref": false,
  "applies-to": false,
}

const defaultMetrics: LayoutMetrics = {
  nodeWidth: 220,
  nodeHeight: 74,
  columnGap: 112,
  rowGap: 44,
  padding: 40,
}

export function buildVisibleGraph(
  nodes: GraphNode[],
  edges: GraphEdge[],
  selectedPath: string | null,
  mode: GraphMode,
  edgeToggles: EdgeToggles,
  showDeprecated: boolean,
  searchQuery = "",
): VisibleGraph {
  const visibleIds = new Set<string>()
  const filteredEdges = edges.filter((edge) => edgeToggles[edge.type] !== false)

  if (mode === "all") {
    nodes.forEach((node) => visibleIds.add(node.id))
  } else if (mode === "focus" && selectedPath) {
    visibleIds.add(selectedPath)
    filteredEdges.forEach((edge) => {
      if (edge.from === selectedPath) visibleIds.add(edge.to)
      if (edge.to === selectedPath) visibleIds.add(edge.from)
    })
  } else {
    nodes.forEach((node) => {
      if (node.type === "root" || node.kind === "index" || node.path.split("/").length <= 3) visibleIds.add(node.id)
    })
    filteredEdges.forEach((edge) => {
      if (visibleIds.has(edge.from)) visibleIds.add(edge.to)
    })
  }

  const query = searchQuery.trim().toLowerCase()
  if (query) {
    const matches = new Set<string>()
    nodes.forEach((node) => {
      if (visibleIds.has(node.id) && graphNodeSearchText(node).includes(query)) matches.add(node.id)
    })
    filteredEdges.forEach((edge) => {
      if (matches.has(edge.from)) matches.add(edge.to)
      if (matches.has(edge.to)) matches.add(edge.from)
    })
    visibleIds.clear()
    matches.forEach((id) => visibleIds.add(id))
    if (selectedPath) visibleIds.add(selectedPath)
  }

  const visibleNodes = nodes.filter((node) => visibleIds.has(node.id) && (showDeprecated || node.displayState !== "deprecated"))
  const ids = new Set(visibleNodes.map((node) => node.id))
  return {
    nodes: visibleNodes,
    links: filteredEdges
      .filter((edge) => ids.has(edge.from) && ids.has(edge.to))
      .map((edge) => ({ ...edge, source: edge.from, target: edge.to })),
  }
}

export function layoutGraph(model: GraphModel, options?: GraphLayoutOptions): GraphLayout
export function layoutGraph(model: VisibleGraph, selectedPath?: string | null): GraphLayout
export function layoutGraph(model: GraphModel | VisibleGraph, optionsOrSelectedPath: GraphLayoutOptions | string | null = {}): GraphLayout {
  const options = typeof optionsOrSelectedPath === "string" || optionsOrSelectedPath === null
    ? { selectedNodeId: optionsOrSelectedPath, variant: "layered" as const }
    : optionsOrSelectedPath
  const graph = normalizeGraph(toGraphModel(model))
  const variant = resolveVariant(graph, options)
  const result = variant === "radial"
    ? layoutRadialGraph(graph, options)
    : variant === "columns"
      ? layoutColumnGraph(graph, options)
      : layoutLayeredGraph(graph, options)
  return toLegacyLayout(result)
}

export function layoutLayeredGraph(model: GraphModel, options: GraphLayoutOptions = {}): GraphLayoutResult {
  const graph = normalizeGraph(model)
  const metrics = layoutMetrics(options)
  const nodeIds = new Set(graph.nodes.map((node) => node.id))
  const incoming = new Map(graph.nodes.map((node) => [node.id, 0]))
  const outgoing = new Map(graph.nodes.map((node) => [node.id, [] as string[]]))

  graph.edges.forEach((edge) => {
    incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1)
    outgoing.get(edge.from)?.push(edge.to)
  })
  outgoing.forEach((ids) => ids.sort(compareIds))

  const selectedNodeId = options.selectedNodeId && nodeIds.has(options.selectedNodeId) ? options.selectedNodeId : null
  const roots = stableNodes(graph.nodes)
    .filter((node) => node.type === "root" || (incoming.get(node.id) ?? 0) === 0)
    .map((node) => node.id)
  const queue = [...new Set([selectedNodeId, ...roots].filter(Boolean) as string[])]
  const depth = new Map<string, number>()
  queue.forEach((id) => depth.set(id, 0))

  for (let index = 0; index < queue.length; index += 1) {
    const id = queue[index]
    const nextDepth = (depth.get(id) ?? 0) + 1
    outgoing.get(id)?.forEach((next) => {
      if (!depth.has(next) || nextDepth < (depth.get(next) ?? Number.MAX_SAFE_INTEGER)) {
        depth.set(next, nextDepth)
        queue.push(next)
      }
    })
  }

  graph.nodes.forEach((node) => {
    if (!depth.has(node.id)) depth.set(node.id, fallbackLayer(node))
  })

  return buildColumnarLayout(graph, groupByLayer(graph.nodes, (node) => depth.get(node.id) ?? 0), metrics, "layered")
}

export function layoutColumnGraph(model: GraphModel, options: GraphLayoutOptions = {}): GraphLayoutResult {
  const graph = normalizeGraph(model)
  const metrics = layoutMetrics(options)
  const columnOrder = ["root", "index", "project", "knowledge", "progress", "agents", "code", "other"]
  const columns = groupByLayer(graph.nodes, (node) => {
    const index = columnOrder.indexOf(columnKey(node))
    return index === -1 ? columnOrder.length - 1 : index
  })
  return buildColumnarLayout(graph, columns, metrics, "columns")
}

export function layoutRadialGraph(model: GraphModel, options: GraphLayoutOptions = {}): GraphLayoutResult {
  const graph = normalizeGraph(model)
  const metrics = layoutMetrics(options)
  const nodeIds = new Set(graph.nodes.map((node) => node.id))
  const centerId = options.selectedNodeId && nodeIds.has(options.selectedNodeId) ? options.selectedNodeId : highestDegreeNode(graph)
  const rings = buildRings(graph, centerId)
  const largestRing = Math.max(1, ...Array.from(rings.values()).map((ids) => ids.length))
  const radiusStep = Math.max(176, Math.ceil((largestRing * metrics.nodeWidth) / (Math.PI * 2)) + 104)
  const maxRing = Math.max(0, ...Array.from(rings.keys()))
  const center = metrics.padding + maxRing * radiusStep + metrics.nodeWidth
  const layoutNodes: LayoutGraphNode[] = []

  Array.from(rings.entries())
    .sort(([a], [b]) => a - b)
    .forEach(([ring, ids]) => {
      const sortedIds = ids.sort(compareIds)
      if (ring === 0) {
        sortedIds.forEach((id, order) => {
          const node = graph.nodes.find((item) => item.id === id)
          if (node) layoutNodes.push(positionedNode(node, center, center, 0, order, metrics))
        })
        return
      }

      const radius = ring * radiusStep
      const angleStep = (Math.PI * 2) / sortedIds.length
      sortedIds.forEach((id, order) => {
        const node = graph.nodes.find((item) => item.id === id)
        if (!node) return
        const angle = -Math.PI / 2 + order * angleStep
        layoutNodes.push(positionedNode(node, center + Math.cos(angle) * radius, center + Math.sin(angle) * radius, ring, order, metrics))
      })
    })

  return completeLayout(graph, layoutNodes, "radial", metrics)
}

export function truncateGraphText(value: string, maxLength: number): string {
  const text = value.trim()
  if (text.length <= maxLength) return text
  if (maxLength <= 1) return "…"
  return `${text.slice(0, maxLength - 1).trimEnd()}…`
}

function toGraphModel(model: GraphModel | VisibleGraph): GraphModel {
  if ("links" in model) {
    return {
      nodes: model.nodes,
      edges: model.links.map(({ source, target, ...edge }) => edge),
    }
  }
  return model
}

function toLegacyLayout(result: GraphLayoutResult): GraphLayout {
  const nodes = result.nodes.map((layoutNode): LayoutNode => ({
    ...layoutNode.node,
    x: layoutNode.x,
    y: layoutNode.y,
    width: layoutNode.width,
    height: layoutNode.height,
    depth: layoutNode.layer,
  }))
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const edges = result.edges
    .map((layoutEdge): LayoutEdge | null => {
      const sourceNode = byId.get(layoutEdge.from)
      const targetNode = byId.get(layoutEdge.to)
      if (!sourceNode || !targetNode) return null
      return {
        ...layoutEdge.edge,
        source: layoutEdge.from,
        target: layoutEdge.to,
        sourceNode,
        targetNode,
      }
    })
    .filter(isLayoutEdge)
  return {
    nodes,
    edges,
    width: result.width,
    height: result.height,
    viewBox: result.viewBox,
    variant: result.variant,
  }
}

function normalizeGraph(model: GraphModel): GraphModel {
  const seen = new Set<string>()
  const nodes = stableNodes(model.nodes).filter((node) => {
    if (!node.id || seen.has(node.id)) return false
    seen.add(node.id)
    return true
  })
  const nodeIds = new Set(nodes.map((node) => node.id))
  const edges = [...model.edges]
    .filter((edge) => nodeIds.has(edge.from) && nodeIds.has(edge.to) && edge.from !== edge.to)
    .sort(compareEdges)
  return { nodes, edges }
}

function layoutMetrics(options: GraphLayoutOptions): LayoutMetrics {
  return {
    nodeWidth: options.nodeWidth ?? defaultMetrics.nodeWidth,
    nodeHeight: options.nodeHeight ?? defaultMetrics.nodeHeight,
    columnGap: options.columnGap ?? defaultMetrics.columnGap,
    rowGap: options.rowGap ?? defaultMetrics.rowGap,
    padding: options.padding ?? defaultMetrics.padding,
  }
}

function resolveVariant(model: GraphModel, options: GraphLayoutOptions): Exclude<GraphLayoutVariant, "auto"> {
  if (options.variant && options.variant !== "auto") return options.variant
  if (options.selectedNodeId && model.nodes.length <= 32) return "radial"
  if (model.nodes.length > 34) return "columns"
  return "layered"
}

function stableNodes(nodes: GraphNode[]) {
  return [...nodes].sort(compareNodes)
}

function compareNodes(a: GraphNode, b: GraphNode) {
  return compareText(nodeSortKey(a), nodeSortKey(b))
}

function compareEdges(a: GraphEdge, b: GraphEdge) {
  return compareText(`${a.from}\u0000${a.to}\u0000${a.type}\u0000${a.label}`, `${b.from}\u0000${b.to}\u0000${b.type}\u0000${b.label}`)
}

function compareIds(a: string, b: string) {
  return compareText(a, b)
}

function compareText(a: string, b: string) {
  return a.localeCompare(b, "en", { numeric: true, sensitivity: "base" })
}

function nodeSortKey(node: GraphNode) {
  return `${fallbackLayer(node)}\u0000${node.kind ?? ""}\u0000${node.type}\u0000${node.path}\u0000${node.title || node.label}\u0000${node.id}`
}

function graphNodeSearchText(node: GraphNode) {
  return [node.id, node.path, node.label, node.title, node.subtitle, node.kind, node.type, node.displayState]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}

function isLayoutEdge(edge: LayoutEdge | null): edge is LayoutEdge {
  return edge !== null
}

function fallbackLayer(node: GraphNode) {
  if (node.type === "root") return 0
  if (node.kind === "index") return 1
  if (node.kind === "project" || node.kind === "knowledge") return 2
  if (node.kind === "progress") return 3
  if (node.kind === "agents") return 4
  if (node.type === "code") return 5
  return 3
}

function columnKey(node: GraphNode) {
  if (node.type === "root") return "root"
  if (node.kind === "index") return "index"
  if (node.kind === "project") return "project"
  if (node.kind === "knowledge") return "knowledge"
  if (node.kind === "progress") return "progress"
  if (node.kind === "agents") return "agents"
  if (node.type === "code") return "code"
  return "other"
}

function groupByLayer(nodes: GraphNode[], layerForNode: (node: GraphNode) => number) {
  const columns = new Map<number, GraphNode[]>()
  stableNodes(nodes).forEach((node) => {
    const layer = Math.max(0, layerForNode(node))
    const column = columns.get(layer) ?? []
    column.push(node)
    columns.set(layer, column)
  })
  return columns
}

function buildColumnarLayout(
  graph: GraphModel,
  columns: Map<number, GraphNode[]>,
  metrics: LayoutMetrics,
  variant: Exclude<GraphLayoutVariant, "auto">,
) {
  const orderedColumns = Array.from(columns.entries()).sort(([a], [b]) => a - b)
  const layoutNodes: LayoutGraphNode[] = []

  orderedColumns.forEach(([layer, nodes], columnIndex) => {
    nodes.forEach((node, order) => {
      const x = metrics.padding + columnIndex * (metrics.nodeWidth + metrics.columnGap) + metrics.nodeWidth / 2
      const y = metrics.padding + order * (metrics.nodeHeight + metrics.rowGap) + metrics.nodeHeight / 2
      layoutNodes.push(positionedNode(node, x, y, layer, order, metrics))
    })
  })

  return completeLayout(graph, layoutNodes, variant, metrics)
}

function buildRings(graph: GraphModel, centerId: string) {
  const neighbors = new Map(graph.nodes.map((node) => [node.id, [] as string[]]))
  graph.edges.forEach((edge) => {
    neighbors.get(edge.from)?.push(edge.to)
    neighbors.get(edge.to)?.push(edge.from)
  })
  neighbors.forEach((ids) => ids.sort(compareIds))

  const rings = new Map<number, string[]>()
  const visited = new Set<string>([centerId])
  let frontier = [centerId]
  rings.set(0, [centerId])

  for (let ring = 1; frontier.length > 0; ring += 1) {
    const next = new Set<string>()
    frontier.forEach((id) => {
      neighbors.get(id)?.forEach((neighbor) => {
        if (!visited.has(neighbor)) next.add(neighbor)
      })
    })
    if (next.size === 0) break
    const ids = Array.from(next).sort(compareIds)
    ids.forEach((id) => visited.add(id))
    rings.set(ring, ids)
    frontier = ids
  }

  const disconnected = graph.nodes.filter((node) => !visited.has(node.id)).map((node) => node.id)
  if (disconnected.length) rings.set(Math.max(1, ...rings.keys()) + 1, disconnected.sort(compareIds))
  return rings
}

function highestDegreeNode(graph: GraphModel) {
  const degree = new Map(graph.nodes.map((node) => [node.id, 0]))
  graph.edges.forEach((edge) => {
    degree.set(edge.from, (degree.get(edge.from) ?? 0) + 1)
    degree.set(edge.to, (degree.get(edge.to) ?? 0) + 1)
  })
  return stableNodes(graph.nodes).sort((a, b) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0) || compareNodes(a, b))[0]?.id ?? ""
}

function positionedNode(node: GraphNode, centerX: number, centerY: number, layer: number, order: number, metrics: LayoutMetrics): LayoutGraphNode {
  return {
    id: node.id,
    node,
    x: Math.round(centerX - metrics.nodeWidth / 2),
    y: Math.round(centerY - metrics.nodeHeight / 2),
    width: metrics.nodeWidth,
    height: metrics.nodeHeight,
    layer,
    order,
  }
}

function completeLayout(graph: GraphModel, nodes: LayoutGraphNode[], variant: Exclude<GraphLayoutVariant, "auto">, metrics: LayoutMetrics): GraphLayoutResult {
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const edges = graph.edges
    .filter((edge) => byId.has(edge.from) && byId.has(edge.to))
    .map((edge, index) => routeEdge(edge, byId, index, variant))
  const bounds = layoutBounds(nodes, metrics)
  return {
    nodes,
    edges,
    width: bounds.width,
    height: bounds.height,
    viewBox: `0 0 ${bounds.width} ${bounds.height}`,
    variant,
  }
}

function layoutBounds(nodes: LayoutGraphNode[], metrics: LayoutMetrics) {
  const maxX = Math.max(metrics.nodeWidth + metrics.padding, ...nodes.map((node) => node.x + node.width))
  const maxY = Math.max(metrics.nodeHeight + metrics.padding, ...nodes.map((node) => node.y + node.height))
  return {
    width: Math.ceil(maxX + metrics.padding),
    height: Math.ceil(maxY + metrics.padding),
  }
}

function routeEdge(edge: GraphEdge, byId: Map<string, LayoutGraphNode>, index: number, variant: Exclude<GraphLayoutVariant, "auto">): LayoutGraphEdge {
  const source = byId.get(edge.from)
  const target = byId.get(edge.to)
  if (!source || !target) {
    return { id: edgeId(edge, index), edge, from: edge.from, to: edge.to, points: [], labelPoint: { x: 0, y: 0 } }
  }

  const sourceCenter = centerOf(source)
  const targetCenter = centerOf(target)
  const lane = (index % 5) * 10
  let points: GraphLayoutPoint[]

  if (variant === "radial") {
    points = [
      edgeAnchor(source, sourceCenter, targetCenter),
      edgeAnchor(target, targetCenter, sourceCenter),
    ]
  } else if (Math.abs(sourceCenter.x - targetCenter.x) > Math.abs(sourceCenter.y - targetCenter.y)) {
    const start = sourceCenter.x < targetCenter.x ? { x: source.x + source.width, y: sourceCenter.y } : { x: source.x, y: sourceCenter.y }
    const end = sourceCenter.x < targetCenter.x ? { x: target.x, y: targetCenter.y } : { x: target.x + target.width, y: targetCenter.y }
    const midX = Math.round((start.x + end.x) / 2) + lane
    points = [start, { x: midX, y: start.y }, { x: midX, y: end.y }, end]
  } else {
    const start = sourceCenter.y < targetCenter.y ? { x: sourceCenter.x, y: source.y + source.height } : { x: sourceCenter.x, y: source.y }
    const end = sourceCenter.y < targetCenter.y ? { x: targetCenter.x, y: target.y } : { x: targetCenter.x, y: target.y + target.height }
    const midY = Math.round((start.y + end.y) / 2) + lane
    points = [start, { x: start.x, y: midY }, { x: end.x, y: midY }, end]
  }

  return {
    id: edgeId(edge, index),
    edge,
    from: edge.from,
    to: edge.to,
    points,
    labelPoint: midpoint(points),
  }
}

function centerOf(node: LayoutGraphNode) {
  return { x: node.x + node.width / 2, y: node.y + node.height / 2 }
}

function edgeAnchor(node: LayoutGraphNode, from: GraphLayoutPoint, to: GraphLayoutPoint) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  if (Math.abs(dx) > Math.abs(dy)) return { x: dx >= 0 ? node.x + node.width : node.x, y: from.y }
  return { x: from.x, y: dy >= 0 ? node.y + node.height : node.y }
}

function midpoint(points: GraphLayoutPoint[]) {
  if (points.length === 0) return { x: 0, y: 0 }
  const middle = points[Math.floor(points.length / 2)]
  const before = points[Math.max(0, Math.floor(points.length / 2) - 1)]
  return {
    x: Math.round((before.x + middle.x) / 2),
    y: Math.round((before.y + middle.y) / 2),
  }
}

function edgeId(edge: GraphEdge, index: number) {
  return `${edge.from}->${edge.to}:${edge.type}:${edge.label}:${index}`
}
