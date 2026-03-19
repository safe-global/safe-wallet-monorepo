import { useCallback, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useSpaceSafes } from '@/features/spaces'
import { isMultiChainSafeItem } from '@/hooks/safes'
import useSafeInfo from '@/hooks/useSafeInfo'
import useChainId from '@/hooks/useChainId'
import useChains from '@/hooks/useChains'
import { AppRoutes } from '@/config/routes'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { useCurrentSpaceId } from '@/features/spaces'
import type { ChainInfo } from '@/features/spaces/types'

export function useSpaceChainSelector() {
  const { allSafes } = useSpaceSafes()
  const { safeAddress } = useSafeInfo()
  const selectedChainId = useChainId()
  const { configs: chainConfigs } = useChains()
  const router = useRouter()
  const spaceId = useCurrentSpaceId()

  const { chains, hasMultipleChains } = useMemo(() => {
    const currentSafe = allSafes.find((s) => s.address.toLowerCase() === safeAddress.toLowerCase())

    if (!currentSafe) return { chains: [] as ChainInfo[], hasMultipleChains: false }

    const chainIds = isMultiChainSafeItem(currentSafe) ? currentSafe.safes.map((s) => s.chainId) : [currentSafe.chainId]

    const resolvedChains: ChainInfo[] = chainIds.map((id) => {
      const chain = chainConfigs.find((c) => c.chainId === id)
      return {
        chainId: id,
        chainName: chain?.chainName ?? id,
        chainLogoUri: chain?.chainLogoUri ?? null,
        shortName: chain?.shortName ?? id,
      }
    })

    return { chains: resolvedChains, hasMultipleChains: chainIds.length > 1 }
  }, [allSafes, safeAddress, chainConfigs])

  const handleChainChange = useCallback(
    (chainId: string) => {
      const chain = chainConfigs.find((c) => c.chainId === chainId)
      if (!chain) return
      trackEvent(
        { ...SPACE_EVENTS.CHAIN_SWITCHED, label: spaceId ?? undefined },
        {
          spaceId,
          [MixpanelEventParams.SAFE_ADDRESS]: safeAddress,
          [MixpanelEventParams.CHAIN_ID]: chainId,
        },
      )
      router.push({ pathname: AppRoutes.home, query: { safe: `${chain.shortName}:${safeAddress}` } })
    },
    [chainConfigs, router, safeAddress, spaceId],
  )

  return { chains, selectedChainId, hasMultipleChains, handleChainChange }
}
