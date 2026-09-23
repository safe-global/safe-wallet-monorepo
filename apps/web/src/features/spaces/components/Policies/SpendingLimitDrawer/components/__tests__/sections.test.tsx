import { render, screen } from '@/tests/test-utils'
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
  it('lists who the policy applies to and who set it up', () => {
    render(
      <PolicyOverview
        appliesTo={{ address: SAFE.address, name: 'Treasury' }}
        initiatedBy={{ address: SAFE.address, name: 'Alice' }}
        lastUpdated="Sep 22, 2026"
        enforcedBy="Safe module"
      />,
    )

    expect(screen.getByText('Applies to')).toBeInTheDocument()
    expect(screen.getByText('Initiated by')).toBeInTheDocument()
    expect(screen.getByText('Safe module')).toBeInTheDocument()
  })
})
