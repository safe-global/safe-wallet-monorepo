import { act } from 'react'
import type { ReactNode } from 'react'
import type Safe from '@safe-global/protocol-kit'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { SafeScopeContext } from '@/components/tx-flow/safe-scope/context'
import type { SafeScope } from '@/components/tx-flow/safe-scope/types'

import { renderHook, waitFor } from '@/tests/test-utils'
import { useSimulation } from '@/components/tx/security/tenderly/useSimulation'
import * as utils from '@/components/tx/security/tenderly/utils'
import { FETCH_STATUS, type TenderlySimulation } from '@safe-global/utils/components/tx/security/tenderly/types'

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
  })

  it('should have the correct initial values', () => {
    const { result } = renderHook(() => useSimulation())
    const { simulationData, simulationLink, requestError: simulationError, _simulationRequestStatus } = result.current

    expect(simulationData).toBeUndefined()
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
        } as SafeState,
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
        } as SafeState,
        executionOwner: safeAddress,
      }),
    )

    await waitFor(() => {
      const { _simulationRequestStatus, simulationData } = result.current
      expect(_simulationRequestStatus).toEqual(FETCH_STATUS.SUCCESS)
      expect(simulationData?.simulation.status).toBeTruthy()
      expect(simulationData?.simulation.id).toEqual('123')
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)

    await act(async () => {
      result.current.resetSimulation()
    })

    expect(result.current._simulationRequestStatus).toEqual(FETCH_STATUS.NOT_ASKED)
    expect(result.current.simulationData).toBeUndefined()
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
        } as SafeState,
        executionOwner: safeAddress,
      }),
    )

    await waitFor(() => {
      const { _simulationRequestStatus, simulationData } = result.current
      expect(_simulationRequestStatus).toEqual(FETCH_STATUS.SUCCESS)
      expect(simulationData?.simulation.status).toBeTruthy()
      expect(simulationData?.simulation.id).toEqual('123')
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('builds the payload for the scoped Safe inside a Space-level flow', async () => {
    const scope: SafeScope = {
      chainId: '11155111',
      safeAddress: '0x0000000000000000000000000000000000000456',
      scopeKey: '11155111:0x0000000000000000000000000000000000000456',
      safeLoaded: true,
      safeLoading: false,
      sdk: {} as Safe,
    }
    const getSimulationPayloadSpy = jest
      .spyOn(utils, 'getSimulationPayload')
      .mockRejectedValue(new Error('stop after the payload'))

    const { result } = renderHook(() => useSimulation(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <SafeScopeContext.Provider value={{ scope, setScope: jest.fn(), clearScope: jest.fn() }}>
          {children}
        </SafeScopeContext.Provider>
      ),
    })

    await act(async () =>
      result.current.simulateTransaction({
        transactions: [],
        safe: { address: { value: scope.safeAddress }, chainId: scope.chainId } as SafeState,
        executionOwner: scope.safeAddress,
      }),
    )

    await waitFor(() => expect(getSimulationPayloadSpy).toHaveBeenCalledWith(expect.anything(), scope))
  })

  it('builds the payload without a scope outside a Space-level flow', async () => {
    const getSimulationPayloadSpy = jest
      .spyOn(utils, 'getSimulationPayload')
      .mockRejectedValue(new Error('stop after the payload'))

    const { result } = renderHook(() => useSimulation())

    await act(async () =>
      result.current.simulateTransaction({
        transactions: [],
        safe: { address: { value: '0x0000000000000000000000000000000000000456' }, chainId: '4' } as SafeState,
        executionOwner: '0x0000000000000000000000000000000000000456',
      }),
    )

    await waitFor(() => expect(getSimulationPayloadSpy).toHaveBeenCalledWith(expect.anything(), undefined))
  })
})
