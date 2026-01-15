import { faker } from '@faker-js/faker'
import { SettingsInfoType, TransactionInfoType } from '@safe-global/store/gateway/types'
import type {
  TransactionDetails,
  SettingsChangeTransaction,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

// Seed faker for deterministic visual regression tests
faker.seed(789)

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
      value: faker.finance.ethereumAddress(),
      name: faker.person.fullName(),
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
      value: faker.finance.ethereumAddress(),
      name: faker.person.fullName(),
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
      value: faker.finance.ethereumAddress(),
      name: faker.person.fullName(),
      logoUri: null,
    },
    newOwner: {
      value: faker.finance.ethereumAddress(),
      name: faker.person.fullName(),
      logoUri: null,
    },
  },
}

export const mockTxData: TransactionDetails['txData'] = {
  hexData: '0x',
  dataDecoded: null,
  to: {
    value: faker.finance.ethereumAddress(),
    name: null,
    logoUri: null,
  },
  value: '0',
  operation: 0,
  trustedDelegateCallTarget: null,
  addressInfoIndex: null,
}
