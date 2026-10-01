import { renderHook } from '@/tests/test-utils'
import { Severity, SafeStatus } from '@safe-global/utils/features/safe-shield/types'
import type { RootState } from '@/store'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import useUntrustedSafeAnalysis from '../useUntrustedSafeAnalysis'

const safe = extendedSafeInfoBuilder().build()
const safeAddress = safe.address.value
const chainId = safe.chainId

const loadedSafeState = { safeInfo: { data: safe, loaded: true, loading: false } } as unknown as Partial<RootState>

const renderAnalysis = (initialReduxState?: Partial<RootState>) =>
  renderHook(() => useUntrustedSafeAnalysis(), { initialReduxState })

describe('useUntrustedSafeAnalysis', () => {
  it('returns no analysis while no Safe is available', () => {
    const { result } = renderAnalysis()

    expect(result.current.safeAnalysis).toBeNull()
  })

  it('returns no analysis while the selected Safe is still loading', () => {
    const { result } = renderAnalysis({
      safeInfo: { data: undefined, loaded: false, loading: true },
    } as unknown as Partial<RootState>)

    expect(result.current.safeAnalysis).toBeNull()
  })

  it('flags a loaded Safe that is not in the user accounts', () => {
    const { result } = renderAnalysis(loadedSafeState)

    expect(result.current.safeAnalysis).toEqual({
      severity: Severity.CRITICAL,
      type: SafeStatus.UNTRUSTED,
      title: 'Not in your accounts',
      description: expect.any(String),
    })
  })

  it('returns no analysis for a pinned Safe', () => {
    const { result } = renderAnalysis({
      ...loadedSafeState,
      addedSafes: { [chainId]: { [safeAddress]: { owners: safe.owners, threshold: safe.threshold } } },
    } as unknown as Partial<RootState>)

    expect(result.current.safeAnalysis).toBeNull()
  })
})
