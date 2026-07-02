import { render, screen, fireEvent } from '@testing-library/react'
import type * as ReactModule from 'react'
import type { ReactElement, ReactNode } from 'react'
import { faker } from '@faker-js/faker'
import { Builder } from '@/tests/Builder'
import type { SpaceAddressBookItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import SpaceAddressBookActions from '../SpaceAddressBookActions'

const mockUseIsMobile = jest.fn(() => false)
jest.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => mockUseIsMobile() }))

const mockUseIsAdmin = jest.fn(() => true)
jest.mock('@/features/spaces', () => ({ useIsAdmin: () => mockUseIsAdmin() }))

jest.mock('../EditContactDialog', () => ({
  __esModule: true,
  default: () => <div data-testid="edit-contact-dialog" />,
}))

jest.mock('../DeleteContactDialog', () => ({
  __esModule: true,
  default: () => <div data-testid="delete-contact-dialog" />,
}))

jest.mock('@/components/common/Track', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

jest.mock('@/services/analytics/events/spaces', () => ({
  SPACE_EVENTS: { EDIT_ADDRESS: {}, REMOVE_ADDRESS: {} },
}))

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

  const DropdownMenuItem = ({ children, onClick }: { children: ReactNode; onClick?: () => void; variant?: string }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  )

  return { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem }
})

const buildEntry = () =>
  Builder.new<SpaceAddressBookItemDto>()
    .with({ name: faker.person.fullName(), address: faker.finance.ethereumAddress(), chainIds: ['1'] })
    .build()

describe('SpaceAddressBookActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseIsMobile.mockReturnValue(false)
    mockUseIsAdmin.mockReturnValue(true)
  })

  it('renders nothing for non-admins', () => {
    mockUseIsAdmin.mockReturnValue(false)

    const { container } = render(<SpaceAddressBookActions entry={buildEntry()} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('does not render the kebab on desktop', () => {
    render(<SpaceAddressBookActions entry={buildEntry()} />)

    expect(screen.queryByRole('button', { name: 'Contact actions' })).not.toBeInTheDocument()
  })

  it('opens the edit dialog from the mobile kebab', () => {
    mockUseIsMobile.mockReturnValue(true)
    render(<SpaceAddressBookActions entry={buildEntry()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Contact actions' }))
    fireEvent.click(screen.getByRole('button', { name: 'Edit entry' }))

    expect(screen.getByTestId('edit-contact-dialog')).toBeInTheDocument()
  })

  it('opens the delete dialog from the mobile kebab', () => {
    mockUseIsMobile.mockReturnValue(true)
    render(<SpaceAddressBookActions entry={buildEntry()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Contact actions' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete entry' }))

    expect(screen.getByTestId('delete-contact-dialog')).toBeInTheDocument()
  })
})
