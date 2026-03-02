import { fireEvent, render, screen } from '@testing-library/react'
import type * as ReactModule from 'react'
import type { ReactElement, ReactNode } from 'react'
import { AppRoutes } from '@/config/routes'
import { trackEvent } from '@/services/analytics'
import { SpaceSelectorDropdown } from '../variants/SpaceSelectorDropdown'

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
  AvatarFallback: ({ children }: { children: ReactNode }) => <div>{children}</div>,
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

  const DropdownMenuItem = ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
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
    render(<SpaceSelectorDropdown selectedSpace={{ id: 1, name: 'Company Space' }} spaces={[]} />)

    expect(screen.getByRole('button', { name: 'Selected space Company Space. Open space selector' })).toBeVisible()
  })

  it('sets aria-expanded on the trigger based on dropdown state', () => {
    render(<SpaceSelectorDropdown selectedSpace={{ id: 1, name: 'Company Space' }} spaces={[]} />)

    const trigger = screen.getByRole('button', { name: 'Selected space Company Space. Open space selector' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })

  it('shows all space items when the dropdown is opened', () => {
    const spaces = [
      { id: 1, name: 'Alpha' },
      { id: 2, name: 'Beta' },
      { id: 3, name: 'Gamma' },
    ]
    render(<SpaceSelectorDropdown selectedSpace={spaces[0]} spaces={spaces} />)

    const trigger = screen.getByRole('button', { name: /Selected space Alpha/ })
    fireEvent.click(trigger)

    const spaceItemButtons = screen
      .getAllByRole('button')
      .filter((btn) => spaces.some((s) => btn.querySelector('span')?.textContent === s.name))
    expect(spaceItemButtons).toHaveLength(3)
  })

  it('calls router.push with the correct spaceId when a space is selected', () => {
    const spaces = [
      { id: 1, name: 'Alpha' },
      { id: 2, name: 'Beta' },
    ]
    render(<SpaceSelectorDropdown selectedSpace={spaces[0]} spaces={spaces} />)

    const trigger = screen.getByRole('button', { name: /Selected space Alpha/ })
    fireEvent.click(trigger)

    const betaButton = screen.getAllByRole('button').find((btn) => btn.querySelector('span')?.textContent === 'Beta')
    fireEvent.click(betaButton!)

    expect(mockPush).toHaveBeenCalledWith({ pathname: '/spaces', query: { spaceId: '2' } })
  })

  it('tracks CREATE_SPACE_MODAL event and navigates when "Create space" is clicked', () => {
    render(<SpaceSelectorDropdown selectedSpace={{ id: 1, name: 'Alpha' }} spaces={[]} />)

    const trigger = screen.getByRole('button', { name: /Selected space Alpha/ })
    fireEvent.click(trigger)
    fireEvent.click(screen.getByText('Create space'))

    expect(trackEvent).toHaveBeenCalledWith(expect.objectContaining({ label: 'space_selector' }))
    expect(mockPush).toHaveBeenCalledWith(AppRoutes.spaces.createSpace)
  })

  it('tracks OPEN_SPACE_LIST_PAGE event and navigates when "View spaces" is clicked', () => {
    render(<SpaceSelectorDropdown selectedSpace={{ id: 1, name: 'Alpha' }} spaces={[]} />)

    const trigger = screen.getByRole('button', { name: /Selected space Alpha/ })
    fireEvent.click(trigger)
    fireEvent.click(screen.getByText('View spaces'))

    expect(trackEvent).toHaveBeenCalledWith(expect.objectContaining({ label: 'space_selector' }))
    expect(mockPush).toHaveBeenCalledWith(AppRoutes.welcome.spaces)
  })

  it('shows a checkmark only next to the currently selected space', () => {
    const spaces = [
      { id: 1, name: 'Alpha' },
      { id: 2, name: 'Beta' },
    ]
    render(<SpaceSelectorDropdown selectedSpace={spaces[0]} spaces={spaces} />)

    const trigger = screen.getByRole('button', { name: /Selected space Alpha/ })
    fireEvent.click(trigger)

    const alphaButton = screen.getAllByRole('button').find((btn) => btn.querySelector('span')?.textContent === 'Alpha')
    const betaButton = screen.getAllByRole('button').find((btn) => btn.querySelector('span')?.textContent === 'Beta')

    expect(alphaButton?.querySelector('svg')).toBeInTheDocument()
    expect(betaButton?.querySelector('svg')).not.toBeInTheDocument()
  })
})
