import { ethers, toBeHex, ZeroAddress } from 'ethers'
import {
  getStateOverwrites,
  THRESHOLD_STORAGE_POSITION,
  THRESHOLD_OVERWRITE,
  NONCE_STORAGE_POSITION,
  GUARD_STORAGE_POSITION,
  getCallTraceErrors,
  getSimulationStatus,
} from '../utils'
import { ImplementationVersionState, type SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import type { SafeTransaction, SafeSignature } from '@safe-global/types-kit'
import type { SingleTransactionSimulationParams } from '../utils'
import { faker } from '@faker-js/faker'
import { EthSafeSignature } from '@safe-global/protocol-kit'
import { FETCH_STATUS, type TenderlySimulation } from '../types'
import type { UseSimulationReturn } from '../useSimulation'

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

describe('getCallTraceErrors', () => {
  it('should return empty array if no simulation', () => {
    expect(getCallTraceErrors(undefined)).toEqual([])
  })

  it('should return empty array if simulation status is false', () => {
    const simulation: TenderlySimulation = {
      simulation: { status: false },
      transaction: { call_trace: [] },
    } as any
    expect(getCallTraceErrors(simulation)).toEqual([])
  })

  it('should return calls with errors', () => {
    const simulation: TenderlySimulation = {
      simulation: { status: true },
      transaction: {
        call_trace: [
          { error: undefined },
          { error: 'Execution reverted' },
          { error: undefined },
          { error: 'Out of gas' },
        ],
      },
    } as any
    const errors = getCallTraceErrors(simulation)
    expect(errors).toHaveLength(2)
    expect(errors[0].error).toBe('Execution reverted')
    expect(errors[1].error).toBe('Out of gas')
  })
})

describe('getSimulationStatus', () => {
  it('should return loading status', () => {
    const simulation: UseSimulationReturn = {
      _simulationRequestStatus: FETCH_STATUS.LOADING,
      simulationData: undefined,
    } as any
    const status = getSimulationStatus(simulation)
    expect(status).toEqual({
      isLoading: true,
      isFinished: false,
      isSuccess: false,
      isCallTraceError: false,
      isError: false,
    })
  })

  it('should return error status', () => {
    const simulation: UseSimulationReturn = {
      _simulationRequestStatus: FETCH_STATUS.ERROR,
      simulationData: undefined,
    } as any
    const status = getSimulationStatus(simulation)
    expect(status).toEqual({
      isLoading: false,
      isFinished: true,
      isSuccess: false,
      isCallTraceError: false,
      isError: true,
    })
  })

  it('should return success status without errors', () => {
    const simulation: UseSimulationReturn = {
      _simulationRequestStatus: FETCH_STATUS.SUCCESS,
      simulationData: {
        simulation: { status: true },
        transaction: { call_trace: [] },
      } as any,
    } as any
    const status = getSimulationStatus(simulation)
    expect(status).toEqual({
      isLoading: false,
      isFinished: true,
      isSuccess: true,
      isCallTraceError: false,
      isError: false,
    })
  })

  it('should return partial revert status when simulation succeeds with call trace errors', () => {
    const simulation: UseSimulationReturn = {
      _simulationRequestStatus: FETCH_STATUS.SUCCESS,
      simulationData: {
        simulation: { status: true },
        transaction: {
          call_trace: [{ error: undefined }, { error: 'Execution reverted' }],
        },
      } as any,
    } as any
    const status = getSimulationStatus(simulation)
    expect(status).toEqual({
      isLoading: false,
      isFinished: true,
      isSuccess: true,
      isCallTraceError: true,
      isError: false,
    })
  })

  it('should return failed status when simulation status is false', () => {
    const simulation: UseSimulationReturn = {
      _simulationRequestStatus: FETCH_STATUS.SUCCESS,
      simulationData: {
        simulation: { status: false },
        transaction: { call_trace: [] },
      } as any,
    } as any
    const status = getSimulationStatus(simulation)
    expect(status).toEqual({
      isLoading: false,
      isFinished: true,
      isSuccess: false,
      isCallTraceError: false,
      isError: false,
    })
  })
})
