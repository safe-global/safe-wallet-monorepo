import { faker } from '@faker-js/faker'
import { fakerChecksummedAddress, render, screen } from '@/tests/test-utils'
import CosignerStatus from './index'

describe('CosignerStatus', () => {
  const cosigner = fakerChecksummedAddress()

  it('renders nothing when the tx needs no co-signature', () => {
    const { container } = render(<CosignerStatus state={{ status: 'notRequired' }} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('tells the user it is waiting while the co-signer reviews the tx', () => {
    render(<CosignerStatus state={{ status: 'pending', cosigner }} />)

    expect(screen.getByText('Waiting for the co-signer to review this transaction.')).toBeInTheDocument()
  })

  it('shows the reason the co-signer rejected the tx', () => {
    const reason = faker.lorem.sentence()

    render(<CosignerStatus state={{ status: 'rejected', reason, ruleId: null, cosignerName: 'SAFE', cosigner }} />)

    expect(screen.getByText(`The co-signer rejected this transaction: ${reason}`)).toBeInTheDocument()
  })

  it('confirms the co-signer approved the tx', () => {
    render(
      <CosignerStatus
        state={{ status: 'ready', context: '0x', onchain: true, signer: cosigner, cosignerName: 'SAFE', cosigner }}
      />,
    )

    expect(screen.getByText('The co-signer approved this transaction.')).toBeInTheDocument()
  })

  it('warns when the co-signer service cannot be reached', () => {
    render(<CosignerStatus state={{ status: 'unavailable', reason: "Can't reach the co-signer service.", cosigner }} />)

    expect(screen.getByText("Can't reach the co-signer service.")).toBeInTheDocument()
  })

  it('explains that batches needing a co-signature per action are not supported', () => {
    render(<CosignerStatus state={{ status: 'unsupportedBatch' }} />)

    expect(screen.getByText(/needs a co-signature for each action/)).toBeInTheDocument()
  })
})
