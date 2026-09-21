// WalletKit / @walletconnect/core surface "No matching key" and "session topic doesn't
// exist" errors whenever the relay reconnects and delivers backlogged messages that
// reference history / session records the local instance no longer knows about. These
// are benign — the dApp retries or times out cleanly. We swallow them at console.log
// level and feed the same list to LogBox.ignoreLogs in walletKit.ts.
export const BENIGN_WALLETKIT_PATTERNS: (string | RegExp)[] = [
  'No matching key',
  /(session|pairing) topic (doesn't|does not) exist/,
  'emitting session_update',
  'without any listeners',
]

const messageOf = (e: unknown): string => {
  if (e instanceof Error) {
    return e.message
  }
  if (typeof e === 'string') {
    return e
  }
  return String(e)
}

export const isBenignWalletKitError = (e: unknown): boolean => {
  const message = messageOf(e)
  return BENIGN_WALLETKIT_PATTERNS.some((p) => (typeof p === 'string' ? message.includes(p) : p.test(message)))
}

// WalletKit/relay errors are technical (e.g. "No matching key. session topic doesn't exist")
// and must not surface verbatim. Map the one common, actionable case (an expired URI) and fall
// back to a single generic message for everything else.
const PAIR_ERROR_FALLBACK = 'Failed to pair. Please try again.'

export const getPairErrorMessage = (e: unknown): string => {
  if (/expired/i.test(messageOf(e))) {
    return 'This WalletConnect URI has expired. Generate a new QR code and try again.'
  }
  return PAIR_ERROR_FALLBACK
}

export const logWalletKitError = (context: string, e: unknown): void => {
  const label = `[walletKit] ${context}`
  if (isBenignWalletKitError(e)) {
    console.log(label, e)
    return
  }
  console.error(label, e)
}

export const logWalletKitWarn = (context: string): void => {
  console.warn(`[walletKit] ${context}`)
}
