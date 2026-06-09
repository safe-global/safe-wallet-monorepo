import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { AccountInfo } from '../AccountInfo'
import { memberBuilder } from '@/tests/builders/member'

const mockLogout = jest.fn()

jest.mock('@/hooks/useLogout', () => ({
  __esModule: true,
  default: () => ({ logout: mockLogout }),
}))

// Render the Base UI popover content inline so the trigger does not need to be
// opened (the real component renders content into a portal only when open).
jest.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PopoverContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

jest.mock('@/components/common/InitialsAvatar', () => ({
  __esModule: true,
  default: ({ name }: { name: string }) => <div data-testid="initials-avatar">{name}</div>,
}))

describe('AccountInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the member name and role', () => {
    const membership = memberBuilder().with({ name: 'Alice', role: 'ADMIN' }).build()

    render(<AccountInfo membership={membership} />)

    expect(screen.getAllByTestId('initials-avatar')[0]).toHaveTextContent('Alice')
    expect(screen.getByText('ADMIN')).toBeInTheDocument()
    expect(screen.getByText('Signed in')).toBeInTheDocument()
  })

  it('falls back to an empty name when membership is undefined', () => {
    render(<AccountInfo />)

    screen.getAllByTestId('initials-avatar').forEach((avatar) => {
      expect(avatar).toHaveTextContent('')
    })
    expect(screen.getByTestId('sidebar-profile-sign-out')).toBeInTheDocument()
  })

  it('logs out when the sign-out button is clicked', async () => {
    const membership = memberBuilder().build()

    render(<AccountInfo membership={membership} />)

    await userEvent.click(screen.getByTestId('sidebar-profile-sign-out'))

    expect(mockLogout).toHaveBeenCalledTimes(1)
  })
})
