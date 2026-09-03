import { render, screen } from '@testing-library/react'
import AccountsNavigation from '../index'

const mockUseHasFeature = jest.fn()

jest.mock('next/router', () => ({ useRouter: () => ({ pathname: '/welcome/spaces' }) }))
jest.mock('@/hooks/useChains', () => ({ useHasFeature: () => mockUseHasFeature() }))
jest.mock('@/public/images/safe-pro/safe-pro-lockup.svg', () => 'svg')
jest.mock('@/public/images/safe-pro/safe-pro-lockup-dark.svg', () => 'svg')
jest.mock('@/public/images/safe-wallet-lockup.svg', () => 'svg')

describe('AccountsNavigation', () => {
  it('shows the Safe Pro and Safe{Wallet} lockups when SAFE_PRO is on', () => {
    mockUseHasFeature.mockReturnValue(true)

    render(<AccountsNavigation />)

    expect(screen.getAllByRole('img', { name: 'Safe Pro' })).toHaveLength(2)
    expect(screen.getByRole('img', { name: 'Safe{Wallet}' })).toBeInTheDocument()
    expect(screen.queryByText('Workspaces')).not.toBeInTheDocument()
  })

  it('keeps the text labels when SAFE_PRO is off', () => {
    mockUseHasFeature.mockReturnValue(false)

    render(<AccountsNavigation />)

    expect(screen.getByText('Workspaces')).toBeInTheDocument()
    expect(screen.getByText('My accounts')).toBeInTheDocument()
    expect(screen.queryAllByRole('img')).toHaveLength(0)
  })
})
