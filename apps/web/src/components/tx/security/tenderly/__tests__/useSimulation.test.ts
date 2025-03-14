import { act } from 'react'
import type { SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'

import { renderHook, waitFor } from '@/tests/test-utils'
import { useSimulation } from '@/components/tx/security/tenderly/useSimulation'
import * as utils from '@/components/tx/security/tenderly/utils'
import * as useIsSafenetEnabled from '@/features/safenet/hooks/useIsSafenetEnabled'
import {
  FETCH_STATUS,
  type RequiredTenderlySimulation,
  type TenderlySimulation,
} from '@/components/tx/security/tenderly/types'
import { faker } from '@faker-js/faker'
import * as safenetStore from '@/store/safenet'
import { safeInfoBuilder } from '@/tests/builders/safe'
import { safeTxBuilder } from '@/tests/builders/safeTx'

const setupFetchStub = (data: any) => () => {
  return Promise.resolve({
    json: () => Promise.resolve(data),
    status: 200,
    ok: true,
  })
}

const originalGlobalFetch = global.fetch
describe('useSimulation()', () => {
  afterAll(() => {
    global.fetch = originalGlobalFetch
  })

  beforeEach(() => {
    jest.resetAllMocks()

    jest.spyOn(useIsSafenetEnabled, 'default').mockReturnValue(false)
  })

  it('should have the correct initial values', () => {
    const { result } = renderHook(() => useSimulation())
    const { simulation, simulationLink, requestError: simulationError, _simulationRequestStatus } = result.current

    expect(simulation).toBeUndefined()
    expect(simulationLink).not.toBeUndefined()
    expect(simulationError).toBeUndefined()
    expect(_simulationRequestStatus).toEqual(FETCH_STATUS.NOT_ASKED)
  })

  it('should set simulationError on errors and errors can be reset.', async () => {
    const safeAddress = '0x57CB13cbef735FbDD65f5f2866638c546464E45F'
    const chainId = '4'

    global.fetch = jest.fn()

    const mockFetch = jest.spyOn(global, 'fetch')

    mockFetch.mockImplementation(() => Promise.reject(new Error('404 not found')))

    jest.spyOn(utils, 'getSimulationPayload').mockImplementation(() =>
      Promise.resolve({
        input: '0x123',
        to: '0x123',
        network_id: chainId,
        from: safeAddress,
        gas: 0,
        // With gas price 0 account don't need token for gas
        gas_price: '0',
        state_objects: {
          [safeAddress]: {
            balance: '0x123',
          },
        },
        save: true,
        save_if_fails: true,
      }),
    )

    const { result } = renderHook(() => useSimulation())
    const { simulateTransaction } = result.current

    await act(async () =>
      simulateTransaction({
        transactions: [],
        safe: {
          address: {
            value: safeAddress,
          },
          chainId,
        } as SafeInfo,
        executionOwner: safeAddress,
      }),
    )

    await waitFor(() => {
      const { _simulationRequestStatus, requestError: simulationError } = result.current
      expect(_simulationRequestStatus).toEqual(FETCH_STATUS.ERROR)
      expect(simulationError).toEqual('404 not found')
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)

    await act(async () => {
      result.current.resetSimulation()
    })

    expect(result.current._simulationRequestStatus).toEqual(FETCH_STATUS.NOT_ASKED)
    expect(result.current.requestError).toBeUndefined()
  })

  it('should set simulation for executable transaction on success and simulation can be reset.', async () => {
    const safeAddress = '0x57CB13cbef735FbDD65f5f2866638c546464E45F'
    const chainId = '4'

    const mockAnswer: TenderlySimulation = {
      contracts: [],
      generated_access_list: [],
      transaction: {},
      simulation: {
        status: true,
        id: '123',
      },
    } as any as TenderlySimulation

    global.fetch = jest.fn().mockImplementation(setupFetchStub(mockAnswer))

    const mockFetch = jest.spyOn(global, 'fetch')

    jest.spyOn(utils, 'getSimulationPayload').mockImplementation(() =>
      Promise.resolve({
        input: '0x123',
        to: '0x123',
        network_id: chainId,
        from: safeAddress,
        gas: 0,
        // With gas price 0 account don't need token for gas
        gas_price: '0',
        state_objects: {
          [safeAddress]: {
            balance: '0x123',
          },
        },
        save: true,
        save_if_fails: true,
      }),
    )

    const { result } = renderHook(() => useSimulation())
    const { simulateTransaction } = result.current

    await act(async () =>
      simulateTransaction({
        transactions: [],
        safe: {
          address: {
            value: safeAddress,
          },
          chainId,
        } as SafeInfo,
        executionOwner: safeAddress,
      }),
    )

    await waitFor(() => {
      const { _simulationRequestStatus, simulation } = result.current
      expect(_simulationRequestStatus).toEqual(FETCH_STATUS.SUCCESS)
      expect(simulation?.simulation.status).toBeTruthy()
      expect(simulation?.simulation.id).toEqual('123')
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)

    await act(async () => {
      result.current.resetSimulation()
    })

    expect(result.current._simulationRequestStatus).toEqual(FETCH_STATUS.NOT_ASKED)
    expect(result.current.simulation).toBeUndefined()
  })

  it('should set simulation for not-executable transaction on success', async () => {
    const safeAddress = '0x57CB13cbef735FbDD65f5f2866638c546464E45F'
    const chainId = '4'

    const mockAnswer: TenderlySimulation = {
      contracts: [],
      generated_access_list: [],
      transaction: {},
      simulation: {
        status: true,
        id: '123',
      },
    } as any as TenderlySimulation

    global.fetch = jest.fn().mockImplementation(setupFetchStub(mockAnswer))

    const mockFetch = jest.spyOn(global, 'fetch')

    jest.spyOn(utils, 'getSimulationPayload').mockImplementation(() =>
      Promise.resolve({
        input: '0x123',
        to: '0x123',
        network_id: chainId,
        from: safeAddress,
        gas: 0,
        // With gas price 0 account don't need token for gas
        gas_price: '0',
        state_objects: {
          [safeAddress]: {
            balance: '0x123',
          },
        },
        save: true,
        save_if_fails: true,
      }),
    )

    const { result } = renderHook(() => useSimulation())
    const { simulateTransaction } = result.current

    await act(async () =>
      simulateTransaction({
        transactions: [],
        safe: {
          address: {
            value: safeAddress,
          },
          chainId,
        } as SafeInfo,
        executionOwner: safeAddress,
      }),
    )

    await waitFor(() => {
      const { _simulationRequestStatus, simulation } = result.current
      expect(_simulationRequestStatus).toEqual(FETCH_STATUS.SUCCESS)
      expect(simulation?.simulation.status).toBeTruthy()
      expect(simulation?.simulation.id).toEqual('123')
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('should use safenet simulation endpoint for safenet enabled Safes', async () => {
    jest.spyOn(useIsSafenetEnabled, 'default').mockReturnValue(true)

    const safeAddress = faker.finance.ethereumAddress()
    const chainId = '11155111'
    const mockAnswer: RequiredTenderlySimulation = {
      transaction: {
        call_trace: [],
      },
      simulation: {
        status: true,
        id: '123',
      },
    }
    const mockSafenetSimulateFn = jest.fn().mockResolvedValue({ data: mockAnswer })
    jest
      .spyOn(safenetStore, 'useLazySimulateSafenetTransactionQuery')
      .mockReturnValue([mockSafenetSimulateFn, { reset: jest.fn() }, {} as any])

    jest.spyOn(utils, 'getSimulationPayload').mockImplementation(() =>
      Promise.resolve({
        input: '0x1234',
        to: '0x1234',
        network_id: chainId,
        from: safeAddress,
        gas: 0,
        // With gas price 0 account don't need token for gas
        gas_price: '0',
        state_objects: {
          [safeAddress]: {
            balance: '0x1234',
          },
        },
        save: true,
        save_if_fails: true,
      }),
    )

    const { result } = renderHook(() => useSimulation())
    const { simulateTransaction } = result.current

    await act(async () =>
      simulateTransaction({
        transactions: safeTxBuilder().build(),
        safe: safeInfoBuilder()
          .with({ address: { value: safeAddress } })
          .build(),
        executionOwner: safeAddress,
      }),
    )

    await waitFor(() => {
      const { _simulationRequestStatus, simulation } = result.current
      expect(_simulationRequestStatus).toEqual(FETCH_STATUS.SUCCESS)
      expect(simulation?.simulation.status).toBeTruthy()
      expect(simulation?.simulation.id).toEqual('123')
    })

    expect(mockSafenetSimulateFn).toHaveBeenCalledTimes(1)

    await act(async () => {
      result.current.resetSimulation()
    })

    expect(result.current._simulationRequestStatus).toEqual(FETCH_STATUS.NOT_ASKED)
    expect(result.current.simulation).toBeUndefined()
  })
})
