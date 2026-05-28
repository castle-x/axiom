import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent, type WheelEvent } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDown, ChevronUp, List, X } from "lucide-react"
import type { PreviewModel } from "./types"
import { buildVisibleGraph, defaultEdgeToggles, layoutGraph, type EdgeToggles, type GraphMode, type LayoutEdge, type LayoutNode } from "./graphLayout"
import { Button } from "./components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "./components/ui/toggle-group"
import { cn } from "./lib/utils"

export interface GraphPanelProps {
  model: PreviewModel | null
  selectedPath: string | null
  mode: GraphMode
  edgeToggles: EdgeToggles
  showDeprecated: boolean
  searchQuery?: string
  collapsed: boolean
  legendVisible: boolean
  onModeChange: (mode: GraphMode) => void
  onEdgesChange: (values: string[]) => void
  onCollapsedChange: (collapsed: boolean) => void
  onLegendVisibleChange: (visible: boolean) => void
  onSelectDocument: (path: string) => void
}

export function GraphPanel({
  model,
  selectedPath,
  mode,
  edgeToggles,
  showDeprecated,
  searchQuery = "",
  collapsed,
  legendVisible,
  onModeChange,
  onEdgesChange,
  onCollapsedChange,
  onLegendVisibleChange,
  onSelectDocument,
}: GraphPanelProps) {
  const { t } = useTranslation()
  const graph = useMemo(
    () => buildVisibleGraph(model?.graph.nodes ?? [], model?.graph.edges ?? [], selectedPath, mode, edgeToggles, showDeprecated, searchQuery),
    [model, selectedPath, mode, edgeToggles, showDeprecated, searchQuery],
  )
  const layout = useMemo(() => layoutGraph(graph, null), [graph])
  const documents = useMemo(() => new Set(model?.documents.map((doc) => doc.path) ?? []), [model])
  const activeEdges = Object.keys(defaultEdgeToggles).filter((key) => edgeToggles[key])
  const graphSignature = useMemo(() => `${graph.nodes.map((node) => node.id).join("\u0000")}\u0001${graph.links.length}`, [graph])
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 })
  const [previewNodeId, setPreviewNodeId] = useState<string | null>(null)
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(null)
  const [panning, setPanning] = useState(false)
  const previewNode = useMemo(() => layout.nodes.find((node) => node.id === previewNodeId) ?? null, [layout.nodes, previewNodeId])

  useEffect(() => {
    setViewport({ x: 0, y: 0, scale: 1 })
    dragRef.current = null
    setPanning(false)
  }, [graphSignature])

  useEffect(() => {
    if (previewNodeId && !previewNode) setPreviewNodeId(null)
  }, [previewNode, previewNodeId])

  useEffect(() => {
    if (collapsed) setPreviewNodeId(null)
  }, [collapsed])

  const handleWheel = useCallback((event: WheelEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const pointerX = event.clientX - box.left
    const pointerY = event.clientY - box.top
    setViewport((current) => {
      const nextScale = clamp(current.scale * Math.exp(-event.deltaY * 0.0015), 0.38, 2.6)
      const ratio = nextScale / current.scale
      return {
        scale: nextScale,
        x: pointerX - (pointerX - current.x) * ratio,
        y: pointerY - (pointerY - current.y) * ratio,
      }
    })
  }, [])

  const handlePointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as Element).closest(".graph-node")) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: viewport.x,
      originY: viewport.y,
    }
    setPanning(true)
  }, [viewport.x, viewport.y])

  const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    setViewport((current) => ({
      ...current,
      x: drag.originX + event.clientX - drag.startX,
      y: drag.originY + event.clientY - drag.startY,
    }))
  }, [])

  const finishPan = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    dragRef.current = null
    setPanning(false)
  }, [])

  return (
    <section
      className={cn("graph-panel", !collapsed && "is-expanded", collapsed && "is-collapsed")}
      data-testid="graph-panel"
      aria-label={t("graph")}
    >
      <div className="graph-toolbar">
        <button
          className="graph-title"
          type="button"
          onClick={() => onCollapsedChange(!collapsed)}
          aria-label={collapsed ? tx(t, "openGraphDrawer", "Open graph drawer") : tx(t, "toggleGraphDrawer", "Toggle graph drawer")}
          aria-expanded={!collapsed}
        >
          {collapsed ? <ChevronUp className="icon-16" /> : <ChevronDown className="icon-16" />}
          <span>{t("graph")}</span>
          <span className="graph-counts">
            {t("graphCounts", {
              visibleNodes: graph.nodes.length,
              totalNodes: model?.graph.nodes.length ?? 0,
              visibleEdges: graph.links.length,
              totalEdges: model?.graph.edges.length ?? 0,
            })}
          </span>
        </button>

        {!collapsed && (
          <div className="graph-actions">
            <ToggleGroup type="single" value={mode} onValueChange={(value) => value && onModeChange(value as GraphMode)}>
              <ToggleGroupItem value="overview">{t("overview")}</ToggleGroupItem>
              <ToggleGroupItem value="focus">{t("focus")}</ToggleGroupItem>
              <ToggleGroupItem value="all">{t("all")}</ToggleGroupItem>
            </ToggleGroup>
            <ToggleGroup type="multiple" value={activeEdges} onValueChange={onEdgesChange} className="graph-edge-toggle">
              {Object.keys(defaultEdgeToggles).map((key) => (
                <ToggleGroupItem key={key} value={key}>
                  {edgeLabel(t, key)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <Button variant="ghost" size="icon" onClick={() => onLegendVisibleChange(!legendVisible)} aria-label={legendVisible ? t("hideLegend") : t("showLegend")} aria-pressed={legendVisible}>
              <List className="icon-16" />
            </Button>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className={cn("graph-body", legendVisible && "has-legend")}>
          {layout.nodes.length === 0 ? (
            <div className="graph-empty">{tx(t, "graphEmpty", "No graph nodes match the current filters.")}</div>
          ) : (
            <div
              className={cn("graph-scroll", panning && "is-panning")}
              onWheel={handleWheel}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={finishPan}
              onPointerCancel={finishPan}
            >
              <svg className="graph-svg" width={layout.width} height={layout.height} viewBox={layout.viewBox} role="img" aria-label={t("graph")}>
                <defs>
                  <marker id="graph-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" className="graph-arrow" />
                  </marker>
                </defs>
                <g data-graph-viewport transform={`translate(${round(viewport.x)} ${round(viewport.y)}) scale(${round(viewport.scale)})`}>
                  <g className="graph-edges">
                    {layout.edges.map((edge) => (
                      <GraphEdgePath key={`${edge.from}-${edge.to}-${edge.type}`} edge={edge} />
                    ))}
                  </g>
                  <g className="graph-nodes">
                    {layout.nodes.map((node) => (
                      <GraphNodeCard
                        key={node.id}
                        node={node}
                        selected={node.id === selectedPath || node.id === previewNodeId}
                        onClick={() => setPreviewNodeId(node.id)}
                      />
                    ))}
                  </g>
                </g>
              </svg>
            </div>
          )}
          {previewNode && (
            <GraphNodeDetails
              node={previewNode}
              canOpen={documents.has(previewNode.id)}
              onClose={() => setPreviewNodeId(null)}
              onOpen={() => {
                if (!documents.has(previewNode.id)) return
                onSelectDocument(previewNode.id)
                onCollapsedChange(true)
                setPreviewNodeId(null)
              }}
            />
          )}
          {legendVisible && <GraphLegend />}
        </div>
      )}
    </section>
  )
}

function GraphNodeCard({ node, selected, onClick }: { node: LayoutNode; selected: boolean; onClick: () => void }) {
  const title = node.title || node.label
  const subtitle = node.subtitle || node.path
  const kind = truncate(node.kind || node.type, 12)
  return (
    <g
      className={cn("graph-node", selected && "is-selected", "is-clickable", node.displayState === "missing" && "is-missing")}
      data-graph-node={node.id}
      data-node-type={nodeKind(node)}
      transform={`translate(${node.x} ${node.y})`}
      tabIndex={0}
      role="button"
      aria-label={node.title || node.label}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onClick()
        }
      }}
    >
      <rect className="graph-node-card" width={node.width} height={node.height} rx="8" />
      <foreignObject className="graph-node-content" x="14" y="8" width={node.width - 28} height={node.height - 16}>
        <div className="graph-node-html">
          <div className="graph-node-meta">
            <span className="graph-node-type">{nodeLabel(node)}</span>
            <span className="graph-node-kind">{kind}</span>
          </div>
          <div className="graph-node-title" title={title}>{title}</div>
          <div className="graph-node-subtitle" title={subtitle}>{subtitle}</div>
        </div>
      </foreignObject>
    </g>
  )
}

function GraphNodeDetails({ node, canOpen, onClose, onOpen }: { node: LayoutNode; canOpen: boolean; onClose: () => void; onOpen: () => void }) {
  const { t } = useTranslation()
  const title = node.title || node.label
  const subtitle = node.subtitle || node.path
  const details = [
    [t("path"), node.path || node.id],
    [tx(t, "graphNodeType", "Type"), node.kind || node.type],
    [tx(t, "metaFields.doc-state", "doc-state"), node.docState],
    [tx(t, "metaFields.workflow-state", "workflow-state"), node.workflowState],
  ].filter(([, value]) => Boolean(value))

  return (
    <aside className="graph-node-popover glass" role="dialog" aria-label={tx(t, "graphNodeDetails", "Graph node details")}>
      <div className="graph-node-popover-header">
        <div className="min-w-0">
          <div className="graph-node-popover-kicker">{nodeLabel(node)}</div>
          <h3>{title}</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label={tx(t, "close", "Close")}>
          <X className="icon-16" aria-hidden="true" />
        </Button>
      </div>
      {subtitle && <p className="graph-node-popover-subtitle">{subtitle}</p>}
      <dl className="graph-node-detail-list">
        {details.map(([label, value]) => (
          <div key={label} className="graph-node-detail-row">
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="graph-node-popover-actions">
        <Button variant="outline" size="sm" onClick={onOpen} disabled={!canOpen}>
          {t("openInViewer")}
        </Button>
        {!canOpen && <span>{tx(t, "graphNodeUnavailable", "This node is not a document file.")}</span>}
      </div>
    </aside>
  )
}

function GraphEdgePath({ edge }: { edge: LayoutEdge }) {
  const startX = edge.sourceNode.x + edge.sourceNode.width / 2
  const startY = edge.sourceNode.y + edge.sourceNode.height
  const endX = edge.targetNode.x + edge.targetNode.width / 2
  const endY = edge.targetNode.y
  const midY = startY + Math.max(28, (endY - startY) / 2)
  const path = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY - 4}`
  return <path className="graph-edge" data-edge-type={edge.type} d={path} markerEnd="url(#graph-arrow)" />
}

function GraphLegend() {
  const { t } = useTranslation()
  return (
    <div className="graph-legend glass" data-testid="graph-legend">
      <div className="graph-legend-title">{t("legend")}</div>
      <LegendRow swatch="file" label="file" description={tx(t, "legendFile", "Code or file reference")} />
      <LegendRow swatch="document" label="document" description={tx(t, "legendDocument", "Knowledge document")} />
      <LegendRow swatch="module" label="index" description={tx(t, "legendIndex", "Index or entry document")} />
      <LegendRow swatch="missing" label="missing" description={t("legendMissing")} />
    </div>
  )
}

function LegendRow({ swatch, label, description }: { swatch: string; label: string; description: string }) {
  return (
    <div className="graph-legend-row">
      <span className="graph-legend-dot" data-swatch={swatch} />
      <div className="min-w-0">
        <div className="graph-legend-label">{label}</div>
        <div className="graph-legend-description">{description}</div>
      </div>
    </div>
  )
}

function edgeLabel(t: (key: string) => string, key: string) {
  if (key === "entries") return t("edgeEntries")
  if (key === "related") return t("edgeRelated")
  if (key === "code-ref") return t("edgeCodeRef")
  if (key === "applies-to") return t("edgeAppliesTo")
  return key
}

function nodeKind(node: LayoutNode) {
  if (node.displayState === "missing" || node.displayState === "unknown") return "missing"
  if (node.kind === "index") return "module"
  if (node.type === "code") return "file"
  if (node.type === "scope" || node.kind === "knowledge") return "document"
  return "file"
}

function nodeLabel(node: LayoutNode) {
  const kind = nodeKind(node)
  return kind === "module" ? "index" : kind
}

function truncate(value: string, max: number) {
  if (value.length <= max) return value
  return `${value.slice(0, Math.max(0, max - 1))}…`
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function round(value: number) {
  return Math.round(value * 1000) / 1000
}

function tx(t: (key: string) => string, key: string, fallback: string) {
  const value = t(key)
  return value === key ? fallback : value
}
