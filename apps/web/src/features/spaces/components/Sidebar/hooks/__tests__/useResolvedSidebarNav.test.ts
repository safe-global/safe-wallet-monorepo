import { renderHook } from '@testing-library/react'
import { useResolvedSidebarNav } from '../useResolvedSidebarNav'
import type { SidebarItemConfig, SidebarGroupConfig } from '../../types'

jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/home',
  }),
}))

describe('useResolvedSidebarNav', () => {
  const mockIcon = (() => null) as unknown as SidebarItemConfig['icon']

  const mockMainNav: SidebarItemConfig[] = [
    { icon: mockIcon, label: 'Home', href: '/home' },
    { icon: mockIcon, label: 'Transactions', href: '/transactions', badge: 5 },
  ]

  const mockSetupGroup: SidebarGroupConfig = {
    label: 'Setup',
    items: [
      { icon: mockIcon, label: 'Settings', href: '/settings' },
      { icon: mockIcon, label: 'Security', href: '/security', activeMemberOnly: true },
    ],
  }

  const mockOptions = {
    getLink: (item: SidebarItemConfig) => ({
      pathname: item.href,
      query: { spaceId: '123' },
    }),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('mainNavItems', () => {
    it('resolves all main navigation items', () => {
      const { result } = renderHook(() => useResolvedSidebarNav(mockMainNav, mockSetupGroup, mockOptions))

      expect(result.current.mainNavItems).toHaveLength(2)
      expect(result.current.mainNavItems[0]?.label).toBe('Home')
      expect(result.current.mainNavItems[1]?.label).toBe('Transactions')
    })

    it('marks item as active when pathname matches href', () => {
      const { result } = renderHook(() => useResolvedSidebarNav(mockMainNav, mockSetupGroup, mockOptions))

      const homeItem = result.current.mainNavItems[0]
      expect(homeItem?.isActive).toBe(true)
      expect(homeItem?.href).toBe('/home')
    })

    it('marks item as inactive when pathname does not match href', () => {
      const { result } = renderHook(() => useResolvedSidebarNav(mockMainNav, mockSetupGroup, mockOptions))

      const transactionsItem = result.current.mainNavItems[1]
      expect(transactionsItem?.isActive).toBe(false)
      expect(transactionsItem?.href).toBe('/transactions')
    })

    it('defaults to disabled false when isItemDisabled not provided', () => {
      const { result } = renderHook(() => useResolvedSidebarNav(mockMainNav, mockSetupGroup, mockOptions))

      expect(result.current.mainNavItems[0]?.disabled).toBe(false)
      expect(result.current.mainNavItems[1]?.disabled).toBe(false)
    })

    it('uses custom isItemDisabled function', () => {
      const customOptions = {
        ...mockOptions,
        isItemDisabled: (item: SidebarItemConfig) => item.label === 'Transactions',
      }

      const { result } = renderHook(() => useResolvedSidebarNav(mockMainNav, mockSetupGroup, customOptions))

      expect(result.current.mainNavItems[0]?.disabled).toBe(false)
      expect(result.current.mainNavItems[1]?.disabled).toBe(true)
    })

    it('preserves badge property', () => {
      const { result } = renderHook(() => useResolvedSidebarNav(mockMainNav, mockSetupGroup, mockOptions))

      expect(result.current.mainNavItems[0]?.badge).toBeUndefined()
      expect(result.current.mainNavItems[1]?.badge).toBe(5)
    })

    it('generates link using getLink function', () => {
      const { result } = renderHook(() => useResolvedSidebarNav(mockMainNav, mockSetupGroup, mockOptions))

      const homeLink = result.current.mainNavItems[0]?.link
      expect(homeLink).toEqual({
        pathname: '/home',
        query: { spaceId: '123' },
      })
    })
  })

  describe('setupGroup', () => {
    it('resolves setup group with label', () => {
      const { result } = renderHook(() => useResolvedSidebarNav(mockMainNav, mockSetupGroup, mockOptions))

      expect(result.current.setupGroup.label).toBe('Setup')
    })

    it('resolves all setup group items', () => {
      const { result } = renderHook(() => useResolvedSidebarNav(mockMainNav, mockSetupGroup, mockOptions))

      expect(result.current.setupGroup.items).toHaveLength(2)
      expect(result.current.setupGroup.items[0]?.label).toBe('Settings')
      expect(result.current.setupGroup.items[1]?.label).toBe('Security')
    })

    it('applies isItemDisabled to setup group items', () => {
      const customOptions = {
        ...mockOptions,
        isItemDisabled: (item: SidebarItemConfig) => item.activeMemberOnly ?? false,
      }

      const { result } = renderHook(() => useResolvedSidebarNav(mockMainNav, mockSetupGroup, customOptions))

      expect(result.current.setupGroup.items[0]?.disabled).toBe(false)
      expect(result.current.setupGroup.items[1]?.disabled).toBe(true)
    })
  })

  describe('developerGroup', () => {
    const mockDeveloperGroupConfig: SidebarGroupConfig = {
      label: 'Developer',
      items: [{ icon: mockIcon, label: 'Feature flags', href: '/feature-flags' }],
    }

    it('resolves developer group with label when config is provided', () => {
      const { result } = renderHook(() =>
        useResolvedSidebarNav(mockMainNav, mockSetupGroup, mockOptions, mockDeveloperGroupConfig),
      )

      expect(result.current.developerGroup?.label).toBe('Developer')
    })

    it('resolves developer group items via the same resolver used for other groups', () => {
      const { result } = renderHook(() =>
        useResolvedSidebarNav(mockMainNav, mockSetupGroup, mockOptions, mockDeveloperGroupConfig),
      )

      const item = result.current.developerGroup?.items[0]
      expect(item?.label).toBe('Feature flags')
      expect(item?.href).toBe('/feature-flags')
      expect(item?.link).toEqual({ pathname: '/feature-flags', query: { spaceId: '123' } })
      expect(item?.isActive).toBe(false)
      expect(item?.disabled).toBe(false)
    })

    it('leaves developerGroup undefined when the 4th arg is omitted', () => {
      const { result } = renderHook(() => useResolvedSidebarNav(mockMainNav, mockSetupGroup, mockOptions))

      expect(result.current.developerGroup).toBeUndefined()
    })
  })
})
