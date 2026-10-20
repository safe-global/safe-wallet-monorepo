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
  if (!screen.queryAllByRole('menu').length) await user.click(screen.getByRole('button', { name: /^Filter/ }))
  await user.click(await screen.findByRole('menuitem', { name: section }))
}
const closeMenus = async (user: TestUser) => {
  for (let i = 0; i < 3 && screen.queryAllByRole('menu').length; i++) await user.keyboard('{Escape}')
}
const toggleFilter = async (user: TestUser, section: string, ...options: string[]) => {
  await openFilter(user, section)
  for (const option of options)
    fireEvent.click(await screen.findByRole('menuitemcheckbox', { name: new RegExp(`^${option}`) }))
  await closeMenus(user)
}
const chooseGrouping = async (user: TestUser, option: string) => {
  await openFilter(user, 'Group by')
  fireEvent.click(await screen.findByRole('menuitemradio', { name: option }))
  await closeMenus(user)
}

const sectionHeader = (name: string) =>
  screen.getByRole('button', { name }).closest<HTMLElement>('[data-slot="section-header"]')!

const allPending = () => within(screen.getByRole('region', { name: 'Queue' }))

describe('queue design exploration', () => {
  it('defaults to a table with named columns and review actions without executing', () => {
    render(<PendingQueue />)
    const table = within(screen.getByRole('table', { name: 'Pending transactions' }))
    expect(table.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'Type',
      'Nonce',
      'Safe',
      'Network',
      'Signatures',
      'Note',
      'Status',
      'Proposed',
      'Action',
    ])
    expect(screen.queryByRole('button', { name: /^(Collapse|Expand) / })).not.toBeInTheDocument()
    expect(table.getByRole('button', { name: 'Execute Batch · 14 actions' })).toBeVisible()
    expect(table.getByRole('button', { name: 'Sign Send to Globex Payroll' })).toBeVisible()
    expect(table.getByRole('button', { name: 'Review Add signer Priya' })).toBeVisible()
    fireEvent.click(table.getByRole('button', { name: 'Execute Batch · 14 actions' }))
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Batch · 14 actions')
    expect(screen.queryByRole('button', { name: 'Execute in preview' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(table.getByRole('button', { name: 'Execute Batch · 14 actions' })).toBeInTheDocument()
  })
  it('keeps replace or cancel in the review panel without creating a proposal', () => {
    render(<PendingQueue />)
    expect(screen.queryByRole('button', { name: 'Replace or cancel Send to Globex Payroll' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Sign Send to Globex Payroll' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Replace or cancel' }))
    const drawer = within(screen.getByRole('dialog'))
    expect(drawer.getByRole('button', { name: 'Hide replace or cancel' })).toBeVisible()
    expect(screen.getByRole('dialog')).toHaveTextContent('A replacement or cancellation uses the same nonce')
    expect(screen.getByRole('dialog')).not.toHaveTextContent('Competing proposal created')
  })
  it('opens review instead of offering signing to an observer', () => {
    render(<PendingQueue />, { routerProps: { query: { persona: 'observer' } } })
    const table = within(screen.getByRole('table', { name: 'Pending transactions' }))
    expect(table.queryByRole('button', { name: 'Sign Send to Globex Payroll' })).not.toBeInTheDocument()
    expect(table.queryByRole('button', { name: 'Replace or cancel Send to Globex Payroll' })).not.toBeInTheDocument()
    fireEvent.click(table.getByRole('button', { name: 'Review Send to Globex Payroll' }))
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Send to Globex Payroll')
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Waiting on others' })).toBeDisabled()
  })

  it('keeps dependency inspection available when earlier proposals are filtered out', () => {
    render(<PendingQueue />, { routerProps: { query: { groupBy: 'status', option: 'queues' } } })
    fireEvent.change(screen.getByRole('searchbox', { name: 'Find a proposal' }), {
      target: { value: 'Add signer Priya' },
    })
    expect(screen.queryByRole('button', { name: 'Open Send to Globex Payroll' })).not.toBeInTheDocument()
    fireEvent.click(allPending().getByRole('button', { name: 'Open Add signer Priya' }))
    fireEvent.click(screen.getByRole('button', { name: 'Earlier transactions' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Send to Globex Payroll')
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
    expect(screen.getByRole('region', { name: 'Queue' })).toBeInTheDocument()
    expect(screen.queryByTestId('execution-reason')).not.toBeInTheDocument()
    fireEvent.click(allPending().getByRole('button', { name: 'Open Send to Globex Payroll' }))
    fireEvent.click(screen.getByRole('button', { name: 'Transaction summary' }))
    expect(screen.getByTestId('execution-reason')).toHaveTextContent(
      'Needs 1 more signature, including yours. It can execute once the threshold is reached.',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Note' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('September contractor payouts')
  })
  it('shows competing proposals in the side panel', () => {
    render(<PendingQueue />, { routerProps: { query: { groupBy: 'status', scenario: 'conflict' } } })
    fireEvent.click(allPending().getByRole('button', { name: 'Open Send to Globex Payroll' }))
    fireEvent.click(screen.getByRole('button', { name: 'Competing proposals' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Swap USDC → ETH')
  })
  it('prioritizes actionable proposals without group headings in the ungrouped inbox', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, {
      routerProps: { query: { groupBy: 'status', option: 'inbox' } },
    })
    await chooseGrouping(user, 'None')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('button', { name: /^(Collapse|Expand) / })).not.toBeInTheDocument()
    const proposalButtons = allPending().getAllByRole('button', { name: /^Open / })
    expect(proposalButtons[0]).toHaveAccessibleName('Open Batch · 14 actions')
    expect(proposalButtons[1]).toHaveAccessibleName('Open Send to Globex Payroll')
    expect(screen.queryByRole('heading', { name: 'Ready to move' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Treasury Main' })).not.toBeInTheDocument()
  })
  it('groups next steps by Safe by default', () => {
    render(<PendingQueue />, { routerProps: { query: { option: 'steps' } } })
    expect(screen.queryByRole('table', { name: 'Ready to sign transactions' })).not.toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Treasury Main transactions' })).toBeInTheDocument()
  })
  it('filters next steps from the Status and Safe dropdowns', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { option: 'steps' } } })
    expect(screen.queryByRole('group', { name: 'Quick filters' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^Safe/ }))
    expect(await screen.findByText('Sorted by actionable transactions')).toBeVisible()
    fireEvent.click(await screen.findByRole('menuitemcheckbox', { name: /^Grants/ }))
    expect(await screen.findByRole('menuitem', { name: /^Clear/ })).toHaveTextContent('Clear1 selected')
    await closeMenus(user)
    expect(screen.getByRole('button', { name: /^Safe/ })).toHaveAccessibleName('Safe')
    expect(screen.queryByRole('table', { name: 'Treasury Main transactions' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Filter/ })).toHaveAccessibleName('Filter')
    expect(screen.getByRole('group', { name: 'Applied filters' })).toHaveTextContent('Safe:Grants')
    await openFilter(user, 'Safe account')
    expect(await screen.findByRole('menuitemcheckbox', { name: /^Grants/ })).toHaveAttribute('aria-checked', 'true')
    await closeMenus(user)
    await user.click(screen.getByRole('button', { name: /^Filter/ }))
    const reset = await screen.findByRole('menuitem', { name: /^Reset all filters/ })
    expect(reset).toHaveTextContent('1 applied')
    await user.click(reset)
    expect(screen.getByRole('table', { name: 'Treasury Main transactions' })).toBeInTheDocument()
  })
  it('shows only the Safe dropdown in the next steps status view', () => {
    render(<PendingQueue />, { routerProps: { query: { option: 'steps', groupBy: 'status' } } })
    expect(screen.getByRole('button', { name: /^Safe/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Status/ })).not.toBeInTheDocument()
  })
  it('puts conflicting transactions below ready to sign in the next steps status view', () => {
    render(<PendingQueue />, { routerProps: { query: { option: 'steps', groupBy: 'status', scenario: 'conflict' } } })
    const labels = screen.getAllByRole('table').map((table) => table.getAttribute('aria-label'))
    const conflicting = labels.indexOf('Conflicting transactions transactions')
    expect(conflicting).toBeGreaterThan(-1)
    expect(labels.slice(0, conflicting)).not.toContain('Blocked transactions')
    expect(labels.slice(0, conflicting)).not.toContain('Waiting on others transactions')
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
      'Blocked transactions',
      'Waiting on others transactions',
    ])
    for (const [label, count] of [
      ['Waiting on others', '1'],
      ['Ready to sign', '3'],
      ['Ready to execute', '1'],
      ['Blocked', '1'],
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
    await toggleFilter(user, 'Safe account', 'Ops Payroll', 'Grants')
    expect(allPending().getAllByRole('button', { name: /^Open / })).toHaveLength(3)
    expect(screen.queryByRole('button', { name: 'Open Send to Globex Payroll' })).not.toBeInTheDocument()
    expect(sectionHeader('Collapse Ready to sign')).toHaveTextContent('1')
    expect(sectionHeader('Collapse Blocked')).toHaveTextContent('0')
    expect(sectionHeader('Collapse Ready to execute')).toHaveTextContent('1')
    await toggleFilter(user, 'Safe account', 'Ops Payroll')
    expect(allPending().getAllByRole('button', { name: /^Open / })).toHaveLength(1)
    expect(sectionHeader('Collapse Ready to execute')).toHaveTextContent('0')
    expect(sectionHeader('Collapse Ready to sign')).toHaveTextContent('0')
    expect(sectionHeader('Collapse Blocked')).toHaveTextContent('0')
  })
  it('shows the queue without page tabs', () => {
    render(<PendingQueue />)
    expect(screen.queryByRole('tab', { name: 'History' })).not.toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Messages' })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Queue' })).toBeVisible()
  })
  it('groups proposals by Safe in nonce order and preserves independent collapse states', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { groupBy: 'status' } } })
    await user.click(screen.getByRole('button', { name: 'Collapse Ready to sign' }))
    await chooseGrouping(user, 'Safe')
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
    ).toEqual(['Open Send to Globex Payroll', 'Open Add signer Priya', 'Open Send to Contoso Ltd'])
    await user.click(screen.getByRole('button', { name: 'Collapse Treasury Main' }))
    expect(treasury.queryByRole('button', { name: /^Open / })).not.toBeInTheDocument()
    expect(
      within(screen.getByRole('table', { name: 'Ops Payroll transactions' })).getAllByRole('button', {
        name: /^Open /,
      }),
    ).toHaveLength(2)
    await chooseGrouping(user, 'Status')
    await user.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: 'Expand Ready to sign' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('button', { name: 'Collapse Ready to execute' })).toHaveAttribute('aria-expanded', 'true')
    await chooseGrouping(user, 'Safe')
    await user.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: 'Expand Treasury Main' })).toHaveAttribute('aria-expanded', 'false')
  })
  it('shows a flat list without headers and preserves filters and collapse states', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { groupBy: 'status' } } })
    await user.click(screen.getByRole('button', { name: 'Collapse Ready to sign' }))
    await chooseGrouping(user, 'None')
    await user.keyboard('{Escape}')
    const table = within(screen.getByRole('table', { name: 'Pending transactions' }))
    expect(table.getAllByRole('button', { name: /^Open / })).toHaveLength(6)
    expect(screen.queryByRole('button', { name: /^(Collapse|Expand) / })).not.toBeInTheDocument()
    fireEvent.change(screen.getByRole('searchbox', { name: 'Find a proposal' }), { target: { value: 'Contoso' } })
    expect(table.getAllByRole('button', { name: /^Open / })).toHaveLength(1)
    expect(table.getByRole('button', { name: 'Open Send to Contoso Ltd' }).closest('tr')).toHaveTextContent(
      'Blocked by #42',
    )
    await chooseGrouping(user, 'Status')
    await user.keyboard('{Escape}')
    expect(sectionHeader('Expand Ready to sign')).toHaveTextContent('1')
  })
  it('applies account selection and search to Safe groups', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { groupBy: 'status' } } })
    await chooseGrouping(user, 'Safe')
    await user.keyboard('{Escape}')
    await toggleFilter(user, 'Safe account', 'Ops Payroll', 'Grants')
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
    expect(screen.queryByRole('button', { name: 'Open Send to Globex Payroll' })).not.toBeInTheDocument()
  })
  it('keeps blocker details accessible while the state filter hides the blocker row', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { groupBy: 'status' } } })
    await toggleFilter(user, 'Status', 'Blocked')
    expect(allPending().queryByRole('button', { name: 'Open Send to Globex Payroll' })).not.toBeInTheDocument()
    await user.click(allPending().getByRole('button', { name: 'Open Add signer Priya' }))
    fireEvent.click(screen.getByRole('button', { name: 'Earlier transactions' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Send to Globex Payroll')
  })
  it('shows signatures as a count with a gauge, keeping outstanding signers in the tooltip, and the note as an icon', () => {
    const { unmount } = render(<PendingQueue />, { routerProps: { query: { groupBy: 'status' } } })
    const row = () => allPending().getByRole('button', { name: 'Open Send to Globex Payroll' }).closest('tr')!
    const signatures = () => within(row()).getByRole('button', { name: /^2 of 3 signatures/ })
    expect(signatures()).toHaveTextContent(/^2\/3$/)
    expect(signatures().querySelector('svg path')).toBeInTheDocument()
    expect(row()).not.toHaveTextContent('1 more from')
    expect(row()).not.toHaveTextContent('September contractor payouts')
    expect(within(row()).getByRole('button', { name: 'Note for Send to Globex Payroll' })).toBeVisible()
    unmount()
    setViewport({ wide: false })
    render(<PendingQueue />, { routerProps: { query: { groupBy: 'status' } } })
    expect(row()).not.toHaveTextContent('1 more from')
    expect(row()).not.toHaveTextContent('September contractor payouts')
    expect(
      within(row()).getByRole('button', { name: /^2 of 3 signatures, 1 more from you, Jonas, Lena$/ }),
    ).toBeVisible()
  })
  it('shows the full off-chain note on hover and focus and opens review only on activation', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />)
    const row = allPending().getByRole('button', { name: 'Open Send to Globex Payroll' }).closest('tr')!
    const note = within(row).getByRole('button', { name: 'Note for Send to Globex Payroll' })
    await user.hover(note)
    const tooltip = (await screen.findByText('Off-chain note')).closest('[data-slot="tooltip-content"]')
    expect(tooltip).toHaveTextContent(
      'September contractor payouts. Confirm the recipient and amount against the invoice.',
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
    await user.click(screen.getByRole('button', { name: 'Advanced transaction data' }))
    await user.click(screen.getByRole('tab', { name: 'JSON' }))
    await user.click(screen.getByRole('button', { name: 'Earlier transactions' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Send to Globex Payroll/ }))
    expect(screen.queryByRole('tab', { name: 'JSON' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Advanced transaction data' }))
    expect(screen.getByRole('tab', { name: 'Data' })).toHaveAttribute('aria-selected', 'true')
  })
  it('opens with every section collapsed and resets them for another proposal', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { groupBy: 'status' } } })
    await user.click(allPending().getByRole('button', { name: 'Open Add signer Priya' }))
    for (const name of ['Transaction summary', 'Note', 'Details', 'Earlier transactions', 'Advanced transaction data'])
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-expanded', 'false')
    await user.click(screen.getByRole('button', { name: 'Details' }))
    expect(screen.getByRole('button', { name: 'Details' })).toHaveAttribute('aria-expanded', 'true')
    await user.click(screen.getByRole('button', { name: 'Earlier transactions' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Send to Globex Payroll/ }))
    expect(screen.getByRole('button', { name: 'Details' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('button', { name: 'Open in Safe' })).not.toBeInTheDocument()
  })
  it('keeps the expanded audit log and actions in the fixed footer while sections scroll', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { groupBy: 'status' } } })
    await user.click(allPending().getByRole('button', { name: 'Open Batch · 14 actions' }))
    const footer = screen.getByTestId('proposal-fixed-footer')
    const audit = within(footer).getByRole('button', { name: 'Signers' })
    expect(audit).toHaveAttribute('aria-expanded', 'true')
    expect(within(footer).getByRole('list', { name: 'Signers' })).toHaveTextContent(
      /^Created by Ana.*Ana0x7C21…D2e4Signed/,
    )
    expect(within(footer).getByRole('button', { name: 'Copy transaction link' })).toBeVisible()
    expect(footer).not.toHaveTextContent('Can be executed once the threshold is reached.')
    expect(footer.closest('.overflow-y-auto')).toBeNull()
    expect(footer.contains(screen.getByRole('button', { name: 'Details' }))).toBe(false)
    await user.click(audit)
    expect(audit).toHaveAttribute('aria-expanded', 'false')
    expect(within(footer).getByRole('button', { name: 'Review and execute' })).toBeEnabled()
    await user.click(within(footer).getByRole('button', { name: 'Review and execute' }))
    expect(screen.getByRole('button', { name: 'Execute in preview' })).toBeVisible()
  })
  it('confirms signing without executing a blocked proposal and keeps its note', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { groupBy: 'status' } } })
    await user.click(allPending().getByRole('button', { name: 'Open Send to Contoso Ltd' }))
    await user.click(screen.getByRole('button', { name: 'Review and sign' }))
    await user.click(screen.getByRole('button', { name: 'Sign in preview' }))
    expect(screen.getByRole('status')).toHaveTextContent('Signature added')
    await user.click(screen.getByRole('button', { name: 'Note' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Q4 vendor payment.')
    expect(screen.getByRole('button', { name: 'Blocked by #42' })).toBeDisabled()
  })
  it('executes after confirmation and unblocks the next nonce', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { groupBy: 'status' } } })
    await user.click(allPending().getByRole('button', { name: 'Open Send to Globex Payroll' }))
    await user.click(screen.getByRole('button', { name: 'Review, sign and execute' }))
    await user.click(screen.getByRole('button', { name: 'Sign and execute in preview' }))
    expect(allPending().queryByRole('button', { name: 'Open Send to Globex Payroll' })).not.toBeInTheDocument()
    const signerRow = allPending().getByRole('button', { name: 'Open Add signer Priya' }).closest('tr')!
    expect(signerRow).toHaveTextContent('Ready to execute')
  })
  it('creates a cancellation competitor while retaining the original and its note', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { groupBy: 'status' } } })
    await user.click(allPending().getByRole('button', { name: 'Open Send to Globex Payroll' }))
    await user.click(screen.getByRole('button', { name: 'Replace or cancel' }))
    await user.click(screen.getByRole('button', { name: 'Propose on-chain cancellation' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('On-chain rejection')
    expect(screen.queryByRole('button', { name: 'Note' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Close' }))
    await user.click(allPending().getByRole('button', { name: 'Open Send to Globex Payroll' }))
    await user.click(screen.getByRole('button', { name: 'Note' }))
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
    const row = allPending().getByRole('button', { name: 'Open Send to Globex Payroll' }).closest('tr')!
    const fraction = within(row).getByRole('button', { name: /^2 of 3 signatures/ })
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
    expect(within(row).getByRole('button', { name: /^2 of 2 signatures/ })).toHaveFocus()
    expect(await screen.findByText('Signature threshold met')).toBeVisible()
    expect(screen.queryByText(/^Not yet signed:/)).not.toBeInTheDocument()
  })
  it('identifies transfer, swap, and signer-change rows with transaction icons', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, {
      routerProps: { query: { groupBy: 'status', scenario: 'conflict' } },
    })
    const transfer = allPending().getByRole('button', { name: 'Open Send to Globex Payroll' }).closest('tr')!
    const swap = allPending().getByRole('button', { name: 'Open Swap USDC → ETH' }).closest('tr')!
    const settings = allPending().getByRole('button', { name: 'Open Add signer Priya' }).closest('tr')!
    expect(within(transfer).getByRole('img', { name: 'Send' })).toBeVisible()
    expect(within(swap).getByRole('img', { name: 'Swap' })).toBeVisible()
    expect(within(settings).getByRole('img', { name: 'Update' })).toBeVisible()
    expect(within(transfer).getByText('48.5 ETH · $155,200').closest('td')).toContainElement(
      within(transfer).getByRole('img', { name: 'Send' }),
    )
    expect(within(swap).getByText('200,000 USDC → 62.4 ETH').closest('td')).toContainElement(
      within(swap).getByRole('img', { name: 'Swap' }),
    )
    expect(within(settings).getByText('New signer: Priya').closest('td')).toContainElement(
      within(settings).getByRole('img', { name: 'Update' }),
    )
    expect(within(settings).queryByText('Safe settings')).not.toBeInTheDocument()
    expect(within(transfer).getAllByText('#42')).toHaveLength(1)
    await user.click(within(transfer).getByRole('img', { name: 'Send' }))
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Send to Globex Payroll')
  })
  it('uses the selected proposal type in the review panel icon', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, {
      routerProps: { query: { groupBy: 'status', scenario: 'conflict' } },
    })
    await user.click(allPending().getByRole('button', { name: 'Open Swap USDC → ETH' }))
    expect(screen.getByRole('dialog').querySelector('svg.lucide-repeat-2')).toBeVisible()
    expect(screen.getByRole('dialog').querySelector('svg.lucide-arrow-up-right')).not.toBeInTheDocument()
  })
  it('keeps one primary button per row and opens replace or reject from the hover buttons', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />)
    const row = allPending().getByRole('button', { name: 'Open Send to Contoso Ltd' }).closest('tr')!
    expect(within(row).getByRole('button', { name: 'Sign Send to Contoso Ltd' })).toBeInTheDocument()
    const replace = within(row).getByRole('button', { name: 'Replace Send to Contoso Ltd' })
    expect(replace.parentElement).toHaveClass('opacity-0', 'group-hover/transaction:opacity-100')
    const primary = within(row).getByRole('button', { name: 'Sign Send to Contoso Ltd' })
    expect(primary).not.toHaveClass('bg-primary')
    fireEvent.mouseMove(row)
    expect(primary).toHaveClass('bg-primary')
    fireEvent.mouseLeave(row)
    expect(primary).not.toHaveClass('bg-primary')
    expect(replace).toHaveTextContent('Replace')
    expect(within(row).getByRole('button', { name: 'Reject Send to Contoso Ltd' })).toHaveTextContent('Reject')
    await user.click(replace)
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Send to Contoso Ltd')
    expect(screen.getByRole('button', { name: 'Propose replacement in preview' })).toBeVisible()
  })
  it('drops the hover look once the drawer closes over a clicked row', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />)
    const row = allPending().getByRole('button', { name: 'Open Send to Contoso Ltd' }).closest('tr')!
    const primary = within(row).getByRole('button', { name: 'Sign Send to Contoso Ltd' })
    fireEvent.mouseMove(row)
    expect(primary).toHaveClass('bg-primary')
    await user.click(within(row).getByRole('button', { name: 'Open Send to Contoso Ltd' }))
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(primary).not.toHaveClass('bg-primary')
    expect(row.className).not.toContain('focus-within')
  })
  it('offers no replace or reject buttons to observers', () => {
    render(<PendingQueue />, { routerProps: { query: { persona: 'observer' } } })
    const row = allPending().getByRole('button', { name: 'Open Send to Contoso Ltd' }).closest('tr')!
    expect(within(row).queryByRole('button', { name: /^(Replace|Reject) / })).not.toBeInTheDocument()
  })
  it('gives the nonce its own column after the type, keeping the type icon first', () => {
    render(<PendingQueue />)
    const row = allPending().getByRole('button', { name: 'Open Send to Contoso Ltd' }).closest('tr')!
    const [type, nonce] = within(row).getAllByRole('cell')
    expect(type).toContainElement(within(row).getByRole('img', { name: 'Send' }))
    expect(nonce).toHaveTextContent(/^#44$/)
    expect(nonce).toHaveAccessibleName('Nonce 44')
  })
  it('shows the action type and nonce with Safe context, hiding the repeated Safe in Safe grouping', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { groupBy: 'status' } } })
    const row = allPending().getByRole('button', { name: 'Open Send to Contoso Ltd' }).closest('tr')!
    expect(within(row).getByRole('img', { name: 'Send' })).toBeVisible()
    expect(within(row).getByLabelText('Nonce 44')).toBeVisible()
    expect(within(row).getByText('Treasury Main')).toBeVisible()
    expect(row).toHaveTextContent('Blocked by #42')
    await chooseGrouping(user, 'Safe')
    await user.keyboard('{Escape}')
    const safe = within(screen.getByRole('table', { name: 'Treasury Main transactions' }))
    const groupedRow = safe.getByRole('button', { name: 'Open Send to Contoso Ltd' }).closest('tr')!
    expect(within(groupedRow).queryByText('Treasury Main')).not.toBeInTheDocument()
    expect(within(groupedRow).queryByText('Ethereum')).not.toBeInTheDocument()
    expect(within(groupedRow).getByLabelText('Nonce 44')).toBeVisible()
    expect(groupedRow).toHaveTextContent('Blocked by #42')
  })
  it('opens mobile details full screen with the signers open and full-height actions', async () => {
    jest.mocked(useIsMobile).mockReturnValue(true)
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { groupBy: 'status' } } })
    expect(screen.getByRole('searchbox', { name: 'Find a proposal' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Filter/ })).toBeInTheDocument()
    await user.click(allPending().getByRole('button', { name: 'Open Batch · 14 actions' }))
    expect(screen.getByRole('dialog')).toHaveAttribute('data-mobile-full-screen', 'true')
    expect(screen.getByRole('button', { name: 'Transaction summary' })).toHaveAttribute('aria-expanded', 'false')
    const footer = within(screen.getByTestId('proposal-fixed-footer'))
    expect(footer.getByRole('button', { name: 'Signers' })).toHaveAttribute('aria-expanded', 'true')
    const primary = footer.getByRole('button', { name: 'Review and execute' })
    expect(primary).toHaveClass('h-12', 'shrink-0')
    expect(primary).not.toHaveClass('flex-1')
    expect(screen.queryByRole('button', { name: 'Expand to full screen' })).not.toBeInTheDocument()
    await user.click(primary)
    expect(footer.getByRole('button', { name: 'Execute in preview' })).toHaveClass('h-12', 'shrink-0')
  })
  it('filters by network and clears all filters back to the default flat table', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />)
    await toggleFilter(user, 'Network', 'Base', 'Arbitrum')
    expect(allPending().getAllByRole('button', { name: /^Open / })).toHaveLength(3)
    expect(allPending().queryByRole('button', { name: 'Open Send to Globex Payroll' })).not.toBeInTheDocument()
    fireEvent.change(screen.getByRole('searchbox', { name: 'Find a proposal' }), { target: { value: 'Fabrikam' } })
    expect(allPending().getAllByRole('button', { name: /^Open / })).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(screen.getByRole('searchbox', { name: 'Find a proposal' })).toHaveValue('')
    expect(allPending().getAllByRole('button', { name: /^Open / })).toHaveLength(6)
    expect(screen.getByRole('table', { name: 'Pending transactions' })).toBeVisible()
  })
  it('keeps the amount under the type and shows the network and a note icon on wide screens', () => {
    render(<PendingQueue />)
    const title = allPending().getByRole('button', { name: 'Open Send to Globex Payroll' })
    expect(title.closest('td')).toHaveTextContent('48.5 ETH')
    expect(title.closest('td')).not.toHaveTextContent('September contractor payouts')
    expect(within(title.closest('tr')!).getByLabelText('Ethereum')).toBeVisible()
    expect(title.closest('tr')).not.toHaveTextContent('September contractor payouts')
    expect(within(title.closest('tr')!).getByRole('button', { name: 'Note for Send to Globex Payroll' })).toBeVisible()
  })
  it('shows the full Safe address when hovering any part of the Safe cell', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />)
    const row = allPending().getByRole('button', { name: 'Open Send to Globex Payroll' }).closest('tr')!
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
      'Nonce',
      'Safe',
      'Signatures',
      'Status',
      'Proposed',
      'Action',
    ])
    const row = table.getByRole('button', { name: 'Open Send to Globex Payroll' }).closest('tr')!
    expect(within(row).getByText('Treasury Main').closest('td')).toHaveTextContent('Ethereum')
    const status = within(row).getByText('Ready to sign').closest('td')!
    expect(status).not.toHaveTextContent('#42')
    expect(status).not.toHaveTextContent('3d ago')
    expect(within(row).getByLabelText('Nonce 42').closest('td')).toHaveTextContent(/^#42$/)
    expect(within(row).getByLabelText('Proposed 3d ago').closest('td')).toHaveTextContent(/^3d ago$/)
    expect(within(row).getByRole('button', { name: 'Open Send to Globex Payroll' }).closest('td')).toContainElement(
      within(row).getByRole('button', { name: 'Note for Send to Globex Payroll' }),
    )
    expect(within(row).getByRole('button', { name: 'Sign Send to Globex Payroll' })).toBeInTheDocument()
  })
  it('gives each status and each Safe its own labelled table, hiding Safe columns when grouped by Safe', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { groupBy: 'status' } } })
    const statusColumns = ['Type', 'Nonce', 'Safe', 'Network', 'Signatures', 'Note', 'Status', 'Proposed', 'Action']
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
    await chooseGrouping(user, 'Safe')
    await user.keyboard('{Escape}')
    expect(screen.getAllByRole('table')).toHaveLength(3)
    const treasury = screen.getByRole('table', { name: 'Treasury Main transactions' })
    expect(
      within(treasury)
        .getAllByRole('columnheader')
        .map((header) => header.textContent),
    ).toEqual(['Type', 'Nonce', 'Signatures', 'Note', 'Status', 'Proposed', 'Action'])
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
    expect(headers.map((header) => header.textContent)).toEqual([
      'Type',
      'Nonce',
      'Safe',
      'Signatures',
      'Status',
      'Proposed',
      'Action',
    ])
    expect(headers[0]).toHaveClass('max-md:sticky', 'max-md:left-0')
    const title = table.getByRole('button', { name: 'Open Send to Globex Payroll' })
    expect(title.closest('td')).toHaveClass('max-md:sticky', 'max-md:left-0', 'max-md:bg-card')
    expect(within(title.closest('tr')!).getAllByRole('cell')).toHaveLength(7)
    fireEvent.click(title.closest('tr')!)
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Send to Globex Payroll')
  })
  it('shows only the empty state when nothing is pending', () => {
    render(<PendingQueue />, { routerProps: { query: { scenario: 'empty' } } })
    expect(screen.getByRole('heading', { name: 'Nothing pending' })).toBeVisible()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByText('No matching proposals')).not.toBeInTheDocument()
  })
  it('keeps the signers open on short viewports and names no placeholder proposer', async () => {
    setViewport({ short: true })
    const { user } = renderWithUserEvent(<PendingQueue />)
    await user.click(allPending().getByRole('button', { name: 'Open Batch · 14 actions' }))
    const footer = within(screen.getByTestId('proposal-fixed-footer'))
    expect(footer.getByRole('button', { name: 'Signers' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('proposal-fixed-footer')).toHaveTextContent('Created by Ana')
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
  it('shows grouping as an applied pill that returns to the default table when removed', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />)
    expect(screen.queryByRole('group', { name: 'Applied filters' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Group by status' }))
    const applied = within(screen.getByRole('group', { name: 'Applied filters' }))
    expect(applied.getByText('Group by:').parentElement).toHaveTextContent('Group by:Status')
    expect(screen.getByRole('button', { name: /^Filter/ })).toHaveAccessibleName('Filter')
    await user.click(applied.getByRole('button', { name: 'Remove' }))
    expect(screen.getAllByRole('table')).toHaveLength(1)
    expect(screen.getByRole('table', { name: 'Pending transactions' })).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Applied filters' })).not.toBeInTheDocument()
  })
  describe('edge cases with many competing proposals', () => {
    const heavy = (query: Record<string, string> = {}) => ({
      routerProps: { query: { scenario: 'conflict-heavy', ...query } },
    })

    it('keeps competing proposals together under one conflict sub-header', () => {
      render(<PendingQueue />, heavy())
      expect(screen.getAllByText('4 competing proposals')).toHaveLength(1)
      expect(screen.getByRole('link', { name: 'Why did this happen?' })).toHaveAttribute('target', '_blank')
      const titles = allPending()
        .getAllByRole('button', { name: /^Open / })
        .map((button) => button.getAttribute('aria-label'))
      const competing = [
        'Open Send to Globex Payroll',
        'Open Batch · 46 actions',
        'Open Add signer Marco',
        'Open Change threshold to 2',
      ]
      const first = titles.indexOf(competing[0])
      expect(titles.slice(first, first + 4).sort()).toEqual([...competing].sort())
      expect(screen.getAllByText('4 competing proposals')).toHaveLength(1)
    })
    it('groups competitors within a status table too', () => {
      render(<PendingQueue />, heavy({ groupBy: 'status' }))
      const ready = within(screen.getByRole('table', { name: 'Ready to execute transactions' }))
      expect(ready.getByText('4 competing proposals')).toBeVisible()
    })
    it('strikes through the proposals an execution would replace', () => {
      render(<PendingQueue />, heavy())
      fireEvent.mouseEnter(screen.getByRole('button', { name: 'Execute Batch · 46 actions' }))
      expect(screen.getByRole('button', { name: 'Open Send to Globex Payroll' })).toHaveClass('line-through')
      expect(screen.getByRole('button', { name: 'Open Batch · 46 actions' })).not.toHaveClass('line-through')
      expect(screen.getByRole('button', { name: 'Open Batch · 14 actions' })).not.toHaveClass('line-through')
      fireEvent.mouseLeave(screen.getByRole('button', { name: 'Execute Batch · 46 actions' }))
      expect(screen.getByRole('button', { name: 'Open Send to Globex Payroll' })).not.toHaveClass('line-through')
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

    it('summarises the transaction above the sections without repeating the amount', async () => {
      const { user } = renderWithUserEvent(<PendingQueue />)
      await user.click(allPending().getByRole('button', { name: 'Open Send to Globex Payroll' }))
      await user.click(dialog().getByRole('button', { name: 'Transaction summary' }))
      const summary = within(screen.getByRole('group', { name: 'Transaction summary' }))
      expect(dialog().getAllByText('48.5 ETH · $155,200')).toHaveLength(1)
      expect(summary.getByText('Treasury Main · Ethereum')).toBeVisible()
      expect(summary.getByText('Ready to sign')).toBeVisible()
      expect(summary.getByText('#42')).toBeVisible()
      expect(summary.getByText(/^[A-Z][a-z]{2} \d{1,2}, \d{4} - \d{1,2}:\d{2}:\d{2} [AP]M/)).toBeVisible()
      expect(summary.getByText(/· 3d ago/)).toBeVisible()
      expect(summary.getByText(/1 more from you, Jonas, Lena/)).toBeVisible()
      const labels = summary.getAllByRole('term').map((term) => term.textContent)
      expect(labels).toEqual(['Safe', 'To', 'Signatures', 'Nonce', 'Proposed', 'Status'])
      expect(summary.getByRole('note')).toHaveTextContent('Needs 1 more signature, including yours.')
      expect(summary.queryByText(/September contractor payouts/)).toBeNull()
      expect(dialog().getByRole('button', { name: 'Note' })).toHaveAttribute('aria-expanded', 'false')
      await user.click(dialog().getByRole('button', { name: 'Note' }))
      expect(dialog().getByText(/September contractor payouts/)).toBeVisible()
      expect(dialog().getByText(/Ana · 6 Oct, 09:15 · Off-chain, not verified/)).toBeVisible()
    })
    it('moves through the table with J/K and opens the highlighted row with Enter', async () => {
      const { user } = renderWithUserEvent(<PendingQueue />)
      const titles = rowTitles()
      const cursorRow = () => document.querySelector('tr[data-cursor]')
      expect(cursorRow()).toBeNull()
      await user.keyboard('j')
      expect(within(cursorRow() as HTMLElement).getByRole('button', { name: `Open ${titles[0]}` })).toBeInTheDocument()
      await user.keyboard('jjk')
      expect(within(cursorRow() as HTMLElement).getByRole('button', { name: `Open ${titles[1]}` })).toBeInTheDocument()
      await user.keyboard('{Enter}')
      expect(screen.getByRole('dialog')).toHaveAccessibleName(titles[1])
      expect(cursorRow()).toBeNull()
    })
    it('shows the position only in full screen, next to the drawer controls', async () => {
      const { user } = renderWithUserEvent(<PendingQueue />)
      const titles = rowTitles()
      await user.click(allPending().getByRole('button', { name: `Open ${titles[0]}` }))
      expect(dialog().getByText(`1 of ${titles.length}`)).toHaveClass('sr-only')
      await user.click(dialog().getByRole('button', { name: 'Expand to full screen' }))
      expect(dialog().getByText(`1 of ${titles.length}`)).not.toHaveClass('sr-only')
    })
    it('repeats the row’s type and detail as the drawer title', async () => {
      const { user } = renderWithUserEvent(<PendingQueue />)
      await user.click(allPending().getByRole('button', { name: 'Open Send to Globex Payroll' }))
      expect(dialog().getByText('Send')).toBeVisible()
      expect(dialog().getByText('48.5 ETH · $155,200')).toBeVisible()
      expect(screen.getByRole('dialog')).toHaveAccessibleName('Send to Globex Payroll')
      await user.click(dialog().getByRole('button', { name: 'Transaction summary' }))
      const summary = within(screen.getByRole('group', { name: 'Transaction summary' }))
      expect(summary.getAllByRole('term').map((term) => term.textContent)).toContain('To')
      expect(summary.getByText('Globex Payroll')).toBeVisible()
      await user.click(screen.getByRole('button', { name: 'Close' }))
      await user.click(allPending().getByRole('button', { name: 'Open Batch · 14 actions' }))
      expect(dialog().getByText('Batch')).toBeVisible()
      expect(dialog().getAllByText(/^14 actions/)).toHaveLength(1)
    })
    it('keeps the open sections and signers state while stepping with prev/next', async () => {
      const { user } = renderWithUserEvent(<PendingQueue />)
      const titles = rowTitles()
      await user.click(allPending().getByRole('button', { name: `Open ${titles[0]}` }))
      await user.click(dialog().getByRole('button', { name: 'Transaction summary' }))
      await user.click(dialog().getByRole('button', { name: 'Details' }))
      await user.click(within(screen.getByTestId('proposal-fixed-footer')).getByRole('button', { name: 'Signers' }))
      await user.click(dialog().getByRole('button', { name: 'Next transaction' }))
      expect(screen.getByRole('dialog')).toHaveAccessibleName(titles[1])
      expect(dialog().getByRole('button', { name: 'Transaction summary' })).toHaveAttribute('aria-expanded', 'true')
      expect(dialog().getByRole('button', { name: 'Details' })).toHaveAttribute('aria-expanded', 'true')
      expect(dialog().getByRole('button', { name: 'Advanced transaction data' })).toHaveAttribute(
        'aria-expanded',
        'false',
      )
      expect(
        within(screen.getByTestId('proposal-fixed-footer')).getByRole('button', { name: 'Signers' }),
      ).toHaveAttribute('aria-expanded', 'false')
      await user.keyboard('k')
      expect(dialog().getByRole('button', { name: 'Details' })).toHaveAttribute('aria-expanded', 'true')
      await user.click(screen.getByRole('button', { name: 'Close' }))
      await user.click(allPending().getByRole('button', { name: `Open ${titles[1]}` }))
      expect(dialog().getByRole('button', { name: 'Details' })).toHaveAttribute('aria-expanded', 'false')
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
      await user.click(dialog().getByRole('button', { name: /Send to Globex Payroll/ }))
      expect(dialog().getByRole('button', { name: 'Previous transaction' })).toBeDisabled()
      expect(dialog().getByRole('button', { name: 'Next transaction' })).toBeDisabled()
      expect(dialog().queryByText(/ of \d+$/)).not.toBeInTheDocument()
    })
  })
  it('filters by transaction type and shows it as an applied filter', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { scenario: 'conflict-heavy' } } })
    await toggleFilter(user, 'Type', 'Batch')
    const titles = allPending()
      .getAllByRole('button', { name: /^Open / })
      .map((button) => button.getAttribute('aria-label'))
    expect(titles).toEqual(['Open Batch · 46 actions', 'Open Batch · 14 actions'])
    expect(screen.getByRole('button', { name: /^Filter/ })).toHaveAccessibleName('Filter')
    expect(screen.getByRole('group', { name: 'Applied filters' })).toHaveTextContent('Type:Batch')
    await openFilter(user, 'Type')
    expect(await screen.findByRole('menuitem', { name: 'Type' })).toHaveTextContent('Type1')
    await closeMenus(user)
    await user.click(
      within(screen.getByRole('group', { name: 'Applied filters' })).getByRole('button', { name: 'Remove' }),
    )
    expect(screen.queryByRole('group', { name: 'Applied filters' })).not.toBeInTheDocument()
    expect(allPending().getAllByRole('button', { name: /^Open / })).toHaveLength(9)
  })
  it('opens the transaction from a shared link', () => {
    render(<PendingQueue />, { routerProps: { query: { tx: 'treasury-42' } } })
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Send to Globex Payroll')
  })
  it('starts with no filters and narrows only when options are checked', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />)
    expect(screen.getByRole('button', { name: /^Filter/ })).toHaveAccessibleName('Filter')
    expect(screen.queryByRole('group', { name: 'Applied filters' })).not.toBeInTheDocument()
    await openFilter(user, 'Safe account')
    const option = await screen.findByRole('menuitemcheckbox', { name: /^Treasury Main/ })
    expect(option).toHaveAttribute('aria-checked', 'false')
    expect(option).toHaveTextContent('Treasury Main3')
    fireEvent.click(option)
    expect(option).toHaveAttribute('aria-checked', 'true')
    await closeMenus(user)
    expect(allPending().getAllByRole('button', { name: /^Open / })).toHaveLength(3)
  })
  it('combines quick status chips and keeps them in sync with the Status menu', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { scenario: 'realistic' } } })
    const quick = within(screen.getByRole('group', { name: 'Quick filters' }))
    const ready = quick.getByRole('button', { name: /^Ready to execute/ })
    const blocked = quick.getByRole('button', { name: /^Blocked/ })
    const total = (button: HTMLElement) => Number(button.getAttribute('aria-label')?.replace(/\D/g, ''))
    await user.click(ready)
    await user.click(blocked)
    expect(allPending().getAllByRole('button', { name: /^Open / })).toHaveLength(total(ready) + total(blocked))
    expect(screen.getByRole('group', { name: 'Applied filters' })).toHaveTextContent('Status:Ready to execute, Blocked')
    await openFilter(user, 'Status')
    expect(await screen.findByRole('menuitemcheckbox', { name: /^Blocked/ })).toHaveAttribute('aria-checked', 'true')
    await closeMenus(user)
  })
  it('groups from the menu without counting grouping as a filter', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />)
    await chooseGrouping(user, 'Safe')
    expect(screen.getByRole('table', { name: 'Treasury Main transactions' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Filter/ })).toHaveAccessibleName('Filter')
  })
  describe('realistic scenario', () => {
    const renderRealistic = () =>
      renderWithUserEvent(<PendingQueue />, { routerProps: { query: { scenario: 'realistic' } } })
    const rowFor = (label: string) =>
      allPending()
        .getByRole('button', { name: `Open ${label}` })
        .closest('tr')!

    it('shows the RFC status words and a proposal pill', () => {
      renderRealistic()
      expect(rowFor('Send to Contoso Ltd')).toHaveTextContent('Blocked by #42')
      expect(rowFor('Send to Globex Payroll')).toHaveTextContent('Ready to sign')
      const [grant, unsigned] = allPending()
        .getAllByRole('button', { name: 'Open Send to Tailspin Labs' })
        .map((button) => button.closest('tr')!)
      expect(grant).toHaveTextContent('Waiting on others')
      expect(within(grant).queryByText('Proposal')).toBeNull()
      expect(unsigned).toHaveTextContent('Blocked by #8')
      expect(within(unsigned).getByText('Proposal')).toBeVisible()
    })
    it('marks rows that need extra care and explains why', () => {
      renderRealistic()
      expect(
        within(rowFor('Bridge ETH to Unknown network')).getByRole('button', { name: 'Warnings: Unknown network' }),
      ).toBeVisible()
      expect(within(rowFor('Batch · 2 actions')).queryByRole('button', { name: /^Warnings/ })).toBeNull()
      expect(
        within(rowFor('Enable module Zodiac Roles')).getByRole('button', {
          name: 'Warnings: Changes who controls funds',
        }),
      ).toBeVisible()
      expect(within(rowFor('Send to Globex Payroll')).queryByRole('button', { name: /^Warnings/ })).toBeNull()
      expect(rowFor('Bridge ETH to Unknown network')).toHaveTextContent('0.04 ETH → Unknown network')
    })
    it('filters with the quick filters and shows a count on each', async () => {
      const { user } = renderRealistic()
      const quick = within(screen.getByRole('group', { name: 'Quick filters' }))
      const blocked = quick.getByRole('button', { name: /^Blocked/ })
      const count = Number(blocked.getAttribute('aria-label')?.replace(/\D/g, ''))
      expect(count).toBeGreaterThan(0)
      await user.click(blocked)
      expect(blocked).toHaveAttribute('aria-pressed', 'true')
      expect(allPending().getAllByRole('button', { name: /^Open / })).toHaveLength(count)
      expect(allPending().getAllByText(/^Blocked by #/)).toHaveLength(count)
      await user.click(blocked)
      expect(blocked).toHaveAttribute('aria-pressed', 'false')
      expect(allPending().getAllByRole('button', { name: /^Open / }).length).toBeGreaterThan(count)
    })
    it('leads with the summary and warnings, with type details collapsed below', async () => {
      const { user } = renderRealistic()
      await user.click(allPending().getByRole('button', { name: 'Open Bridge ETH to Unknown network' }))
      const dialog = within(screen.getByRole('dialog'))
      expect(dialog.getByRole('alert')).toHaveTextContent('Unknown network')
      await user.click(dialog.getByRole('button', { name: 'Transaction summary' }))
      expect(screen.getByTestId('execution-reason')).toHaveTextContent('Blocked by #42')
      expect(dialog.getByRole('alert').compareDocumentPosition(dialog.getByRole('button', { name: 'Details' }))).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      )
      expect(dialog.queryByText('Unknown network · chain 999')).toBeNull()
      await user.click(dialog.getByRole('button', { name: 'Details' }))
      expect(dialog.getByText('Unknown network · chain 999')).toBeVisible()
      await user.click(screen.getByRole('button', { name: 'Next transaction' }))
      expect(dialog.getByRole('button', { name: 'Details' })).toHaveAttribute('aria-expanded', 'true')
      expect(dialog.getByText('Swap 1.2 WETH for 4,180 USDC')).toBeVisible()
      expect(dialog.queryByRole('alert')).toBeNull()
    })
    it('lists who has signed in the footer, with a faded row for you', async () => {
      const { user } = renderRealistic()
      await user.click(allPending().getByRole('button', { name: 'Open Send to Globex Payroll' }))
      const rows = within(screen.getByRole('list', { name: 'Signers' })).getAllByRole('listitem')
      expect(rows).toHaveLength(4)
      expect(rows[3]).toHaveTextContent(/^Dev \(you\).*Your signature needed$/)
      const footer = within(screen.getByTestId('proposal-fixed-footer'))
      expect(footer.getByText('2 of 3 required')).toBeVisible()
      expect(footer.getByRole('button', { name: 'Copy transaction link' })).toBeVisible()
      expect(screen.getByTestId('proposal-fixed-footer')).toHaveTextContent(
        'Can be executed once the threshold is reached.',
      )
    })
  })
})
