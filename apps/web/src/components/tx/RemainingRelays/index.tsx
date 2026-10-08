import type { RelaysRemaining } from '@safe-global/store/gateway/AUTO_GENERATED/relay'
import { MAX_DAY_RELAYS } from '@/hooks/useRemainingRelays'
import { RemainingRelaysView } from '@views/components/tx/RemainingRelays/RemainingRelaysView'

const RemainingRelays = ({ relays, tooltip }: { relays?: RelaysRemaining; tooltip?: string }) => {
  return (
    <RemainingRelaysView
      remaining={relays?.remaining ?? MAX_DAY_RELAYS}
      limit={relays?.limit ?? MAX_DAY_RELAYS}
      tooltip={tooltip}
    />
  )
}

export default RemainingRelays
