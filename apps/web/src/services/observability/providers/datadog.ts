import type { ILogger, IObservabilityProvider, ObservedError } from '../types'
import {
  datadogRum,
  type RumEvent,
  type RumErrorEvent,
  type RumEventDomainContext,
  type RumErrorEventDomainContext,
} from '@datadog/browser-rum'
import {
  COMMIT_HASH,
  DATADOG_RUM_APPLICATION_ID,
  DATADOG_RUM_CLIENT_TOKEN,
  DATADOG_RUM_DEFAULT_PRIVACY_LEVEL,
  DATADOG_RUM_ENV,
  DATADOG_RUM_SERVICE,
  DATADOG_RUM_SESSION_REPLAY_SAMPLE_RATE,
  DATADOG_RUM_SESSION_SAMPLE_RATE,
  DATADOG_RUM_SITE,
  DATADOG_RUM_TRACE_SAMPLE_RATE,
  DATADOG_RUM_TRACK_LONG_TASKS,
  DATADOG_RUM_TRACK_RESOURCES,
  DATADOG_RUM_TRACK_USER_INTERACTIONS,
  DATADOG_RUM_TRACING_ENABLED,
  GATEWAY_URL_PRODUCTION,
  GATEWAY_URL_STAGING,
} from '@/config/constants'

type DatadogSite =
  | 'datadoghq.com'
  | 'datadoghq.eu'
  | 'us3.datadoghq.com'
  | 'us5.datadoghq.com'
  | 'ddog-gov.com'
  | 'ap1.datadoghq.com'

export const isDatadogEnabled = Boolean(DATADOG_RUM_APPLICATION_ID) && Boolean(DATADOG_RUM_CLIENT_TOKEN)

const EXTENSION_URL_PATTERNS = [
  'chrome-extension://',
  'moz-extension://',
  'safari-extension://',
  'safari-web-extension://',
  'webkit-masked-url://',
]

const KNOWN_NOISE_PATTERNS = [
  // Firefox fires this when ResizeObserver hits a benign infinite-loop guard
  'ResizeObserver loop completed with undelivered notifications',
  'ResizeObserver loop limit exceeded',
  // Null/undefined promise rejections from injected 3rd-party scripts
  'Non-Error promise rejection captured with value: null',
  'Non-Error promise rejection captured with value: undefined',
  // Safari Intelligent Tracking Prevention noise
  'The operation is insecure',
  // Generic script error surfaced when a cross-origin script fails — unactionable
  'Script error.',
]

const originatesFromExtension = (stack: string | undefined): boolean => {
  if (!stack) return false
  return EXTENSION_URL_PATTERNS.some((pattern) => stack.includes(pattern))
}

const isKnownNoise = (message: string | undefined): boolean => {
  if (!message) return false
  return KNOWN_NOISE_PATTERNS.some((pattern) => message.includes(pattern))
}

const NON_USER_IMPACTING_SOURCES = new Set(['console', 'report'])

/**
 * Drop RUM error events that are demonstrably not caused by user-impacting
 * failures so the Error-Free Views SLO reflects real breakage. Non-error events
 * (views, actions, resources) pass through untouched.
 *
 * Sources we drop:
 * - `console`: the RUM SDK auto-instruments `console.error` via
 *   `trackConsoleError` (no init flag exists to disable it). The codebase has
 *   many `console.error` catch blocks for non-blocking failures (clipboard
 *   denial, RPC retries, third-party widget init, observability self-recovery
 *   in `composite.ts`, etc.) that are not user-impacting.
 * - `report`: Browser Reporting API events (CSP violations, deprecation,
 *   intervention, permissions-policy). Useful as a security/policy signal but
 *   not indicative of user-blocking failure; CSP visibility belongs on a
 *   `report-uri`/`report-to` endpoint, not the SLO.
 *
 * Genuine user failures continue to flow through `trackError` /
 * `captureException` (source: `custom`), unhandled exceptions (`source`), and
 * network failures (`network`).
 */
export const filterRumEvent = (event: RumEvent, context: RumEventDomainContext): boolean => {
  if (event.type !== 'error') return true

  const errorEvent = event as RumErrorEvent
  if (NON_USER_IMPACTING_SOURCES.has(errorEvent.error.source)) return false
  if (isKnownNoise(errorEvent.error.message)) return false
  if (originatesFromExtension(errorEvent.error.stack)) return false

  // context.error is the raw value originally passed to addError/captureException
  const { error: rawError } = context as RumErrorEventDomainContext
  const rawStack = rawError instanceof Error ? rawError.stack : undefined
  if (originatesFromExtension(rawStack)) return false

  return true
}

export class DatadogProvider implements IObservabilityProvider {
  readonly name = 'Datadog'
  private isInitialized = false

  async init(): Promise<void> {
    const isClient = typeof window !== 'undefined'
    if (!isClient || !isDatadogEnabled || this.isInitialized) {
      return
    }

    try {
      const getInitConfiguration = datadogRum.getInitConfiguration
      const isAlreadyInitialized = typeof getInitConfiguration === 'function' && Boolean(getInitConfiguration())
      if (isAlreadyInitialized) {
        this.isInitialized = true
        return
      }

      datadogRum.init({
        applicationId: DATADOG_RUM_APPLICATION_ID,
        clientToken: DATADOG_RUM_CLIENT_TOKEN,
        site: DATADOG_RUM_SITE as DatadogSite,
        service: DATADOG_RUM_SERVICE,
        env: DATADOG_RUM_ENV,
        version: COMMIT_HASH,
        sessionSampleRate: DATADOG_RUM_SESSION_SAMPLE_RATE,
        sessionReplaySampleRate: DATADOG_RUM_SESSION_REPLAY_SAMPLE_RATE,
        trackUserInteractions: DATADOG_RUM_TRACK_USER_INTERACTIONS,
        trackResources: DATADOG_RUM_TRACK_RESOURCES,
        trackLongTasks: DATADOG_RUM_TRACK_LONG_TASKS,
        defaultPrivacyLevel: DATADOG_RUM_DEFAULT_PRIVACY_LEVEL,
        beforeSend: filterRumEvent,
        ...(DATADOG_RUM_TRACING_ENABLED && {
          traceSampleRate: DATADOG_RUM_TRACE_SAMPLE_RATE,
          allowedTracingUrls: [
            { match: GATEWAY_URL_PRODUCTION, propagatorTypes: ['tracecontext', 'datadog'] },
            { match: GATEWAY_URL_STAGING, propagatorTypes: ['tracecontext', 'datadog'] },
          ],
        }),
      })

      this.isInitialized = true
    } catch (error) {
      console.warn('Failed to initialize Datadog RUM (might be already initialized):', error)
    }
  }

  getLogger(): ILogger {
    return {
      info: (message: string, context?: Record<string, unknown>) => {
        if (this.isInitialized) {
          datadogRum.addAction(message, { level: 'info', ...context })
        }
      },
      warn: (message: string, context?: Record<string, unknown>) => {
        if (this.isInitialized) {
          datadogRum.addAction(message, { level: 'warn', ...context })
        }
      },
      error: (message: string, context?: Record<string, unknown>) => {
        if (this.isInitialized) {
          datadogRum.addError(new Error(message), context)
        }
      },
      debug: (message: string, context?: Record<string, unknown>) => {
        if (this.isInitialized) {
          datadogRum.addAction(message, { level: 'debug', ...context })
        }
      },
    }
  }

  captureError({ error, isUserFacing, tags }: ObservedError): void {
    // Only user-facing failures become RUM errors (addError) so background /
    // logged errors don't count against the Error-Free Views SLO — those are
    // already recorded as warn-level actions via getLogger().warn.
    if (this.isInitialized && isUserFacing) {
      datadogRum.addError(error, tags)
    }
  }
}
