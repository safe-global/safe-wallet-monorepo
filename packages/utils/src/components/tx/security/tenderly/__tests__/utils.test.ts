import { ethers, toBeHex, ZeroAddress } from 'ethers'
import {
  getStateOverwrites,
  THRESHOLD_STORAGE_POSITION,
  THRESHOLD_OVERWRITE,
  NONCE_STORAGE_POSITION,
  GUARD_STORAGE_POSITION,
} from '../utils'
import { ImplementationVersionState, type SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import type { SafeTransaction, SafeSignature } from '@safe-global/types-kit'
import type { SingleTransactionSimulationParams } from '../utils'
import { faker } from '@faker-js/faker'
import { EthSafeSignature } from '@safe-global/protocol-kit'

describe('getStateOverwrites', () => {
  const mockOwners = [faker.finance.ethereumAddress(), faker.finance.ethereumAddress(), faker.finance.ethereumAddress()]
  const safeAddress = faker.finance.ethereumAddress()
  const mockSafe = {
    address: { value: safeAddress },
    chainId: '1',
    nonce: 5,
    threshold: 2,
    guard: { value: ZeroAddress },
    version: '1.4.1',
    owners: mockOwners.map((owner) => ({ value: owner })),
    implementation: { value: ZeroAddress },
    implementationVersionState: ImplementationVersionState.UP_TO_DATE,
    modules: [],
    fallbackHandler: { value: ZeroAddress },
    collectiblesTag: '0',
    txQueuedTag: '0',
    txHistoryTag: '0',
    messagesTag: '0',
  }
  const mockSafeWithGuard = {
    ...mockSafe,
    guard: { value: faker.finance.ethereumAddress() },
  }

  const mockSignature = new EthSafeSignature(mockOwners[0], faker.string.hexadecimal({ length: 66 }))

  const mockTransaction: SafeTransaction = {
    data: {
      to: faker.finance.ethereumAddress(),
      value: '0',
      data: '0x',
      operation: 0,
      safeTxGas: '0',
      baseGas: '0',
      gasPrice: '0',
      gasToken: ZeroAddress,
      refundReceiver: ZeroAddress,
      nonce: 5,
    },
    signatures: new Map<string, SafeSignature>(),
    getSignature: () => undefined,
    addSignature: () => {},
    encodedSignatures: () => '',
  }

  mockTransaction.signatures.set(mockOwners[0], mockSignature)

  it('should return empty object when no overwrites are needed', () => {
    // Threshold 2, one signature in the tx and the execution owner is the second owner
    const params: SingleTransactionSimulationParams = {
      safe: mockSafe,
      executionOwner: mockOwners[1],
      transactions: mockTransaction,
    }

    const result = getStateOverwrites(params)
    expect(result).toEqual({})
  })

  it('should include threshold overwrite when signatures are below threshold', () => {
    const params: SingleTransactionSimulationParams = {
      safe: { ...mockSafe, threshold: 3 },
      executionOwner: mockOwners[1],
      transactions: mockTransaction,
    }

    const result = getStateOverwrites(params)
    expect(result).toEqual({
      [THRESHOLD_STORAGE_POSITION]: THRESHOLD_OVERWRITE,
    })
  })

  it('should include nonce overwrite when transaction nonce is higher than safe nonce', () => {
    const params: SingleTransactionSimulationParams = {
      safe: mockSafe,
      executionOwner: mockOwners[1],
      transactions: { ...mockTransaction, data: { ...mockTransaction.data, nonce: 6 } },
    }

    const result = getStateOverwrites(params)
    expect(result).toEqual({
      [NONCE_STORAGE_POSITION]: toBeHex('0x6', 32),
    })
  })

  it('should include guard overwrite when safe has a guard', () => {
    const params: SingleTransactionSimulationParams = {
      safe: mockSafeWithGuard,
      executionOwner: mockOwners[1],
      transactions: mockTransaction,
    }

    const result = getStateOverwrites(params)
    expect(result).toEqual({
      [GUARD_STORAGE_POSITION]: toBeHex(ZeroAddress, 32),
    })
  })

  it('should combine multiple overwrites when multiple conditions are met', () => {
    const params: SingleTransactionSimulationParams = {
      safe: { ...mockSafe, guard: { value: faker.finance.ethereumAddress() }, threshold: 3 },
      executionOwner: mockOwners[1],
      transactions: {
        ...mockTransaction,
        data: {
          ...mockTransaction.data,
          nonce: 6,
        },
      },
    }

    const result = getStateOverwrites(params)
    expect(result).toEqual({
      [THRESHOLD_STORAGE_POSITION]: THRESHOLD_OVERWRITE,
      [NONCE_STORAGE_POSITION]: toBeHex('0x6', 32),
      [GUARD_STORAGE_POSITION]: toBeHex(ZeroAddress, 32),
    })
  })
})
