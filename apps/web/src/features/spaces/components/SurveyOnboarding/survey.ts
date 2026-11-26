import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'
import { ArrowLeftRight, BarChart3, FileCode, HelpCircle, Send, Shield, Sparkles, type LucideIcon } from 'lucide-react'

// Backend-issued icon keys → lucide icons. Unknown keys fall back to a
// placeholder so the card never renders iconless.
const ICON_MAP: Record<string, LucideIcon> = {
  terminal: FileCode,
  gift: Sparkles,
  cash: Send,
  sprout: BarChart3,
  swap: ArrowLeftRight,
  bank: Shield,
}
const FALLBACK_ICON: LucideIcon = HelpCircle

export const surveyIcon = (key: string | undefined): LucideIcon | undefined =>
  key ? (ICON_MAP[key] ?? FALLBACK_ICON) : undefined

export const ONBOARDING_SURVEY_SLUG = 'onboarding'

/** A 404 means no active survey (an admin turned it off), not a failure. */
export const isSurveyNotFound = (error: FetchBaseQueryError | SerializedError | undefined): boolean =>
  error !== undefined && 'status' in error && error.status === 404
