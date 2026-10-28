import { faker } from '@faker-js/faker'
import { render, renderWithUserEvent, screen } from '@/tests/test-utils'
import GuardStatusBanner, { type GuardStatus } from '../GuardStatusBanner'

const FOREIGN_GUARD = faker.finance.ethereumAddress()

const renderBanner = (guard: GuardStatus) => render(<GuardStatusBanner guard={guard} safeName="Treasury" />)

describe('GuardStatusBanner', () => {
  it('names the Safe being checked while loading', () => {
    renderBanner({ status: 'loading' })

    expect(screen.getByText('Checking guards on Treasury…')).toBeInTheDocument()
  })

  it.each<GuardStatus>([{ status: 'none' }, { status: 'known' }])('renders nothing for the $status state', (guard) => {
    const { container } = renderBanner(guard)

    expect(container).toBeEmptyDOMElement()
  })

  it('asks to remove an unknown policy and leads to the Safe settings', () => {
    render(
      <GuardStatusBanner
        guard={{ status: 'unknown', foreignGuards: [{ slot: 'module', address: FOREIGN_GUARD }] }}
        safeName="Treasury"
        settingsLink={<a href="/settings">Go to Safe settings</a>}
      />,
    )

    expect(screen.getByText('This Safe account has an unknown policy installed')).toBeInTheDocument()
    expect(
      screen.getByText('A Safe account can only have one policy of this kind, remove it to set up an allowlist.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to Safe settings' })).toHaveAttribute('href', '/settings')
  })

  it('lists every installed unknown policy', () => {
    const moduleGuard = faker.finance.ethereumAddress()
    render(
      <GuardStatusBanner
        guard={{
          status: 'unknown',
          foreignGuards: [
            { slot: 'transaction', address: FOREIGN_GUARD },
            { slot: 'module', address: moduleGuard },
          ],
        }}
        safeName="Treasury"
        renderAddress={(address, name) => <span data-testid={`policy-${address}`}>{name}</span>}
      />,
    )

    const list = screen.getByTestId('installed-policies')
    expect(list).toHaveTextContent('Installed policies')
    expect(list).toHaveTextContent('Unknown policy 1')
    expect(list).toHaveTextContent('Unknown policy 2')
    expect(screen.getByTestId(`policy-${FOREIGN_GUARD}`)).toHaveTextContent('Unknown policy 1')
    expect(screen.getByTestId(`policy-${moduleGuard}`)).toHaveTextContent('Unknown policy 2')
  })

  it('shows the short address of an unknown policy without an app renderer', () => {
    renderBanner({ status: 'unknown', foreignGuards: [{ slot: 'transaction', address: FOREIGN_GUARD }] })

    const list = screen.getByTestId('installed-policies')
    expect(list).toHaveTextContent(FOREIGN_GUARD.slice(-4))
    expect(screen.getByText('Unknown policy')).toBeInTheDocument()
    expect(list).not.toHaveTextContent('Unknown policy 1')
  })

  it('warns that modules skip the policies and the module guard can be set later', () => {
    renderBanner({ status: 'partial', missingSlot: 'module' })

    expect(screen.getByTestId('guard-status-warning')).toBeInTheDocument()
    expect(screen.getByText(/transactions sent through modules skip your policies/)).toBeInTheDocument()
    expect(screen.getByText(/You can set the module guard later in this flow/)).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('warns that owner transactions skip the policies and this setup sets the transaction guard', () => {
    renderBanner({ status: 'partial', missingSlot: 'transaction' })

    expect(screen.getByTestId('guard-status-warning')).toBeInTheDocument()
    expect(screen.getByText(/transactions signed by the owners skip your policies/)).toBeInTheDocument()
    expect(screen.getByText(/This setup sets the transaction guard/)).toBeInTheDocument()
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
