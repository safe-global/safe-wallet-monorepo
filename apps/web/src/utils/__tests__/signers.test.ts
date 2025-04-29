import { getAvailableSigners } from '../signers'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { safeInfoBuilder } from '@/tests/builders/safe'
import { faker } from '@faker-js/faker'
import type { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import { checksumAddress } from '@safe-global/utils/utils/addresses'

describe('getAvailableSigners', () => {
  const mockWallet = {
    address: checksumAddress(faker.finance.ethereumAddress()),
  } as ConnectedWallet
  const parentSafe = checksumAddress(faker.finance.ethereumAddress())

  const mockTx = {
    signatures: new Map(),
  } as SafeTransaction

  it('should return an empty array if wallet is null', () => {
    const mockSafe = safeInfoBuilder()
      .with({ owners: [{ value: mockWallet.address }] })
      .build()

    const result = getAvailableSigners(null, ['0xOwner1'], mockSafe, mockTx)

    expect(result).toEqual([])
  })

  it('should return an empty array if nestedSafeOwners is null', () => {
    const mockSafe = safeInfoBuilder()
      .with({ owners: [{ value: mockWallet.address }] })
      .build()
    const result = getAvailableSigners(mockWallet, null, mockSafe, mockTx)

    expect(result).toEqual([])
  })

  it('should return an empty array if tx is undefined', () => {
    const nestedOwners = [mockWallet.address]
    const mockSafe = safeInfoBuilder()
      .with({ owners: [{ value: mockWallet.address }, { value: parentSafe }] })
      .build()

    const result = getAvailableSigners(mockWallet, nestedOwners, mockSafe, undefined)

    expect(result).toEqual([])
  })

  it('should include wallet address if wallet is a direct owner and has not signed', () => {
    const nestedOwners = [checksumAddress(faker.finance.ethereumAddress())]
    const mockSafe = safeInfoBuilder()
      .with({ owners: [{ value: mockWallet.address }, { value: parentSafe }] })
      .build()

    const result = getAvailableSigners(mockWallet, nestedOwners, mockSafe, mockTx)

    expect(result).toEqual([nestedOwners[0], mockWallet.address])
  })

  it('should not include wallet address if wallet is a direct owner and has already signed', () => {
    const nestedOwners = [checksumAddress(faker.finance.ethereumAddress())]
    const mockSafe = safeInfoBuilder()
      .with({ owners: [{ value: mockWallet.address }, { value: parentSafe }], threshold: 2 })
      .build()
    const signedTx = {
      ...mockTx,
      signatures: new Map([[mockWallet.address, 'mockWallet signature']]),
    } as unknown as SafeTransaction

    const result = getAvailableSigners(mockWallet, nestedOwners, mockSafe, signedTx)

    expect(result).toEqual([nestedOwners[0]])
  })

  it('should return only signers who have not signed if threshold is not met', () => {
    const nestedOwners = [
      checksumAddress(faker.finance.ethereumAddress()),
      checksumAddress(faker.finance.ethereumAddress()),
    ]
    const mockSafe = safeInfoBuilder()
      .with({ owners: [{ value: mockWallet.address }, { value: parentSafe }] })
      .build()
    const signedTx = {
      ...mockTx,
      signatures: new Map([[nestedOwners[0], 'nestedOwners[0] signature']]),
    } as unknown as SafeTransaction

    const result = getAvailableSigners(mockWallet, nestedOwners, mockSafe, signedTx)

    expect(result).toEqual([nestedOwners[1], mockWallet.address])
  })

  it('should return nestedSafeOwners if wallet is not a direct owner', () => {
    const nestedOwners = [
      checksumAddress(faker.finance.ethereumAddress()),
      checksumAddress(faker.finance.ethereumAddress()),
    ]
    const mockSafe = safeInfoBuilder()
      .with({ owners: [{ value: parentSafe }] })
      .build()
    const result = getAvailableSigners(mockWallet, nestedOwners, mockSafe, mockTx)

    expect(result).toEqual([nestedOwners[0], nestedOwners[1]])
  })

  it('should return nested signers if the transaction has met the threshold', () => {
    const nestedOwners = [checksumAddress(faker.finance.ethereumAddress())]
    const mockSafe = safeInfoBuilder()
      .with({ owners: [{ value: mockWallet.address }, { value: parentSafe }], threshold: 2 })
      .build()
    const fullySignedTx = {
      ...mockTx,
      signatures: new Map([
        [checksumAddress(mockWallet.address), 'mockWallet signature'],
        [checksumAddress(nestedOwners[0]), 'nestedOwners[0] signature'],
      ]),
    } as unknown as SafeTransaction

    const result = getAvailableSigners(mockWallet, nestedOwners, mockSafe, fullySignedTx)

    expect(result).toEqual([nestedOwners[0]])
  })

  it('should handle case insensitivity in addresses', () => {
    const nonChecksummedMockWallet = { address: mockWallet.address.toLowerCase() } as ConnectedWallet
    const nestedOwners = [faker.finance.ethereumAddress().toUpperCase(), faker.finance.ethereumAddress().toLowerCase()]
    const mockSafe = safeInfoBuilder()
      .with({
        owners: [{ value: mockWallet.address }, { value: parentSafe }],
      })
      .build()

    const result = getAvailableSigners(nonChecksummedMockWallet, nestedOwners, mockSafe, mockTx)

    expect(result).toEqual([
      checksumAddress(nestedOwners[0]),
      checksumAddress(nestedOwners[1]),
      checksumAddress(nonChecksummedMockWallet.address),
    ])
  })
})
