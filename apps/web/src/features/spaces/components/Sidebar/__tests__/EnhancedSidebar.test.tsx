import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { EnhancedSidebar } from '../index'
import type { SpaceItem } from '../types'

// Mock the sidebar components
jest.mock('@/components/ui/sidebar', () => ({
  Sidebar: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  SidebarHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

jest.mock('../SidebarTopBar', () => ({
  SidebarTopBar: () => <div>Top Bar</div>,
}))

jest.mock('../SidebarCommonFooter', () => ({
  SidebarCommonFooter: () => <div>Footer</div>,
}))

jest.mock('../variants', () => ({
  getSidebarVariant: jest.fn((type) => {
    if (type === 'spaces') {
      const SpacesVariant = () => <div>Spaces Variant</div>
      SpacesVariant.displayName = 'SpacesVariant'
      return SpacesVariant
    }
    const SafeVariant = () => <div>Safe Variant</div>
    SafeVariant.displayName = 'SafeVariant'
    return SafeVariant
  }),
}))

describe('EnhancedSidebar', () => {
  const mockSpaces: SpaceItem[] = [
    { id: 1, name: 'Space 1' },
    { id: 2, name: 'Space 2' },
  ]

  const mockSelectedSpace: SpaceItem = { id: 1, name: 'Space 1' }

  it('renders all required components', () => {
    render(
      <EnhancedSidebar
        type="spaces"
        spaceName="Test Space"
        spaceInitial="T"
        selectedSpace={mockSelectedSpace}
        spaces={mockSpaces}
      />,
    )

    expect(screen.getByText('Top Bar')).toBeInTheDocument()
    expect(screen.getByText('Footer')).toBeInTheDocument()
  })

  it('renders spaces variant when type is spaces', () => {
    render(
      <EnhancedSidebar
        type="spaces"
        spaceName="Test Space"
        spaceInitial="T"
        selectedSpace={mockSelectedSpace}
        spaces={mockSpaces}
      />,
    )

    expect(screen.getByText('Spaces Variant')).toBeInTheDocument()
  })

  it('renders safe variant when type is safe', () => {
    render(
      <EnhancedSidebar
        type="safe"
        spaceName="Test Space"
        spaceInitial="T"
        selectedSpace={mockSelectedSpace}
        spaces={mockSpaces}
      />,
    )

    expect(screen.getByText('Safe Variant')).toBeInTheDocument()
  })

  it('passes props to variant component', () => {
    const { getSidebarVariant } = require('../variants')
    const MockVariantComponent = jest.fn(() => <div>Variant</div>)
    getSidebarVariant.mockReturnValue(MockVariantComponent)

    render(
      <EnhancedSidebar
        type="spaces"
        spaceName="My Space"
        spaceInitial="M"
        selectedSpace={mockSelectedSpace}
        spaces={mockSpaces}
      />,
    )

    expect(MockVariantComponent.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        spaceName: 'My Space',
        spaceInitial: 'M',
        selectedSpace: mockSelectedSpace,
        spaces: mockSpaces,
      }),
    )
  })
})
