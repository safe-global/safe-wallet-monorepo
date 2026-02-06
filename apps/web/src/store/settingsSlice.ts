import type { PayloadAction } from '@reduxjs/toolkit'
import { createSelector, createSlice } from '@reduxjs/toolkit'
import merge from 'lodash/merge'

import type { RootState } from '@/store'
import isEqual from 'lodash/isEqual'
import type { EnvState } from '@safe-global/store/settingsSlice'

export enum TOKEN_LISTS {
  TRUSTED = 'TRUSTED',
  ALL = 'ALL',
}

// Curation state for nested safes (replaces old hide/show mechanism)
export interface CuratedNestedSafeState {
  /** Addresses of nested safes selected by user */
  selectedAddresses: string[]
  /** Timestamp of last modification (for detecting new safes) */
  lastModified: number
  /** Whether user has completed initial curation */
  hasCompletedCuration: boolean
}

export interface CuratedNestedSafesMap {
  [parentSafeAddress: string]: CuratedNestedSafeState
}

export type SettingsState = {
  currency: string

  hiddenTokens: {
    [chainId: string]: string[]
  }

  // Curation state for nested safes (replaces old hide/show)
  curatedNestedSafes: CuratedNestedSafesMap

  tokenList: TOKEN_LISTS

  hideDust?: boolean

  hideSuspiciousTransactions?: boolean

  shortName: {
    copy: boolean
    qr: boolean
  }
  theme: {
    darkMode?: boolean
  }
  env: EnvState
  signing: {
    onChainSigning: boolean
    blindSigning: boolean
  }
  transactionExecution: boolean
}

export const initialState: SettingsState = {
  currency: 'usd',

  tokenList: TOKEN_LISTS.TRUSTED,

  hiddenTokens: {},

  curatedNestedSafes: {},

  hideDust: true,

  hideSuspiciousTransactions: true,

  // The `shortName` object contains settings related to short name interactions.
  // The `copy` setting determines if the short name can be copied, while the `qr` setting
  // determines if a QR code for the short name is displayed. Both are disabled by default
  // for consistency and to avoid unintended behavior.
  shortName: {
    copy: false,
    qr: false,
  },
  theme: {},
  env: {
    rpc: {},
    tenderly: {
      url: '',
      accessToken: '',
    },
  },
  signing: {
    onChainSigning: false,
    blindSigning: false,
  },
  transactionExecution: true,
}

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setCurrency: (state, { payload }: PayloadAction<SettingsState['currency']>) => {
      state.currency = payload
    },
    setCopyShortName: (state, { payload }: PayloadAction<SettingsState['shortName']['copy']>) => {
      state.shortName.copy = payload
    },
    setQrShortName: (state, { payload }: PayloadAction<SettingsState['shortName']['qr']>) => {
      state.shortName.qr = payload
    },
    setTransactionExecution: (state, { payload }: PayloadAction<SettingsState['transactionExecution']>) => {
      state.transactionExecution = payload
    },
    setDarkMode: (state, { payload }: PayloadAction<SettingsState['theme']['darkMode']>) => {
      state.theme.darkMode = payload
    },
    setHiddenTokensForChain: (state, { payload }: PayloadAction<{ chainId: string; assets: string[] }>) => {
      const { chainId, assets } = payload
      state.hiddenTokens[chainId] = assets
    },
    setCuratedNestedSafes: (
      state,
      {
        payload,
      }: PayloadAction<{
        parentSafeAddress: string
        selectedAddresses: string[]
        hasCompletedCuration: boolean
      }>,
    ) => {
      const { parentSafeAddress, selectedAddresses, hasCompletedCuration } = payload
      state.curatedNestedSafes[parentSafeAddress.toLowerCase()] = {
        selectedAddresses: selectedAddresses.map((addr) => addr.toLowerCase()),
        lastModified: Date.now(),
        hasCompletedCuration,
      }
    },
    clearCuratedNestedSafes: (state, { payload }: PayloadAction<{ parentSafeAddress: string }>) => {
      delete state.curatedNestedSafes[payload.parentSafeAddress.toLowerCase()]
    },
    setTokenList: (state, { payload }: PayloadAction<SettingsState['tokenList']>) => {
      state.tokenList = payload
    },
    setHideDust: (state, { payload }: PayloadAction<SettingsState['hideDust']>) => {
      state.hideDust = payload
    },
    hideSuspiciousTransactions: (state, { payload }: PayloadAction<boolean>) => {
      state.hideSuspiciousTransactions = payload
    },
    setRpc: (state, { payload }: PayloadAction<{ chainId: string; rpc: string }>) => {
      const { chainId, rpc } = payload
      if (rpc) {
        state.env.rpc[chainId] = rpc
      } else {
        delete state.env.rpc[chainId]
      }
    },
    setTenderly: (state, { payload }: PayloadAction<EnvState['tenderly']>) => {
      state.env.tenderly = merge({}, state.env.tenderly, payload)
    },
    setOnChainSigning: (state, { payload }: PayloadAction<boolean>) => {
      state.signing.onChainSigning = payload
    },
    setBlindSigning: (state, { payload }: PayloadAction<boolean>) => {
      state.signing.blindSigning = payload
    },
    setSettings: (_, { payload }: PayloadAction<SettingsState>) => {
      // We must return as we are overwriting the entire state
      // Preserve default nested settings if importing without
      return merge({}, initialState, payload)
    },
  },
})

export const {
  setCurrency,
  setCopyShortName,
  setQrShortName,
  setDarkMode,
  setHiddenTokensForChain,
  setCuratedNestedSafes,
  clearCuratedNestedSafes,
  setTokenList,
  setHideDust,
  hideSuspiciousTransactions,
  setRpc,
  setTenderly,
  setOnChainSigning,
  setTransactionExecution,
  setBlindSigning,
} = settingsSlice.actions

export const selectSettings = (state: RootState): SettingsState => state[settingsSlice.name]

export const selectCurrency = (state: RootState): SettingsState['currency'] => {
  return state[settingsSlice.name].currency || initialState.currency
}

export const selectTokenList = (state: RootState): SettingsState['tokenList'] => {
  return state[settingsSlice.name].tokenList || initialState.tokenList
}

export const selectHiddenTokensPerChain = createSelector(
  [selectSettings, (_, chainId) => chainId],
  (settings, chainId) => {
    return settings.hiddenTokens?.[chainId] || []
  },
)

export const selectRpc = createSelector(selectSettings, (settings) => settings.env.rpc)

export const selectTenderly = createSelector(selectSettings, (settings) => settings.env.tenderly)

export const isEnvInitialState = createSelector([selectSettings, (_, chainId) => chainId], (settings, chainId) => {
  return isEqual(settings.env.tenderly, initialState.env.tenderly) && !settings.env.rpc[chainId]
})

export const selectOnChainSigning = createSelector(selectSettings, (settings) => settings.signing.onChainSigning)
export const selectBlindSigning = createSelector(selectSettings, (settings) => settings.signing.blindSigning)
export const selectHideDust = createSelector(selectSettings, (settings) => settings.hideDust ?? true)

// Curation selectors
export const selectCuratedNestedSafes = createSelector(
  [selectSettings, (_, parentSafeAddress: string) => parentSafeAddress],
  (settings, parentSafeAddress): CuratedNestedSafeState | undefined => {
    return settings.curatedNestedSafes?.[parentSafeAddress.toLowerCase()]
  },
)

export const selectHasCompletedCuration = createSelector(
  [selectSettings, (_, parentSafeAddress: string) => parentSafeAddress],
  (settings, parentSafeAddress): boolean => {
    return settings.curatedNestedSafes?.[parentSafeAddress.toLowerCase()]?.hasCompletedCuration ?? false
  },
)

export const selectCuratedAddresses = createSelector(
  [selectSettings, (_, parentSafeAddress: string) => parentSafeAddress],
  (settings, parentSafeAddress): string[] => {
    return settings.curatedNestedSafes?.[parentSafeAddress.toLowerCase()]?.selectedAddresses ?? []
  },
)

/**
 * Checks if a safe address is curated under ANY parent safe.
 * Used to determine trust status for nested safes.
 */
export const selectIsCuratedNestedSafe = createSelector(
  [selectSettings, (_, safeAddress: string) => safeAddress],
  (settings, safeAddress): boolean => {
    if (!safeAddress) return false
    const normalizedAddress = safeAddress.toLowerCase()
    return Object.values(settings.curatedNestedSafes).some((curation) =>
      curation?.selectedAddresses?.some((addr) => addr.toLowerCase() === normalizedAddress),
    )
  },
)
