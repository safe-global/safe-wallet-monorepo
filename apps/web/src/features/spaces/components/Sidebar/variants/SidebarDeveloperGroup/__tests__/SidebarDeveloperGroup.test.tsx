import { fireEvent, render, screen } from '@testing-library/react'
import type * as React from 'react'
import type { ReactNode } from 'react'
import { SidebarDeveloperGroup } from '../SidebarDeveloperGroup'
import type { ResolvedSidebarItem } from '../../../types'
import { setIsProduction } from '@/tests/env'

jest.mock('@/components/ui/sidebar', () => ({
  SidebarGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarGroupLabel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarGroupContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarSeparator: ({ className }: { className?: string }) => <hr className={className} />,
}))

jest.mock('../../NavItem', () => ({
  NavItem: ({
    item,
    isLoading,
    children,
  }: {
    item: ResolvedSidebarItem | null
    isLoading?: boolean
    children?: ReactNode
  }) =>
    isLoading ? (
      <div data-testid="nav-item-skeleton">{children}</div>
    ) : (
      <div>
        <button type="button" data-testid={item?.testId} onClick={item?.onSelect}>
          {item?.label}
          {item?.badge !== undefined && <span data-testid={`${item.testId}-badge`}>{item.badge}</span>}
        </button>
        {children}
      </div>
    ),
}))

// Two entries, each with its own hook and its own open state. The group must never reach into either:
// clicking one entry has to leave the other untouched.
jest.mock('../../../developerItems', () => {
  const { useState } = jest.requireActual('react') as typeof React
  const Icon = () => null

  const makeItemStateHook = (id: string, badge?: number) => () => {
    const [isOpen, setOpen] = useState(false)
    return {
      badge,
      onSelect: () => setOpen(true),
      dialog: isOpen ? <div data-testid={`${id}-dialog`} /> : null,
    }
  }

  return {
    sidebarDeveloperGroup: {
      label: 'Developer',
      items: [
        {
          icon: Icon,
          label: 'Feature flags',
          id: 'feature-flags',
          useItemState: makeItemStateHook('feature-flags', 3),
        },
        { icon: Icon, label: 'Playground', id: 'playground', useItemState: makeItemStateHook('playground') },
      ],
    },
  }
})

describe('SidebarDeveloperGroup', () => {
  it('renders the label and every configured entry', () => {
    render(<SidebarDeveloperGroup />)

    expect(screen.getByText('Developer')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar-feature-flags-item')).toHaveTextContent('Feature flags')
    expect(screen.getByTestId('sidebar-playground-item')).toHaveTextContent('Playground')
  })

  it("takes each entry's badge from its own hook", () => {
    render(<SidebarDeveloperGroup />)

    expect(screen.getByTestId('sidebar-feature-flags-item-badge')).toHaveTextContent('3')
    expect(screen.queryByTestId('sidebar-playground-item-badge')).not.toBeInTheDocument()
  })

  it('gives each entry independent state, so selecting one leaves the others alone', () => {
    render(<SidebarDeveloperGroup />)

    expect(screen.queryByTestId('feature-flags-dialog')).not.toBeInTheDocument()
    expect(screen.queryByTestId('playground-dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('sidebar-feature-flags-item'))

    expect(screen.getByTestId('feature-flags-dialog')).toBeInTheDocument()
    expect(screen.queryByTestId('playground-dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('sidebar-playground-item'))

    expect(screen.getByTestId('feature-flags-dialog')).toBeInTheDocument()
    expect(screen.getByTestId('playground-dialog')).toBeInTheDocument()
  })

  it('renders nothing in production', () => {
    const originalIsProduction = process.env.NEXT_PUBLIC_IS_PRODUCTION
    setIsProduction('true')

    try {
      const { container } = render(<SidebarDeveloperGroup />)

      expect(container).toBeEmptyDOMElement()
      expect(screen.queryByText('Developer')).not.toBeInTheDocument()
    } finally {
      setIsProduction(originalIsProduction)
    }
  })

  it('forwards the loading state to its entries', () => {
    render(<SidebarDeveloperGroup isLoading />)

    expect(screen.getAllByTestId('nav-item-skeleton')).toHaveLength(2)
    expect(screen.queryByText('Feature flags')).not.toBeInTheDocument()
  })
})
