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

export const useFeatureFlagEditorData = (): FeatureFlagEditorData => {
  const { data } = useGetChainsConfigV2Query(CONFIG_SERVICE_KEY)
  const overrides = useAppSelector(selectFeatureFlagOverrides)
  const currentChainId = useChainId()

  return useMemo(() => {
    const chains = data ? data.ids.map((id) => data.entities[id]!) : []
    const currentChain = data?.entities[currentChainId]

    const rows: FeatureFlagRowData[] = Object.values(FEATURES).map((feature) => {
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

    const byName = (a: FeatureFlagRowData, b: FeatureFlagRowData) => a.feature.localeCompare(b.feature)

    return {
      overridden: rows.filter((r) => r.override !== undefined).sort(byName),
      rest: rows.filter((r) => r.override === undefined).sort(byName),
    }
  }, [data, overrides, currentChainId])
}
