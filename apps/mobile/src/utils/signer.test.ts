import { getSafeSigners } from './signer'
import { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

describe('getSafeSigners', () => {
  const mockSafeInfo: SafeOverview = {
    owners: [{ value: '0x123' }, { value: '0x456' }, { value: '0x789' }],
    address: { value: '0x123' },
    chainId: '1',
    threshold: 2,
    fiatTotal: '0',
    queued: 0,
  } as SafeOverview

  const mockSigners: Record<string, AddressInfo> = {
    '0x123': { value: '0x123' },
    '0x789': { value: '0x789' },
  }

  it('should return only the owners that exist in signers', () => {
    const result = getSafeSigners(mockSafeInfo, mockSigners)
    expect(result).toEqual(['0x123', '0x789'])
  })

  it('should return empty array when no owners match signers', () => {
    const emptySigners: Record<string, AddressInfo> = {}
    const result = getSafeSigners(mockSafeInfo, emptySigners)
    expect(result).toEqual([])
  })

  it('should handle case when all owners are signers', () => {
    const allSigners: Record<string, AddressInfo> = {
      '0x123': { value: '0x123' },
      '0x456': { value: '0x456' },
      '0x789': { value: '0x789' },
    }
    const result = getSafeSigners(mockSafeInfo, allSigners)
    expect(result).toEqual(['0x123', '0x456', '0x789'])
  })
})
