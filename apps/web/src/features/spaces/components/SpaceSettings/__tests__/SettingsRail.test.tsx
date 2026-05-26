import { render, screen } from '@testing-library/react'
import SettingsRail from '../SettingsRail'
import { AppRoutes } from '@/config/routes'

const mockRouterQuery: { spaceId?: string } = {}

jest.mock('next/router', () => ({
  useRouter: () => ({ query: mockRouterQuery }),
}))

const setSpaceId = (id: string | undefined) => {
  if (id === undefined) delete mockRouterQuery.spaceId
  else mockRouterQuery.spaceId = id
}

const parseHref = (anchor: HTMLAnchorElement) => {
  const url = new URL(anchor.href, 'http://localhost')
  return {
    pathname: url.pathname,
    spaceId: url.searchParams.get('spaceId'),
  }
}

describe('SettingsRail', () => {
  beforeEach(() => {
    setSpaceId(undefined)
  })

  it('marks the active page with aria-current="page"', () => {
    setSpaceId('42')
    render(<SettingsRail activePage="general" />)

    expect(screen.getByTestId('settings-rail-general')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByTestId('settings-rail-account')).not.toHaveAttribute('aria-current')
    expect(screen.getByTestId('settings-rail-about')).not.toHaveAttribute('aria-current')
  })

  it('updates the active page when activePage prop changes', () => {
    setSpaceId('42')
    const { rerender } = render(<SettingsRail activePage="general" />)
    rerender(<SettingsRail activePage="about" />)

    expect(screen.getByTestId('settings-rail-general')).not.toHaveAttribute('aria-current')
    expect(screen.getByTestId('settings-rail-about')).toHaveAttribute('aria-current', 'page')
  })

  it('propagates spaceId from router query into every link', () => {
    setSpaceId('42')
    render(<SettingsRail activePage="general" />)

    const general = parseHref(screen.getByTestId('settings-rail-general') as HTMLAnchorElement)
    const account = parseHref(screen.getByTestId('settings-rail-account') as HTMLAnchorElement)
    const about = parseHref(screen.getByTestId('settings-rail-about') as HTMLAnchorElement)

    expect(general).toEqual({ pathname: AppRoutes.spaces.settingsGeneral, spaceId: '42' })
    expect(account).toEqual({ pathname: AppRoutes.spaces.settingsAccount, spaceId: '42' })
    expect(about).toEqual({ pathname: AppRoutes.spaces.settingsAbout, spaceId: '42' })
  })

  it('omits the spaceId query when none is present in the router', () => {
    render(<SettingsRail activePage="general" />)

    const general = parseHref(screen.getByTestId('settings-rail-general') as HTMLAnchorElement)
    expect(general.pathname).toBe(AppRoutes.spaces.settingsGeneral)
    expect(general.spaceId).toBeNull()
  })

  it('ignores a non-string spaceId query value', () => {
    // next/router can return string[] for repeated query params
    ;(mockRouterQuery as unknown as { spaceId: string[] }).spaceId = ['42', '43']
    render(<SettingsRail activePage="general" />)

    const general = parseHref(screen.getByTestId('settings-rail-general') as HTMLAnchorElement)
    expect(general.spaceId).toBeNull()
  })
})
