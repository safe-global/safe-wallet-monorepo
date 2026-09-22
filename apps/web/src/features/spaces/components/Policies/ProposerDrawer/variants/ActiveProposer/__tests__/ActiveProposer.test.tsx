import { render, screen } from '@/tests/test-utils'
import { ActiveProposer } from '../ActiveProposer'

const OVERVIEW = {
  proposer: { address: '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326', name: 'Marc' },
  appliesTo: { address: '0x86753FE4b8E29Ce8A38cDf9559D80E05b00cdBA0', name: 'Marketing' },
  initiatedBy: { address: '0xA77De01c5B6f829Cbe4604cF71dDc8C4d608b000', name: 'Jacob' },
  lastUpdated: '06.24.26 03:35 AM UTC',
  enforcedBy: 'Safe module',
}

describe('ActiveProposer', () => {
  it('shows the proposer overview', () => {
    render(<ActiveProposer overview={OVERVIEW} />)

    expect(screen.getByText('Policy overview')).toBeInTheDocument()
    expect(screen.getByText('Marc')).toBeInTheDocument()
  })

  it('carries none of the chrome a proposer still awaiting activation needs', () => {
    render(<ActiveProposer overview={OVERVIEW} />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByText('Pending signatures')).not.toBeInTheDocument()
    expect(screen.queryByTestId('safe-signature-progress')).not.toBeInTheDocument()
  })
})
