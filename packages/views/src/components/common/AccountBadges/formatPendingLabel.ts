/** Hover label for the pending badge: total queued, plus how many await the wallet's signature. */
export const formatPendingLabel = (count: number, awaitingConfirmation = 0): string => {
  const base = count === 1 ? '1 pending transaction' : `${count} pending transactions`
  return awaitingConfirmation > 0 ? `${base} · ${awaitingConfirmation} awaiting your confirmation` : base
}
