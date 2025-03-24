import { apiSliceWithChainsConfig, chainsAdapter, initialState } from '@safe-global/store/gateway/chains'
import { createSelector } from '@reduxjs/toolkit'
import { RootState } from '..'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { selectActiveSafe } from '../activeSafeSlice'

const selectChainsResult = apiSliceWithChainsConfig.endpoints.getChainsConfig.select()

const selectChainsData = createSelector(selectChainsResult, (result) => {
  return result.data ?? initialState
})

const { selectAll: selectAllChains, selectById } = chainsAdapter.getSelectors(selectChainsData)

export const selectChainById = (state: RootState, chainId: string) => selectById(state, chainId)

export const selectActiveChain = createSelector(
  [selectActiveSafe, (state: RootState) => state],
  (activeSafe, state) => {
    if (!activeSafe) {
      return null
    }
    return selectChainById(state, activeSafe.chainId)
  },
)

export const selectAllChainsIds = createSelector([selectAllChains], (chains: Chain[]) =>
  (chains || []).map((chain) => chain.chainId),
)

export const selectActiveChainCurrency = createSelector(
  [selectActiveChain, (state: RootState) => state],
  (activeChain) => {
    return activeChain?.nativeCurrency
  },
)

export const getChainsByIds = createSelector(
  [
    // Pass the root state and chainIds array as dependencies
    (state: RootState) => state,
    (_state: RootState, chainIds: string[]) => chainIds,
  ],
  (state, chainIds) => {
    return (chainIds || []).map((chainId) => selectById(state, chainId)).filter(Boolean)
  },
)

export const { useGetChainsConfigQuery } = apiSliceWithChainsConfig
export { selectAllChains }
