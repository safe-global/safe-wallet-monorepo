import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { SpaceSelectorDropdown } from '../variants/SpaceSelectorDropdown'

jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/spaces',
    query: { spaceId: '1' },
    push: jest.fn(),
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
  const { createContext, useContext, useState, cloneElement } = jest.requireActual<typeof import('react')>('react')

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
})
