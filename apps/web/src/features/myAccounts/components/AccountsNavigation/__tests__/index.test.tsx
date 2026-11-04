import { render, screen } from '@testing-library/react'
import AccountsNavigation from '../index'

let mockPathname = '/welcome/spaces'
jest.mock('next/router', () => ({ useRouter: () => ({ pathname: mockPathname }) }))

const mockUseIsSafeProEnabled = jest.fn()
jest.mock('@/hooks/useIsSafeProEnabled', () => ({ useIsSafeProEnabled: () => mockUseIsSafeProEnabled() }))

describe('AccountsNavigation', () => {
  beforeEach(() => {
    mockPathname = '/welcome/spaces'
    mockUseIsSafeProEnabled.mockReturnValue(true)
  })

  it('names the Workspaces side Safe Pro with the brand underline and keeps My accounts plain', () => {
    render(<AccountsNavigation />)

    const safePro = screen.getByRole('tab', { name: 'Safe Pro' })
    expect(safePro).toHaveAttribute('href', '/welcome/spaces')
    expect(safePro.querySelector('span')).toHaveTextContent('Safe Pro')
    expect(safePro).toHaveAttribute('aria-selected', 'true')

    const accounts = screen.getByRole('tab', { name: 'My accounts' })
    expect(accounts).toHaveAttribute('href', '/welcome/accounts')
    expect(accounts.querySelector('span')).toBeNull()
  })

  it('keeps the plain Workspaces tab until Safe Pro is live', () => {
    mockUseIsSafeProEnabled.mockReturnValue(false)
    render(<AccountsNavigation />)

    const workspaces = screen.getByRole('tab', { name: 'Workspaces' })
    expect(workspaces).toHaveAttribute('href', '/welcome/spaces')
    expect(workspaces.querySelector('span')).toBeNull()
    expect(screen.queryByRole('tab', { name: 'Safe Pro' })).not.toBeInTheDocument()
  })

  it('selects My accounts on its route', () => {
    mockPathname = '/welcome/accounts'
    render(<AccountsNavigation />)

    expect(screen.getByRole('tab', { name: 'My accounts' })).toHaveAttribute('aria-selected', 'true')
  })
})
