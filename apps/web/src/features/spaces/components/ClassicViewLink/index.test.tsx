import { render, screen, fireEvent } from '@/tests/test-utils'
import ClassicViewLink from './'
import { disableClassicView, useIsClassicViewOptedIn } from '@/hooks/useClassicView'
import { AppRoutes } from '@/config/routes'
import { renderHook } from '@testing-library/react'

describe('ClassicViewLink', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
  })

  afterEach(() => {
    disableClassicView()
  })

  it('renders the "Use the old UI" copy with a trailing arrow icon', () => {
    render(<ClassicViewLink />, { routerProps: { query: {} } })

    const link = screen.getByTestId('classic-view-link')
    expect(link).toHaveTextContent('Use the old UI')
    expect(link.querySelector('svg')).toBeInTheDocument()
  })

  it('enables classic view and redirects to /welcome/accounts when no ?next= is present', () => {
    const replace = jest.fn()
    render(<ClassicViewLink />, { routerProps: { replace, query: {} } })

    fireEvent.click(screen.getByTestId('classic-view-link'))

    expect(replace).toHaveBeenCalledWith({ pathname: AppRoutes.welcome.accounts })
    expect(renderHook(() => useIsClassicViewOptedIn()).result.current).toBe(true)
  })

  it('honours a sanitised ?next= URL when present', () => {
    const replace = jest.fn()
    render(<ClassicViewLink />, {
      routerProps: { replace, query: { next: '/home?safe=eth:0x1234' } },
    })

    fireEvent.click(screen.getByTestId('classic-view-link'))

    expect(replace).toHaveBeenCalledWith({ pathname: '/home', query: { safe: 'eth:0x1234' } })
  })

  it('rejects an unsafe ?next= (protocol-relative URL) and falls back to /welcome/accounts', () => {
    const replace = jest.fn()
    render(<ClassicViewLink />, {
      routerProps: { replace, query: { next: '//evil.example.com/steal' } },
    })

    fireEvent.click(screen.getByTestId('classic-view-link'))

    expect(replace).toHaveBeenCalledWith({ pathname: AppRoutes.welcome.accounts })
  })
})
