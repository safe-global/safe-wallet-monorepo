import type { NativeTokenMetadataDto, PendingPolicyDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { MOCK_SAFES } from './policies'

/** Shaped like the CGW `policies/pending` response. */

const ALLOWANCE_MODULE = '0xCFbFaC74C26F8647cBDb8c5caf80BB5b32E43134'

export const PENDING_MOCK_DELEGATE = '0x91033E6fE839AEbBfEB7900cf802218DdB579859'

export const mockPendingDto = (overrides: Partial<PendingPolicyDto> = {}): PendingPolicyDto => ({
  kind: 'queued-transaction',
  type: 'spending-limit',
  enforcement: { via: 'module', moduleAddress: ALLOWANCE_MODULE },
  safeTxHash: '0xc11256ba0538b5f2fad7fc351385b5e87fd926712956de138a5edcfb99eaeead',
  nonce: 2,
  confirmations: 1,
  confirmationsRequired: 2,
  proposedAt: 1_790_342_985,
  data: {
    module: ALLOWANCE_MODULE,
    changes: [
      { kind: 'add-delegate', delegate: PENDING_MOCK_DELEGATE },
      {
        kind: 'set-allowance',
        delegate: PENDING_MOCK_DELEGATE,
        token: '0x0000000000000000000000000000000000000000',
        tokenMetadata: mockEthMetadata(),
        amount: '100000000000000000',
        resetPeriodMinutes: 0,
      },
    ],
  },
  safe: MOCK_SAFES.treasury,
  ...overrides,
})

export const mockEthMetadata = (): NativeTokenMetadataDto => ({
  type: 'NATIVE_TOKEN',
  address: '0x0000000000000000000000000000000000000000',
  symbol: 'ETH',
  decimals: 18,
  logoUri: 'https://safe-transaction-assets.safe.global/chains/1/currency_logo.png',
  name: 'Ether',
  trusted: true,
})
