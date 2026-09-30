import { render, screen } from '@/tests/test-utils'
import { NotActivatedProposer } from '../NotActivatedProposer'

const SAFE = { address: '0x8675B754342754A30A2AeF474D114d8460bca19b', name: 'Ops', threshold: 3 }

const OVERVIEW = {
  proposer: { address: '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326', name: 'Marc' },
  appliesTo: { address: '0x86753FE4b8E29Ce8A38cDf9559D80E05b00cdBA0', name: 'Marketing' },
  initiatedBy: { address: '0xA77De01c5B6f829Cbe4604cF71dDc8C4d608b000', name: 'Jacob' },
  lastUpdated: '06.24.26 03:35 AM UTC',
  enforcedBy: 'Safe module',
}

const PROPS = {
  description: 'The time window expired. Set the policy up again to retry.',
  safe: SAFE,
  signatures: 2,
  overview: OVERVIEW,
}

describe('NotActivatedProposer', () => {
  it('says the role was not activated and what stopped it', () => {
    render(<NotActivatedProposer {...PROPS} />)

    expect(screen.getByText('The proposer role was not activated')).toBeInTheDocument()
    expect(screen.getByText('The time window expired. Set the policy up again to retry.')).toBeInTheDocument()
  })

  it('tints the alert as an error', () => {
    render(<NotActivatedProposer {...PROPS} />)

    expect(screen.getByRole('alert')).toHaveClass('bg-error-subtle')
  })

  it('pairs the alert with triangle-alert rather than the destructive default', () => {
    render(<NotActivatedProposer {...PROPS} />)

    const alert = screen.getByRole('alert')

    expect(alert.querySelector('.lucide-triangle-alert')).toBeInTheDocument()
    expect(alert.querySelector('.lucide-circle-alert')).not.toBeInTheDocument()
  })

  it('shows the stalled signatures with what is left of the window', () => {
    render(<NotActivatedProposer {...PROPS} expiresLabel="Expired" />)

    expect(screen.getByText('Pending signatures')).toBeInTheDocument()
    expect(screen.getByText('Expired')).toBeInTheDocument()
    expect(screen.getByTestId('safe-signature-progress')).toHaveTextContent('2 of 3 signed')
  })

  it('omits the window note when none is given', () => {
    render(<NotActivatedProposer {...PROPS} />)

    expect(screen.getByText('Pending signatures')).toBeInTheDocument()
    expect(screen.queryByText(/Expire/)).not.toBeInTheDocument()
  })

  it('marks the signature progress as failed even below the threshold', () => {
    render(<NotActivatedProposer {...PROPS} />)

    expect(screen.getByTestId('safe-signature-progress')).toHaveAttribute('data-variant', 'destructive')
  })

  it('includes the proposer overview', () => {
    render(<NotActivatedProposer {...PROPS} />)

    expect(screen.getByText('Policy overview')).toBeInTheDocument()
    expect(screen.getByText('Marc')).toBeInTheDocument()
  })
})
