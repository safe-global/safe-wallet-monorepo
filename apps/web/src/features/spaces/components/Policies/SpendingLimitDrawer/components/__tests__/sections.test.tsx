import { render, screen, within } from '@/tests/test-utils'
import { PendingBanner } from '../PendingBanner'
import { PendingSignatures } from '../PendingSignatures'
import { PolicyOverview } from '../PolicyOverview'

const SAFE = { address: '0x8675B754342754A30A2AeF474D114d8460bca19b', name: 'Ops' }

describe('PendingBanner', () => {
  it('renders both lines when the state supplies a second one', () => {
    render(
      <PendingBanner title="The spending limit is not active." line2="Sign and execute the transaction to activate." />,
    )

    expect(screen.getByText('The spending limit is not active.')).toBeInTheDocument()
    expect(screen.getByText('Sign and execute the transaction to activate.')).toBeInTheDocument()
  })

  it('renders the title alone for a viewer with nothing to do', () => {
    render(<PendingBanner title="The spending limit is not active." />)

    expect(screen.getByText('The spending limit is not active.')).toBeInTheDocument()
    expect(screen.queryByTestId('pending-banner-line-2')).not.toBeInTheDocument()
  })
})

describe('PendingSignatures', () => {
  it('counts the signatures collected against the threshold', () => {
    render(<PendingSignatures safe={SAFE} signed={1} required={3} />)

    expect(screen.getByText('1 of 3 signed')).toBeInTheDocument()
    expect(screen.getByText('Safe account')).toBeInTheDocument()
    expect(screen.getByText('Ops')).toBeInTheDocument()
  })
})

describe('PolicyOverview', () => {
  // Spending limits pass no initiator, so the row must not render an empty account.
  it('omits the initiated-by row when no initiator is given', () => {
    render(
      <PolicyOverview
        appliesTo={{ address: SAFE.address, name: 'Treasury' }}
        lastUpdated="Sep 22, 2026"
        enforcedBy="Safe allowance module"
      />,
    )

    expect(screen.queryByText('Initiated by')).not.toBeInTheDocument()

    const appliesToRow = screen.getByText('Applies to').closest('div') as HTMLElement
    expect(within(appliesToRow).getByText('Treasury')).toBeInTheDocument()

    const lastUpdatedRow = screen.getByText('Last updated').closest('div') as HTMLElement
    expect(within(lastUpdatedRow).getByText('Sep 22, 2026')).toBeInTheDocument()

    const enforcedByRow = screen.getByText('Enforced by').closest('div') as HTMLElement
    expect(within(enforcedByRow).getByText('Safe allowance module')).toBeInTheDocument()
  })

  it('binds each account to its own row when an initiator is given', () => {
    render(
      <PolicyOverview
        appliesTo={{ address: SAFE.address, name: 'Treasury' }}
        initiatedBy={{ address: SAFE.address, name: 'Alice' }}
        lastUpdated="Sep 22, 2026"
        enforcedBy="Safe allowance module"
      />,
    )

    const appliesToRow = screen.getByText('Applies to').closest('div') as HTMLElement
    expect(within(appliesToRow).getByText('Treasury')).toBeInTheDocument()
    expect(within(appliesToRow).queryByText('Alice')).not.toBeInTheDocument()

    const initiatedByRow = screen.getByText('Initiated by').closest('div') as HTMLElement
    expect(within(initiatedByRow).getByText('Alice')).toBeInTheDocument()
    expect(within(initiatedByRow).queryByText('Treasury')).not.toBeInTheDocument()
  })
})
