import { render, screen, fireEvent } from '@testing-library/react'
import type * as ReactModule from 'react'
import type { ReactElement, ReactNode } from 'react'
import { memberBuilder } from '@/tests/builders/member'
import MemberRowActionsMenu from './MemberRowActionsMenu'

const mockRenew = jest.fn()
jest.mock('./useRenewInvite', () => ({
  __esModule: true,
  default: () => ({ renewInvite: mockRenew, isLoading: false }),
}))

jest.mock('./EditMemberDialog', () => ({
  __esModule: true,
  default: () => <div data-testid="edit-dialog" />,
}))

jest.mock('./RemoveMemberDialog', () => ({
  __esModule: true,
  default: () => <div data-testid="remove-dialog" />,
}))

jest.mock('@/components/common/Track', () => ({
  __esModule: true,
  default: ({ children, action, label }: { children: ReactNode; action?: string; label?: string }) => (
    <div data-track-event={action} data-track-label={label}>
      {children}
    </div>
  ),
}))

jest.mock('@/services/analytics/events/spaces', () => ({
  SPACE_EVENTS: {
    REMOVE_MEMBER_MODAL: { action: 'Open remove member modal' },
    WORKSPACE_MEMBER_INVITE_RENEWED: { action: 'Workspace member invite renewed' },
  },
  SPACE_LABELS: { invite_list: 'invite_list', member_list: 'member_list' },
}))

// The codebase tests dropdown menus with a lightweight stand-in rather than
// driving base-ui's portal/pointer machinery in jsdom (see SpaceSelectorDropdown.test).
jest.mock('@/components/ui/dropdown-menu', () => {
  const { createContext, useContext, useState, cloneElement } = jest.requireActual('react') as typeof ReactModule

  type DropdownCtx = { open: boolean; setOpen: (open: boolean) => void }
  const Ctx = createContext<DropdownCtx | null>(null)

  const DropdownMenu = ({ children }: { children: ReactNode }) => {
    const [open, setOpen] = useState(false)
    return <Ctx.Provider value={{ open, setOpen }}>{children}</Ctx.Provider>
  }

  const DropdownMenuTrigger = ({ render }: { render: ReactElement<{ onClick?: () => void }> }) => {
    const context = useContext(Ctx)
    if (!context) return null
    return cloneElement(render, { onClick: () => context.setOpen(!context.open) })
  }

  const DropdownMenuContent = ({ children }: { children: ReactNode }) => {
    const context = useContext(Ctx)
    return context?.open ? <div>{children}</div> : null
  }

  const DropdownMenuItem = ({
    children,
    onClick,
    disabled,
  }: {
    children: ReactNode
    onClick?: () => void
    disabled?: boolean
    variant?: 'default' | 'destructive'
  }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )

  return { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem }
})

describe('MemberRowActionsMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const member = memberBuilder().with({ name: 'Alice' }).build()
  const openMenu = () => fireEvent.click(screen.getByRole('button', { name: 'Member actions' }))

  it('opens the edit dialog from the menu for active members', () => {
    render(
      <MemberRowActionsMenu member={member} disabled={false} editDisabled={false} isInvite={false} canRenew={false} />,
    )

    openMenu()
    fireEvent.click(screen.getByRole('button', { name: 'Edit member' }))

    expect(screen.getByTestId('edit-dialog')).toBeInTheDocument()
  })

  it('opens the remove dialog from the menu', () => {
    render(
      <MemberRowActionsMenu member={member} disabled={false} editDisabled={false} isInvite={false} canRenew={false} />,
    )

    openMenu()
    fireEvent.click(screen.getByRole('button', { name: 'Remove member' }))

    expect(screen.getByTestId('remove-dialog')).toBeInTheDocument()
  })

  it('hides edit and renew for declined invites but still offers remove', () => {
    render(<MemberRowActionsMenu member={member} disabled={false} editDisabled={false} isInvite canRenew={false} />)

    openMenu()

    expect(screen.queryByRole('button', { name: 'Edit member' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Renew invitation' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove invitation' })).toBeInTheDocument()
  })

  it('triggers renew from the menu when the invite is renewable', () => {
    render(<MemberRowActionsMenu member={member} disabled={false} editDisabled={false} isInvite canRenew />)

    openMenu()
    fireEvent.click(screen.getByRole('button', { name: 'Renew invitation' }))

    expect(mockRenew).toHaveBeenCalled()
  })

  it('wraps the renew action in the renew analytics event (parity with the desktop button)', () => {
    render(<MemberRowActionsMenu member={member} disabled={false} editDisabled={false} isInvite canRenew />)

    openMenu()
    const renewItem = screen.getByRole('button', { name: 'Renew invitation' })

    expect(renewItem.closest('[data-track-event]')).toHaveAttribute(
      'data-track-event',
      'Workspace member invite renewed',
    )
  })

  it('disables edit and remove when the member is the last admin', () => {
    render(<MemberRowActionsMenu member={member} disabled editDisabled isInvite={false} canRenew={false} />)

    openMenu()

    expect(screen.getByRole('button', { name: 'Edit member' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Remove member' })).toBeDisabled()
  })

  it('keeps edit enabled for the current user while remove stays disabled', () => {
    render(<MemberRowActionsMenu member={member} disabled editDisabled={false} isInvite={false} canRenew={false} />)

    openMenu()

    expect(screen.getByRole('button', { name: 'Edit member' })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: 'Remove member' })).toBeDisabled()
  })
})
