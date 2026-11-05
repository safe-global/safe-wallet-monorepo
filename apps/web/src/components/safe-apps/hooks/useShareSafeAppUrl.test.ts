import { useCurrentChain } from '@/hooks/useChains'
import { chainBuilder } from '@/tests/builders/chains'
import { renderHook } from '@/tests/test-utils'
import { useShareSafeAppUrl } from './useShareSafeAppUrl'

jest.mock('@/hooks/useChains', () => ({
  ...jest.requireActual('@/hooks/useChains'),
  useCurrentChain: jest.fn(),
}))

const APP_URL = 'https://apps-portal.safe.global/tx-builder'

describe('useShareSafeAppUrl', () => {
  it('links to the share page of the app on the current chain', () => {
    jest.mocked(useCurrentChain).mockReturnValue(chainBuilder().with({ shortName: 'eth' }).build())

    const { result } = renderHook(() => useShareSafeAppUrl(APP_URL))

    expect(result.current).toBe(
      `${window.location.origin}/share/safe-app?appUrl=https%3A%2F%2Fapps-portal.safe.global%2Ftx-builder&chain=eth`,
    )
  })

  it('leaves the chain empty while no chain is loaded', () => {
    jest.mocked(useCurrentChain).mockReturnValue(undefined)

    const { result } = renderHook(() => useShareSafeAppUrl(APP_URL))

    expect(result.current).toBe(
      `${window.location.origin}/share/safe-app?appUrl=https%3A%2F%2Fapps-portal.safe.global%2Ftx-builder&chain=`,
    )
  })
})
