import { render, screen } from '@testing-library/react'
import AccountsNavigation from '../index'

let mockPathname = '/welcome/spaces'
jest.mock('next/router', () => ({ useRouter: () => ({ pathname: mockPathname }) }))
jest.mock('@/public/images/safe-pro/pro-chip.svg', () => 'svg')

describe('AccountsNavigation', () => {
  it('labels Workspaces as the Safe Pro side and keeps My accounts plain', () => {
    render(<AccountsNavigation />)

    const workspaces = screen.getByRole('tab', { name: /Workspaces/ })
    expect(workspaces).toHaveAttribute('href', '/welcome/spaces')
    expect(workspaces).toContainElement(screen.getByRole('img', { name: 'Pro' }))
    expect(workspaces).toHaveAttribute('aria-selected', 'true')

    const accounts = screen.getByRole('tab', { name: 'My accounts' })
    expect(accounts).toHaveAttribute('href', '/welcome/accounts')
    expect(screen.getAllByRole('img')).toHaveLength(1)
  })

  it('selects My accounts on its route', () => {
    mockPathname = '/welcome/accounts'
    render(<AccountsNavigation />)

    expect(screen.getByRole('tab', { name: 'My accounts' })).toHaveAttribute('aria-selected', 'true')
  })
})
