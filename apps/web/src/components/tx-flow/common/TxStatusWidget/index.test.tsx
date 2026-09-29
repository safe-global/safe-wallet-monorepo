import { render, screen } from '@/tests/test-utils'
import { mockIsSafeOwner, mockSafeInfo, mockWallet } from '@/tests/mocks/hooks'
import TxStatusWidget from '.'

jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/wallets/useWallet')
jest.mock('@/hooks/useIsSafeOwner')
jest.mock('@/hooks/useProposers', () => ({ useIsWalletProposer: jest.fn(() => false) }))

describe('TxStatusWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockWallet()
    mockIsSafeOwner(true)
    mockSafeInfo({ threshold: 3 })
  })

  it('omits the review step for flows that have none', () => {
    render(<TxStatusWidget />)

    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(screen.queryByTestId('step-review')).not.toBeInTheDocument()
  })

  it('adds the review step for flows that have one', () => {
    render(<TxStatusWidget reviewStepDone={false} />)

    expect(screen.getAllByRole('listitem')).toHaveLength(4)
    expect(screen.getByTestId('step-review')).toHaveAttribute('data-state', 'todo')
  })

  it('marks the review step done once the flow has reached it', () => {
    render(<TxStatusWidget reviewStepDone />)

    expect(screen.getByTestId('step-review')).toHaveAttribute('data-state', 'done')
  })

  it('always marks the first step done', () => {
    render(<TxStatusWidget reviewStepDone={false} />)

    expect(screen.getByTestId('step-create')).toHaveAttribute('data-state', 'done')
  })

  it('leaves the confirm step pending while the Safe needs more signatures', () => {
    render(<TxStatusWidget reviewStepDone />)

    expect(screen.getByTestId('step-confirm')).toHaveAttribute('data-state', 'todo')
  })

  it('marks the confirm step done for a single-signer Safe', () => {
    mockSafeInfo({ threshold: 1 })

    render(<TxStatusWidget reviewStepDone />)

    expect(screen.getByTestId('step-confirm')).toHaveAttribute('data-state', 'done')
  })

  it('relabels the batch steps and marks the batch as confirmed', () => {
    render(<TxStatusWidget reviewStepDone isBatch />)

    expect(screen.getByText('Queue transactions')).toBeInTheDocument()
    expect(screen.getByText('Create batch')).toBeInTheDocument()
    expect(screen.getByTestId('step-confirm')).toHaveAttribute('data-state', 'done')
  })

  it('leaves the execute step pending while no transaction is awaiting execution', () => {
    render(<TxStatusWidget reviewStepDone />)

    expect(screen.getByTestId('step-execute')).toHaveAttribute('data-state', 'todo')
  })
})
