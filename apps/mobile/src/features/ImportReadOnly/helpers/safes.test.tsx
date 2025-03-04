import { extractSignersFromSafes, extractChainsFromSafes } from './safes'
import { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'

describe('extractSignersFromSafes', () => {
  it('should extract signers from safes', () => {
    const safes: SafeOverview[] = [
      {
        owners: [
          { value: '0x1', name: 'Owner 1' },
          { value: '0x2', name: 'Owner 2' },
        ],
        chainId: '1',
        address: { value: '0xSafe1' },
      } as SafeOverview,
      {
        owners: [
          { value: '0x1', name: 'Owner 1' },
          { value: '0x3', name: 'Owner 3' },
          { value: '0x4', name: 'Owner 4' },
        ],
        chainId: '2',
        address: { value: '0xSafe2' },
      } as SafeOverview,
    ]

    const expectedSigners = {
      '0x1': { value: '0x1', name: 'Owner 1' },
      '0x2': { value: '0x2', name: 'Owner 2' },
      '0x3': { value: '0x3', name: 'Owner 3' },
      '0x4': { value: '0x4', name: 'Owner 4' },
    }

    expect(extractSignersFromSafes(safes)).toEqual(expectedSigners)
  })
})

describe('extractChainsFromSafes', () => {
  it('should extract chain IDs from safes', () => {
    const safes: SafeOverview[] = [
      {
        owners: [{ value: '0x3', name: 'Owner 3' }],
        chainId: '1',
        address: { value: '0xSafe1' },
      } as SafeOverview,
      {
        owners: [{ value: '0x3', name: 'Owner 3' }],
        chainId: '2',
        address: { value: '0xSafe2' },
      } as SafeOverview,
    ]

    const expectedChainIds = ['1', '2']

    expect(extractChainsFromSafes(safes)).toEqual(expectedChainIds)
  })
})
