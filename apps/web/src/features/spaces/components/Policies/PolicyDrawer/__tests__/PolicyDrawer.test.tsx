import { render, screen } from '@/tests/test-utils'
import PolicyDrawer from '../PolicyDrawer'
import { PolicyStatus } from '../variants/types'

const PENDING_PROPS = {
  status: PolicyStatus.PENDING,
  description: 'Marketing is a nested Safe account.',
  safe: { address: '0x8675B754342754A30A2AeF474D114d8460bca19b', name: 'Ops', threshold: 3 },
  signatures: 2,
  overview: {
    proposer: { address: '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326', name: 'Marc' },
    appliesTo: { address: '0x86753FE4b8E29Ce8A38cDf9559D80E05b00cdBA0', name: 'Marketing' },
    initiatedBy: { address: '0xA77De01c5B6f829Cbe4604cF71dDc8C4d608b000', name: 'Jacob' },
    lastUpdated: '06.24.26 03:35 AM UTC',
    enforcedBy: 'Safe module',
  },
} as const

describe('PolicyDrawer', () => {
  const staticVariants: { status: PolicyStatus.ACTIVE | PolicyStatus.NOT_ACTIVATED; label: string }[] = [
    { status: PolicyStatus.ACTIVE, label: 'Active' },
    { status: PolicyStatus.NOT_ACTIVATED, label: 'Not activated' },
  ]

  it.each(staticVariants)('renders the $status variant content and status badge', ({ status, label }) => {
    render(
      <PolicyDrawer open onClose={jest.fn()} status={status} actionLabel="Submit delegation" onAction={jest.fn()} />,
    )

    expect(screen.getByText('Proposer role')).toBeInTheDocument()
    expect(screen.getAllByText(label)).toHaveLength(2)
  })

  it('renders the pending variant with its alert and signature section', () => {
    render(
      <PolicyDrawer
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
    expect(screen.getByText('06.24.26 03:35 AM UTC')).toBeInTheDocument()
    expect(screen.getByText('Safe module')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Review transaction' })).toBeInTheDocument()
  })

  it('renders nothing while closed', () => {
    render(
      <PolicyDrawer
        open={false}
        onClose={jest.fn()}
        status={PolicyStatus.ACTIVE}
        actionLabel="Submit delegation"
        onAction={jest.fn()}
      />,
    )

    expect(screen.queryByText('Proposer role')).not.toBeInTheDocument()
  })
})
