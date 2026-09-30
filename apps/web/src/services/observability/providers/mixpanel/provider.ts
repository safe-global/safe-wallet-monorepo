import type { ILogger, IObservabilityProvider, ObservedError } from '../../types'
import { trackErrorSurfaced } from './error-tracking'

const noopLogger: ILogger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
}

/**
 * Observability provider that forwards surfaced coded errors to Mixpanel as the
 * `Error Surfaced` analytics event (WA-2775). Registered alongside the Datadog
 * provider so both error sinks live behind the same observability service.
 *
 * `captureError` acts only on coded errors — raw crashes without a `code` (e.g.
 * a React error boundary) are skipped — and forwards the taxonomy only, never
 * the `error`/stack/tags, so no message or PII reaches analytics. `init` and
 * `getLogger` are inert because Mixpanel is not a logging sink.
 *
 * Constructed at the composition root (`_app.tsx`) and injected into
 * `initObservability`, so the observability core never imports the analytics
 * module graph — keeping `services/exceptions` free of an analytics import cycle.
 */
export class MixpanelTracingProvider implements IObservabilityProvider {
  readonly name = 'MixpanelTracing'

  init(): void {}

  getLogger(): ILogger {
    return noopLogger
  }

  captureError({ error, isUserFacing, code, context }: ObservedError): void {
    if (code == null) {
      return
    }

    trackErrorSurfaced({ code, message: error.message, isUserFacing, context })
  }
}
