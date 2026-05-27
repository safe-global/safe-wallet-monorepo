import { useCallback, useMemo } from 'react'
import { useRouter } from 'next/router'
import { isMultiChainSafeItem } from '@/hooks/safes'
import useSafeInfo from '@/hooks/useSafeInfo'
import useChainId from '@/hooks/useChainId'
import useChains from '@/hooks/useChains'
import { useSafeAddressFromUrl } from '@/hooks/useSafeAddressFromUrl'
import { AppRoutes } from '@/config/routes'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { useCurrentSpaceId } from '@/features/spaces'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { ChainInfo } from '@/features/spaces/types'
import { useSafeBarSafes } from './useSafeBarSafes'

export function useSpaceChainSelector() {
  const { chainSelectorSafes: allSafes } = useSafeBarSafes()
  const { safeAddress: reduxSafeAddress } = useSafeInfo()
  const urlSafeAddress = useSafeAddressFromUrl()
  const safeAddress = urlSafeAddress || reduxSafeAddress
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
    selectedChainId,
    deployedChainIds,
    safeAddress,
    safeName,
    handleChainChange,
  }
}
