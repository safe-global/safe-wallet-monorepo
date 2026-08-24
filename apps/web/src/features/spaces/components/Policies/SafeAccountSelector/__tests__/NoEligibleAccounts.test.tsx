import { renderWithUserEvent, screen } from '@/tests/test-utils'
import NoEligibleAccounts from '../components/NoEligibleAccounts'
import { NO_ELIGIBLE_ACCOUNTS_TEXT } from '../constants'

describe('NoEligibleAccounts', () => {
  it('explains why the list is empty', () => {
    renderWithUserEvent(<NoEligibleAccounts onSwitchWallet={jest.fn()} />)

    expect(screen.getByText(NO_ELIGIBLE_ACCOUNTS_TEXT)).toBeInTheDocument()
  })

  it('calls onSwitchWallet when the switch-wallet button is clicked', async () => {
    const onSwitchWallet = jest.fn()
    const { user } = renderWithUserEvent(<NoEligibleAccounts onSwitchWallet={onSwitchWallet} />)

    await user.click(screen.getByRole('button', { name: 'Switch wallet' }))

    expect(onSwitchWallet).toHaveBeenCalledTimes(1)
  })
})
