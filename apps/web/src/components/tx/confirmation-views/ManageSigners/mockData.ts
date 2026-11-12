import { mockAddress } from '@/stories/mocks/address'
import { SettingsInfoType, TransactionInfoType } from '@safe-global/store/gateway/types'
import type {
  TransactionDetails,
  SettingsChangeTransaction,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

export const mockAddOwnerTxInfo: SettingsChangeTransaction = {
  type: TransactionInfoType.SETTINGS_CHANGE,
  humanDescription: null,
  dataDecoded: {
    method: 'addOwnerWithThreshold',
    parameters: [],
  },
  settingsInfo: {
    type: SettingsInfoType.ADD_OWNER,
    owner: {
      value: mockAddress(1),
      name: 'Alice Martin',
      logoUri: null,
    },
    threshold: 2,
  },
}

export const mockRemoveOwnerTxInfo: SettingsChangeTransaction = {
  type: TransactionInfoType.SETTINGS_CHANGE,
  humanDescription: null,
  dataDecoded: {
    method: 'removeOwner',
    parameters: [],
  },
  settingsInfo: {
    type: SettingsInfoType.REMOVE_OWNER,
    owner: {
      value: mockAddress(2),
      name: 'Bob Chen',
      logoUri: null,
    },
    threshold: 1,
  },
}

export const mockSwapOwnerTxInfo: SettingsChangeTransaction = {
  type: TransactionInfoType.SETTINGS_CHANGE,
  humanDescription: null,
  dataDecoded: {
    method: 'swapOwner',
    parameters: [],
  },
  settingsInfo: {
    type: SettingsInfoType.SWAP_OWNER,
    oldOwner: {
      value: mockAddress(3),
      name: 'Carol Diaz',
      logoUri: null,
    },
    newOwner: {
      value: mockAddress(4),
      name: 'David Kim',
      logoUri: null,
    },
  },
}

export const mockTxData: TransactionDetails['txData'] = {
  hexData: '0x',
  dataDecoded: null,
  to: {
    value: mockAddress(5),
    name: null,
    logoUri: null,
  },
  value: '0',
  operation: 0,
  trustedDelegateCallTarget: null,
  addressInfoIndex: null,
}
