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

export const logWalletKitError = (context: string, e: unknown): void => {
  const label = `[walletKit] ${context}`
  if (isBenignWalletKitError(e)) {
    console.log(label, e)
    return
  }
  console.error(label, e)
}
