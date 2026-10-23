import { faker } from '@faker-js/faker'
import { render, renderWithUserEvent, screen } from '@/tests/test-utils'
import GuardStatusBanner, { type GuardStatus } from '../GuardStatusBanner'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'

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

  it.each<[string, GuardStatus]>([
    ['a transaction guard', { status: 'unknown', foreignGuards: [{ slot: 'transaction', address: FOREIGN_GUARD }] }],
    ['a module guard', { status: 'unknown', foreignGuards: [{ slot: 'module', address: FOREIGN_GUARD }] }],
    [
      'guards in both slots',
      {
        status: 'unknown',
        foreignGuards: [
          { slot: 'transaction', address: FOREIGN_GUARD },
          { slot: 'module', address: FOREIGN_GUARD },
        ],
      },
    ],
  ])('asks to remove an unknown policy and links to the help article for %s', (_, guard) => {
    renderBanner(guard)

    expect(screen.getByText('This Safe account has an unknown policy installed')).toBeInTheDocument()
    expect(screen.getByText('Remove it to set up an allowlist.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'How to remove it' })).toHaveAttribute(
      'href',
      HelpCenterArticle.TRANSACTION_GUARD,
    )
    expect(screen.queryByText(/Transaction guard|Module guard/)).not.toBeInTheDocument()
    expect(screen.queryByText(new RegExp(FOREIGN_GUARD.slice(0, 6)))).not.toBeInTheDocument()
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
