import type { JsonRpcProvider } from 'ethers'
import { chainBuilder } from '@/tests/builders/chains'
import { createWeb3ReadOnly } from '@/hooks/wallets/web3'
import { _clearSharedReadOnlyProviders, getSharedReadOnlyProvider } from '../sharedReadOnlyProvider'

jest.mock('@/hooks/wallets/web3', () => ({ createWeb3ReadOnly: jest.fn() }))

const mockCreate = createWeb3ReadOnly as jest.MockedFunction<typeof createWeb3ReadOnly>
const chain = chainBuilder().with({ chainId: '11155111' }).build()
const fakeProvider = () => ({}) as JsonRpcProvider

describe('getSharedReadOnlyProvider', () => {
  beforeEach(() => {
    mockCreate.mockReset()
    _clearSharedReadOnlyProviders()
  })

  it('returns one provider per chain', () => {
    mockCreate.mockImplementation(fakeProvider)
    const first = getSharedReadOnlyProvider(chain)
    expect(getSharedReadOnlyProvider(chain)).toBe(first)
    expect(mockCreate).toHaveBeenCalledTimes(1)
    expect(mockCreate).toHaveBeenCalledWith(chain, undefined)
  })

  it('keeps a separate provider per custom RPC', () => {
    mockCreate.mockImplementation(fakeProvider)
    const standard = getSharedReadOnlyProvider(chain)
    const custom = getSharedReadOnlyProvider(chain, 'https://custom.rpc')
    expect(custom).not.toBe(standard)
    expect(mockCreate).toHaveBeenLastCalledWith(chain, 'https://custom.rpc')
  })

  it('does not cache a chain without an RPC', () => {
    mockCreate.mockReturnValue(undefined)
    expect(getSharedReadOnlyProvider(chain)).toBeUndefined()
    getSharedReadOnlyProvider(chain)
    expect(mockCreate).toHaveBeenCalledTimes(2)
  })
})
