import { useMemo } from 'react'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { useGetChainsConfigV2Query } from '@safe-global/store/gateway'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { CONFIG_SERVICE_KEY } from '@/config/constants'
import { useAppSelector } from '@/store'
import { selectFeatureFlagOverrides } from '@/features/feature-flags/store'
import useChainId from '@/hooks/useChainId'

export type FeatureFlagRowData = {
  feature: FEATURES
  chainScope: 'global' | 'off' | Chain[]
  configValue: boolean
  override: boolean | undefined
  effective: boolean
  matchesCurrentChain: boolean
}

export type FeatureFlagEditorData = {
  overridden: FeatureFlagRowData[]
  rest: FeatureFlagRowData[]
}

const getChainScope = (chains: Chain[], feature: FEATURES): FeatureFlagRowData['chainScope'] => {
  const withFeature = chains.filter((chain) => hasFeature(chain, feature))
  if (withFeature.length === 0) return 'off'
  if (withFeature.length === chains.length) return 'global'
  return withFeature
}

// The flag list is a fixed enum, so sort it once at module scope rather than on every render.
const SORTED_FEATURES: FEATURES[] = [...Object.values(FEATURES)].sort((a, b) => a.localeCompare(b))

/**
 * Derives the editor's per-flag display data.
 *
 * Deliberately reads the **raw** config-service chains (via
 * `useGetChainsConfigV2Query` directly, not `useChains`, which applies
 * overrides). The editor shows what the config service delivered
 * (`configValue` / `chainScope`) alongside the local `override`, so this data
 * must stay un-overridden — unlike `useHasFeature`, which reflects overrides.
 */
export const useFeatureFlagEditorData = (): FeatureFlagEditorData => {
  const { data } = useGetChainsConfigV2Query(CONFIG_SERVICE_KEY)
  const overrides = useAppSelector(selectFeatureFlagOverrides)
  const currentChainId = useChainId()

  return useMemo(() => {
    const chains = data ? data.ids.map((id) => data.entities[id]!) : []
    const currentChain = data?.entities[currentChainId]

    // Built in sorted order, so the filtered partitions below stay sorted without re-sorting.
    const rows: FeatureFlagRowData[] = SORTED_FEATURES.map((feature) => {
      const configValue = currentChain ? hasFeature(currentChain, feature) : false
      const override = overrides[feature]
      return {
        feature,
        chainScope: getChainScope(chains, feature),
        configValue,
        override,
        effective: override ?? configValue,
        matchesCurrentChain: override !== undefined && override === configValue,
      }
    })

    return {
      overridden: rows.filter((r) => r.override !== undefined),
      rest: rows.filter((r) => r.override === undefined),
    }
  }, [data, overrides, currentChainId])
}
