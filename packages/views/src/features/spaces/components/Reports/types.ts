export type ReportBar = {
  id: string
  label: string
  tooltipTitle: string
  value: string
  heightPercent: number
  isCurrent: boolean
}

export type ReportBreakdownLine = {
  id: string
  name: string
  detail?: string
  quantity?: string
  change: string
  changePercent?: string
  value: string
  isUnavailable?: boolean
}

export type ReportRow = {
  id: string
  label: string
  safeAccounts: string
  change: string
  changePercent?: string
  total: string
  bySafeAccount: ReportBreakdownLine[]
  byAsset: ReportBreakdownLine[]
}

export type StatementLine = {
  id: string
  asset: string
  protocol?: string
  network: string
  quantity: string
  price: string
  value: string
}

export type StatementGroup = {
  id: string
  name: string
  address: string
  subtotal: string
  isUnavailable: boolean
  lines: StatementLine[]
}

export type BalanceStatement = {
  workspaceName: string
  asOf: string
  total: string
  fileName: string
  groups: StatementGroup[]
}

export type ReportsNotice = {
  title: string
  description?: string
  actionLabel?: string
}
