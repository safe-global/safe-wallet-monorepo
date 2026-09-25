import { render, screen } from '@/tests/test-utils'
import ProposerDrawer from '../ProposerDrawer'
import { ProposerStatus } from '../variants/types'

const OVERVIEW = {
  proposer: { address: '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326', name: 'Marc' },
  appliesTo: { address: '0x86753FE4b8E29Ce8A38cDf9559D80E05b00cdBA0', name: 'Marketing' },
  initiatedBy: { address: '0xA77De01c5B6f829Cbe4604cF71dDc8C4d608b000', name: 'Jacob' },
  lastUpdated: '06.24.26 03:35 AM UTC',
  enforcedBy: 'Safe module',
}

const PENDING_PROPS = {
  status: ProposerStatus.PENDING,
  description: 'Marketing is a nested Safe account.',
  safe: { address: '0x8675B754342754A30A2AeF474D114d8460bca19b', name: 'Ops', threshold: 3 },
  signatures: 2,
  overview: OVERVIEW,
} as const

describe('ProposerDrawer', () => {
  it('renders the not-activated variant with why it failed and its stalled signatures', () => {
    render(
      <ProposerDrawer
        open
        onClose={jest.fn()}
        status={ProposerStatus.NOT_ACTIVATED}
        description="The time window expired. Set the policy up again to retry."
        safe={PENDING_PROPS.safe}
        signatures={2}
        expiresLabel="Expired"
        overview={OVERVIEW}
        actionLabel="Retry"
        onAction={jest.fn()}
      />,
    )

    expect(screen.getByText('Proposer role')).toBeInTheDocument()
    expect(screen.getByText('Not activated')).toBeInTheDocument()
    expect(screen.getByText('The proposer role was not activated')).toBeInTheDocument()
    expect(screen.getByText('The time window expired. Set the policy up again to retry.')).toBeInTheDocument()
    expect(screen.getByText('Expired')).toBeInTheDocument()
    expect(screen.getByTestId('safe-signature-progress')).toHaveTextContent('2 of 3 signed')
    expect(screen.getByText('Policy overview')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('renders the active variant as the proposer overview alone', () => {
    render(
      <ProposerDrawer
        open
        onClose={jest.fn()}
        status={ProposerStatus.ACTIVE}
        overview={OVERVIEW}
        actionLabel="Remove proposer"
        actionVariant="secondary"
        onAction={jest.fn()}
      />,
    )

    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Policy overview')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove proposer' })).toBeInTheDocument()
    expect(screen.queryByText('Pending signatures')).not.toBeInTheDocument()
  })

  it('keeps the active action out of reach for a wallet that cannot sign', () => {
    render(
      <ProposerDrawer
        open
        onClose={jest.fn()}
        status={ProposerStatus.ACTIVE}
        overview={OVERVIEW}
        actionLabel="Remove proposer"
        actionDisabled
        actionHint="Only signers of this Treasury can delete or edit this Proposer role."
        onAction={jest.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Remove proposer' })).toBeDisabled()
    expect(screen.getByText('Only signers of this Treasury can delete or edit this Proposer role.')).toBeInTheDocument()
  })

  it('renders the pending variant with its alert, signature section and overview', () => {
    render(
      <ProposerDrawer
        open
        onClose={jest.fn()}
        actionLabel="Review transaction"
        onAction={jest.fn()}
        {...PENDING_PROPS}
      />,
    )

    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.getByText('The proposer role is not active yet')).toBeInTheDocument()
    expect(screen.getByText(PENDING_PROPS.description)).toBeInTheDocument()
    expect(screen.getByText('Pending signatures')).toBeInTheDocument()
    expect(screen.getByTestId('safe-signature-progress')).toHaveTextContent('2 of 3 signed')
    expect(screen.getByText('Policy overview')).toBeInTheDocument()
    expect(screen.getByText('Marc')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Review transaction' })).toBeInTheDocument()
  })

  it('renders nothing while closed', () => {
    render(
      <ProposerDrawer
        open={false}
        onClose={jest.fn()}
        status={ProposerStatus.ACTIVE}
        overview={OVERVIEW}
        actionLabel="Remove proposer"
        onAction={jest.fn()}
      />,
    )

    expect(screen.queryByText('Proposer role')).not.toBeInTheDocument()
  })

  it('stands in with skeletons while the policy is still loading', () => {
    render(<ProposerDrawer open onClose={jest.fn()} isLoading />)

    expect(screen.getByText('Proposer role')).toBeInTheDocument()
    expect(screen.getByTestId('proposer-status-skeleton')).toBeInTheDocument()
    expect(screen.getByText('Policy overview')).toBeInTheDocument()
    expect(screen.getAllByTestId('account-identity-skeleton')).toHaveLength(3)
    expect(screen.getByTestId('policy-drawer-actions-skeleton')).toBeInTheDocument()
    expect(screen.queryByText('Active')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /remove proposer|retry|review transaction/i })).not.toBeInTheDocument()
  })
})
