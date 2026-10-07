import { act, renderHook } from '@/tests/test-utils'
import { useCurrentChain, useHasFeature } from '@/hooks/useChains'
import { chainBuilder } from '@/tests/builders/chains'
import { TxEvent, txDispatch } from '@/services/tx/txEvents'
import { clearCheckStarts, recordCheckStart, startRecordingCheckStarts, stopRecordingCheckStarts } from '../checkStarts'
import { useSafenetCheckState } from '../useSafenetCheckState'
import { useSafenetScenario } from '../useSafenetScenario'

jest.mock('@/hooks/useChains', () => ({
  useHasFeature: jest.fn(),
  useCurrentChain: jest.fn(),
}))

const SAFE_TX_HASH = `0x${'ab'.repeat(32)}`
const TX_ID = `multisig_0x81e84a1e121Add6514170396E864033e087E6216_${SAFE_TX_HASH}`
const PROPOSED = { txId: TX_ID, nonce: 1, chainId: '1', safeAddress: '0x81e84a1e121Add6514170396E864033e087E6216' }

const mockUseHasFeature = useHasFeature as jest.MockedFunction<typeof useHasFeature>
const mockChainId = (chainId: string) =>
  (useCurrentChain as jest.Mock).mockReturnValue(chainBuilder().with({ chainId }).build())

describe('useSafenetCheckState', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    window.localStorage.clear()
    clearCheckStarts()
    mockUseHasFeature.mockReturnValue(true)
    mockChainId('1')
  })

  afterEach(() => {
    stopRecordingCheckStarts()
    jest.useRealTimers()
  })

  it('returns nothing while the prototype flag is off', () => {
    mockUseHasFeature.mockReturnValue(false)
    const { result } = renderHook(() => useSafenetCheckState(SAFE_TX_HASH))
    expect(result.current).toBeNull()
  })

  it('returns nothing outside Ethereum and Gnosis Chain', () => {
    mockChainId('137')
    const { result } = renderHook(() => useSafenetCheckState(SAFE_TX_HASH))
    expect(result.current).toBeNull()
  })

  it.each(['1', '100', '11155111'])('runs on chain %s', (chainId) => {
    mockChainId(chainId)
    const { result } = renderHook(() => useSafenetCheckState(SAFE_TX_HASH))
    expect(result.current).not.toBeNull()
  })

  it('has no check for a transaction nobody has signed, however long the flow stays open', () => {
    const { result } = renderHook(() => useSafenetCheckState(undefined))
    expect(result.current?.state.phase).toBe('before-sign')

    act(() => jest.advanceTimersByTime(5 * 60_000))
    expect(result.current?.state.phase).toBe('before-sign')
  })

  it('shows a transaction signed elsewhere as already checked', () => {
    const { result } = renderHook(() => useSafenetCheckState(SAFE_TX_HASH))
    expect(result.current?.state.phase).toBe('no-issues')
  })

  it('starts the check at the first signature and runs it through to the outcome', () => {
    startRecordingCheckStarts()
    const { result } = renderHook(() => useSafenetCheckState(SAFE_TX_HASH))

    act(() => txDispatch(TxEvent.PROPOSED, PROPOSED))
    expect(result.current?.state.phase).toBe('submitted')

    act(() => jest.advanceTimersByTime(5_000))
    expect(result.current?.state.phase).toBe('checking')

    act(() => jest.advanceTimersByTime(60_000))
    expect(result.current?.state.phase).toBe('no-issues')
  })

  it('never restarts a running check for the same transaction', () => {
    startRecordingCheckStarts()
    const { result } = renderHook(() => useSafenetCheckState(SAFE_TX_HASH))

    act(() => txDispatch(TxEvent.PROPOSED, PROPOSED))
    act(() => jest.advanceTimersByTime(30_000))
    const startedAtMs = result.current?.state.startedAtMs

    act(() => txDispatch(TxEvent.PROPOSED, PROPOSED))
    act(() => recordCheckStart(SAFE_TX_HASH))
    expect(result.current?.state.startedAtMs).toBe(startedAtMs)
    expect(result.current?.state.phase).toBe('checking')
  })

  it('restarts every check from the dev scenario', () => {
    const { result } = renderHook(() => ({
      controls: useSafenetScenario(),
      check: useSafenetCheckState(SAFE_TX_HASH),
    }))

    act(() => result.current.controls.updateScenario({ timing: 'about-60s', outcome: 'risk' }))
    expect(result.current.check?.state.phase).toBe('submitted')

    act(() => jest.advanceTimersByTime(65_000))
    expect(result.current.check?.state.phase).toBe('risk')
  })
})
