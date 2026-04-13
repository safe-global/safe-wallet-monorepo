import { renderHookWithStore, createTestStore, act } from '@/src/tests/test-utils'
import { faker } from '@faker-js/faker'
import { useChainSync } from '../useChainSync'
import { switchActiveChain } from '@/src/store/activeSafeSlice'

const mockSwitchNetwork = jest.fn().mockResolvedValue(undefined)

jest.mock('@reown/appkit-react-native', () => ({
  useAppKit: () => ({ switchNetwork: mockSwitchNetwork }),
  useAccount: () => ({ chainId: 1 }),
}))

jest.mock('@/src/utils/logger', () => ({
  __esModule: true,
  default: { warn: jest.fn() },
}))

const safeAddress = faker.finance.ethereumAddress() as `0x${string}`

describe('useChainSync', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('does not switch network on initial render', () => {
    const store = createTestStore({ activeSafe: { address: safeAddress, chainId: '1' } })

    renderHookWithStore(() => useChainSync(), store)

    expect(mockSwitchNetwork).not.toHaveBeenCalled()
  })

  it('switches network when active safe chainId changes', () => {
    const store = createTestStore({ activeSafe: { address: safeAddress, chainId: '1' } })

    renderHookWithStore(() => useChainSync(), store)

    act(() => {
      store.dispatch(switchActiveChain({ chainId: '137' }))
    })

    expect(mockSwitchNetwork).toHaveBeenCalledWith('eip155:137')
  })

  it('does not switch network when chainId stays the same', () => {
    const store = createTestStore({ activeSafe: { address: safeAddress, chainId: '1' } })

    renderHookWithStore(() => useChainSync(), store)

    act(() => {
      store.dispatch(switchActiveChain({ chainId: '1' }))
    })

    expect(mockSwitchNetwork).not.toHaveBeenCalled()
  })

  it('does not switch network when active safe is null', () => {
    const store = createTestStore({ activeSafe: null })

    renderHookWithStore(() => useChainSync(), store)

    expect(mockSwitchNetwork).not.toHaveBeenCalled()
  })

  it('swallows errors from switchNetwork', () => {
    mockSwitchNetwork.mockRejectedValueOnce(new Error('Switch failed'))
    const store = createTestStore({ activeSafe: { address: safeAddress, chainId: '1' } })

    renderHookWithStore(() => useChainSync(), store)

    act(() => {
      store.dispatch(switchActiveChain({ chainId: '137' }))
    })

    expect(mockSwitchNetwork).toHaveBeenCalledWith('eip155:137')
  })
})
