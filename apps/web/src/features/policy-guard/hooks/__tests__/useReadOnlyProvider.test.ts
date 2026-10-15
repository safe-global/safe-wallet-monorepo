import { faker } from '@faker-js/faker'
import type { JsonRpcProvider } from 'ethers'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { renderHook, waitFor } from '@/tests/test-utils'
import { chainBuilder } from '@/tests/builders/chains'
import * as useChains from '@/hooks/useChains'
import { createWeb3ReadOnly } from '@/hooks/wallets/web3'
import { initialState as settingsInitialState } from '@/store/settingsSlice'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { logError } from '@/services/exceptions'
import { useReadOnlyProvider } from '../useReadOnlyProvider'

jest.mock('@/hooks/wallets/web3', () => ({ createWeb3ReadOnly: jest.fn() }))
jest.mock('@/services/exceptions', () => ({ logError: jest.fn() }))

const mockCreate = createWeb3ReadOnly as jest.MockedFunction<typeof createWeb3ReadOnly>

// A unique RPC per test keeps the module-level provider cache from leaking between tests
const mockChain = (rpcUrl = faker.internet.url()): Chain => {
  const chain = chainBuilder()
    .with({ chainId: '11155111', rpcUri: { authentication: 'NO_AUTHENTICATION', value: rpcUrl } })
    .build()
  jest.spyOn(useChains, 'useChain').mockImplementation((chainId) => (chainId === chain.chainId ? chain : undefined))
  return chain
}

const fakeProvider = () => ({ id: faker.string.uuid() }) as unknown as JsonRpcProvider

describe('useReadOnlyProvider', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    mockCreate.mockReset()
  })

  it('returns no provider without a chain', () => {
    mockChain()
    const { result } = renderHook(() => useReadOnlyProvider(undefined))
    expect(result.current.provider).toBeUndefined()
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('creates a provider for the chain', async () => {
    const chain = mockChain()
    const provider = fakeProvider()
    mockCreate.mockReturnValue(provider)
    const { result } = renderHook(() => useReadOnlyProvider('11155111'))
    await waitFor(() => expect(result.current.provider).toBe(provider))
    expect(mockCreate).toHaveBeenCalledWith(chain, undefined)
  })

  it("honours the user's custom RPC", async () => {
    const chain = mockChain()
    const customRpc = faker.internet.url()
    mockCreate.mockReturnValue(fakeProvider())
    renderHook(() => useReadOnlyProvider('11155111'), {
      initialReduxState: {
        settings: { ...settingsInitialState, env: { ...settingsInitialState.env, rpc: { '11155111': customRpc } } },
      },
    })
    await waitFor(() => expect(mockCreate).toHaveBeenCalledWith(chain, customRpc))
  })

  it('shares one provider between Safes on the same chain', async () => {
    mockChain()
    mockCreate.mockImplementation(fakeProvider)
    const { result } = renderHook(() => [useReadOnlyProvider('11155111'), useReadOnlyProvider('11155111')])
    await waitFor(() => expect(result.current[0].provider).toBeDefined())
    await waitFor(() => expect(result.current[1].provider).toBe(result.current[0].provider))

    const { result: later } = renderHook(() => useReadOnlyProvider('11155111'))
    expect(later.current.provider).toBe(result.current[0].provider)
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })

  it('returns no provider when the chain has no RPC', async () => {
    mockChain('')
    mockCreate.mockReturnValue(undefined)
    const { result } = renderHook(() => useReadOnlyProvider('11155111'))
    await waitFor(() => expect(mockCreate).toHaveBeenCalled())
    expect(result.current.provider).toBeUndefined()
  })

  it('logs and returns an error when the provider cannot be loaded', async () => {
    mockChain()
    const loadError = new Error('chunk failed')
    mockCreate.mockImplementation(() => {
      throw loadError
    })
    const { result } = renderHook(() => useReadOnlyProvider('11155111'))
    await waitFor(() => expect(result.current.error).toBe(loadError))
    expect(result.current.provider).toBeUndefined()
    expect(logError).toHaveBeenCalledWith(ErrorCodes._654, loadError)
  })
})
