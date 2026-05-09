import { getAccountType } from './accountType'
import { NOTIFICATION_ACCOUNT_TYPE } from '@/src/store/constants'
import { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

const mockSafeInfo: SafeOverview = {
  owners: [{ value: '0x123' }],
  address: { value: '0x123' },
  chainId: '1',
  threshold: 1,
  fiatTotal: '0',
  queued: 0,
} as SafeOverview

const signers: Record<string, AddressInfo> = {
  '0x123': { value: '0x123' },
}

describe('getAccountType', () => {
  it('returns REGULAR when safeInfo is undefined', () => {
    const result = getAccountType(undefined, signers)
    expect(result).toEqual({ ownerFound: null, accountType: NOTIFICATION_ACCOUNT_TYPE.REGULAR })
  })

  it('returns OWNER when owner matches a signer', () => {
    const result = getAccountType(mockSafeInfo, signers)
    expect(result).toEqual({ ownerFound: { value: '0x123' }, accountType: NOTIFICATION_ACCOUNT_TYPE.OWNER })
  })

  it('returns REGULAR when no owners match signers', () => {
    const result = getAccountType(mockSafeInfo, {})
    expect(result).toEqual({ ownerFound: null, accountType: NOTIFICATION_ACCOUNT_TYPE.REGULAR })
  })
})
