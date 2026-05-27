import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type CSSProperties } from "react"
import ReactMarkdown from "react-markdown"
import rehypeSanitize from "rehype-sanitize"
import remarkGfm from "remark-gfm"
import { useTranslation } from "react-i18next"
import {
  AlertTriangle,
  Bug,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Eye,
  EyeOff,
  FileText,
  Folder,
  Languages,
  Moon,
  Network,
  RefreshCw,
  Search,
  Sun,
} from "lucide-react"
import { fetchModel, pickTarget, switchTarget } from "./api"
import type { BugItem, DocumentModel, PreviewModel, TreeNode } from "./types"
import type { ValidationIssue } from "./types"
import i18n from "./i18n"
import { GraphPanel } from "./GraphPanel"
import { defaultEdgeToggles, type EdgeToggles, type GraphMode } from "./graphLayout"
import { Badge } from "./components/ui/badge"
import { Button } from "./components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./components/ui/dialog"
import { Input } from "./components/ui/input"
import { ScrollArea } from "./components/ui/scroll-area"
import { Separator } from "./components/ui/separator"
import { ToggleGroup, ToggleGroupItem } from "./components/ui/toggle-group"
import { Tooltip, TooltipContent } from "./components/ui/tooltip"
import { cn } from "./lib/utils"

type Translate = (key: string, options?: Record<string, unknown>) => string

const selectedPathKey = "axmPreview:selectedPath"
const recentProjectsKey = "axmPreview:recentProjects"
const graphModeKey = "axmPreview:graphMode"
const graphEdgesKey = "axmPreview:graphEdgeTypes"
const graphCollapsedKey = "axmPreview:graphCollapsed"

export function App() {
  const { t } = useTranslation()
  const [model, setModel] = useState<PreviewModel | null>(null)
  const [selectedPath, setSelectedPath] = useState<string | null>(() => localStorage.getItem(selectedPathKey))
  const [query, setQuery] = useState("")
  const [error, setError] = useState("")
  const [projectMenuOpen, setProjectMenuOpen] = useState(false)
  const [bugOpen, setBugOpen] = useState(false)
  const [bugFilter, setBugFilter] = useState<"open" | "all" | "closed">("open")
  const [bugQuery, setBugQuery] = useState("")
  const [showDeprecated, setShowDeprecated] = useState(false)
  const [graphCollapsed, setGraphCollapsed] = useState(() => localStorage.getItem(graphCollapsedKey) !== "false")
  const [graphLegendVisible, setGraphLegendVisible] = useState(true)
  const [graphMode, setGraphMode] = useState<GraphMode>(() => loadGraphMode())
  const [edgeToggles, setEdgeToggles] = useState<EdgeToggles>(() => loadEdgeToggles())
  const [theme, setTheme] = useState(() => localStorage.getItem("axmPreview:theme") || "light")
  const [recentProjects, setRecentProjects] = useState(() => loadRecentProjects())
  const [isPending, startTransition] = useTransition()
  const recentProjectsRef = useRef(recentProjects)

  const documentsByPath = useMemo(() => new Map(model?.documents.map((doc) => [doc.path, doc])), [model])
  const selectedDoc = selectedPath ? documentsByPath.get(selectedPath) : undefined
  const visibleDocs = useMemo(
    () => (model?.documents ?? []).filter((doc) => showDeprecated || displayState(doc) !== "deprecated"),
    [model, showDeprecated],
  )
  const searchResults = useMemo(() => {
    const text = query.trim().toLowerCase()
    if (!text) return []
    return visibleDocs.filter((doc) => doc.searchText.includes(text)).slice(0, 24)
  }, [query, visibleDocs])

  const bugItems = useMemo(() => filterBugs(model?.bugs.items ?? [], bugFilter, bugQuery), [model, bugFilter, bugQuery])
  const deprecatedToggleLabel = showDeprecated ? t("hideDeprecated") : t("showDeprecated")

  useEffect(() => {
    recentProjectsRef.current = recentProjects
  }, [recentProjects])

  const refresh = useCallback(
    (initial = false) => {
      startTransition(() => {
        fetchModel()
          .then((data) => {
            setModel(data)
            setRecentProjects(rememberProject(data.target))
            setError("")
            setSelectedPath((current) => {
              const visible = data.documents.filter((doc) => showDeprecated || displayState(doc) !== "deprecated")
              const next = visible.find((doc) => doc.path === current)?.path ?? visible[0]?.path ?? null
              if (next) localStorage.setItem(selectedPathKey, next)
              return next
            })
          })
          .catch((err: Error) => {
            if (initial && recentProjectsRef.current.length) {
              restoreRecentProject(err, recentProjectsRef.current[0])
              return
            }
            if (initial) setModel(null)
            setError(err.message)
          })
      })
    },
    [showDeprecated],
  )

  useEffect(() => {
    refresh(true)
  }, [refresh])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    localStorage.setItem("axmPreview:theme", theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem(graphCollapsedKey, String(graphCollapsed))
  }, [graphCollapsed])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        document.getElementById("searchInput")?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  function selectDoc(path: string) {
    setSelectedPath(path)
    localStorage.setItem(selectedPathKey, path)
  }

  async function openPicker() {
    try {
      const data = await pickTarget()
      setModel(data)
      setRecentProjects(rememberProject(data.target))
      setError("")
      const first = data.documents[0]?.path ?? null
      setSelectedPath(first)
      if (first) localStorage.setItem(selectedPathKey, first)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  function changeLanguage(next: string) {
    i18n.changeLanguage(next)
    localStorage.setItem("axmPreview:language", next)
  }

  async function restoreRecentProject(originalError: Error, candidate?: { path: string; name: string }) {
    if (!candidate) {
      setError(originalError.message)
      return
    }
    try {
      const data = await switchTarget(candidate.path)
      setModel(data)
      setRecentProjects(rememberProject(data.target))
      setError("")
      const first = data.documents[0]?.path ?? null
      setSelectedPath(first)
      if (first) localStorage.setItem(selectedPathKey, first)
    } catch (err) {
      setModel(null)
      setError(err instanceof Error ? err.message : originalError.message)
    }
  }

  return (
    <div className="app-shell noise-overlay">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark">
            <Network className="icon-16" aria-hidden="true" />
          </span>
          <div className="brand-title">{t("title")}</div>
        </div>

        <div className="search-shell" data-testid="search-shell">
          <Search className="icon-16 search-icon" aria-hidden="true" />
          <Input id="searchInput" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("search")} aria-label={t("search")} className="search-input" />
          <span className="kbd-hint">⌘K</span>
          {searchResults.length > 0 && (
            <Card className="search-menu glass-heavy">
              <ScrollArea className="max-h-80">
                <div className="flex flex-col p-1">
                  {searchResults.map((doc) => (
                    <button key={doc.path} className="menu-row" onClick={() => { selectDoc(doc.path); setQuery("") }}>
                      <div className="truncate text-sm font-medium">{doc.title}</div>
                      <div className="truncate font-mono text-[11px] text-muted-foreground">{doc.path}</div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          )}
        </div>

        <div className="topbar-actions">
          <Stat label={t("documents")} value={model?.summary.docs ?? 0} tone="primary" />
          <Stat label={t("errors")} value={model?.summary.errors ?? 0} tone="error" />
          <Stat label={t("warnings")} value={model?.summary.warnings ?? 0} tone="warn" />
          <Button variant="outline" size="sm" onClick={() => setBugOpen(true)} aria-label={t("openBugInventory")}>
            <Bug className="icon-16" aria-hidden="true" />
            <span>{model?.summary.bugs ?? 0}</span>
            <span className="stat-label">{t("bugs")}</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={t("theme")}>
            {theme === "dark" ? <Sun className="icon-16" aria-hidden="true" /> : <Moon className="icon-16" aria-hidden="true" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => changeLanguage(i18n.language === "zh" ? "en" : "zh")} aria-label={t("language")}>
            <Languages className="icon-16" aria-hidden="true" />
          </Button>
        </div>
      </header>

      {error && <div className="border-b border-border-subtle bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</div>}

      <main className={cn("workspace", graphCollapsed && "graph-is-collapsed")}>
        <aside className="file-sidebar">
          <div className="panel-header sidebar-project-header">
            <div className="project-switcher sidebar-project-switcher">
              <Folder className="icon-16 project-icon" aria-hidden="true" />
              <button className="project-trigger" onClick={() => setProjectMenuOpen((value) => !value)} aria-expanded={projectMenuOpen}>
                <span className="truncate">{model?.target.name ?? t("noProject")}</span>
                <ChevronDown className="icon-16 ml-auto" aria-hidden="true" />
              </button>
              {projectMenuOpen && (
                <Card className="project-menu glass-heavy">
                  <CardHeader className="p-3">
                    <CardTitle>{t("recentProjects")}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex max-h-72 flex-col gap-1 overflow-auto p-2 pt-0">
                    {recentProjects.length === 0 && <div className="px-3 py-4 text-sm text-muted-foreground">{t("noRecentProjects")}</div>}
                    {recentProjects.map((project) => (
                      <button
                        key={project.path}
                        className="menu-row"
                        onClick={async () => {
                          try {
                            setProjectMenuOpen(false)
                            const data = await switchTarget(project.path)
                            setModel(data)
                            setRecentProjects(rememberProject(data.target))
                            setError("")
                            const first = data.documents[0]?.path ?? null
                            setSelectedPath(first)
                            if (first) localStorage.setItem(selectedPathKey, first)
                          } catch (err) {
                            setError(err instanceof Error ? err.message : String(err))
                          }
                        }}
                      >
                        <div className="truncate text-sm font-medium">{project.name}</div>
                        <div className="truncate font-mono text-[11px] text-muted-foreground">{project.path}</div>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
            <Tooltip side="bottom">
              <Button variant="outline" size="sm" onClick={openPicker}>{t("open")}</Button>
              <TooltipContent>{t("open")}</TooltipContent>
            </Tooltip>
            <Tooltip side="bottom">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDeprecated((value) => !value)}
                aria-label={deprecatedToggleLabel}
                aria-pressed={showDeprecated}
              >
                {showDeprecated ? <Eye className="icon-16" aria-hidden="true" /> : <EyeOff className="icon-16" aria-hidden="true" />}
              </Button>
              <TooltipContent>{deprecatedToggleLabel}</TooltipContent>
            </Tooltip>
          </div>
          <ScrollArea className="min-h-0">
            <div className="tree-list">
              {model ? <TreeView node={model.tree} depth={0} selectedPath={selectedPath} onSelect={selectDoc} showDeprecated={showDeprecated} targetPath={model.target.path} /> : null}
            </div>
          </ScrollArea>
          <div className="sidebar-footer">{visibleDocs.length} {t("documents")}</div>
        </aside>

        <section className="content-shell">
          <div className="reader-shell">
            <article className="document-viewer">
              <div className="viewer-header">
                <span className="truncate font-mono text-[11px] text-accent">{selectedDoc?.path ?? t("markdownEmpty")}</span>
                <span className="ml-auto text-[11px] text-text-muted">{t("lineCount", { count: selectedDoc?.lineCount ?? 0 })}</span>
                <Button variant="ghost" size="icon" onClick={() => refresh(false)} disabled={isPending} aria-label={t("refresh")}>
                  <RefreshCw className={cn("icon-16", isPending && "animate-spin")} aria-hidden="true" />
                </Button>
              </div>
              <ScrollArea className="reader-scroll" data-testid="preview-scroll">
                <div className="markdown mx-auto max-w-4xl">
                  {selectedDoc ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                      {selectedDoc.body}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-muted-foreground">{t("markdownEmpty")}</p>
                  )}
                </div>
              </ScrollArea>
            </article>
            <Inspector doc={selectedDoc} model={model} onRefresh={() => refresh(false)} refreshing={isPending} />
          </div>

        </section>

        <GraphPanel
          model={model}
          selectedPath={selectedPath}
          mode={graphMode}
          edgeToggles={edgeToggles}
          showDeprecated={showDeprecated}
          searchQuery={query}
          collapsed={graphCollapsed}
          legendVisible={graphLegendVisible}
          onModeChange={setStoredGraphMode}
          onEdgesChange={setStoredEdges}
          onCollapsedChange={setGraphCollapsed}
          onLegendVisibleChange={setGraphLegendVisible}
          onSelectDocument={selectDoc}
        />
      </main>

      <Dialog open={bugOpen} onOpenChange={setBugOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("bugs")}</DialogTitle>
            <DialogDescription>{t("bugCounts", { open: model?.bugs.openCount ?? 0, total: model?.bugs.total ?? 0 })}</DialogDescription>
          </DialogHeader>
          <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3 p-5 pt-0">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
              <Input value={bugQuery} onChange={(event) => setBugQuery(event.target.value)} placeholder={t("search")} />
              <ToggleGroup type="single" value={bugFilter} onValueChange={(value) => value && setBugFilter(value as typeof bugFilter)}>
                <ToggleGroupItem value="open">{t("openBugs")}</ToggleGroupItem>
                <ToggleGroupItem value="all">{t("allBugs")}</ToggleGroupItem>
                <ToggleGroupItem value="closed">{t("closedBugs")}</ToggleGroupItem>
              </ToggleGroup>
            </div>
            <ScrollArea className="max-h-[520px]">
              <div className="flex flex-col gap-2">
                {bugItems.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">{t("noBugs")}</div>}
                {bugItems.map((bug) => (
                  <button key={bug.path} className="rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent/15 hover:text-accent" onClick={() => { selectDoc(bug.path); setBugOpen(false) }}>
                    <div className="flex gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold">{bug.title}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{bug.path}</div>
                        <div className="mt-2 text-sm text-muted-foreground">{bug.excerpt}</div>
                      </div>
                      <div className="flex max-w-64 flex-wrap justify-end gap-1">
                        <StateBadge state={bug.state} />
                        {bug.priority && <Badge variant="outline">{bug.priority}</Badge>}
                        {bug.severity && <Badge variant="outline">{bug.severity}</Badge>}
                        {bug.initiative && <Badge variant="secondary">{bug.initiative}</Badge>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )

  function setStoredGraphMode(value: GraphMode) {
    setGraphMode(value)
    localStorage.setItem(graphModeKey, value)
  }

  function setStoredEdges(values: string[]) {
    const next = Object.fromEntries(Object.keys(defaultEdgeToggles).map((key) => [key, values.includes(key)]))
    setEdgeToggles(next)
    localStorage.setItem(graphEdgesKey, JSON.stringify(next))
  }
}

function TreeView({ node, depth, selectedPath, onSelect, showDeprecated, targetPath }: { node: TreeNode; depth: number; selectedPath: string | null; onSelect: (path: string) => void; showDeprecated: boolean; targetPath: string }) {
  const [open, setOpen] = useState(() => !loadCollapsed(targetPath, node.path))
  const style = { "--tree-depth": depth } as CSSProperties & Record<"--tree-depth", number>
  if (node.type === "doc") {
    if (!showDeprecated && node.displayState === "deprecated") return null
    return (
      <button
        className={cn("tree-row", selectedPath === node.path && "is-active")}
        style={style}
        onClick={() => onSelect(node.path)}
      >
        <span className="tree-row-spacer" />
        <FileText className="icon-16 text-muted-foreground" aria-hidden="true" />
        <span className="truncate">{node.title || node.name}</span>
      </button>
    )
  }
  return (
    <div>
      <button
        className="tree-row font-medium"
        style={style}
        onClick={() => {
          const next = !open
          setOpen(next)
          storeCollapsed(targetPath, node.path, !next)
        }}
      >
        {open ? <ChevronDown className="icon-16" aria-hidden="true" /> : <ChevronRight className="icon-16" aria-hidden="true" />}
        <Folder className="icon-16 text-muted-foreground" aria-hidden="true" />
        <span className="truncate">{node.name}</span>
      </button>
      {open && node.children?.map((child) => <TreeView key={child.path} node={child} depth={depth + 1} selectedPath={selectedPath} onSelect={onSelect} showDeprecated={showDeprecated} targetPath={targetPath} />)}
    </div>
  )
}

function Inspector({ doc, model, onRefresh, refreshing }: { doc?: DocumentModel; model: PreviewModel | null; onRefresh: () => void; refreshing: boolean }) {
  const { t } = useTranslation()
  const currentIssues = model?.validation.issues.filter((issue) => issue.file === doc?.path) ?? []
  const allIssues = model?.validation.issues ?? []
  return (
    <aside className="min-h-0 min-w-0 overflow-hidden border-l bg-muted/20 p-3">
      <ScrollArea className="h-full">
        <div className="flex flex-col gap-3">
          <Card>
            <CardHeader>
              <CardTitle>{t("metadata")}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
                {Object.entries(doc?.meta ?? {}).map(([key, value]) => (
                  <div key={key} className="contents">
                    <dt className="text-muted-foreground">{translateMetaField(t, key)}</dt>
                    <dd className="min-w-0 break-words" data-meta-field={translateMetaField(t, key)}>{renderMetaValue(key, value, t)}</dd>
                  </div>
                ))}
                {doc && (
                  <div className="contents">
                    <dt className="text-muted-foreground">{translateMetaField(t, "kind")}</dt>
                    <dd className="min-w-0 break-words" data-meta-field={translateMetaField(t, "kind")}>{skeletonName(doc, t)}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {t("validation")}
                <span className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={onRefresh} disabled={refreshing} aria-label={t("refreshValidation")}>
                    <RefreshCw className={cn("icon-16", refreshing && "animate-spin")} aria-hidden="true" />
                  </Button>
                  <StateBadge state={model?.validation.status ?? "missing"} />
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <ValidationRow section="summary" status={model?.validation.status ?? "warn"} title={checkedLabel(model, t)} subtitle={validationCountLabel(t, model?.summary.errors ?? 0, model?.summary.warnings ?? 0)} />
              <Separator />
              <IssueSection section="current" title={t("currentDocument")} issues={currentIssues} />
              <Separator />
              <IssueSection section="all" title={t("allIssues")} issues={allIssues} />
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </aside>
  )
}

function IssueSection({ section, title, issues }: { section: string; title: string; issues: ValidationIssue[] }) {
  const { t } = useTranslation()
  const status = issuesStatus(issues)
  const Icon = validationIcon(status)
  return (
    <section className="flex flex-col gap-2" data-validation-section={section} data-validation-status={status}>
      <div className="grid grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-2 text-sm">
        <Icon className={cn("icon-16", validationIconClass(status))} data-validation-icon aria-hidden="true" />
        <span className="min-w-0 font-medium">{title}</span>
        <Badge variant={status === "error" ? "destructive" : status === "pass" ? "default" : "secondary"} className="h-5 px-1.5 text-[10px]">
          {issues.length}
        </Badge>
      </div>
      {issues.length === 0 ? (
        <div className="rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground" data-validation-empty>{validationIssueCountLabel(t, issues)}</div>
      ) : (
        issues.map((issue) => (
          <ValidationRow key={`${issue.file}-${issue.ruleRef}-${issue.message}`} status={issue.level} title={issue.message} subtitle={`${issue.file}${issue.line ? `:${issue.line}` : ""} · ${issue.ruleRef}`} />
        ))
      )}
    </section>
  )
}

function validationIssueCountLabel(t: Translate, issues: ValidationIssue[]) {
  return validationCountLabel(
    t,
    issues.filter((issue) => issue.level === "error").length,
    issues.filter((issue) => issue.level === "warn").length,
  )
}

function validationCountLabel(t: Translate, errors: number, warnings: number) {
  return t("validationCounts", { errors, warnings })
}

function checkedLabel(model: PreviewModel | null, t: Translate) {
  const axmDocs = model?.summary.axmDocs ?? 0
  const agentsDocs = model?.summary.agentsDocs ?? 0
  return t("checkedFiles", { count: axmDocs, agents: agentsDocs ? t("checkedAgents") : "" })
}

function skeletonName(doc: DocumentModel, t: Translate) {
  if (doc.kind === "agents") return "AGENTS.md"
  if (doc.kind === "index") return t("skeleton.index")
  if (doc.kind === "knowledge") return t("skeleton.knowledge")
  if (doc.kind === "progress") return t("skeleton.progress")
  if (doc.kind === "project") return t("skeleton.project")
  return doc.kind
}

function ValidationRow({ section, status, title, subtitle }: { section?: string; status: string; title: string; subtitle: string }) {
  const normalizedStatus = normalizeValidationStatus(status)
  const Icon = validationIcon(normalizedStatus)
  return (
    <div
      className="grid grid-cols-[20px_minmax(0,1fr)] gap-2 text-sm"
      data-validation-section={section}
      data-validation-status={section ? normalizedStatus : undefined}
    >
      <Icon className={cn("icon-16", validationIconClass(normalizedStatus))} data-validation-icon aria-hidden="true" />
      <div className="min-w-0">
        <div className="font-medium">{title}</div>
        <div className="break-words text-xs text-muted-foreground">{subtitle}</div>
      </div>
    </div>
  )
}

function issuesStatus(issues: ValidationIssue[]) {
  if (issues.some((issue) => issue.level === "error")) return "error"
  if (issues.some((issue) => issue.level === "warn")) return "warn"
  return "pass"
}

function normalizeValidationStatus(status: string) {
  if (status === "pass" || status === "error" || status === "warn") return status
  return "warn"
}

function validationIcon(status: string) {
  return status === "pass" ? CheckCircle2 : status === "warn" ? CircleAlert : AlertTriangle
}

function validationIconClass(status: string) {
  return status === "error" ? "text-destructive" : status === "warn" ? "text-amber-600" : "text-emerald-600"
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "primary" | "warn" | "error" }) {
  return (
    <div className="status-pill" data-stat>
      <span className={cn("status-dot", tone === "primary" && "is-primary", tone === "warn" && "is-warn", tone === "error" && "is-error")} />
      <span className="font-semibold">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}

function StateBadge({ state }: { state: string }) {
  const { t } = useTranslation()
  const variant = state === "error" || state === "blocked" || state === "reopened" ? "destructive" : state === "current" || state === "pass" || state === "fixed" || state === "verified" ? "default" : "secondary"
  return <Badge variant={variant} data-state-badge={state}>{translateMetaValue(t, "state", state)}</Badge>
}

function displayState(doc: DocumentModel) {
  return String(doc.meta["doc-state"] || "missing")
}

function filterBugs(items: BugItem[], filter: "open" | "all" | "closed", query: string) {
  const q = query.trim().toLowerCase()
  return items.filter((bug) => {
    if (filter === "open" && !bug.open) return false
    if (filter === "closed" && bug.open) return false
    if (q && !bug.searchText.includes(q)) return false
    return true
  })
}

const metaTagFields = new Set(["doc-state", "workflow-state", "state-updated", "entries", "related", "code-refs", "entities"])

function renderMetaValue(key: string, value: unknown, t: Translate) {
  if (metaTagFields.has(key)) return <MetaTagList metaKey={key} value={value} t={t} />
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === "object" && item) {
        return formatMetaObject(item, t)
      }
      return translateMetaValue(t, key, item)
    }).join(" · ")
  }
  if (typeof value === "object" && value) return formatMetaObject(value, t)
  return translateMetaValue(t, key, value)
}

function MetaTagList({ metaKey, value, t }: { metaKey: string; value: unknown; t: Translate }) {
  const values = metaTagValues(metaKey, value)
  const wraps = metaKey === "code-refs"
  if (values.length === 0) return <span className="text-muted-foreground">-</span>
  return (
    <span className="flex flex-wrap gap-1.5" data-meta-tags={metaKey}>
      {values.map((item) => (
        <Badge
          key={item}
          variant={metaTagVariant(metaKey, item)}
          className={cn("h-7 max-w-full normal-case text-[12px]", wraps && "h-auto min-h-7 whitespace-normal break-all py-1.5 text-left leading-snug")}
          data-meta-tag
          data-meta-key={metaKey}
        >
          <span className={cn("min-w-0", wraps ? "whitespace-normal break-all" : "truncate")}>{translateMetaValue(t, metaKey, item)}</span>
        </Badge>
      ))}
    </span>
  )
}

function translateMetaField(t: Translate, key: string) {
  return t(`metaFields.${key}`, { defaultValue: key })
}

const translatableMetaValueFields = new Set(["doc-state", "workflow-state", "progress-type", "depth", "severity", "state"])

function translateMetaValue(t: Translate, key: string, value: unknown) {
  const text = String(value ?? "").trim()
  if (!text || !translatableMetaValueFields.has(key)) return text
  return t(`metaValues.${text}`, { defaultValue: text })
}

function formatMetaObject(value: object, t: Translate) {
  return Object.entries(value).map(([key, child]) => `${translateMetaField(t, key)}: ${translateMetaValue(t, key, child)}`).join(", ")
}

function metaTagValues(key: string, value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap((item) => metaTagValues(key, item))
  if (typeof value === "object" && value) {
    if (key === "entries") return [formatEntryTag(value)]
    return [Object.entries(value).map(([childKey, child]) => `${childKey}: ${String(child)}`).join(", ")]
  }
  const text = String(value ?? "").trim()
  return text ? [text] : []
}

function formatEntryTag(value: object) {
  const entry = value as { path?: unknown; title?: unknown }
  const path = String(entry.path ?? "").trim()
  const title = String(entry.title ?? "").trim()
  if (path && title) return `${path} · ${title}`
  if (path) return path
  if (title) return title
  return Object.entries(value).map(([key, child]) => `${key}: ${String(child)}`).join(", ")
}

function metaTagVariant(key: string, value: string): "default" | "secondary" | "outline" | "destructive" {
  const normalized = value.toLowerCase()
  if (normalized === "blocked" || normalized === "reopened" || normalized === "missing" || normalized === "error") return "destructive"
  if (key === "doc-state" && (normalized === "current" || normalized === "accepted" || normalized === "verified")) return "default"
  if (key === "workflow-state" && (normalized === "open" || normalized === "in-progress" || normalized === "ready")) return "default"
  if (key === "related" || key === "entities") return "outline"
  return "secondary"
}

function loadGraphMode(): GraphMode {
  const value = localStorage.getItem(graphModeKey)
  return value === "focus" || value === "all" ? value : "overview"
}

function loadEdgeToggles(): EdgeToggles {
  try {
    return { ...defaultEdgeToggles, ...JSON.parse(localStorage.getItem(graphEdgesKey) || "{}") }
  } catch {
    return defaultEdgeToggles
  }
}

function loadCollapsed(targetPath: string, path: string) {
  const raw = localStorage.getItem(`axmPreview:treeCollapsed:${targetPath}`)
  if (!raw) return false
  try {
    return (JSON.parse(raw) as string[]).includes(path)
  } catch {
    return false
  }
}

function storeCollapsed(targetPath: string, path: string, collapsed: boolean) {
  const key = `axmPreview:treeCollapsed:${targetPath}`
  let values: string[] = []
  try {
    values = JSON.parse(localStorage.getItem(key) || "[]") as string[]
  } catch {
    values = []
  }
  const set = new Set(values)
  if (collapsed) set.add(path)
  else set.delete(path)
  localStorage.setItem(key, JSON.stringify(Array.from(set)))
}

function rememberProject(target?: { path: string; name: string }) {
  if (!target) return loadRecentProjects()
  try {
    const recent = loadRecentProjects()
    const next = [target, ...recent.filter((item) => item.path !== target.path)].slice(0, 8)
    localStorage.setItem(recentProjectsKey, JSON.stringify(next))
    return next
  } catch {
    localStorage.setItem(recentProjectsKey, JSON.stringify([target]))
    return [target]
  }
}

function loadRecentProjects() {
  try {
    const parsed = JSON.parse(localStorage.getItem(recentProjectsKey) || "[]") as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isRecentProject).slice(0, 8)
  } catch {
    return []
  }
}

function isRecentProject(value: unknown): value is { path: string; name: string } {
  if (!value || typeof value !== "object") return false
  const project = value as { path?: unknown; name?: unknown }
  return typeof project.path === "string" && project.path.length > 0 && typeof project.name === "string" && project.name.length > 0
}
