import { useMemo, type ReactElement } from 'react'
import type { SpaceQueueSafe } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useSpaceSafesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import UnavailableSafesAlertView from '@safe-global/views/features/spaces/components/SpaceQueue/UnavailableSafesAlertView'
import { useSafeNameResolver } from '@/hooks/useAllAddressBooks'
import useChains from '@/hooks/useChains'

/** The gateway reads the queue of this many distinct Safe addresses at most */
export const SPACE_QUEUE_MAX_SAFES = 100

export const countSafeAddresses = (safes: Record<string, string[]> | undefined): number =>
  new Set(
    Object.values(safes ?? {})
      .flat()
      .map((address) => address.toLowerCase()),
  ).size

export const getUnavailableTitle = (count: number): string =>
  count === 1 ? '1 Safe account not loaded' : `${count} Safe accounts not loaded`

type UnavailableSafesAlertProps = {
  spaceId: string
  safes: SpaceQueueSafe[]
  onRetry: () => void
  isRetrying?: boolean
}

const UnavailableSafesAlert = ({ spaceId, safes, onRetry, isRetrying }: UnavailableSafesAlertProps): ReactElement => {
  const getName = useSafeNameResolver()
  const { configs } = useChains()
  const { currentData: spaceSafes } = useSpaceSafesGetV1Query({ spaceId })

  const rows = useMemo(
    () =>
      safes.map(({ chainId, safeAddress }) => {
        const chain = configs.find((config) => config.chainId === chainId)
        return {
          id: `${chainId}:${safeAddress}`,
          chain,
          name: getName(safeAddress, chainId) || shortenAddress(safeAddress),
          networkName: chain?.chainName ?? `Chain ${chainId}`,
        }
      }),
    [safes, getName, configs],
  )

  return (
    <UnavailableSafesAlertView
      title={getUnavailableTitle(safes.length)}
      maxSafes={SPACE_QUEUE_MAX_SAFES}
      isOverLimit={countSafeAddresses(spaceSafes?.safes) > SPACE_QUEUE_MAX_SAFES}
      rows={rows}
      isRetrying={isRetrying}
      onRetry={onRetry}
    />
  )
}

export default UnavailableSafesAlert
