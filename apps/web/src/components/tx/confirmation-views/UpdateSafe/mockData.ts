import { faker } from '@faker-js/faker'
import type { TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

/** Fixed Safe address shared with the stories: the version extractor only recognises the
 *  upgrade when the call targets the Safe itself. */
export const MOCK_SAFE_ADDRESS = '0xE20e9C5Fb0FD24Ae4423Fc1eeD1088BCe1934630'

/** Safe 1.3.0 L1 singleton — a mastercopy the version lookup knows on mainnet. */
const SAFE_130_SINGLETON = '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552'

export const mockUpdateSafeTxData: TransactionData = {
  // changeMasterCopy(SAFE_130_SINGLETON) — the extractor decodes the raw calldata, not dataDecoded
  hexData: `0x7de7edef000000000000000000000000${SAFE_130_SINGLETON.slice(2)}`,
  dataDecoded: {
    method: 'changeMasterCopy',
    parameters: [
      {
        name: '_masterCopy',
        type: 'address',
        value: SAFE_130_SINGLETON,
        valueDecoded: null,
      },
    ],
  },
  to: {
    value: MOCK_SAFE_ADDRESS,
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
