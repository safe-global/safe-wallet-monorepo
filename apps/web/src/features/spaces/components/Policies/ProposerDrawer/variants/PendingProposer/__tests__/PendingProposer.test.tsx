import { render, screen } from '@/tests/test-utils'
import { PendingProposer } from '../PendingProposer'

const SAFE = { address: '0x8675B754342754A30A2AeF474D114d8460bca19b', name: 'Ops', threshold: 3 }

const OVERVIEW = {
  proposer: { address: '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326', name: 'Marc' },
  appliesTo: { address: '0x86753FE4b8E29Ce8A38cDf9559D80E05b00cdBA0', name: 'Marketing' },
  initiatedBy: { address: '0xA77De01c5B6f829Cbe4604cF71dDc8C4d608b000', name: 'Jacob' },
  lastUpdated: '06.24.26 03:35 AM UTC',
  enforcedBy: 'Safe module',
}

const PROPS = {
  description: 'Marketing is a nested Safe account.',
  safe: SAFE,
  signatures: 2,
  overview: OVERVIEW,
}

describe('PendingProposer', () => {
  it('explains that the role has not activated yet and why', () => {
    render(<PendingProposer {...PROPS} />)

    expect(screen.getByText('The proposer role is not active yet')).toBeInTheDocument()
    expect(screen.getByText('Marketing is a nested Safe account.')).toBeInTheDocument()
  })

  it('tints the alert as a warning rather than an error', () => {
    render(<PendingProposer {...PROPS} />)

    expect(screen.getByRole('alert')).toHaveClass('bg-warning-subtle')
  })

  it('shows the signing progress with the time left to sign', () => {
    render(<PendingProposer {...PROPS} expiresLabel="Expires in 1h 33 min" />)

    expect(screen.getByText('Pending signatures')).toBeInTheDocument()
    expect(screen.getByText('Expires in 1h 33 min')).toBeInTheDocument()
    expect(screen.getByTestId('safe-signature-progress')).toHaveTextContent('2 of 3 signed')
  })

  it('omits the expiry note when the request does not expire', () => {
    render(<PendingProposer {...PROPS} />)

    expect(screen.getByText('Pending signatures')).toBeInTheDocument()
    expect(screen.queryByText(/Expires/)).not.toBeInTheDocument()
  })

  it('leaves the progress on the in-flight tone while signatures can still arrive', () => {
    render(<PendingProposer {...PROPS} />)

    expect(screen.getByTestId('safe-signature-progress')).not.toHaveAttribute('data-variant', 'destructive')
  })

  it('includes the proposer overview', () => {
    render(<PendingProposer {...PROPS} />)

    expect(screen.getByText('Policy overview')).toBeInTheDocument()
    expect(screen.getByText('Marc')).toBeInTheDocument()
  })
})
