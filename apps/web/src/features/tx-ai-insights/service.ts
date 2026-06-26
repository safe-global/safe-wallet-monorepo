import { TX_AI_INSIGHTS_URL } from '@/config/constants'
import type { TxAiInsightRequest, TxAiInsightResponse } from './types'

export class TxAiInsightsNotConfiguredError extends Error {
  constructor() {
    super('AI insights are not configured')
    this.name = 'TxAiInsightsNotConfiguredError'
  }
}

export const isTxAiInsightsConfigured = (): boolean => Boolean(TX_AI_INSIGHTS_URL)

/**
 * Calls the backend AI endpoint. Swap NEXT_PUBLIC_TX_AI_INSIGHTS_URL for your service; until it is
 * set, callers get a TxAiInsightsNotConfiguredError so the UI can show a friendly message.
 */
export const fetchTxAiInsight = async (request: TxAiInsightRequest): Promise<TxAiInsightResponse> => {
  if (!TX_AI_INSIGHTS_URL) {
    throw new TxAiInsightsNotConfiguredError()
  }

  const res = await fetch(TX_AI_INSIGHTS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!res.ok) {
    throw new Error(`AI insight request failed (${res.status})`)
  }

  return (await res.json()) as TxAiInsightResponse
}
