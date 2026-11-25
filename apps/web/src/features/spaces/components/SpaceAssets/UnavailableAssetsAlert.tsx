import { useMemo, type ReactElement } from 'react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import UnavailableSafesAlertView from '@safe-global/views/features/spaces/components/SpaceQueue/UnavailableSafesAlertView'
import { useSafeNameResolver } from '@/hooks/useAllAddressBooks'
import useChains from '@/hooks/useChains'
import { getUnavailableTitle } from '../SpaceTransactions/UnavailableSafesAlert'
import { toChainInfos } from '../../utils'

type UnavailableAssetsAlertProps = {
  safes: { chainId: string; safeAddress: string }[]
  onRetry: () => void
}

const UnavailableAssetsAlert = ({ safes, onRetry }: UnavailableAssetsAlertProps): ReactElement => {
  const getName = useSafeNameResolver()
  const { configs } = useChains()

  const rows = useMemo(
    () =>
      safes.map(({ chainId, safeAddress }) => {
        const chain = toChainInfos([chainId], configs)[0]
        return {
          id: `${chainId}:${safeAddress}`,
          chain,
          name: getName(safeAddress, chainId) || shortenAddress(safeAddress),
          networkName: chain.chainName,
        }
      }),
    [safes, getName, configs],
  )

  return (
    <UnavailableSafesAlertView
      title={getUnavailableTitle(safes.length)}
      description="Their assets aren't counted in the totals. The network may be unreachable or not supported. Reload to try again."
      maxSafes={0}
      isOverLimit={false}
      rows={rows}
      onRetry={onRetry}
    />
  )
}

export default UnavailableAssetsAlert
