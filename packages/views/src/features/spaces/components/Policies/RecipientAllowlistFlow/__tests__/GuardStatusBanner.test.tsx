import { faker } from '@faker-js/faker'
import { render, renderWithUserEvent, screen } from '@/tests/test-utils'
import GuardStatusBanner, { type GuardStatus } from '../GuardStatusBanner'

const FOREIGN_GUARD = faker.finance.ethereumAddress()
const SETTINGS_HREF = `/settings/modules?safe=sep:${faker.finance.ethereumAddress()}`

const renderBanner = (guard: GuardStatus) =>
  render(
    <GuardStatusBanner
      guard={guard}
      safeName="Treasury"
      settingsLink={<a href={SETTINGS_HREF}>Go to Safe settings</a>}
      renderAddress={(address) => <span data-testid="guard-address">{address}</span>}
    />,
  )

describe('GuardStatusBanner', () => {
  it('names the Safe being checked while loading', () => {
    renderBanner({ status: 'loading' })

    expect(screen.getByText('Checking guards on Treasury…')).toBeInTheDocument()
  })

  it('says the transaction also enables the guard when there is none', () => {
    renderBanner({ status: 'none' })

    expect(screen.getByTestId('guard-status-info')).toHaveTextContent("The Safe policy guard isn't enabled yet")
    expect(screen.getByText(/active right after execution/)).toBeInTheDocument()
  })

  it('says only the policy change is sent when the policy guard is already enabled', () => {
    renderBanner({ status: 'known' })

    expect(screen.getByTestId('guard-status-success')).toHaveTextContent('The Safe policy guard is already enabled')
    expect(
      screen.getByText(
        'Only the policy change is sent. It waits 24 hours, then needs an activation step before it applies.',
      ),
    ).toBeInTheDocument()
  })

  it('shows the slot and address of an unknown transaction guard, with a link to remove it in settings', () => {
    renderBanner({ status: 'unknown', foreignGuards: [{ slot: 'transaction', address: FOREIGN_GUARD }] })

    expect(screen.getByText('This Safe account has an unknown guard')).toBeInTheDocument()
    expect(screen.getByText('Transaction guard')).toBeInTheDocument()
    expect(screen.getByTestId('guard-address')).toHaveTextContent(FOREIGN_GUARD)
    expect(screen.getByRole('link', { name: 'Go to Safe settings' })).toHaveAttribute('href', SETTINGS_HREF)
    expect(screen.queryByText(/Removing a module guard needs a transaction/)).not.toBeInTheDocument()
  })

  it('does not link an unknown module guard to settings, which cannot remove it', () => {
    renderBanner({ status: 'unknown', foreignGuards: [{ slot: 'module', address: FOREIGN_GUARD }] })

    expect(screen.getByText('Module guard')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText(/Removing a module guard needs a transaction from this Safe account\./)).toBeInTheDocument()
  })

  it('offers both ways when unknown guards sit in both slots', () => {
    renderBanner({
      status: 'unknown',
      foreignGuards: [
        { slot: 'transaction', address: FOREIGN_GUARD },
        { slot: 'module', address: FOREIGN_GUARD },
      ],
    })

    expect(screen.getAllByTestId('guard-address')).toHaveLength(2)
    expect(screen.getByRole('link', { name: 'Go to Safe settings' })).toBeInTheDocument()
    expect(screen.getByText(/Removing a module guard needs a transaction/)).toBeInTheDocument()
  })

  it('links to settings when only the transaction slot holds the policy guard', () => {
    renderBanner({ status: 'partial', missingSlot: 'module' })

    expect(screen.getByText(/The module guard slot isn't set/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to Safe settings' })).toHaveAttribute('href', SETTINGS_HREF)
  })

  it('says a transaction is needed when only the module slot holds the policy guard', () => {
    renderBanner({ status: 'partial', missingSlot: 'transaction' })

    expect(screen.getByText(/The transaction guard slot isn't set/)).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText(/Removing a module guard needs a transaction/)).toBeInTheDocument()
  })

  it('shows a guard address shortened when the app supplies no identity row', () => {
    render(
      <GuardStatusBanner
        guard={{ status: 'unknown', foreignGuards: [{ slot: 'transaction', address: FOREIGN_GUARD }] }}
        safeName="Treasury"
      />,
    )

    expect(screen.getByText(`${FOREIGN_GUARD.slice(0, 6)}...${FOREIGN_GUARD.slice(-4)}`)).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('names the version a Safe needs', () => {
    renderBanner({ status: 'unsupported' })

    expect(screen.getByText('Recipient allowlists need Safe v1.5.0 or newer.')).toBeInTheDocument()
  })

  it('says a Safe that is not deployed yet needs activating', () => {
    renderBanner({ status: 'not-activated' })

    expect(screen.getByText("This Safe account isn't activated yet")).toBeInTheDocument()
  })

  it('retries a failed check', async () => {
    const onRetry = jest.fn()
    const { user } = renderWithUserEvent(
      <GuardStatusBanner guard={{ status: 'error' }} safeName="Treasury" onRetry={onRetry} />,
    )

    expect(screen.getByText("Couldn't check the guards on Treasury")).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
