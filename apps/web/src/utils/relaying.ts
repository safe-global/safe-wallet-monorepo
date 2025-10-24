import type { RelaysRemaining } from '@safe-global/store/gateway/AUTO_GENERATED/relay'

export const hasRemainingRelays = (relays?: RelaysRemaining): boolean => {
  return !!relays && relays.remaining > 0
}
