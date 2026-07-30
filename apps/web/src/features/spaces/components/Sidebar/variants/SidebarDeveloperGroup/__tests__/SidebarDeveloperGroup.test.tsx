import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { FlaskConical } from 'lucide-react'
import { SidebarDeveloperGroup } from '../SidebarDeveloperGroup'
import type { ResolvedSidebarActionGroup, ResolvedSidebarItem } from '../../../types'

jest.mock('@/components/ui/sidebar', () => ({
  SidebarGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarGroupLabel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarGroupContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

jest.mock('../../NavItem', () => ({
  NavItem: ({ item, isLoading }: { item: ResolvedSidebarItem | null; isLoading?: boolean }) =>
    isLoading ? <div data-testid="nav-item-skeleton" /> : <div data-testid={item?.testId}>{item?.label}</div>,
}))

const group: ResolvedSidebarActionGroup = {
  label: 'Developer',
  items: [
    {
      icon: FlaskConical,
      label: 'Feature flags',
      id: 'feature-flags',
      isActive: false,
      disabled: false,
      testId: 'sidebar-feature-flags-item',
      onSelect: jest.fn(),
    },
  ],
}

describe('SidebarDeveloperGroup', () => {
  it('renders the label and every action item', () => {
    render(<SidebarDeveloperGroup group={group} />)

    expect(screen.getByText('Developer')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar-feature-flags-item')).toHaveTextContent('Feature flags')
  })

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['empty', { label: 'Developer', items: [] }],
  ])('renders nothing when the group is %s', (_case, value) => {
    const { container } = render(<SidebarDeveloperGroup group={value} />)

    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByText('Developer')).not.toBeInTheDocument()
  })

  it('forwards the loading state to its items', () => {
    render(<SidebarDeveloperGroup group={group} isLoading />)

    expect(screen.getByTestId('nav-item-skeleton')).toBeInTheDocument()
    expect(screen.queryByText('Feature flags')).not.toBeInTheDocument()
  })
})
