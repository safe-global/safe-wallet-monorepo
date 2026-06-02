// WalletKit / @walletconnect/core surface "No matching key" and "session topic doesn't
// exist" errors whenever the relay reconnects and delivers backlogged messages that
// reference history / session records the local instance no longer knows about. These
// are benign — the dApp retries or times out cleanly — but they look like real failures
// in a stack trace. We swallow them at `console.log` level here, and feed the same list
// to LogBox.ignoreLogs in walletKit.ts to silence the on-device toast.
//
// Any other error — especially a `respondSessionRequest` that fails for a live topic —
// leaves the dApp hanging with no response. Those go to `console.error` so they're
// visible in development and reach Sentry-style telemetry in production.
export const BENIGN_WALLETKIT_PATTERNS: (string | RegExp)[] = [
  'No matching key',
  /(session|pairing) topic (doesn't|does not) exist/,
  'emitting session_update',
  'without any listeners',
]

const messageOf = (e: unknown): string => {
  if (e instanceof Error) return e.message
  if (typeof e === 'string') return e
  return String(e)
}

export const isBenignWalletKitError = (e: unknown): boolean => {
  const message = messageOf(e)
  return BENIGN_WALLETKIT_PATTERNS.some((p) => (typeof p === 'string' ? message.includes(p) : p.test(message)))
}

/**
 * Log a WalletKit error at the appropriate level: `console.log` for stale-topic noise,
 * `console.error` for anything else so real delivery failures are visible.
 */
export const logWalletKitError = (context: string, e: unknown): void => {
  const label = `[walletKit] ${context}`
  if (isBenignWalletKitError(e)) {
    console.log(label, e)
    return
  }
  console.error(label, e)
}
