import { render, renderWithUserEvent, screen } from '@/tests/test-utils'
import { getScenario } from '../services/model'
import { ProposalAdvanced, ProposalDetails, SignerList } from './ProposalDetails'

const proposal = (id: string) => getScenario('everyday').find((tx) => tx.id === id)!
const heavyBatch = () => getScenario('conflict-heavy').find((tx) => tx.id === 'treasury-42-batch')!

describe('proposal details preview', () => {
  it('marks JSON as non-signable with unavailable hashes', async () => {
    const { user } = renderWithUserEvent(<ProposalAdvanced proposal={proposal('treasury-42')} />)
    await user.click(screen.getByRole('tab', { name: 'Hashes' }))
    expect(screen.getByText(/Domain hash, message hash, and Safe transaction hash are not supplied/)).toBeVisible()
    await user.click(screen.getByRole('tab', { name: 'JSON' }))
    expect(screen.getByText('Prototype summary data, not a signable transaction payload.')).toBeVisible()
    expect(screen.getByText(/"calldata": null/)).toBeVisible()
  })
  it.each([
    ['treasury-42', 'everyday', ['Globex Payroll', '0x1c9f…77aa', 'ETH']],
    ['treasury-43', 'everyday', ['Add signer', 'Priya', '3 (unchanged)']],
    ['payroll-17', 'everyday', ['All actions (14)', 'Total value']],
    ['treasury-45', 'realistic', ['Ethereum', 'Unknown network · chain 999', 'This Safe account', '0.0004 ETH']],
    ['treasury-46', 'realistic', ['Verified', 'execute', '0x66a9…e7af', 'Wrap 1.2 ETH']],
    ['payroll-19', 'realistic', ['Delegate call', 'multiSend', 'All actions (2)']],
    ['payroll-20', 'realistic', ['approveHash', '#44 on Treasury Main']],
    ['grants-9', 'realistic', ['Limit sell order', '1 ARB = 0.795 USDC', 'Expired 2h ago', 'Expired']],
    ['grants-10', 'realistic', ['This Safe account', 'ETH']],
  ] as const)('shows production details for %s without repeating the amount', (id, scenario, details) => {
    const tx = getScenario(scenario).find((item) => item.id === id)!
    render(<ProposalDetails proposal={tx} />)
    for (const detail of details) expect(screen.getAllByText(detail)[0]).toBeVisible()
    if (tx.kind.type === 'transfer') expect(screen.queryByText(tx.amount)).toBeNull()
  })
  it('explains what an on-chain rejection replaces', () => {
    render(<ProposalDetails proposal={{ ...proposal('treasury-42'), kind: { type: 'rejection' } }} />)
    expect(screen.getByText(/replaces every awaiting transaction with nonce #42/)).toBeVisible()
  })
  it('lists production data fields and copies the sample Safe address', async () => {
    const { user } = renderWithUserEvent(<ProposalAdvanced proposal={proposal('treasury-42')} />)
    expect(screen.getByText('0 (call)')).toBeVisible()
    const writeText = jest.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    await user.click(screen.getByRole('button', { name: 'Copy sample Safe address' }))
    expect(writeText).toHaveBeenCalledWith('0x867500000000000000000000000000000000c3d2')
    expect(screen.getByRole('button', { name: 'sample Safe address copied' })).toBeVisible()
  })
  it('lists who created and signed, and asks for your signature when it’s needed', () => {
    render(<SignerList proposal={{ ...proposal('treasury-42'), signers: ['Max', 'Former owner'] }} persona="owner" />)
    const rows = screen.getAllByRole('listitem')
    expect(rows).toHaveLength(3)
    expect(rows[0]).toHaveTextContent(/^Created by Max/)
    expect(rows[1]).toHaveTextContent(/^Max0x9A0B…3a5bSigned/)
    expect(rows[2]).toHaveTextContent('Dev (you)0x1f3a…0a12Your signature needed')
    expect(screen.queryByText(/Ana|Jonas|Lena|Former owner/)).not.toBeInTheDocument()
  })
  it('shows no row for you once you can’t or needn’t sign', () => {
    const tx = getScenario('conflict-heavy').find((item) => item.id === 'treasury-42')!
    render(<SignerList proposal={tx} persona="owner" />)
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
    expect(screen.queryByText('Your signature needed')).not.toBeInTheDocument()
  })
  it('falls back to the address for an owner with no name', () => {
    const tx = getScenario('realistic').find((item) => item.id === 'grants-9')!
    render(<SignerList proposal={tx} persona="owner" />)
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent(/^Created by 0x65f8…c7b0/)
    expect(screen.getAllByRole('listitem')[1]).toHaveTextContent(/^0x65f8…c7b0Signed/)
  })
  it('lists a 46-action batch progressively with expand and collapse all', async () => {
    const { user } = renderWithUserEvent(<ProposalDetails proposal={heavyBatch()} />)
    expect(screen.getByText('All actions (46)')).toBeVisible()
    expect(screen.queryByText('Total value')).not.toBeInTheDocument()
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
  it('describes a threshold change instead of a signer change', () => {
    const threshold = getScenario('conflict-heavy').find((tx) => tx.id === 'treasury-42-threshold')!
    render(<ProposalDetails proposal={threshold} />)
    expect(screen.getByText('3 → 2')).toBeVisible()
    expect(screen.queryByText('Add signer')).not.toBeInTheDocument()
    expect(screen.queryByText(/unchanged/)).not.toBeInTheDocument()
  })
})
