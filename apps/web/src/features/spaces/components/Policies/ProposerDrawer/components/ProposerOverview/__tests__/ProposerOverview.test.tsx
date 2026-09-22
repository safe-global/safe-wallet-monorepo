import { render, screen } from '@/tests/test-utils'
import ProposerOverview from '../ProposerOverview'

const PROPS = {
  proposer: { address: '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326', name: 'Marc' },
  appliesTo: { address: '0x86753FE4b8E29Ce8A38cDf9559D80E05b00cdBA0', name: 'Treasury' },
  initiatedBy: { address: '0xA77De01c5B6f829Cbe4604cF71dDc8C4d608b000', name: 'Jacob' },
  lastUpdated: '06.24.26 03:35 AM UTC',
  enforcedBy: 'Safe module',
}

describe('ProposerOverview', () => {
  it('lists every proposer fact against its label', () => {
    render(<ProposerOverview {...PROPS} />)

    expect(screen.getByText('Policy overview')).toBeInTheDocument()
    expect(screen.getByText('Proposer')).toBeInTheDocument()
    expect(screen.getByText('Marc')).toBeInTheDocument()
    expect(screen.getByText('Applies to')).toBeInTheDocument()
    expect(screen.getByText('Treasury')).toBeInTheDocument()
    expect(screen.getByText('Initiated by')).toBeInTheDocument()
    expect(screen.getByText('Jacob')).toBeInTheDocument()
    expect(screen.getByText('06.24.26 03:35 AM UTC')).toBeInTheDocument()
    expect(screen.getByText('Safe module')).toBeInTheDocument()
  })
})
