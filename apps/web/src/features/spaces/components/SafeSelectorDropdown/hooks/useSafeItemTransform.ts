import { useCallback } from 'react'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'
import type { PortfolioBalances } from '@/hooks/loadables/useLoadBalances'
import type { SafeInfo } from '@/features/spaces/types'

export interface SafeItemData {
  name: string
  address: string
  threshold: number
  owners: number
  chains: { chainId: string; chainName?: string; chainLogoUri?: string | null }[]
  balanceValue: string
  isLoading: boolean
}

interface UseSafeItemTransformParams {
  currentSafeId: string | null
  currentSafeName: string
  currentSafeDisplayAddress: string
  safe: ExtendedSafeInfo
  chain: Chain | undefined
  chainId: string
  balances: PortfolioBalances
  balancesLoading: boolean
}

export const useSafeItemTransform = ({
  currentSafeId,
  currentSafeName,
  currentSafeDisplayAddress,
  safe,
  chain,
  chainId,
  balances,
  balancesLoading,
}: UseSafeItemTransformParams) => {
  const getSafeItemData = useCallback(
    (safeItem: SafeInfo): SafeItemData => {
      const isCurrent = safeItem.id === currentSafeId

      if (isCurrent) {
        return {
          name: currentSafeName,
          address: currentSafeDisplayAddress,
          threshold: safe.threshold,
          owners: safe.owners.length,
          chains: chain
            ? [
                {
                  chainId,
                  chainName: chain.chainName ?? chain.shortName,
                  chainLogoUri: chain.chainLogoUri ?? undefined,
                },
              ]
            : [],
          balanceValue: balances.fiatTotal,
          isLoading: balancesLoading,
        }
      }

      return {
        name: safeItem.name ?? '',
        address: safeItem.address,
        threshold: safeItem.threshold,
        owners: safeItem.owners,
        chains: safeItem.chains,
        balanceValue: safeItem.balance,
        isLoading: false,
      }
    },
    [
      currentSafeId,
      currentSafeName,
      currentSafeDisplayAddress,
      safe.threshold,
      safe.owners.length,
      chain,
      chainId,
      balances.fiatTotal,
      balancesLoading,
    ],
  )

  return {
    getSafeItemData,
  }
}
