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

export type SettingsState = {
  currency: string

  hiddenTokens: {
    [chainId: string]: string[]
  }

  tokenList: TOKEN_LISTS

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

  hideSuspiciousTransactions: true,

  shortName: {
    copy: true,
    qr: true,
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
    setTokenList: (state, { payload }: PayloadAction<SettingsState['tokenList']>) => {
      state.tokenList = payload
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
  setTokenList,
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
