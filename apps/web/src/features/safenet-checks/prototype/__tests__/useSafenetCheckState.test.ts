import { act, renderHook } from '@/tests/test-utils'
import { useCurrentChain, useHasFeature } from '@/hooks/useChains'
import { chainBuilder } from '@/tests/builders/chains'
import { useSafenetCheckState } from '../useSafenetCheckState'
import { useSafenetScenario } from '../useSafenetScenario'

jest.mock('@/hooks/useChains', () => ({
  useHasFeature: jest.fn(),
  useCurrentChain: jest.fn(),
}))

const mockUseHasFeature = useHasFeature as jest.MockedFunction<typeof useHasFeature>
const mockChainId = (chainId: string) =>
  (useCurrentChain as jest.Mock).mockReturnValue(chainBuilder().with({ chainId }).build())

describe('useSafenetCheckState', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    window.localStorage.clear()
    mockUseHasFeature.mockReturnValue(true)
    mockChainId('1')
  })

  afterEach(() => jest.useRealTimers())

  it('returns nothing while the prototype flag is off', () => {
    mockUseHasFeature.mockReturnValue(false)
    const { result } = renderHook(() => useSafenetCheckState('co-signer'))
    expect(result.current).toBeNull()
  })

  it('returns nothing outside Ethereum and Gnosis Chain', () => {
    mockChainId('137')
    const { result } = renderHook(() => useSafenetCheckState('co-signer'))
    expect(result.current).toBeNull()
  })

  it.each(['1', '100'])('runs on chain %s', (chainId) => {
    mockChainId(chainId)
    const { result } = renderHook(() => useSafenetCheckState('co-signer'))
    expect(result.current).not.toBeNull()
  })

  it('ticks from submitted through checking to the outcome', () => {
    const { result } = renderHook(() => {
      const controls = useSafenetScenario()
      return { controls, check: useSafenetCheckState('co-signer') }
    })

    act(() => result.current.controls.updateScenario({ timing: 'about-60s', outcome: 'risk' }))
    expect(result.current.check?.state.phase).toBe('submitted')

    act(() => jest.advanceTimersByTime(5_000))
    expect(result.current.check?.state.phase).toBe('checking')

    act(() => jest.advanceTimersByTime(60_000))
    expect(result.current.check?.state.phase).toBe('risk')
  })
})
