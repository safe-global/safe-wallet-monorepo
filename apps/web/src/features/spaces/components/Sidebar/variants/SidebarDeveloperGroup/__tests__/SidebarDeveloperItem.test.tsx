import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { FlaskConical } from 'lucide-react'
import { SidebarDeveloperItem } from '../SidebarDeveloperItem'
import type { ResolvedSidebarItem, SidebarDeveloperItemConfig, SidebarDeveloperItemState } from '../../../types'

const mockNavItem = jest.fn()

jest.mock('../../NavItem', () => ({
  NavItem: (props: { item: ResolvedSidebarItem | null; isLoading?: boolean; children?: ReactNode }) => {
    mockNavItem(props)
    return <div data-testid="nav-item">{props.children}</div>
  },
}))

const onSelect = jest.fn()

const buildConfig = (state: Partial<SidebarDeveloperItemState> = {}): SidebarDeveloperItemConfig => ({
  icon: FlaskConical,
  label: 'Feature flags',
  id: 'feature-flags',
  useItemState: () => ({ onSelect, ...state }),
})

const getItem = () => mockNavItem.mock.calls.at(-1)![0].item as ResolvedSidebarItem

describe('SidebarDeveloperItem', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('maps the config into an action item, deriving the test id from the entry id', () => {
    render(<SidebarDeveloperItem config={buildConfig()} />)

    expect(getItem()).toMatchObject({
      icon: FlaskConical,
      label: 'Feature flags',
      id: 'feature-flags',
      testId: 'sidebar-feature-flags-item',
    })
  })

  it('never navigates or highlights: action entries have no route', () => {
    render(<SidebarDeveloperItem config={buildConfig()} />)

    const item = getItem()
    expect(item.isActive).toBe(false)
    expect(item.disabled).toBe(false)
    expect(item.href).toBeUndefined()
    expect(item.link).toBeUndefined()
  })

  it("passes through the hook's onSelect so the entry drives its own action", () => {
    render(<SidebarDeveloperItem config={buildConfig()} />)

    getItem().onSelect?.()

    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it("takes the badge from the hook's state", () => {
    render(<SidebarDeveloperItem config={buildConfig({ badge: 7 })} />)

    expect(getItem().badge).toBe(7)
  })

  it('leaves the badge unset when the hook reports none', () => {
    render(<SidebarDeveloperItem config={buildConfig()} />)

    expect(getItem().badge).toBeUndefined()
  })

  it("hosts the hook's dialog inside the item rather than beside it", () => {
    render(<SidebarDeveloperItem config={buildConfig({ dialog: <div data-testid="entry-dialog" /> })} />)

    // Nested, not a sibling — entries live in a <ul>, so stray markup there would be invalid.
    expect(screen.getByTestId('nav-item')).toContainElement(screen.getByTestId('entry-dialog'))
  })

  it('forwards the loading state', () => {
    render(<SidebarDeveloperItem config={buildConfig()} isLoading />)

    expect(mockNavItem.mock.calls.at(-1)![0].isLoading).toBe(true)
  })

  it("calls the entry's own hook", () => {
    const useItemState = jest.fn(() => ({ onSelect }))

    render(<SidebarDeveloperItem config={{ ...buildConfig(), useItemState }} />)

    expect(useItemState).toHaveBeenCalled()
  })
})
