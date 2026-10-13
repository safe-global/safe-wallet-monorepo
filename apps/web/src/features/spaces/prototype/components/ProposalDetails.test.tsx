import { render, renderWithUserEvent, screen } from '@/tests/test-utils'
import { getScenario } from '../services/model'
import { ProposalActivity, ProposalSummary, ProposalTransactionDetails } from './ProposalDetails'

const proposal = (id: string) => getScenario('everyday').find((tx) => tx.id === id)!
const heavyBatch = () => getScenario('conflict-heavy').find((tx) => tx.id === 'treasury-42-batch')!

describe('proposal details preview', () => {
  it('keeps raw data collapsed and marks JSON as non-signable with unavailable hashes', async () => {
    const { user } = renderWithUserEvent(<ProposalTransactionDetails proposal={proposal('treasury-42')} />)
    expect(screen.queryByRole('tab', { name: 'JSON' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Advanced transaction data' }))
    await user.click(screen.getByRole('tab', { name: 'Hashes' }))
    expect(screen.getByText(/Domain hash, message hash, and Safe transaction hash are not supplied/)).toBeVisible()
    await user.click(screen.getByRole('tab', { name: 'JSON' }))
    expect(screen.getByText('Prototype summary data, not a signable transaction payload.')).toBeVisible()
    expect(screen.getByText(/"calldata": null/)).toBeVisible()
  })
  it.each([
    ['treasury-42', 'Transfer', '48.5 ETH'],
    ['treasury-43', 'Signer change', '3 signatures (unchanged)'],
    ['payroll-17', 'Batch', '14 actions'],
  ])('shows distinct transaction details for %s', (id, type, detail) => {
    render(<ProposalTransactionDetails proposal={proposal(id)} />)
    expect(screen.getByText(type)).toBeVisible()
    expect(screen.getByText(detail)).toBeVisible()
  })
  it('copies the explicitly labelled sample Safe address', async () => {
    const { user } = renderWithUserEvent(<ProposalSummary proposal={proposal('treasury-42')} />)
    const writeText = jest.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    await user.click(screen.getByRole('button', { name: 'Copy sample Safe address' }))
    expect(writeText).toHaveBeenCalledWith('0x867500000000000000000000000000000000c3d2')
    expect(screen.getByRole('button', { name: 'sample Safe address copied' })).toBeVisible()
  })
  it('shows only current-owner confirmations in the audit log', () => {
    render(
      <ProposalActivity proposal={{ ...proposal('treasury-42'), signers: ['Ana', 'Former owner'] }} persona="owner" />,
    )
    expect(screen.getByText('Signed (1/3)')).toBeVisible()
    expect(screen.queryByText('Signed (2/3)')).not.toBeInTheDocument()
    expect(screen.queryByText('Former owner')).not.toBeInTheDocument()
    expect(screen.getByText(/Needs 2 more · Dev, Max, Jonas, Lena/)).toBeVisible()
    expect(screen.getByRole('button', { name: 'Open in Safe' })).toBeDisabled()
  })
  it('lists a 46-action batch progressively with expand and collapse all', async () => {
    const { user } = renderWithUserEvent(<ProposalTransactionDetails proposal={heavyBatch()} />)
    expect(screen.getByText('46 actions')).toBeVisible()
    expect(screen.queryByText('Value')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Actions (46)' }))
    expect(screen.getAllByRole('button', { name: /^\d+\. / })).toHaveLength(10)
    await user.click(screen.getByRole('button', { name: 'Show all 46 actions' }))
    expect(screen.getAllByRole('button', { name: /^\d+\. / })).toHaveLength(46)
    expect(screen.queryByRole('button', { name: /Show all/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Expand all' }))
    expect(screen.getByRole('button', { name: /^46\. transfer · Supplier 46/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    await user.click(screen.getByRole('button', { name: 'Collapse all' }))
    expect(screen.getByRole('button', { name: /^1\. transfer · Supplier 1 / })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })
})
