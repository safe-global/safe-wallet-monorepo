import { faker } from '@faker-js/faker'
import { render, renderWithUserEvent, screen } from '@/tests/test-utils'
import GuardStatusBanner, { isGuardReady, type GuardStatus } from '../GuardStatusBanner'

const FOREIGN_GUARD = faker.finance.ethereumAddress()
const SETTINGS_HREF = `/settings/modules?safe=sep:${faker.finance.ethereumAddress()}`

const renderBanner = (guard: GuardStatus, onRetry = jest.fn()) =>
  render(<GuardStatusBanner guard={guard} safeName="Treasury" settingsHref={SETTINGS_HREF} onRetry={onRetry} />)

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

  it('shows the slot and address of an unknown guard, with a link to remove it', () => {
    renderBanner({ status: 'unknown', foreignGuards: [{ slot: 'module', address: FOREIGN_GUARD }] })

    expect(screen.getByText('This Safe account has an unknown guard installed')).toBeInTheDocument()
    expect(screen.getByText(/Module guard/)).toBeInTheDocument()
    expect(screen.getByText(FOREIGN_GUARD)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Remove it in the Safe account settings/ })).toHaveAttribute(
      'href',
      SETTINGS_HREF,
    )
  })

  it('names the missing slot of a partly enabled guard', () => {
    renderBanner({ status: 'partial', missingSlot: 'transaction' })

    expect(screen.getByText(/The transaction guard slot isn't set/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Remove it in the Safe account settings/ })).toBeInTheDocument()
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

describe('isGuardReady', () => {
  it.each<[GuardStatus, boolean]>([
    [{ status: 'loading' }, false],
    [{ status: 'error' }, false],
    [{ status: 'none' }, true],
    [{ status: 'known' }, true],
    [{ status: 'partial', missingSlot: 'module' }, false],
    [{ status: 'unknown', foreignGuards: [] }, false],
    [{ status: 'unsupported' }, false],
    [{ status: 'not-activated' }, false],
  ])('%o → %s', (guard, ready) => {
    expect(isGuardReady(guard)).toBe(ready)
  })
})
