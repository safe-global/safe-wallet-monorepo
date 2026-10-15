import { faker } from '@faker-js/faker'
import type { JsonRpcProvider } from 'ethers'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { renderHook, waitFor } from '@/tests/test-utils'
import { chainBuilder } from '@/tests/builders/chains'
import * as useChains from '@/hooks/useChains'
import * as useChainId from '@/hooks/useChainId'
import { createWeb3ReadOnly } from '@/hooks/wallets/web3'
import * as web3ReadOnly from '@/hooks/wallets/web3ReadOnly'
import { _clearSharedReadOnlyProviders } from '@/hooks/wallets/sharedReadOnlyProvider'
import { initialState as settingsInitialState } from '@/store/settingsSlice'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { logError } from '@/services/exceptions'
import { useReadOnlyProvider } from '../useReadOnlyProvider'

jest.mock('@/hooks/wallets/web3', () => ({ createWeb3ReadOnly: jest.fn() }))
jest.mock('@/services/exceptions', () => ({ logError: jest.fn() }))

const mockCreate = createWeb3ReadOnly as jest.MockedFunction<typeof createWeb3ReadOnly>

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
    _clearSharedReadOnlyProviders()
    jest.spyOn(useChainId, 'default').mockReturnValue('1')
  })

  it("reuses the current chain's provider", () => {
    mockChain()
    const globalProvider = fakeProvider()
    jest.spyOn(useChainId, 'default').mockReturnValue('11155111')
    jest.spyOn(web3ReadOnly, 'useWeb3ReadOnly').mockReturnValue(globalProvider)
    const { result } = renderHook(() => useReadOnlyProvider('11155111'))
    expect(result.current.provider).toBe(globalProvider)
    expect(mockCreate).not.toHaveBeenCalled()
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
    await waitFor(() => expect(later.current.provider).toBe(result.current[0].provider))
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
    const loadError = new Error('chunk failed')
    jest.doMock('@/hooks/wallets/sharedReadOnlyProvider', () => {
      throw loadError
    })
    mockChain()
    const { result } = renderHook(() => useReadOnlyProvider('11155111'))
    await waitFor(() => expect(result.current.error).toBe(loadError))
    expect(result.current.provider).toBeUndefined()
    expect(logError).toHaveBeenCalledWith(ErrorCodes._654, loadError)
    jest.dontMock('@/hooks/wallets/sharedReadOnlyProvider')
  })
})
