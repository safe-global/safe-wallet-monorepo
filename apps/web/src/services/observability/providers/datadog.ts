import type { ILogger, IObservabilityProvider, ObservedError } from '../types'
import { matchUserOutcome } from '@safe-global/utils/services/exceptions/normalizeError'
import {
  datadogRum,
  type RumEvent,
  type RumErrorEvent,
  type RumResourceEvent,
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
  IS_TEST_E2E,
} from '@/config/constants'

type DatadogSite =
  | 'datadoghq.com'
  | 'datadoghq.eu'
  | 'us3.datadoghq.com'
  | 'us5.datadoghq.com'
  | 'ddog-gov.com'
  | 'ap1.datadoghq.com'

export const isDatadogEnabled = Boolean(DATADOG_RUM_APPLICATION_ID) && Boolean(DATADOG_RUM_CLIENT_TOKEN) && !IS_TEST_E2E

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

// Our own webpack output — anything reported from here is first-party and must
// stay visible even if its `error.type` happens to be `EvalError` (see below).
const FIRST_PARTY_BUNDLE_PATH = '_next/static/'

/**
 * `error.type === 'EvalError'` alone isn't proof of a CSP-blocked eval() (a thrown string, `new EvalError()`,
 * or any `name = 'EvalError'` class all yield the same type), so also gate on the stack NOT pointing at our
 * own bundle (`_next/static/`). We ship no eval()/Function() today, so a same-bundle EvalError means something
 * new started calling eval() and is worth surfacing. A missing stack defaults to "not first-party".
 */
const isNotFirstPartyStack = (stack: string | undefined): boolean => {
  if (!stack) return true
  return !stack.includes(FIRST_PARTY_BUNDLE_PATH)
}

/**
 * Real-world `EvalError`s reaching RUM are third-party vendor scripts (Beamer, GTM, Calendly, etc.) whose
 * dynamic code our `script-src` CSP correctly blocks in production — intended behaviour, nothing broken for
 * the user, so dropped rather than counted (WA-2952).
 *
 * Trade-off: `'unsafe-eval'` IS allowed in dev/Cypress, so a first-party dynamic-code call would pass locally
 * and only throw (as this same EvalError) in production, where this filter would hide it. Accepted because no
 * bundle path constructs code dynamically, and `isNotFirstPartyStack` still surfaces it if the stack ever does.
 */
const isCspBlockedEval = (errorEvent: RumErrorEvent): boolean =>
  errorEvent.error.type === 'EvalError' && isNotFirstPartyStack(errorEvent.error.stack)

const NON_USER_IMPACTING_SOURCES = new Set(['console', 'report'])

const ADDRESS = String.raw`0x[a-fA-F0-9]{40}`
const MESSAGE_HASH = String.raw`0x[a-fA-F0-9]{64}`

// Terminates every pattern below so a prefix match cannot also swallow a deeper
// route nested under the same path, which reports its own failures.
const PATH_END = String.raw`(?:[?#]|$)`

/**
 * Resource requests whose non-2xx responses are expected, not failures (WA-2991). Matched on the raw request
 * URL (Datadog's `@resource.url_path_group` facet isn't available client-side) plus the status code.
 */
const EXPECTED_RESOURCE_FAILURES: { urlPattern: RegExp; statuses: Set<number> }[] = [
  // "Safe not targeted." — the documented answer for nearly every Safe, on a
  // route probed on every Safe load.
  {
    urlPattern: new RegExp(
      String.raw`/v1/targeted-messaging/outreaches/[^/]+/chains/[^/]+/safes/${ADDRESS}${PATH_END}`,
    ),
    statuses: new Set([404]),
  },
  // CGW has no metadata for most addresses; the UI falls back to the raw address.
  {
    urlPattern: new RegExp(String.raw`/v1/chains/[^/]+/contracts/${ADDRESS}${PATH_END}`),
    statuses: new Set([404]),
  },
  // A documented answer on a relay-fee chain when the request quotes no
  // `safeTxHash`, not a permission failure.
  {
    urlPattern: new RegExp(String.raw`/v1/chains/[^/]+/relay/${ADDRESS}${PATH_END}`),
    statuses: new Set([403]),
  },
  // A Safe the CGW doesn't index (undeployed counterfactual, or an address typed into the URL). A 429 on
  // these routes is a real capacity signal and deliberately keeps reporting.
  {
    urlPattern: new RegExp(String.raw`/v1/chains/[^/]+/safes/${ADDRESS}/transactions/(?:queued|history)${PATH_END}`),
    statuses: new Set([404]),
  },
  // An expired or already-executed message the UI still has a link to.
  {
    urlPattern: new RegExp(String.raw`/v1/chains/[^/]+/messages/${MESSAGE_HASH}${PATH_END}`),
    statuses: new Set([404]),
  },
]

const isExpectedResourceFailure = (event: RumResourceEvent): boolean => {
  const { url, status_code: status } = event.resource ?? {}
  if (!url || status === undefined) return false
  return EXPECTED_RESOURCE_FAILURES.some(({ urlPattern, statuses }) => urlPattern.test(url) && statuses.has(status))
}

/**
 * Drop RUM error events not caused by user-impacting failures so the Error-Free Views SLO reflects real
 * breakage, plus resource events with expected non-2xx responses (see `EXPECTED_RESOURCE_FAILURES`). Views,
 * actions and other resources pass through.
 *
 * Dropped by source:
 * - `console`: the SDK auto-instruments `console.error` (no disable flag), and we have many non-blocking
 *   `console.error` catch blocks (clipboard denial, RPC retries, widget init, self-recovery).
 * - `report`: Browser Reporting API events (CSP/deprecation/intervention) — a policy signal, not a
 *   user-blocking failure; CSP visibility belongs on a `report-uri`, not the SLO.
 *
 * Dropped regardless of source:
 * - `EvalError`s whose stack isn't our bundle (see `isCspBlockedEval`): a vendor script blocked by our CSP
 *   (WA-2952) — the CSP doing its job isn't a failure.
 *
 * Genuine failures still flow through `trackError`/`captureException` (source `custom`) and unhandled
 * exceptions; a failed request has no `network` error event, reaching us only as the `resource` event above.
 */
export const filterRumEvent = (event: RumEvent, context: RumEventDomainContext): boolean => {
  if (event.type === 'resource') return !isExpectedResourceFailure(event as RumResourceEvent)
  if (event.type !== 'error') return true

  const errorEvent = event as RumErrorEvent
  if (NON_USER_IMPACTING_SOURCES.has(errorEvent.error.source)) return false
  if (isKnownNoise(errorEvent.error.message)) return false
  if (isCspBlockedEval(errorEvent)) return false
  if (originatesFromExtension(errorEvent.error.stack)) return false

  // User-driven outcomes that third-party SDKs surface as unhandled errors (WalletConnect TTL expiry, a
  // wallet's bare "Rejected") bypass trackError/the normalizer. Re-emit as info-level actions (queryable
  // as an approval drop-off signal) and drop the RUM error to keep it off the Error-Free Views SLO (WA-2950).
  const userOutcome = matchUserOutcome(errorEvent.error.message)
  if (userOutcome) {
    datadogRum.addAction(errorEvent.error.message, { level: 'info', error_type: userOutcome })
    return false
  }

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
        // Pinned to the v6 default. v7 flipped this to `true`, which routes
        // auto-collected click action names through the privacy tree walker:
        // under our `defaultPrivacyLevel: 'mask'`, `shouldMaskNode` rejects
        // every node, so every action name would resolve to an empty string.
        enablePrivacyForActionName: false,
        beforeSend: filterRumEvent,
        ...(DATADOG_RUM_TRACING_ENABLED && {
          traceSampleRate: DATADOG_RUM_TRACE_SAMPLE_RATE,
          // Pinned to the v6 default. v7 flipped this to `true`, adding a
          // `baggage` header to every traced request — CGW would have to
          // allowlist it in `Access-Control-Allow-Headers` or all preflights
          // to the gateway start failing. Flip back on once CGW accepts it.
          propagateTraceBaggage: false,
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
    // Only user-facing failures become RUM errors (addError); background/logged errors are recorded as
    // warn-level actions via getLogger().warn, keeping them off the Error-Free Views SLO.
    if (this.isInitialized && isUserFacing) {
      datadogRum.addError(error, tags)
    }
  }
}
