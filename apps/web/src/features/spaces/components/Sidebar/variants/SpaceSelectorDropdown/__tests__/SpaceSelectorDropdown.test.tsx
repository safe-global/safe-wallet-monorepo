import { act, fireEvent, render, screen } from '@testing-library/react'
import type * as ReactModule from 'react'
import type { ReactElement, ReactNode, CSSProperties } from 'react'
import { AppRoutes } from '@/config/routes'
import { trackEvent } from '@/services/analytics'
import { getDeterministicColor } from '@/features/spaces'
import { SpaceSelectorDropdown } from '../SpaceSelectorDropdown'

jest.mock('../../../hooks/useAddSafeToSpace', () => ({
  useAddSafeToSpace: jest.fn(() => ({ addToSpace: jest.fn().mockResolvedValue(true), loadingSpaceId: null })),
}))

const mockPush = jest.fn()
jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/spaces',
    query: { spaceId: '1' },
    push: mockPush,
  }),
}))

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

jest.mock('@/services/analytics/events/spaces', () => ({
  SPACE_EVENTS: {
    CREATE_SPACE_MODAL: {},
    OPEN_SPACE_LIST_PAGE: {},
  },
  SPACE_LABELS: {
    space_selector: 'space_selector',
  },
}))

jest.mock('@/components/ui/sidebar', () => ({
  SidebarMenuButton: ({
    children,
    onClick,
    ...props
  }: {
    children: ReactNode
    onClick?: () => void
    [key: string]: unknown
  }) => (
    <button type="button" onClick={onClick} {...props}>
      {children}
    </button>
  ),
}))

jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  AvatarFallback: ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
    <div data-testid="avatar-fallback" style={style}>
      {children}
    </div>
  ),
}))

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

jest.mock('@/components/ui/dropdown-menu', () => {
  const { createContext, useContext, useState, cloneElement } = jest.requireActual('react') as typeof ReactModule

  type DropdownCtx = { open: boolean; setOpen: (open: boolean) => void }
  const Ctx = createContext<DropdownCtx | null>(null)

  const DropdownMenu = ({
    children,
    open: openProp,
    onOpenChange,
  }: {
    children: ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }) => {
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = openProp !== undefined
    const open = isControlled ? openProp : internalOpen
    const setOpen = (nextOpen: boolean) => {
      if (!isControlled) setInternalOpen(nextOpen)
      onOpenChange?.(nextOpen)
    }

    return <Ctx.Provider value={{ open, setOpen }}>{children}</Ctx.Provider>
  }

  type TriggerElementProps = { onClick?: () => void; children?: ReactNode }

  const DropdownMenuTrigger = ({
    render,
    children,
  }: {
    render: ReactElement<TriggerElementProps>
    children: ReactNode
  }) => {
    const context = useContext(Ctx)
    if (!context) return null

    return cloneElement(render, {
      onClick: () => context.setOpen(!context.open),
      children,
    })
  }

  const DropdownMenuContent = ({ children, id }: { children: ReactNode; id?: string }) => {
    const context = useContext(Ctx)
    if (!context?.open) return null
    return <div id={id}>{children}</div>
  }

  const DropdownMenuItem = ({
    children,
    onClick,
    disabled,
  }: {
    children: ReactNode
    onClick?: () => void
    disabled?: boolean
  }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )

  const DropdownMenuSeparator = () => <hr />

  return {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
  }
})

describe('SpaceSelectorDropdown', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('adds an accessible label to the trigger', () => {
    render(<SpaceSelectorDropdown selectedSpace={{ id: 1, name: 'Company Space', safeCount: 0 }} spaces={[]} />)

    expect(screen.getByRole('button', { name: 'Open workspace selector' })).toBeVisible()
  })

  it('sets aria-expanded on the trigger based on dropdown state', () => {
    render(<SpaceSelectorDropdown selectedSpace={{ id: 1, name: 'Company Space', safeCount: 0 }} spaces={[]} />)

    const trigger = screen.getByRole('button', { name: 'Open workspace selector' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })

  it('shows all space items when the dropdown is opened', () => {
    const spaces = [
      { id: 1, name: 'Alpha', safeCount: 0 },
      { id: 2, name: 'Beta', safeCount: 0 },
      { id: 3, name: 'Gamma', safeCount: 0 },
    ]
    render(<SpaceSelectorDropdown selectedSpace={spaces[0]} spaces={spaces} />)

    const trigger = screen.getByRole('button', { name: 'Open workspace selector' })
    fireEvent.click(trigger)

    const spaceItemButtons = screen
      .getAllByRole('button')
      .filter((btn) => spaces.some((s) => btn.querySelector('span')?.textContent === s.name))
    expect(spaceItemButtons).toHaveLength(3)
  })

  it('calls router.push with the correct spaceId when a space is selected', () => {
    const spaces = [
      { id: 1, name: 'Alpha', safeCount: 0 },
      { id: 2, name: 'Beta', safeCount: 0 },
    ]
    render(<SpaceSelectorDropdown selectedSpace={spaces[0]} spaces={spaces} />)

    const trigger = screen.getByRole('button', { name: 'Open workspace selector' })
    fireEvent.click(trigger)

    const betaButton = screen.getAllByRole('button').find((btn) => btn.querySelector('span')?.textContent === 'Beta')
    fireEvent.click(betaButton!)

    expect(mockPush).toHaveBeenCalledWith({ pathname: '/spaces', query: { spaceId: '2' } })
  })

  it('tracks CREATE_SPACE_MODAL event and navigates when "Add new space" is clicked', () => {
    render(<SpaceSelectorDropdown selectedSpace={{ id: 1, name: 'Alpha', safeCount: 0 }} spaces={[]} />)

    const trigger = screen.getByRole('button', { name: 'Open workspace selector' })
    fireEvent.click(trigger)
    fireEvent.click(screen.getByText('Add new space'))

    expect(trackEvent).toHaveBeenCalledWith(expect.objectContaining({ label: 'space_selector' }))
    expect(mockPush).toHaveBeenCalledWith(AppRoutes.spaces.createSpace)
  })

  it('tracks OPEN_SPACE_LIST_PAGE event and navigates when "View all" is clicked', () => {
    render(<SpaceSelectorDropdown selectedSpace={{ id: 1, name: 'Alpha', safeCount: 0 }} spaces={[]} />)

    const trigger = screen.getByRole('button', { name: 'Open workspace selector' })
    fireEvent.click(trigger)
    fireEvent.click(screen.getByText('View all'))

    expect(trackEvent).toHaveBeenCalledWith(expect.objectContaining({ label: 'space_selector' }))
    expect(mockPush).toHaveBeenCalledWith(AppRoutes.welcome.spaces)
  })

  describe('getDeterministicColor (avatar color from name)', () => {
    it('returns the same color for the same name', () => {
      expect(getDeterministicColor('My Space')).toBe(getDeterministicColor('My Space'))
    })

    it('returns different colors for different names', () => {
      const colors = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'].map(getDeterministicColor)
      expect(new Set(colors).size).toBe(colors.length)
    })
  })

  it('shows a checkmark only next to the currently selected space', () => {
    const spaces = [
      { id: 1, name: 'Alpha', safeCount: 0 },
      { id: 2, name: 'Beta', safeCount: 0 },
    ]
    render(<SpaceSelectorDropdown selectedSpace={spaces[0]} spaces={spaces} />)

    const trigger = screen.getByRole('button', { name: 'Open workspace selector' })
    fireEvent.click(trigger)

    const alphaButton = screen.getAllByRole('button').find((btn) => btn.querySelector('span')?.textContent === 'Alpha')
    const betaButton = screen.getAllByRole('button').find((btn) => btn.querySelector('span')?.textContent === 'Beta')

    expect(alphaButton?.querySelector('svg')).toBeInTheDocument()
    expect(betaButton?.querySelector('svg')).not.toBeInTheDocument()
  })

  describe('safe limit per workspace (addToWorkspace variant)', () => {
    const LIMIT = 40

    it('disables a space that has reached the safe limit', () => {
      const spaces = [
        { id: 1, name: 'Full Space', safeCount: LIMIT },
        { id: 2, name: 'Empty Space', safeCount: 0 },
      ]
      render(<SpaceSelectorDropdown triggerVariant="addToWorkspace" spaces={spaces} />)

      fireEvent.click(screen.getByRole('button', { name: 'Add Safe to workspace' }))

      const fullButton = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('span')?.textContent === 'Full Space')
      const emptyButton = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('span')?.textContent === 'Empty Space')

      expect(fullButton).toBeDisabled()
      expect(emptyButton).not.toBeDisabled()
    })

    it('shows a tooltip with the limit message for a space at the limit', () => {
      const spaces = [{ id: 1, name: 'Full Space', safeCount: LIMIT }]
      render(<SpaceSelectorDropdown triggerVariant="addToWorkspace" spaces={spaces} />)

      fireEvent.click(screen.getByRole('button', { name: 'Add Safe to workspace' }))

      expect(screen.getByText(/You've reached the limit of Safes for this workspace/)).toBeInTheDocument()
    })

    it('does not show a limit tooltip for a space below the limit', () => {
      const spaces = [{ id: 1, name: 'Space', safeCount: LIMIT - 1 }]
      render(<SpaceSelectorDropdown triggerVariant="addToWorkspace" spaces={spaces} />)

      fireEvent.click(screen.getByRole('button', { name: 'Add Safe to workspace' }))

      expect(screen.queryByText(/You've reached the limit of Safes for this workspace/)).not.toBeInTheDocument()
    })

    it('does not disable spaces at the limit in the default variant', () => {
      const spaces = [{ id: 1, name: 'Full Space', safeCount: LIMIT }]
      render(<SpaceSelectorDropdown triggerVariant="default" selectedSpace={spaces[0]} spaces={spaces} />)

      fireEvent.click(screen.getByRole('button', { name: 'Open workspace selector' }))

      const fullButton = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('span')?.textContent === 'Full Space')
      expect(fullButton).not.toBeDisabled()
    })

    it('shows the full tooltip text including the limit number', () => {
      const spaces = [{ id: 1, name: 'Full Space', safeCount: LIMIT }]
      render(<SpaceSelectorDropdown triggerVariant="addToWorkspace" spaces={spaces} />)

      fireEvent.click(screen.getByRole('button', { name: 'Add Safe to workspace' }))

      expect(
        screen.getByText(`You've reached the limit of Safes for this workspace (max. ${LIMIT} Safes per workspace)`),
      ).toBeInTheDocument()
    })
  })

  describe('onSpaceAdded callback propagation', () => {
    it('passes onSpaceAdded to useAddSafeToSpace hook', () => {
      const { useAddSafeToSpace } = jest.requireMock('../../../hooks/useAddSafeToSpace') as {
        useAddSafeToSpace: jest.Mock
      }
      const onSpaceAdded = jest.fn()
      const spaces = [{ id: 1, name: 'Alpha', safeCount: 0 }]

      render(<SpaceSelectorDropdown triggerVariant="addToWorkspace" spaces={spaces} onSpaceAdded={onSpaceAdded} />)

      expect(useAddSafeToSpace).toHaveBeenCalledWith(expect.objectContaining({ onSpaceAdded }))
    })

    it('closes the dropdown after successfully adding a Safe to a Space', async () => {
      const mockAddToSpace = jest.fn().mockResolvedValue(true)
      const { useAddSafeToSpace } = jest.requireMock('../../../hooks/useAddSafeToSpace') as {
        useAddSafeToSpace: jest.Mock
      }
      useAddSafeToSpace.mockReturnValue({ addToSpace: mockAddToSpace, loadingSpaceId: null })

      const spaces = [{ id: 1, name: 'Alpha', safeCount: 0 }]
      render(<SpaceSelectorDropdown triggerVariant="addToWorkspace" spaces={spaces} />)

      fireEvent.click(screen.getByRole('button', { name: 'Add Safe to workspace' }))
      expect(screen.getByText('Alpha')).toBeInTheDocument()

      const alphaButton = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('span')?.textContent === 'Alpha')
      await act(async () => {
        fireEvent.click(alphaButton!)
      })

      expect(mockAddToSpace).toHaveBeenCalledWith(1)
      expect(screen.queryByText('Alpha')).not.toBeInTheDocument()
    })
  })
})
