import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'

type SafeItemLike = { isReadOnly?: boolean }

export const hasQueuedItems = (safeItem: SafeItemLike, safeOverview?: SafeOverview | null): boolean =>
  !safeItem.isReadOnly &&
  !!safeOverview &&
  ((safeOverview.queued ?? 0) > 0 || (safeOverview.awaitingConfirmation ?? 0) > 0)
