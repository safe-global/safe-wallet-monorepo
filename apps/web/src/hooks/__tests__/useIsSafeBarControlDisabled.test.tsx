import type { ReactNode } from 'react'
import { renderHook } from '@testing-library/react'
import { useRouter } from 'next/router'
import { TxModalContext, type TxModalContextType } from '@/components/tx-flow'
import { AppRoutes } from '@/config/routes'
import { useIsSafeBarControlDisabled } from '../useIsSafeBarControlDisabled'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

const mockUseRouter = useRouter as jest.Mock

function setRoute(pathname: string, query: Record<string, string> = {}) {
  mockUseRouter.mockReturnValue({ pathname, query })
}

function wrapperWithTxFlow(txFlow: TxModalContextType['txFlow']) {
  const value: TxModalContextType = {
    txFlow,
    setTxFlow: jest.fn(),
    setFullWidth: jest.fn(),
  }
  return function Wrapper({ children }: { children: ReactNode }) {
    return <TxModalContext.Provider value={value}>{children}</TxModalContext.Provider>
  }
}

describe('useIsSafeBarControlDisabled', () => {
  beforeEach(() => {
    setRoute('/')
  })

  it('returns false on an unrelated route with no tx flow', () => {
    const { result } = renderHook(() => useIsSafeBarControlDisabled())
    expect(result.current).toBe(false)
  })

  it('returns true when a tx flow is open, regardless of the route', () => {
    const { result } = renderHook(() => useIsSafeBarControlDisabled(), {
      wrapper: wrapperWithTxFlow(<div data-testid="active-tx-flow" />),
    })
    expect(result.current).toBe(true)
  })

  it('returns true on /apps/open when appUrl is present', () => {
    setRoute(AppRoutes.apps.open, { appUrl: 'https://example-safe-app.test' })
    const { result } = renderHook(() => useIsSafeBarControlDisabled())
    expect(result.current).toBe(true)
  })

  it('returns false on /apps/open without an appUrl', () => {
    setRoute(AppRoutes.apps.open)
    const { result } = renderHook(() => useIsSafeBarControlDisabled())
    expect(result.current).toBe(false)
  })

  it('returns false on /apps even with a safe query', () => {
    setRoute(AppRoutes.apps.index, { safe: 'eth:0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' })
    const { result } = renderHook(() => useIsSafeBarControlDisabled())
    expect(result.current).toBe(false)
  })

  it('returns false on /apps/custom', () => {
    setRoute(AppRoutes.apps.custom, { safe: 'eth:0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' })
    const { result } = renderHook(() => useIsSafeBarControlDisabled())
    expect(result.current).toBe(false)
  })

  it('returns false on /apps/bookmarked', () => {
    setRoute(AppRoutes.apps.bookmarked)
    const { result } = renderHook(() => useIsSafeBarControlDisabled())
    expect(result.current).toBe(false)
  })

  it('tx flow wins over a non-matching apps route', () => {
    setRoute(AppRoutes.apps.custom)
    const { result } = renderHook(() => useIsSafeBarControlDisabled(), {
      wrapper: wrapperWithTxFlow(<div data-testid="active-tx-flow" />),
    })
    expect(result.current).toBe(true)
  })
})
