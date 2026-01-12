import { faker } from '@faker-js/faker'
import type { TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

export const mockUpdateSafeTxData: TransactionData = {
  hexData: '0x',
  dataDecoded: {
    method: 'changeMasterCopy',
    parameters: [
      {
        name: '_masterCopy',
        type: 'address',
        value: '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552',
        valueDecoded: null,
      },
    ],
  },
  to: {
    value: faker.finance.ethereumAddress(),
    name: 'Safe',
    logoUri: null,
  },
  value: '0',
  operation: 0,
  trustedDelegateCallTarget: null,
  addressInfoIndex: null,
}

export const mockUnknownContractTxData: TransactionData = {
  hexData: '0x',
  dataDecoded: {
    method: 'changeMasterCopy',
    parameters: [
      {
        name: '_masterCopy',
        type: 'address',
        value: faker.finance.ethereumAddress(),
        valueDecoded: null,
      },
    ],
  },
  to: {
    value: faker.finance.ethereumAddress(),
    name: 'Safe',
    logoUri: null,
  },
  value: '0',
  operation: 0,
  trustedDelegateCallTarget: null,
  addressInfoIndex: null,
}
