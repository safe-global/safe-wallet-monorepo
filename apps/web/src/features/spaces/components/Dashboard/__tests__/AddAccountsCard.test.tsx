import { render, screen } from '@testing-library/react'
import AddAccountsCard from '../AddAccountsCard'

jest.mock('@/hooks/useDarkMode', () => ({
  useDarkMode: () => false,
}))

jest.mock('@/components/common/Track', () => {
  const Track = ({ children }: { children: React.ReactNode }) => <>{children}</>
  Track.displayName = 'Track'
  return Track
})

jest.mock('../../AddAccountsChooser', () => ({
  __esModule: true,
  default: ({ buttonLabel, entryPoint }: { buttonLabel?: string; entryPoint?: string }) => (
    <button data-testid="add-accounts-chooser" data-entry-point={entryPoint}>
      {buttonLabel}
    </button>
  ),
}))

describe('AddAccountsCard', () => {
  it('renders the AddAccountsChooser with the "Manage accounts" label', () => {
    render(<AddAccountsCard />)

    expect(screen.getByTestId('add-accounts-chooser')).toHaveTextContent('Manage accounts')
  })

  it('passes "dashboard" as the entryPoint to AddAccountsChooser', () => {
    render(<AddAccountsCard />)

    expect(screen.getByTestId('add-accounts-chooser')).toHaveAttribute('data-entry-point', 'dashboard')
  })
})
