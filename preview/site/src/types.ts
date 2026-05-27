export interface Target {
  path: string
  name: string
}

export interface PreviewModel {
  version: number
  generatedAt: string
  target: Target
  summary: Summary
  tree: TreeNode
  documents: DocumentModel[]
  graph: GraphModel
  bugs: BugInventory
  validation: ValidationResult
}

export interface Summary {
  docs: number
  axmDocs: number
  agentsDocs: number
  errors: number
  warnings: number
  bugs: number
  status: "pass" | "warn" | "error"
  byDocState: Record<string, number>
  byWorkflowState: Record<string, number>
  lines: number
}

export interface DocumentModel {
  id: string
  path: string
  name: string
  dir: string
  kind: string
  title: string
  subtitle: string
  body: string
  raw: string
  lineCount: number
  meta: Record<string, unknown>
  hasMeta?: boolean
  metaKind: string | null
  parseError: string | null
  searchText: string
}

export interface TreeNode {
  type: "dir" | "doc"
  name: string
  path: string
  children?: TreeNode[]
  count?: number
  title?: string
  subtitle?: string
  kind?: string
  docState?: string
  workflowState?: string
  displayState?: string
}

export interface GraphModel {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface GraphNode {
  id: string
  type: string
  path: string
  label: string
  title: string
  subtitle?: string
  kind?: string
  docState?: string
  workflowState?: string
  displayState?: string
}

export interface GraphEdge {
  from: string
  to: string
  type: string
  label: string
}

export interface BugInventory {
  open: number
  openCount: number
  total: number
  byState: Record<string, number>
  items: BugItem[]
}

export interface BugItem {
  path: string
  title: string
  subtitle: string
  initiative: string
  state: string
  open: boolean
  stateUpdated: string
  priority?: string
  severity?: string
  excerpt: string
  searchText: string
}

export interface ValidationResult {
  status: "pass" | "warn" | "error"
  errors: number
  warnings: number
  issues: ValidationIssue[]
}

export interface ValidationIssue {
  level: "error" | "warn"
  file: string
  line?: number
  ruleRef: string
  rule: string
  message: string
}
