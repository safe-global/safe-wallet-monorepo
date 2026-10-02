import { GATEWAY_URL } from '@/config/gateway'
import { navigateTo } from '@/utils/navigation'
import { STEP_UP_CANCELLED } from '../constants'

const AUTHORIZE_PATH = '/v1/auth/oidc/authorize'

/** A static page, so the popup does not start the whole app only to report the outcome. */
const STEP_UP_COMPLETE_PATH = '/step-up-complete.html'

/** Also hardcoded in `public/step-up-complete.js`. */
export const STEP_UP_CHANNEL = 'safe-step-up'

const POPUP_FEATURES = 'popup,width=480,height=720'

export type StepUpOutcome = 'elevated' | 'cancelled' | 'failed'

const getStepUpUrl = (returnUrl: string): string => {
  const url = new URL(AUTHORIZE_PATH, GATEWAY_URL)
  url.searchParams.set('redirect_url', returnUrl)
  url.searchParams.set('elevate', 'true')
  return url.toString()
}

/** The fallback when the browser blocks the popup: this tab leaves for the challenge and loses its state. */
export const startStepUp = (): void => {
  // An `error` left over from an earlier attempt would look like this attempt's failure on return.
  const returnUrl = new URL(window.location.href)
  returnUrl.searchParams.delete('error')
  returnUrl.searchParams.delete('error_description')

  // Not RTK Query: this endpoint answers with a redirect to Auth0's own HTML pages.
  navigateTo(getStepUpUrl(returnUrl.toString()))
}

/** Must run in a click handler, or the browser blocks the popup. Null when it is blocked. */
export const openStepUpPopup = (): Window | null => {
  const returnUrl = new URL(STEP_UP_COMPLETE_PATH, window.location.origin).toString()
  return window.open(getStepUpUrl(returnUrl), STEP_UP_CHANNEL, POPUP_FEATURES)
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

/** Reads the message of the completion page, which forwards the `error` params of the gateway callback. */
export const getStepUpOutcome = (message: unknown): StepUpOutcome => {
  if (!isRecord(message)) return 'failed'
  if (!message.error) return 'elevated'

  const isCancelled =
    message.error === STEP_UP_CANCELLED.error && message.errorDescription === STEP_UP_CANCELLED.description
  return isCancelled ? 'cancelled' : 'failed'
}

/** Listens before the popup opens, so a fast challenge cannot finish before anyone listens. */
export const listenForStepUp = (onOutcome: (outcome: StepUpOutcome) => void): (() => void) => {
  const channel = new BroadcastChannel(STEP_UP_CHANNEL)
  channel.onmessage = (event: MessageEvent) => onOutcome(getStepUpOutcome(event.data))
  return () => channel.close()
}
