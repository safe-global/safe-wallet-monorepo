import { useMemo } from 'react'
import useChains, { useCurrentChain } from '@/hooks/useChains'
import { useCompatibleNetworks } from '@safe-global/utils/features/multichain/hooks/useCompatibleNetworks'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { hasMultiChainAddNetworkFeature } from '../utils'
import { useSafeCreationData } from './useSafeCreationData'

export type AddNetworkUnavailableReason = 'safe-specific' | 'outdated-mastercopy'

export type AvailableNetwork = Chain & { available: boolean }

export interface AddNetworkState {
  /** True while the Safe creation data is being fetched. */
  loading: boolean
  /** Target chains that can technically receive this Safe. Empty when the Safe cannot be added to any network. */
  availableNetworks: AvailableNetwork[]
  /** Non-null when the user should be shown a "cannot add" message instead of the chain list. */
  unavailableReason: AddNetworkUnavailableReason | null
  /** Underlying creation-data error, when any. Surface its message as a tooltip if needed. */
  error?: Error
  /** Whether the current (origin) chain supports the add-network feature at all. */
  isFeatureEnabled: boolean
}

export function useAddNetworkState(safeAddress: string, deployedChainIds: string[]): AddNetworkState {
  const { configs } = useChains()
  const currentChain = useCurrentChain()
  const isFeatureEnabled = hasMultiChainAddNetworkFeature(currentChain)

  const deployedChainConfigs = useMemo(
    () => (isFeatureEnabled ? configs.filter((c) => deployedChainIds.includes(c.chainId)) : []),
    [isFeatureEnabled, configs, deployedChainIds],
  )

  const [safeCreationData, safeCreationError, safeCreationLoading] = useSafeCreationData(
    safeAddress,
    deployedChainConfigs,
  )

  const allCompatibleChains = useCompatibleNetworks(safeCreationData, configs)

  const availableNetworks = useMemo<AvailableNetwork[]>(
    () =>
      allCompatibleChains?.filter(
        (config) => !deployedChainIds.includes(config.chainId) && hasMultiChainAddNetworkFeature(config),
      ) ?? [],
    [allCompatibleChains, deployedChainIds],
  )

  const noAvailableNetworks = availableNetworks.length > 0 && availableNetworks.every((c) => !c.available)
  const isUnsupportedSafeCreationVersion = Boolean(safeCreationData && !allCompatibleChains?.length)

  const unavailableReason: AddNetworkUnavailableReason | null = (() => {
    if (!isFeatureEnabled) return null
    if (safeCreationError) return 'safe-specific'
    if (safeCreationData && noAvailableNetworks) return 'safe-specific'
    if (isUnsupportedSafeCreationVersion) return 'outdated-mastercopy'
    return null
  })()

  return {
    loading: safeCreationLoading,
    availableNetworks: unavailableReason ? [] : availableNetworks,
    unavailableReason,
    error: safeCreationError,
    isFeatureEnabled,
  }
}
