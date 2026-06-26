export type TxAiRiskLevel = 'low' | 'medium' | 'high' | 'critical' | 'unknown'

/** Shape returned by the backend AI endpoint. */
export type TxAiInsightResponse = {
  description: string
  riskLevel: TxAiRiskLevel
  riskSummary: string
}

/** Stored insight — the backend response plus the bookkeeping we add client-side. */
export type TxAiInsight = TxAiInsightResponse & {
  /** safeTxHash the insight was generated for — used to detect staleness when the tx changes. */
  safeTxHash: string
  /** epoch ms */
  generatedAt: number
}

/** Payload sent to the backend AI endpoint. */
export type TxAiInsightRequest = {
  chainId: string
  safeAddress: string
  safeTxHash: string
  nonce: number
  transaction: {
    to: string
    value: string
    data: string
    operation: number
  }
  decoded?: {
    method: string
    parameters: unknown
  } | null
  tokenTransfers?: Array<{ token: string; recipient: string; amount: string }>
}
