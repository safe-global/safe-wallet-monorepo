import type { PayMethod } from '@/features/counterfactual/PayNowPayLater'
import { type RootState } from '@/store'
import { selectChainIdAndSafeAddress, selectSafeAddress } from '@/store/common'
import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { PredictedSafeProps } from '@safe-global/protocol-kit'
import { type SafeVersion } from '@safe-global/safe-core-sdk-types'

export enum PendingSafeStatus {
  AWAITING_EXECUTION = 'AWAITING_EXECUTION',
  PROCESSING = 'PROCESSING',
  RELAYING = 'RELAYING',
  SAFENET_RELAYING = 'SAFENET_RELAYING',
}

type UndeployedSafeStatus = {
  status: PendingSafeStatus
  type: PayMethod
  txHash?: string
  taskId?: string
  startBlock?: number
  submittedAt?: number
  signerAddress?: string
  signerNonce?: number | null
}

export type ReplayedSafeProps = {
  factoryAddress: string
  masterCopy: string
  safeAccountConfig: {
    threshold: number
    owners: string[]
    fallbackHandler: string
    to: string
    data: string
    paymentToken?: string
    payment?: number
    paymentReceiver: string
  }
  saltNonce: string
  safeVersion: SafeVersion
}

export type UndeployedSafeProps = PredictedSafeProps | ReplayedSafeProps

export type UndeployedSafe = {
  status: UndeployedSafeStatus
  props: UndeployedSafeProps
}

type UndeployedSafesSlice = { [address: string]: UndeployedSafe }

export type UndeployedSafesState = { [chainId: string]: UndeployedSafesSlice }

const initialState: UndeployedSafesState = {}

export const undeployedSafesSlice = createSlice({
  name: 'undeployedSafes',
  initialState,
  reducers: {
    addUndeployedSafe: (
      state,
      action: PayloadAction<{
        chainId: string
        address: string
        type: PayMethod
        safeProps: PredictedSafeProps | ReplayedSafeProps
      }>,
    ) => {
      const { chainId, address, type, safeProps } = action.payload

      if (!state[chainId]) {
        state[chainId] = {}
      }

      state[chainId][address] = {
        props: safeProps,
        status: {
          status: PendingSafeStatus.AWAITING_EXECUTION,
          type,
        },
      }
    },

    addUndeployedSafes: (_, { payload }: PayloadAction<UndeployedSafesState>) => {
      // We must return as we are overwriting the entire state
      return payload
    },

    updateUndeployedSafeStatus: (
      state,
      action: PayloadAction<{ chainId: string; address: string; status: Omit<UndeployedSafeStatus, 'type'> }>,
    ) => {
      const { chainId, address, status } = action.payload

      if (!state[chainId]?.[address]) return state

      state[chainId][address] = {
        props: state[chainId][address].props,
        status: {
          ...state[chainId][address].status,
          ...status,
        },
      }
    },

    removeUndeployedSafe: (state, action: PayloadAction<{ chainId: string; address: string }>) => {
      const { chainId, address } = action.payload
      if (!state[chainId]) return state

      delete state[chainId][address]

      if (Object.keys(state[chainId]).length > 0) return state

      delete state[chainId]
    },
  },
})

export const { removeUndeployedSafe, addUndeployedSafe, updateUndeployedSafeStatus } = undeployedSafesSlice.actions

export const selectUndeployedSafes = (state: RootState): UndeployedSafesState => {
  return state[undeployedSafesSlice.name]
}

export const selectUndeployedSafe = createSelector(
  [selectUndeployedSafes, selectChainIdAndSafeAddress],
  (undeployedSafes, [chainId, address]): UndeployedSafe | undefined => {
    return undeployedSafes[chainId]?.[address]
  },
)

export const selectUndeployedSafesByAddress = createSelector(
  [selectUndeployedSafes, selectSafeAddress],
  (undeployedSafes, [address]): UndeployedSafe[] => {
    return Object.values(undeployedSafes)
      .flatMap((value) => value[address])
      .filter(Boolean)
  },
)

export const selectIsUndeployedSafe = createSelector([selectUndeployedSafe], (undeployedSafe) => {
  return !!undeployedSafe
})
