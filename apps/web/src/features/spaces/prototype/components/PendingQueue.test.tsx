import type { ReactNode } from 'react'
import { act, fireEvent, render, renderWithUserEvent, screen, within } from '@/tests/test-utils'
import PendingQueue from './PendingQueue'
import { useIsMobile } from '@safe-global/views/hooks/use-mobile'
import useMediaQuery from '@/hooks/useMediaQuery'

jest.mock('@safe-global/views/hooks/use-mobile', () => ({ useIsMobile: jest.fn(() => false) }))
jest.mock('@/hooks/useMediaQuery', () => ({ __esModule: true, default: jest.fn() }))

const WIDE = '(min-width: 1280px)'
const SHORT = '(max-height: 599px)'
const setViewport = ({ wide = true, short = false }: { wide?: boolean; short?: boolean } = {}) =>
  jest.mocked(useMediaQuery).mockImplementation((query) => (query === WIDE ? wide : query === SHORT ? short : false))

beforeEach(() => {
  jest.mocked(useIsMobile).mockReturnValue(false)
  setViewport()
})

jest.mock('./PrototypeFrame', () => ({ PrototypeFrame: ({ children }: { children: ReactNode }) => <>{children}</> }))

type TestUser = ReturnType<typeof renderWithUserEvent>['user']
const openFilter = async (user: TestUser, section: string) => {
  await user.click(screen.getByRole('button', { name: /^Filters/ }))
  const trigger = screen.getByRole('button', { name: section })
  if (trigger.getAttribute('aria-expanded') !== 'true') await user.click(trigger)
}

const sectionHeader = (name: string) =>
  screen.getByRole('button', { name }).closest<HTMLElement>('[data-slot="section-header"]')!

const allPending = () => within(screen.getByRole('tabpanel', { name: 'Queue' }))

describe('queue design exploration', () => {
  it('defaults to a table with named columns and review actions without executing', () => {
    render(<PendingQueue />)
    const table = within(screen.getByRole('table', { name: 'Pending transactions' }))
    expect(table.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'Type',
      'Safe',
      'Network',
      'Signatures',
      'Note',
      'Status',
      'Action',
    ])
    expect(screen.queryByRole('button', { name: /^(Collapse|Expand) / })).not.toBeInTheDocument()
    expect(table.getByRole('button', { name: 'Execute Batch · 14 actions' })).toBeVisible()
    expect(table.getByRole('button', { name: 'Sign Send to Bitwave Payroll' })).toBeVisible()
    expect(table.getByRole('button', { name: 'Review Add signer Priya' })).toBeVisible()
    fireEvent.click(table.getByRole('button', { name: 'Execute Batch · 14 actions' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Batch · 14 actions')
    expect(screen.queryByRole('button', { name: 'Execute in preview' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(table.getByRole('button', { name: 'Execute Batch · 14 actions' })).toBeInTheDocument()
  })
  it('keeps replace or cancel in the review panel without creating a proposal', () => {
    render(<PendingQueue />)
    expect(screen.queryByRole('button', { name: 'Replace or cancel Send to Bitwave Payroll' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Sign Send to Bitwave Payroll' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Replace or cancel' }))
    const drawer = within(screen.getByRole('dialog'))
    expect(drawer.getByRole('button', { name: 'Hide replace or cancel' })).toBeVisible()
    expect(screen.getByRole('dialog')).toHaveTextContent('A replacement or cancellation uses the same nonce')
    expect(screen.getByRole('dialog')).not.toHaveTextContent('Competing proposal created')
  })
  it('opens review instead of offering signing to an observer', () => {
    render(<PendingQueue />, { routerProps: { query: { persona: 'observer' } } })
    const table = within(screen.getByRole('table', { name: 'Pending transactions' }))
    expect(table.queryByRole('button', { name: 'Sign Send to Bitwave Payroll' })).not.toBeInTheDocument()
    expect(table.queryByRole('button', { name: 'Replace or cancel Send to Bitwave Payroll' })).not.toBeInTheDocument()
    fireEvent.click(table.getByRole('button', { name: 'Review Send to Bitwave Payroll' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Send to Bitwave Payroll')
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Waiting on signatures' })).toBeDisabled()
  })

  it('keeps dependency inspection available when earlier proposals are filtered out', () => {
    render(<PendingQueue />, { routerProps: { query: { groupBy: 'status', option: 'queues' } } })
    fireEvent.change(screen.getByRole('searchbox', { name: 'Find a proposal' }), {
      target: { value: 'Add signer Priya' },
    })
    expect(screen.queryByRole('button', { name: 'Open Send to Bitwave Payroll' })).not.toBeInTheDocument()
    fireEvent.click(allPending().getByRole('button', { name: 'Open Add signer Priya' }))
    fireEvent.click(screen.getByRole('button', { name: 'Earlier transactions' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Send to Bitwave Payroll')
  })
  it('opens proposal details in the shared side panel', () => {
    render(<PendingQueue />, { routerProps: { query: { groupBy: 'status' } } })
    fireEvent.click(allPending().getByRole('button', { name: 'Open Batch · 14 actions' }))
    expect(screen.getByRole('dialog')).toBeVisible()
    expect(screen.getByRole('dialog')).not.toHaveTextContent(
      'No wallet connection, signature or transaction will be requested',
    )
    expect(within(screen.getByRole('dialog')).queryByRole('status')).not.toBeInTheDocument()
  })
  it('keeps rows compact and details out of the table', () => {
    render(<PendingQueue />, { routerProps: { query: { groupBy: 'status' } } })
    expect(screen.getByRole('tabpanel', { name: 'Queue' })).toBeInTheDocument()
    expect(screen.queryByText('What happens next')).not.toBeInTheDocument()
    fireEvent.click(allPending().getByRole('button', { name: 'Open Send to Bitwave Payroll' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('What happens next')
    fireEvent.click(screen.getByRole('button', { name: 'Workspace note' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('September contractor payouts')
  })
  it('shows competing proposals in the side panel', () => {
    render(<PendingQueue />, { routerProps: { query: { groupBy: 'status', scenario: 'conflict' } } })
    fireEvent.click(allPending().getByRole('button', { name: 'Open Send to Bitwave Payroll' }))
    fireEvent.click(screen.getByRole('button', { name: 'Competing proposals' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Swap USDC → ETH')
  })
  it('prioritizes actionable proposals without group headings in the ungrouped inbox', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, {
      routerProps: { query: { groupBy: 'status', option: 'inbox' } },
    })
    await openFilter(user, 'Group by')
    await user.click(screen.getByRole('combobox', { name: 'Group by' }))
    await user.click(await screen.findByRole('option', { name: 'None' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('button', { name: /^(Collapse|Expand) / })).not.toBeInTheDocument()
    const proposalButtons = allPending().getAllByRole('button', { name: /^Open / })
    expect(proposalButtons[0]).toHaveAccessibleName('Open Batch · 14 actions')
    expect(proposalButtons[1]).toHaveAccessibleName('Open Send to Bitwave Payroll')
    expect(screen.queryByRole('heading', { name: 'Ready to move' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Treasury Main' })).not.toBeInTheDocument()
  })
  it('collapses one status without hiding proposals in other sections', () => {
    render(<PendingQueue />, { routerProps: { query: { groupBy: 'status' } } })
    const section = within(screen.getByRole('table', { name: 'Ready to sign transactions' }))
    expect(section.getAllByRole('button', { name: /^Open / })).toHaveLength(3)
    fireEvent.click(screen.getByRole('button', { name: 'Collapse Ready to sign' }))
    expect(section.queryByRole('button', { name: /^Open / })).not.toBeInTheDocument()
    expect(sectionHeader('Expand Ready to sign')).toHaveTextContent('3')
    expect(screen.getByRole('button', { name: 'Open Batch · 14 actions' })).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Expand Ready to sign' }))
    expect(section.getAllByRole('button', { name: /^Open / })).toHaveLength(3)
  })
  it('shows each pending proposal once across four primary status sections', () => {
    render(<PendingQueue />, { routerProps: { query: { groupBy: 'status' } } })
    expect(screen.getAllByRole('table').map((table) => table.getAttribute('aria-label'))).toEqual([
      'Ready to execute transactions',
      'Ready to sign transactions',
      'Waiting on signatures transactions',
      'Waiting on transactions transactions',
    ])
    for (const [label, count] of [
      ['Waiting on signatures', '1'],
      ['Ready to sign', '3'],
      ['Ready to execute', '1'],
      ['Waiting on transactions', '1'],
    ]) {
      expect(sectionHeader(`Collapse ${label}`)).toHaveTextContent(count)
    }
    expect(screen.queryByRole('button', { name: /All pending/ })).not.toBeInTheDocument()
    const rows = screen.getAllByRole('button', { name: /^Open / })
    expect(rows).toHaveLength(6)
    expect(new Set(rows.map((row) => row.getAttribute('aria-label'))).size).toBe(6)
    expect(screen.queryByRole('button', { name: /Create note/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: 'Add section' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Remove .* section$/ })).not.toBeInTheDocument()
  })
  it('filters every section by multiple selected Safe accounts', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { groupBy: 'status' } } })
    await openFilter(user, 'Safe account')
    await user.click(screen.getByRole('checkbox', { name: 'Treasury Main' }))
    await user.keyboard('{Escape}')
    expect(allPending().getAllByRole('button', { name: /^Open / })).toHaveLength(3)
    expect(screen.queryByRole('button', { name: 'Open Send to Bitwave Payroll' })).not.toBeInTheDocument()
    expect(sectionHeader('Collapse Ready to sign')).toHaveTextContent('1')
    expect(sectionHeader('Collapse Waiting on transactions')).toHaveTextContent('0')
    expect(sectionHeader('Collapse Ready to execute')).toHaveTextContent('1')
    await openFilter(user, 'Safe account')
    await user.click(screen.getByRole('checkbox', { name: 'Ops Payroll' }))
    await user.keyboard('{Escape}')
    expect(allPending().getAllByRole('button', { name: /^Open / })).toHaveLength(1)
    expect(sectionHeader('Collapse Ready to execute')).toHaveTextContent('0')
    expect(sectionHeader('Collapse Ready to sign')).toHaveTextContent('0')
    expect(sectionHeader('Collapse Waiting on transactions')).toHaveTextContent('0')
  })
  it('shows history and message placeholders and restores the queue when returning', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { groupBy: 'status' } } })
    await user.click(screen.getByRole('tab', { name: 'History' }))
    expect(screen.getByText('No transactions executed in this preview yet.')).toBeVisible()
    expect(screen.queryByRole('tabpanel', { name: 'Queue' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Messages' }))
    expect(screen.getByText('Messages are not included in this queue design prototype.')).toBeVisible()
    await user.click(screen.getByRole('tab', { name: 'Queue' }))
    expect(screen.getByRole('tabpanel', { name: 'Queue' })).toBeVisible()
    expect(allPending().getAllByRole('button', { name: /^Open / })).toHaveLength(6)
    expect(screen.queryByText('Messages are not included in this queue design prototype.')).not.toBeInTheDocument()
  })
  it('groups proposals by Safe in nonce order and preserves independent collapse states', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { groupBy: 'status' } } })
    await user.click(screen.getByRole('button', { name: 'Collapse Ready to sign' }))
    await openFilter(user, 'Group by')
    await user.click(screen.getByRole('combobox', { name: 'Group by' }))
    await user.click(await screen.findByRole('option', { name: 'Safe' }))
    await user.keyboard('{Escape}')
    expect(screen.getAllByRole('table')).toHaveLength(3)
    expect(
      within(screen.getByRole('table', { name: 'Ops Payroll transactions' })).getAllByRole('button', {
        name: /^Open /,
      }),
    ).toHaveLength(2)
    expect(
      within(screen.getByRole('table', { name: 'Grants transactions' })).getAllByRole('button', { name: /^Open / }),
    ).toHaveLength(1)
    const treasury = within(screen.getByRole('table', { name: 'Treasury Main transactions' }))
    expect(
      treasury.getAllByRole('button', { name: /^Open / }).map((button) => button.getAttribute('aria-label')),
    ).toEqual(['Open Send to Bitwave Payroll', 'Open Add signer Priya', 'Open Send to Lightbridge Ltd'])
    await user.click(screen.getByRole('button', { name: 'Collapse Treasury Main' }))
    expect(treasury.queryByRole('button', { name: /^Open / })).not.toBeInTheDocument()
    expect(
      within(screen.getByRole('table', { name: 'Ops Payroll transactions' })).getAllByRole('button', {
        name: /^Open /,
      }),
    ).toHaveLength(2)
    await openFilter(user, 'Group by')
    await user.click(screen.getByRole('combobox', { name: 'Group by' }))
    await user.click(await screen.findByRole('option', { name: 'Status' }))
    await user.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: 'Expand Ready to sign' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('button', { name: 'Collapse Ready to execute' })).toHaveAttribute('aria-expanded', 'true')
    await openFilter(user, 'Group by')
    await user.click(screen.getByRole('combobox', { name: 'Group by' }))
    await user.click(await screen.findByRole('option', { name: 'Safe' }))
    await user.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: 'Expand Treasury Main' })).toHaveAttribute('aria-expanded', 'false')
  })
  it('shows a flat list without headers and preserves filters and collapse states', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { groupBy: 'status' } } })
    await user.click(screen.getByRole('button', { name: 'Collapse Ready to sign' }))
    await openFilter(user, 'Group by')
    await user.click(screen.getByRole('combobox', { name: 'Group by' }))
    await user.click(await screen.findByRole('option', { name: 'None' }))
    await user.keyboard('{Escape}')
    const table = within(screen.getByRole('table', { name: 'Pending transactions' }))
    expect(table.getAllByRole('button', { name: /^Open / })).toHaveLength(6)
    expect(screen.queryByRole('button', { name: /^(Collapse|Expand) / })).not.toBeInTheDocument()
    fireEvent.change(screen.getByRole('searchbox', { name: 'Find a proposal' }), { target: { value: 'Lightbridge' } })
    expect(table.getAllByRole('button', { name: /^Open / })).toHaveLength(1)
    expect(table.getByRole('button', { name: 'Open Send to Lightbridge Ltd' }).closest('tr')).toHaveTextContent(
      'Waiting on #42',
    )
    await openFilter(user, 'Group by')
    await user.click(screen.getByRole('combobox', { name: 'Group by' }))
    await user.click(await screen.findByRole('option', { name: 'Status' }))
    await user.keyboard('{Escape}')
    expect(sectionHeader('Expand Ready to sign')).toHaveTextContent('1')
  })
  it('applies account selection and search to Safe groups', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { groupBy: 'status' } } })
    await openFilter(user, 'Group by')
    await user.click(screen.getByRole('combobox', { name: 'Group by' }))
    await user.click(await screen.findByRole('option', { name: 'Safe' }))
    await user.keyboard('{Escape}')
    await openFilter(user, 'Safe account')
    await user.click(screen.getByRole('checkbox', { name: 'Treasury Main' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('table', { name: 'Treasury Main transactions' })).not.toBeInTheDocument()
    fireEvent.change(screen.getByRole('searchbox', { name: 'Find a proposal' }), {
      target: { value: 'Batch · 14 actions' },
    })
    expect(screen.getAllByRole('button', { name: /^Open / })).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Open Batch · 14 actions' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Collapse Ops Payroll' })).toBeVisible()
  })
  it('labels each Safe group with only its name, network and address, and keeps it when collapsed', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { groupBy: 'safe' } } })
    const header = sectionHeader('Collapse Treasury Main')
    expect(header).toHaveTextContent('Treasury MainEthereum · 0x8675…c3d2')
    await user.hover(within(header).getByText('Treasury Main'))
    expect(await screen.findByText('0x867500000000000000000000000000000000c3d2')).toBeVisible()
    await user.unhover(within(header).getByText('Treasury Main'))
    expect(header).not.toHaveTextContent('signers')
    expect(header).not.toHaveTextContent('pending')
    expect(header).not.toHaveTextContent('Next nonce')
    await user.click(header)
    expect(sectionHeader('Expand Treasury Main')).toHaveTextContent('Ethereum · 0x8675…c3d2')
    expect(screen.queryByRole('button', { name: 'Open Send to Bitwave Payroll' })).not.toBeInTheDocument()
  })
  it('keeps blocker details accessible while the state filter hides the blocker row', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { groupBy: 'status' } } })
    await openFilter(user, 'Status')
    await user.click(screen.getByRole('combobox', { name: 'State' }))
    await user.click(await screen.findByRole('option', { name: 'Waiting on transactions' }))
    await user.keyboard('{Escape}')
    expect(allPending().queryByRole('button', { name: 'Open Send to Bitwave Payroll' })).not.toBeInTheDocument()
    await user.click(allPending().getByRole('button', { name: 'Open Add signer Priya' }))
    fireEvent.click(screen.getByRole('button', { name: 'Earlier transactions' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Send to Bitwave Payroll')
  })
  it('keeps notes and signer names out of a grouped proposal row', () => {
    render(<PendingQueue />, { routerProps: { query: { groupBy: 'status' } } })
    const row = allPending().getByRole('button', { name: 'Open Send to Bitwave Payroll' }).closest('tr')!
    expect(row).not.toHaveTextContent('Note ·')
    expect(row).not.toHaveTextContent('September contractor payouts')
    expect(row).not.toHaveTextContent('Needs 1 more')
    expect(row).not.toHaveTextContent('Not yet signed:')
    expect(within(row).queryByRole('button', { name: /· (not )?signed$/ })).not.toBeInTheDocument()
    expect(within(row).getByRole('button', { name: '2 of 3 signatures' })).toBeInTheDocument()
  })
  it('shows the full off-chain note on hover and focus and opens review only on activation', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />)
    const row = allPending().getByRole('button', { name: 'Open Send to Bitwave Payroll' }).closest('tr')!
    const note = within(row).getByRole('button', { name: 'Note for Send to Bitwave Payroll' })
    await user.hover(note)
    const tooltip = (await screen.findByText('Off-chain note')).closest('[data-slot="tooltip-content"]')
    expect(tooltip).toHaveTextContent(
      'September contractor payouts. Finance reference FIN-221. Confirm the recipient and amount against the invoice.',
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await user.unhover(note)
    act(() => note.focus())
    expect(await screen.findByText('Off-chain note')).toBeVisible()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('dialog')).toBeVisible()
  })
  it('resets advanced transaction views when inspecting a dependency proposal', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { groupBy: 'status' } } })
    await user.click(allPending().getByRole('button', { name: 'Open Add signer Priya' }))
    await user.click(screen.getByRole('button', { name: 'Transaction details' }))
    await user.click(screen.getByRole('button', { name: 'Advanced transaction data' }))
    await user.click(screen.getByRole('tab', { name: 'JSON' }))
    await user.click(screen.getByRole('button', { name: 'Earlier transactions' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Send to Bitwave Payroll/ }))
    expect(screen.queryByRole('tab', { name: 'JSON' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Transaction details' }))
    await user.click(screen.getByRole('button', { name: 'Advanced transaction data' }))
    expect(screen.getByRole('tab', { name: 'Data' })).toHaveAttribute('aria-selected', 'true')
  })
  it('collapses panel sections independently and resets them for another proposal', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { groupBy: 'status' } } })
    await user.click(allPending().getByRole('button', { name: 'Open Add signer Priya' }))
    await user.click(screen.getByRole('button', { name: 'Summary' }))
    expect(screen.getByRole('button', { name: 'Summary' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('button', { name: 'Transaction details' })).toHaveAttribute('aria-expanded', 'false')
    await user.click(screen.getByRole('button', { name: 'Earlier transactions' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Send to Bitwave Payroll/ }))
    expect(screen.getByRole('button', { name: 'Summary' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.queryByRole('button', { name: 'Open in Safe' })).not.toBeInTheDocument()
    expect(screen.queryByText(/Sample Safe address\. Full recipient/)).not.toBeInTheDocument()
  })
  it('keeps audit and available actions outside the scrolling body when audit is collapsed', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { groupBy: 'status' } } })
    await user.click(allPending().getByRole('button', { name: 'Open Batch · 14 actions' }))
    const footer = screen.getByTestId('proposal-fixed-footer')
    const audit = within(footer).getByRole('button', { name: /Audit log/ })
    expect(audit).toHaveAttribute('aria-expanded', 'true')
    expect(footer.closest('.overflow-y-auto')).toBeNull()
    expect(footer.contains(screen.getByRole('button', { name: 'Summary' }))).toBe(false)
    await user.click(audit)
    expect(audit).toHaveAttribute('aria-expanded', 'false')
    expect(within(footer).getByRole('button', { name: 'Review and execute' })).toBeEnabled()
    await user.click(within(footer).getByRole('button', { name: 'Review and execute' }))
    expect(screen.getByRole('button', { name: 'Execute in preview' })).toBeVisible()
  })
  it('confirms signing without executing a blocked proposal and keeps its note', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { groupBy: 'status' } } })
    await user.click(allPending().getByRole('button', { name: 'Open Send to Lightbridge Ltd' }))
    await user.click(screen.getByRole('button', { name: 'Review and sign' }))
    await user.click(screen.getByRole('button', { name: 'Sign in preview' }))
    expect(screen.getByRole('status')).toHaveTextContent('Signature added')
    await user.click(screen.getByRole('button', { name: 'Workspace note' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Q4 vendor payment for invoice #4471.')
    expect(screen.getByRole('button', { name: 'Waiting on #42' })).toBeDisabled()
  })
  it('executes after confirmation, unblocks the next nonce, and records history', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { groupBy: 'status' } } })
    await user.click(allPending().getByRole('button', { name: 'Open Send to Bitwave Payroll' }))
    await user.click(screen.getByRole('button', { name: 'Review, sign and execute' }))
    await user.click(screen.getByRole('button', { name: 'Sign and execute in preview' }))
    expect(allPending().queryByRole('button', { name: 'Open Send to Bitwave Payroll' })).not.toBeInTheDocument()
    const signerRow = allPending().getByRole('button', { name: 'Open Add signer Priya' }).closest('tr')!
    expect(signerRow).toHaveTextContent('Ready to execute')
    await user.click(screen.getByRole('tab', { name: 'History' }))
    expect(screen.getByText('Sent to Bitwave Payroll · #42 · Treasury Main')).toBeVisible()
    expect(screen.getByText('Executed in preview')).toBeVisible()
  })
  it('creates a cancellation competitor while retaining the original and its note', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { groupBy: 'status' } } })
    await user.click(allPending().getByRole('button', { name: 'Open Send to Bitwave Payroll' }))
    await user.click(screen.getByRole('button', { name: 'Replace or cancel' }))
    await user.click(screen.getByRole('button', { name: 'Propose on-chain cancellation' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('On-chain rejection')
    await user.click(screen.getByRole('button', { name: 'Workspace note' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('No note was added to this proposal.')
    await user.click(screen.getByRole('button', { name: 'Close' }))
    await user.click(allPending().getByRole('button', { name: 'Open Send to Bitwave Payroll' }))
    await user.click(screen.getByRole('button', { name: 'Workspace note' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('September contractor payouts')
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(allPending().getByRole('button', { name: 'Open On-chain rejection' })).toBeVisible()
    expect(
      within(allPending().getByRole('button', { name: 'Open On-chain rejection' }).closest('tr')!).getByRole('img', {
        name: 'On-chain rejection',
      }),
    ).toBeVisible()
  })
  it('shows remaining signatures and owner names in the fraction tooltip without opening details', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { groupBy: 'status' } } })
    const row = allPending().getByRole('button', { name: 'Open Send to Bitwave Payroll' }).closest('tr')!
    const fraction = within(row).getByRole('button', { name: '2 of 3 signatures' })
    await user.hover(fraction)
    expect(await screen.findByText('1 more signature needed')).toBeVisible()
    expect(screen.getByText('Signed: Ana, Max')).toBeVisible()
    expect(screen.getByText('Not yet signed: Dev, Jonas, Lena')).toBeVisible()
    await user.click(fraction)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  it('shows threshold met when the ready signature fraction receives keyboard focus', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { groupBy: 'status' } } })
    const row = allPending().getByRole('button', { name: 'Open Batch · 14 actions' }).closest('tr')!
    const network = within(row).getByRole('button', { name: 'Base' })
    act(() => network.focus())
    await user.tab()
    expect(within(row).getByRole('button', { name: '2 of 2 signatures' })).toHaveFocus()
    expect(await screen.findByText('Signature threshold met')).toBeVisible()
    expect(screen.queryByText(/^Not yet signed:/)).not.toBeInTheDocument()
  })
  it('identifies transfer, swap, and signer-change rows with transaction icons', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, {
      routerProps: { query: { groupBy: 'status', scenario: 'conflict' } },
    })
    const transfer = allPending().getByRole('button', { name: 'Open Send to Bitwave Payroll' }).closest('tr')!
    const swap = allPending().getByRole('button', { name: 'Open Swap USDC → ETH' }).closest('tr')!
    const settings = allPending().getByRole('button', { name: 'Open Add signer Priya' }).closest('tr')!
    expect(within(transfer).getByRole('img', { name: 'Send' })).toBeVisible()
    expect(within(swap).getByRole('img', { name: 'Swap' })).toBeVisible()
    expect(within(settings).getByRole('img', { name: 'Update' })).toBeVisible()
    expect(within(transfer).getByText('48.5 ETH').closest('td')).toContainElement(
      within(transfer).getByRole('img', { name: 'Send' }),
    )
    expect(within(swap).getByText('200,000 USDC → ETH').closest('td')).toContainElement(
      within(swap).getByRole('img', { name: 'Swap' }),
    )
    expect(within(settings).getByText('New signer').closest('td')).toContainElement(
      within(settings).getByRole('img', { name: 'Update' }),
    )
    expect(within(settings).queryByText('Safe settings')).not.toBeInTheDocument()
    expect(within(transfer).getAllByText('#42')).toHaveLength(1)
    await user.click(within(transfer).getByRole('img', { name: 'Send' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Send to Bitwave Payroll')
  })
  it('uses the selected proposal type in the review panel icon', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, {
      routerProps: { query: { groupBy: 'status', scenario: 'conflict' } },
    })
    await user.click(allPending().getByRole('button', { name: 'Open Swap USDC → ETH' }))
    expect(screen.getByRole('dialog').querySelector('svg.lucide-repeat-2')).toBeVisible()
    expect(screen.getByRole('dialog').querySelector('svg.lucide-arrow-up-right')).not.toBeInTheDocument()
  })
  it('shows the action type and nonce with Safe context, hiding the repeated Safe in Safe grouping', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { groupBy: 'status' } } })
    const row = allPending().getByRole('button', { name: 'Open Send to Lightbridge Ltd' }).closest('tr')!
    expect(within(row).getByRole('img', { name: 'Send' })).toBeVisible()
    expect(within(row).getByLabelText('Nonce 44')).toBeVisible()
    expect(within(row).getByText('Treasury Main')).toBeVisible()
    expect(row).toHaveTextContent('Waiting on #42')
    await openFilter(user, 'Group by')
    await user.click(screen.getByRole('combobox', { name: 'Group by' }))
    await user.click(await screen.findByRole('option', { name: 'Safe' }))
    await user.keyboard('{Escape}')
    const safe = within(screen.getByRole('table', { name: 'Treasury Main transactions' }))
    const groupedRow = safe.getByRole('button', { name: 'Open Send to Lightbridge Ltd' }).closest('tr')!
    expect(within(groupedRow).queryByText('Treasury Main')).not.toBeInTheDocument()
    expect(within(groupedRow).queryByText('Ethereum')).not.toBeInTheDocument()
    expect(within(groupedRow).getByLabelText('Nonce 44')).toBeVisible()
    expect(groupedRow).toHaveTextContent('Waiting on #42')
  })
  it('opens mobile details full screen with collapsed audit and full-height actions', async () => {
    jest.mocked(useIsMobile).mockReturnValue(true)
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { groupBy: 'status' } } })
    expect(screen.getByRole('searchbox', { name: 'Find a proposal' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Filters/ })).toBeInTheDocument()
    await user.click(allPending().getByRole('button', { name: 'Open Batch · 14 actions' }))
    expect(screen.getByRole('dialog')).toHaveAttribute('data-mobile-full-screen', 'true')
    expect(screen.getByRole('button', { name: 'Summary' })).toHaveAttribute('aria-expanded', 'true')
    const footer = within(screen.getByTestId('proposal-fixed-footer'))
    expect(footer.getByRole('button', { name: /Audit log/ })).toHaveAttribute('aria-expanded', 'false')
    const primary = footer.getByRole('button', { name: 'Review and execute' })
    expect(primary).toHaveClass('h-12', 'shrink-0')
    expect(primary).not.toHaveClass('flex-1')
    expect(screen.queryByRole('button', { name: 'Expand to full screen' })).not.toBeInTheDocument()
    await user.click(primary)
    expect(footer.getByRole('button', { name: 'Execute in preview' })).toHaveClass('h-12', 'shrink-0')
  })
  it('filters by network and clears all filters back to the default flat table', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />)
    await openFilter(user, 'Network')
    await user.click(screen.getByRole('checkbox', { name: 'Ethereum' }))
    await user.keyboard('{Escape}')
    expect(allPending().getAllByRole('button', { name: /^Open / })).toHaveLength(3)
    expect(allPending().queryByRole('button', { name: 'Open Send to Bitwave Payroll' })).not.toBeInTheDocument()
    fireEvent.change(screen.getByRole('searchbox', { name: 'Find a proposal' }), { target: { value: 'Deel' } })
    expect(allPending().getAllByRole('button', { name: /^Open / })).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: /^Filters/ }))
    await user.click(screen.getByRole('button', { name: 'Clear all' }))
    await user.keyboard('{Escape}')
    expect(screen.getByRole('searchbox', { name: 'Find a proposal' })).toHaveValue('')
    expect(allPending().getAllByRole('button', { name: /^Open / })).toHaveLength(6)
    expect(screen.getByRole('table', { name: 'Pending transactions' })).toBeVisible()
  })
  it('keeps the amount under the type and exposes a network label without inline note text', () => {
    render(<PendingQueue />)
    const title = allPending().getByRole('button', { name: 'Open Send to Bitwave Payroll' })
    expect(title.closest('td')).toHaveTextContent('48.5 ETH')
    expect(title.closest('tr')).not.toHaveTextContent('September contractor payouts')
    expect(within(title.closest('tr')!).getByLabelText('Ethereum')).toBeVisible()
    expect(within(title.closest('tr')!).getByRole('button', { name: 'Note for Send to Bitwave Payroll' })).toBeVisible()
  })
  it('shows the full Safe address when hovering any part of the Safe cell', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />)
    const row = allPending().getByRole('button', { name: 'Open Send to Bitwave Payroll' }).closest('tr')!
    expect(within(row).getByText('0x8675…c3d2')).toBeVisible()
    await user.hover(within(row).getByText('Treasury Main'))
    const tooltip = (await screen.findByText('0x867500000000000000000000000000000000c3d2')).closest(
      '[data-slot="tooltip-content"]',
    )
    expect(tooltip).toBeVisible()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  it('drops the network and note columns below 1280px, moving the note beside the title', () => {
    setViewport({ wide: false })
    render(<PendingQueue />)
    const table = within(screen.getByRole('table', { name: 'Pending transactions' }))
    expect(table.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'Type',
      'Safe',
      'Signatures',
      'Status',
      'Action',
    ])
    const row = table.getByRole('button', { name: 'Open Send to Bitwave Payroll' }).closest('tr')!
    expect(within(row).getByText('Treasury Main').closest('td')).toHaveTextContent('Ethereum')
    const status = within(row).getByText('Ready to sign').closest('td')!
    expect(status).toContainElement(within(row).getByLabelText('Nonce 42'))
    expect(status).toContainElement(within(row).getByLabelText('Proposed 3d ago'))
    expect(within(row).getByRole('button', { name: 'Open Send to Bitwave Payroll' }).closest('td')).toContainElement(
      within(row).getByRole('button', { name: 'Note for Send to Bitwave Payroll' }),
    )
    expect(within(row).getByRole('button', { name: 'Sign Send to Bitwave Payroll' })).toBeInTheDocument()
  })
  it('gives each status and each Safe its own labelled table, hiding Safe columns when grouped by Safe', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { groupBy: 'status' } } })
    const statusColumns = ['Type', 'Safe', 'Network', 'Signatures', 'Note', 'Status', 'Action']
    expect(screen.getAllByRole('table')).toHaveLength(4)
    for (const table of screen.getAllByRole('table')) {
      expect(
        within(table)
          .getAllByRole('columnheader')
          .map((header) => header.textContent),
      ).toEqual(statusColumns)
    }
    const signHeading = screen.getByRole('button', { name: 'Collapse Ready to sign' })
    expect(signHeading.compareDocumentPosition(screen.getByRole('table', { name: 'Ready to sign transactions' }))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    await openFilter(user, 'Group by')
    await user.click(screen.getByRole('combobox', { name: 'Group by' }))
    await user.click(await screen.findByRole('option', { name: 'Safe' }))
    await user.keyboard('{Escape}')
    expect(screen.getAllByRole('table')).toHaveLength(3)
    const treasury = screen.getByRole('table', { name: 'Treasury Main transactions' })
    expect(
      within(treasury)
        .getAllByRole('columnheader')
        .map((header) => header.textContent),
    ).toEqual(['Type', 'Signatures', 'Note', 'Status', 'Action'])
    expect(screen.getByRole('button', { name: 'Collapse Treasury Main' }).compareDocumentPosition(treasury)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
  })
  it('keeps the full table on mobile with the transaction column pinned while rows scroll', () => {
    jest.mocked(useIsMobile).mockReturnValue(true)
    setViewport({ wide: false })
    render(<PendingQueue />)
    const table = within(screen.getByRole('table', { name: 'Pending transactions' }))
    const headers = table.getAllByRole('columnheader')
    expect(headers.map((header) => header.textContent)).toEqual(['Type', 'Safe', 'Signatures', 'Status', 'Action'])
    expect(headers[0]).toHaveClass('max-md:sticky', 'max-md:left-0')
    const title = table.getByRole('button', { name: 'Open Send to Bitwave Payroll' })
    expect(title.closest('td')).toHaveClass('max-md:sticky', 'max-md:left-0', 'max-md:bg-card')
    expect(within(title.closest('tr')!).getAllByRole('cell')).toHaveLength(5)
    fireEvent.click(title.closest('tr')!)
    expect(screen.getByRole('dialog')).toHaveTextContent('Send to Bitwave Payroll')
  })
  it('shows only the empty state when nothing is pending', () => {
    render(<PendingQueue />, { routerProps: { query: { scenario: 'empty' } } })
    expect(screen.getByRole('heading', { name: 'Nothing pending' })).toBeVisible()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByText('No matching proposals')).not.toBeInTheDocument()
  })
  it('collapses the audit log on short viewports and names no placeholder proposer', async () => {
    setViewport({ short: true })
    const { user } = renderWithUserEvent(<PendingQueue />)
    await user.click(allPending().getByRole('button', { name: 'Open Batch · 14 actions' }))
    const footer = within(screen.getByTestId('proposal-fixed-footer'))
    expect(footer.getByRole('button', { name: /Audit log/ })).toHaveAttribute('aria-expanded', 'false')
    await user.click(footer.getByRole('button', { name: /Audit log/ }))
    expect(screen.getByTestId('proposal-fixed-footer')).toHaveTextContent('Created · 5h ago')
    expect(screen.getByRole('dialog')).not.toHaveTextContent('Proposer not supplied')
  })
  it('groups from the Safe and Status column headers, and switches from status to Safe groups', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />)
    expect(screen.queryByRole('button', { name: 'Group by Safe' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Group by status' }))
    expect(screen.getAllByRole('table')).toHaveLength(4)
    expect(screen.getByRole('button', { name: 'Collapse Ready to sign' })).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Group by status' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Group by Safe' })).toHaveLength(4)
    await user.click(screen.getAllByRole('button', { name: 'Group by Safe' })[0])
    expect(screen.getAllByRole('table')).toHaveLength(3)
    expect(screen.getByRole('button', { name: 'Collapse Treasury Main' })).toBeVisible()
  })
  it('shows a group-by chip beside Filters that switches grouping or returns to the default table', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />)
    expect(screen.queryByRole('combobox', { name: 'Grouped by' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Group by status' }))
    const chip = screen.getByRole('combobox', { name: 'Grouped by' })
    expect(chip).toHaveTextContent('Status')
    await user.click(chip)
    await user.click(await screen.findByRole('option', { name: 'Safe' }))
    expect(screen.getByRole('table', { name: 'Treasury Main transactions' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Remove grouping' }))
    expect(screen.getAllByRole('table')).toHaveLength(1)
    expect(screen.getByRole('table', { name: 'Pending transactions' })).toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: 'Grouped by' })).not.toBeInTheDocument()
  })
  describe('edge cases with many competing proposals', () => {
    const heavy = (query: Record<string, string> = {}) => ({
      routerProps: { query: { scenario: 'conflict-heavy', ...query } },
    })

    it('keeps competing proposals together under one conflict sub-header', () => {
      render(<PendingQueue />, heavy())
      expect(screen.getAllByText('Nonce #42 · 4 competing proposals')).toHaveLength(1)
      expect(screen.getByRole('link', { name: 'Why did this happen?' })).toHaveAttribute('target', '_blank')
      const titles = allPending()
        .getAllByRole('button', { name: /^Open / })
        .map((button) => button.getAttribute('aria-label'))
      const competing = [
        'Open Send to Bitwave Payroll',
        'Open Batch · 46 actions',
        'Open Add signer Marco',
        'Open Change threshold to 2',
      ]
      const first = titles.indexOf(competing[0])
      expect(titles.slice(first, first + 4).sort()).toEqual([...competing].sort())
      expect(screen.queryByText('4 competing proposals')).not.toBeInTheDocument()
    })
    it('groups competitors within a status table too', () => {
      render(<PendingQueue />, heavy({ groupBy: 'status' }))
      const ready = within(screen.getByRole('table', { name: 'Ready to execute transactions' }))
      expect(ready.getByText('Nonce #42 · 4 competing proposals')).toBeVisible()
    })
    it('strikes through the proposals an execution would replace', () => {
      render(<PendingQueue />, heavy())
      fireEvent.mouseEnter(screen.getByRole('button', { name: 'Execute Batch · 46 actions' }))
      expect(screen.getByRole('button', { name: 'Open Send to Bitwave Payroll' })).toHaveClass('line-through')
      expect(screen.getByRole('button', { name: 'Open Batch · 46 actions' })).not.toHaveClass('line-through')
      expect(screen.getByRole('button', { name: 'Open Batch · 14 actions' })).not.toHaveClass('line-through')
      fireEvent.mouseLeave(screen.getByRole('button', { name: 'Execute Batch · 46 actions' }))
      expect(screen.getByRole('button', { name: 'Open Send to Bitwave Payroll' })).not.toHaveClass('line-through')
    })
    it('summarises batches by action count in the row', () => {
      render(<PendingQueue />, heavy())
      expect(screen.getByRole('button', { name: 'Open Batch · 46 actions' }).closest('td')).toHaveTextContent(
        '46 actions',
      )
      expect(screen.getByRole('button', { name: 'Open Batch · 14 actions' }).closest('td')).toHaveTextContent(
        '32,400 USDC',
      )
    })
    it('reviews and bulk executes one batch per Safe, explaining Safes held back by a conflict', async () => {
      const { user } = renderWithUserEvent(<PendingQueue />, heavy())
      await user.click(screen.getByRole('button', { name: 'Bulk execute 2 transactions' }))
      const dialog = within(screen.getByRole('dialog'))
      const payroll = within(dialog.getByRole('region', { name: 'Ops Payroll batch' }))
      expect(payroll.getByText('2 transactions · #17–#18')).toBeVisible()
      expect(payroll.getByText('Batch · 14 actions')).toBeVisible()
      expect(dialog.getByRole('region', { name: 'Treasury Main batch' })).toHaveTextContent(
        'Not included. Choose one of the 4 competing proposals at #42 first.',
      )
      await user.click(dialog.getByRole('button', { name: 'Execute 2 transactions in preview' }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Open Batch · 14 actions' })).not.toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveTextContent('2 transactions executed in this preview across 1 Safe.')
      expect(screen.queryByRole('button', { name: /^Bulk execute/ })).not.toBeInTheDocument()
    })
    it('offers bulk execute on a Safe label without collapsing it', async () => {
      const { user } = renderWithUserEvent(<PendingQueue />, heavy({ groupBy: 'safe' }))
      await user.click(screen.getByRole('button', { name: 'Bulk execute 2' }))
      expect(screen.getByRole('button', { name: 'Collapse Ops Payroll', hidden: true })).toBeInTheDocument()
      const dialog = within(screen.getByRole('dialog'))
      expect(dialog.getByRole('region', { name: 'Ops Payroll batch' })).toBeVisible()
      expect(dialog.queryByRole('region', { name: 'Treasury Main batch' })).not.toBeInTheDocument()
    })
    it.each([
      ['in', 'Logged in to Hypernative'],
      ['out', 'Hypernative not connected'],
    ])('shows the %s Hypernative state beside bulk execute', (hn, text) => {
      render(<PendingQueue />, heavy({ hn }))
      expect(screen.getByText(text)).toBeVisible()
      expect(screen.queryByRole('button', { name: 'Log in' }) !== null).toBe(hn === 'out')
    })
    it('hides Hypernative when no Safe in the workspace is eligible', () => {
      render(<PendingQueue />, heavy({ hn: 'none' }))
      expect(screen.queryByText('Logged in to Hypernative')).not.toBeInTheDocument()
      expect(screen.queryByText('Hypernative not connected')).not.toBeInTheDocument()
    })
  })
  describe('review panel header and navigation', () => {
    const rowTitles = () =>
      allPending()
        .getAllByRole('button', { name: /^Open / })
        .map((button) => button.getAttribute('aria-label')!.replace('Open ', ''))
    const dialog = () => within(screen.getByRole('dialog'))

    it('summarises the transaction in the header', async () => {
      const { user } = renderWithUserEvent(<PendingQueue />)
      await user.click(allPending().getByRole('button', { name: 'Open Send to Bitwave Payroll' }))
      const meta = within(screen.getByRole('group', { name: 'Transaction summary' }))
      expect(dialog().getAllByText('48.5 ETH')[0]).toBeVisible()
      expect(meta.getByText('Treasury Main · Ethereum')).toBeVisible()
      expect(meta.getByText('Ready to sign')).toBeVisible()
      expect(meta.getByText('#42')).toBeVisible()
      expect(meta.getByText('2/3 signatures')).toBeVisible()
      expect(meta.getByText('3d ago')).toBeVisible()
    })
    it('steps through transactions in table order with buttons and J/K', async () => {
      const { user } = renderWithUserEvent(<PendingQueue />)
      const titles = rowTitles()
      await user.click(allPending().getByRole('button', { name: `Open ${titles[0]}` }))
      expect(dialog().getByText(`1 of ${titles.length}`)).toBeVisible()
      expect(dialog().getByRole('button', { name: 'Previous transaction' })).toBeDisabled()
      await user.click(dialog().getByRole('button', { name: 'Next transaction' }))
      expect(screen.getByRole('dialog')).toHaveAccessibleName(titles[1])
      await user.keyboard('j')
      expect(screen.getByRole('dialog')).toHaveAccessibleName(titles[2])
      await user.keyboard('k')
      expect(screen.getByRole('dialog')).toHaveAccessibleName(titles[1])
      for (let index = 2; index < titles.length; index++) await user.keyboard('j')
      expect(screen.getByRole('dialog')).toHaveAccessibleName(titles[titles.length - 1])
      expect(dialog().getByRole('button', { name: 'Next transaction' })).toBeDisabled()
    })
    it('skips collapsed groups and ignores J while typing', async () => {
      const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { groupBy: 'status' } } })
      await user.click(screen.getByRole('button', { name: 'Collapse Ready to sign' }))
      const titles = rowTitles()
      await user.click(allPending().getByRole('button', { name: `Open ${titles[0]}` }))
      expect(dialog().getByText(`1 of ${titles.length}`)).toBeVisible()
      await user.click(dialog().getByRole('button', { name: 'Replace or cancel' }))
      await user.click(dialog().getByRole('button', { name: 'Replace with another transaction' }))
      const field = dialog().getByRole('textbox', { name: 'Recipient' })
      await user.click(field)
      await user.keyboard('j')
      expect((field as HTMLInputElement).value.endsWith('j')).toBe(true)
      expect(screen.getByRole('dialog')).toHaveAccessibleName(titles[0])
    })
    it('disables navigation for a proposal opened outside the visible list', async () => {
      const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { groupBy: 'status' } } })
      fireEvent.change(screen.getByRole('searchbox', { name: 'Find a proposal' }), {
        target: { value: 'Add signer Priya' },
      })
      await user.click(allPending().getByRole('button', { name: 'Open Add signer Priya' }))
      await user.click(screen.getByRole('button', { name: 'Earlier transactions' }))
      await user.click(dialog().getByRole('button', { name: /Send to Bitwave Payroll/ }))
      expect(dialog().getByRole('button', { name: 'Previous transaction' })).toBeDisabled()
      expect(dialog().getByRole('button', { name: 'Next transaction' })).toBeDisabled()
      expect(dialog().queryByText(/ of \d+$/)).not.toBeInTheDocument()
    })
  })
  it('filters by transaction type and shows the filter as active', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { scenario: 'conflict-heavy' } } })
    await openFilter(user, 'Type')
    for (const type of ['Send', 'Receive', 'Swap', 'Update', 'On-chain rejection']) {
      await user.click(screen.getByRole('checkbox', { name: type }))
    }
    await user.keyboard('{Escape}')
    const titles = allPending()
      .getAllByRole('button', { name: /^Open / })
      .map((button) => button.getAttribute('aria-label'))
    expect(titles).toEqual(['Open Batch · 46 actions', 'Open Batch · 14 actions'])
    expect(screen.getByRole('button', { name: /^Filters/ })).toHaveTextContent('Active')
    await user.click(screen.getByRole('button', { name: /^Filters/ }))
    await user.click(screen.getByRole('button', { name: 'Clear all' }))
    await user.keyboard('{Escape}')
    expect(allPending().getAllByRole('button', { name: /^Open / })).toHaveLength(9)
  })
})
