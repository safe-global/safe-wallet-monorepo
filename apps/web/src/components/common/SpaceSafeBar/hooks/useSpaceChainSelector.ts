import { useCallback, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useSpaceSafes, useCurrentSpaceId } from '@/features/spaces'
import { isMultiChainSafeItem } from '@/hooks/safes'
import useSafeInfo from '@/hooks/useSafeInfo'
import useChainId from '@/hooks/useChainId'
import useChains from '@/hooks/useChains'
import { AppRoutes } from '@/config/routes'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { ChainInfo } from '@/features/spaces/types'

export function useSpaceChainSelector() {
  const { allSafes } = useSpaceSafes()
  const { safeAddress } = useSafeInfo()
  const selectedChainId = useChainId()
  const { configs: chainConfigs } = useChains()
  const router = useRouter()
  const spaceId = useCurrentSpaceId()

  const { deployedChains, deployedChainIds, safeName } = useMemo(() => {
    const currentSafe = allSafes.find((s) => sameAddress(s.address, safeAddress))

    if (!currentSafe)
      return { deployedChains: [] as ChainInfo[], deployedChainIds: [] as string[], safeName: undefined }

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

    return { deployedChains: resolvedChains, deployedChainIds: chainIds, safeName: currentSafe.name }
  }, [allSafes, safeAddress, chainConfigs])

  const availableChains: ChainInfo[] = useMemo(() => {
    return chainConfigs
      .filter((c) => !deployedChainIds.includes(c.chainId))
      .map((c) => ({
        chainId: c.chainId,
        chainName: c.chainName,
        chainLogoUri: c.chainLogoUri ?? null,
        shortName: c.shortName,
      }))
  }, [chainConfigs, deployedChainIds])

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

  return {
    deployedChains,
    availableChains,
    selectedChainId,
    deployedChainIds,
    safeAddress,
    safeName,
    handleChainChange,
  }
}
