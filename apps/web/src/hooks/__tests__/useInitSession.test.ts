import { renderHook } from '@/tests/test-utils'
import { useInitSession } from '@/hooks/useInitSession'
import { useAppSelector } from '@/store'
import { selectSession } from '@/store/sessionSlice'
import * as useChainId from '@/hooks/useChainId'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'

const renderSession = () =>
  renderHook(() => {
    useInitSession()
    return useAppSelector(selectSession)
  })

describe('useInitSession', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    // sessionSlice is persisted, so makeStore would preload the previous test's lastChainId
    localStorage.clear()
    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safe: extendedSafeInfoBuilder().build(),
      safeAddress: '',
      safeLoaded: false,
      safeLoading: false,
      safeError: undefined,
    })
  })

  it('remembers the chain named by a resolved URL prefix', () => {
    jest.spyOn(useChainId, 'useUrlChain').mockReturnValue({ status: 'resolved', chainId: '4663' })

    const { result } = renderSession()

    expect(result.current.lastChainId).toBe('4663')
  })

  // lastChainId is persisted, so a prefix we can't resolve must not be written through
  // as the user's last chain.
  it.each(['unknown', 'pending'] as const)('does not remember a %s URL prefix', (status) => {
    jest.spyOn(useChainId, 'useUrlChain').mockReturnValue({ status, shortName: 'rhood' })

    const { result } = renderSession()

    expect(result.current.lastChainId).toBe('')
  })
})
