import type { ReactNode } from 'react'
import {
  act,
  fireEvent,
  render as baseRender,
  renderWithUserEvent as baseRenderWithUserEvent,
  screen,
  within,
} from '@/tests/test-utils'
import PendingQueue from './PendingQueue'
import { useIsMobile } from '@safe-global/views/hooks/use-mobile'
import { useElementWidth } from '../hooks/useElementWidth'

jest.mock('@safe-global/views/hooks/use-mobile', () => ({ useIsMobile: jest.fn(() => false) }))
jest.mock('../hooks/useElementWidth', () => ({ useElementWidth: jest.fn() }))

// Content width, which decides the wide columns.
const setViewport = ({ wide = true }: { wide?: boolean } = {}) =>
  jest.mocked(useElementWidth).mockReturnValue([{ current: null }, wide ? 1200 : 800])

beforeEach(() => {
  jest.mocked(useIsMobile).mockReturnValue(false)
  setViewport()
})

jest.mock('./PrototypeFrame', () => ({ PrototypeFrame: ({ children }: { children: ReactNode }) => <>{children}</> }))

// These tests cover the everyday queue in M2, with a wallet connected, with every feature on, unless they say otherwise.
type RenderOptions = Parameters<typeof baseRender>[1]
const withDefaults = (options: RenderOptions = {}): RenderOptions => ({
  ...options,
  routerProps: {
    ...options?.routerProps,
    query: { scenario: 'everyday', state: 'normal', m: '2', ...options?.routerProps?.query },
  },
})
// The page remembers its grouping. The Safe view tests start grouped by Safe.
const groupBySafe = () => localStorage.setItem('prototype.pendingQueue.groupBy', JSON.stringify({ groupBy: 'safe' }))
const render = (ui: Parameters<typeof baseRender>[0], options?: RenderOptions) => baseRender(ui, withDefaults(options))
const renderWithUserEvent = (ui: Parameters<typeof baseRenderWithUserEvent>[0], options?: RenderOptions) =>
  baseRenderWithUserEvent(ui, withDefaults(options))
// The drawer opens with every section collapsed. Tests that read a section open them all first.
const expandSections = (user: ReturnType<typeof renderWithUserEvent>['user']) =>
  user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Expand all sections' }))

type TestUser = ReturnType<typeof renderWithUserEvent>['user']
const openFilter = async (user: TestUser, section: string) => {
  if (!screen.queryAllByRole('menu').length) await user.click(screen.getByRole('button', { name: /^Filter/ }))
  await user.click(await screen.findByRole('menuitem', { name: section }))
}
const closeMenus = async (user: TestUser) => {
  for (let i = 0; i < 3 && screen.queryAllByRole('menu').length; i++) await user.keyboard('{Escape}')
}
const groupBy = async (user: TestUser, name: RegExp) => {
  await closeMenus(user)
  await user.click(screen.getByRole('button', { name: /^Group by/ }))
  await user.click(await screen.findByRole('menuitemradio', { name }))
}
const toggleFilter = async (user: TestUser, section: string, ...options: string[]) => {
  await openFilter(user, section)
  for (const option of options)
    fireEvent.click(await screen.findByRole('menuitemcheckbox', { name: new RegExp(`^${option}`) }))
  await closeMenus(user)
}

const allPending = () => within(screen.getByRole('region', { name: 'Queue' }))
const openRows = () => allPending().getAllByRole('button', { name: /^Open / })
const rowFor = (label: string) =>
  allPending()
    .getByRole('button', { name: `Open ${label}` })
    .closest('tr')!
// Each Safe is a band row in the one table. Its toggle controls the body that holds its rows.
const safeToggle = (name: string) => screen.queryByRole('button', { name: new RegExp(`^(Collapse|Expand) ${name}$`) })
const safeBand = (name: string) => safeToggle(name)!.closest('tr')!
const safeRows = (name: string) => within(document.getElementById(safeToggle(name)!.getAttribute('aria-controls')!)!)

jest.setTimeout(20_000)

describe('queue design exploration', () => {
  beforeEach(groupBySafe)
  it('defaults to one table grouped by Safe, and opens execute without running it', () => {
    render(<PendingQueue />)
    expect(screen.getAllByRole('table')).toHaveLength(1)
    const table = within(screen.getByRole('table', { name: 'Pending transactions' }))
    const headers = table.getAllByRole('columnheader')
    expect(headers.slice(0, -1).map((header) => header.textContent)).toEqual([
      'Nonce',
      'Transaction',
      'To',
      'Proposed',
      'Note',
      'Signatures',
      'Status',
    ])
    expect(within(headers.at(-1)!).getByText('Action')).toHaveClass('sr-only')
    expect(screen.getByRole('button', { name: 'Collapse Treasury Main' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: 'Collapse Ops Payroll' })).toHaveAttribute('aria-expanded', 'true')
    // Grants has nothing for you, so it starts collapsed.
    expect(screen.getByRole('button', { name: 'Expand Grants' })).toHaveAttribute('aria-expanded', 'false')
    expect(table.getByRole('button', { name: 'Sign Send to Globex Payroll' })).toBeVisible()
    expect(table.getByRole('button', { name: 'Go to #42 Add signer Priya' })).toBeVisible()
    fireEvent.click(table.getByRole('button', { name: 'Execute Batch · 14 actions' }))
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Batch · 14 actions')
    expect(screen.getByRole('button', { name: 'Execute in preview' })).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(table.getByRole('button', { name: 'Execute Batch · 14 actions' })).toBeInTheDocument()
  })
  it('keeps reject in the review panel without creating a proposal', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />)
    await user.click(screen.getByRole('button', { name: 'More actions for Send to Contoso Ltd' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Reject' }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAccessibleName('Send to Contoso Ltd')
    expect(within(dialog).getByRole('button', { name: 'Reject' })).toHaveAttribute('aria-expanded', 'true')
    expect(dialog).toHaveTextContent('Creates an on-chain rejection at nonce #44.')
    expect(within(dialog).getByRole('button', { name: 'Reject in preview' })).toBeVisible()
    expect(dialog).not.toHaveTextContent('Competing proposal created')
  })
  it('offers reminders instead of signing to a member who does not sign', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { persona: 'member' } } })
    // Nothing on Treasury Main is for a member, so it starts collapsed.
    await user.click(screen.getByRole('button', { name: 'Expand Treasury Main' }))
    const table = within(screen.getByRole('table', { name: 'Pending transactions' }))
    expect(table.queryByRole('button', { name: 'Sign Send to Globex Payroll' })).not.toBeInTheDocument()
    expect(table.getByRole('button', { name: 'Remind Send to Globex Payroll' })).toBeVisible()
    await user.click(table.getByRole('button', { name: 'Open Send to Globex Payroll' }))
    const dialog = within(screen.getByRole('dialog'))
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Send to Globex Payroll')
    expect(screen.getByRole('dialog')).toHaveTextContent("You aren't a signer of Treasury Main.")
    expect(dialog.queryByRole('button', { name: 'Sign' })).not.toBeInTheDocument()
    expect(dialog.getByRole('button', { name: 'Remind' })).toBeVisible()
  })
  it('shows members the same menu, with replace and reject disabled and explained', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { persona: 'member' } } })
    await user.click(screen.getByRole('button', { name: 'Expand Treasury Main' }))
    await user.click(screen.getByRole('button', { name: 'More actions for Send to Contoso Ltd' }))
    const menu = await screen.findAllByRole('menuitem')
    expect(menu.map((item) => item.textContent)).toEqual([
      'Remind signers',
      'Replace with a transfer',
      'Reject',
      'Copy link',
      'Invite signers to workspace',
      'Delete from queue',
    ])
    expect(
      menu.filter((item) => item.getAttribute('aria-disabled') !== 'true').map((item) => item.textContent),
    ).toEqual(['Remind signers', 'Copy link'])
    await user.hover(screen.getByRole('menuitem', { name: 'Reject' }).parentElement!)
    expect(await screen.findByText('Only signers of this Safe can reject it.')).toBeVisible()
  })

  it('keeps dependency inspection available when earlier proposals are filtered out', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />)
    fireEvent.change(screen.getByRole('searchbox', { name: 'Find a proposal' }), {
      target: { value: 'Add signer Priya' },
    })
    expect(screen.queryByRole('button', { name: 'Open Send to Globex Payroll' })).not.toBeInTheDocument()
    await user.click(allPending().getByRole('button', { name: 'Open Add signer Priya' }))
    await expandSections(user)
    const dialog = within(screen.getByRole('dialog'))
    expect(dialog.getByRole('button', { name: 'Conflicts and checks' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('dialog')).toHaveTextContent('Blocked by #42')
    await user.click(dialog.getByRole('button', { name: /^Runs after #42.*Send 48\.5 ETH/ }))
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Send to Globex Payroll')
  })
  it('opens proposal details in the shared side panel', () => {
    render(<PendingQueue />)
    fireEvent.click(allPending().getByRole('button', { name: 'Open Batch · 14 actions' }))
    expect(screen.getByRole('dialog')).toBeVisible()
    expect(screen.getByRole('dialog')).not.toHaveTextContent(
      'No wallet connection, signature or transaction will be requested',
    )
    expect(within(screen.getByRole('dialog')).queryByRole('status')).not.toBeInTheDocument()
  })
  it('keeps rows compact and the note in the review panel', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />)
    expect(rowFor('Send to Globex Payroll')).not.toHaveTextContent('September contractor payouts')
    await user.click(allPending().getByRole('button', { name: 'Open Send to Globex Payroll' }))
    const note = within(screen.getByRole('dialog')).getByRole('button', { name: 'Note' })
    expect(note).toHaveAttribute('aria-expanded', 'false')
    await user.click(note)
    expect(screen.getByRole('dialog')).toHaveTextContent('September contractor payouts')
  })
  it('shows competing proposals in the side panel', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { scenario: 'conflict' } } })
    await user.click(allPending().getByRole('button', { name: 'Open Send to Globex Payroll' }))
    await expandSections(user)
    const dialog = within(screen.getByRole('dialog'))
    expect(dialog.getByRole('button', { name: 'Conflicts and checks' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('dialog')).toHaveTextContent('2 transactions at #42')
    expect(dialog.getByRole('button', { name: /Swap 200,000 USDC → 62\.4 ETH/ })).toBeVisible()
  })
  it('filters the Safes by multiple selected Safe accounts', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />)
    await toggleFilter(user, 'Safe account', 'Ops Payroll', 'Grants')
    expect(safeToggle('Treasury Main')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Open Send to Globex Payroll' })).not.toBeInTheDocument()
    expect(openRows()).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: 'Expand Grants' }))
    expect(openRows()).toHaveLength(3)
    await toggleFilter(user, 'Safe account', 'Ops Payroll')
    expect(safeToggle('Ops Payroll')).not.toBeInTheDocument()
    expect(openRows()).toHaveLength(1)
    expect(safeRows('Grants').getAllByRole('button', { name: /^Open / })).toHaveLength(1)
  })
  it('shows the queue without page tabs', () => {
    render(<PendingQueue />)
    expect(screen.queryByRole('tab', { name: 'History' })).not.toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Messages' })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Queue' })).toBeVisible()
  })
  it('lists each Safe in nonce order and collapses Safes independently', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />)
    expect(safeRows('Ops Payroll').getAllByRole('button', { name: /^Open / })).toHaveLength(2)
    expect(
      safeRows('Treasury Main')
        .getAllByRole('button', { name: /^Open / })
        .map((button) => button.getAttribute('aria-label')),
    ).toEqual(['Open Send to Globex Payroll', 'Open Add signer Priya', 'Open Send to Contoso Ltd'])
    await user.click(screen.getByRole('button', { name: 'Collapse Treasury Main' }))
    expect(safeRows('Treasury Main').queryByRole('button', { name: /^Open / })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Expand Treasury Main' })).toHaveAttribute('aria-expanded', 'false')
    expect(safeRows('Ops Payroll').getAllByRole('button', { name: /^Open / })).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: 'Expand Grants' }))
    expect(safeRows('Grants').getAllByRole('button', { name: /^Open / })).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Expand Treasury Main' })).toBeInTheDocument()
  })
  it('applies account selection and search to Safe groups', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />)
    await toggleFilter(user, 'Safe account', 'Ops Payroll', 'Grants')
    expect(safeToggle('Treasury Main')).not.toBeInTheDocument()
    fireEvent.change(screen.getByRole('searchbox', { name: 'Find a proposal' }), {
      target: { value: 'Batch · 14 actions' },
    })
    expect(openRows()).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Open Batch · 14 actions' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Collapse Ops Payroll' })).toBeVisible()
    expect(safeToggle('Grants')).not.toBeInTheDocument()
  })
  it('labels each Safe band with its name, with details on hover and a summary when collapsed', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />)
    expect(safeBand('Treasury Main')).toHaveTextContent(/^Treasury Main$/)
    await user.hover(within(safeBand('Treasury Main')).getByText('Treasury Main'))
    const tooltip = (await screen.findByText('0x867500000000000000000000000000000000c3d2')).closest(
      '[data-slot="tooltip-content"]',
    )
    expect(tooltip).toHaveTextContent('Threshold3 of 5 signers')
    expect(tooltip).toHaveTextContent('Next nonce#42')
    await user.unhover(within(safeBand('Treasury Main')).getByText('Treasury Main'))
    await user.click(screen.getByRole('button', { name: 'Collapse Treasury Main' }))
    expect(safeBand('Treasury Main')).toHaveTextContent('Treasury Main2 to sign · 1 blocked')
    expect(screen.queryByRole('button', { name: 'Open Send to Globex Payroll' })).not.toBeInTheDocument()
  })
  it('keeps blocker details accessible while the Status filter hides the blocker row', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />)
    await toggleFilter(user, 'Status', 'Blocked')
    expect(allPending().queryByRole('button', { name: 'Open Send to Globex Payroll' })).not.toBeInTheDocument()
    await user.click(allPending().getByRole('button', { name: 'Open Add signer Priya' }))
    await expandSections(user)
    expect(screen.getByRole('dialog')).toHaveTextContent('Send 48.5 ETH · Sign #42 first.')
  })
  it('shows signatures as a count with a gauge, keeping outstanding signers in the tooltip, and the note as an icon', () => {
    const { unmount } = render(<PendingQueue />)
    const row = () => rowFor('Send to Globex Payroll')
    const signatures = () => within(row()).getByRole('button', { name: /^2 of 3 signatures/ })
    expect(signatures()).toHaveTextContent(/^2\/3$/)
    expect(signatures().querySelector('svg path')).toBeInTheDocument()
    expect(row()).not.toHaveTextContent('1 more from')
    expect(row()).not.toHaveTextContent('September contractor payouts')
    expect(within(row()).getByRole('button', { name: 'Note for Send to Globex Payroll' })).toBeVisible()
    unmount()
    setViewport({ wide: false })
    render(<PendingQueue />)
    expect(row()).not.toHaveTextContent('1 more from')
    expect(row()).not.toHaveTextContent('September contractor payouts')
    expect(
      within(row()).getByRole('button', { name: /^2 of 3 signatures, 1 more from you, Jonas, Lena$/ }),
    ).toBeVisible()
  })
  it('shows the full off-chain note on hover and focus and opens review only on activation', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />)
    const note = within(rowFor('Send to Globex Payroll')).getByRole('button', {
      name: 'Note for Send to Globex Payroll',
    })
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
  it('opens with every section collapsed and the signatures open, and resets them for another proposal', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />)
    await user.click(allPending().getByRole('button', { name: 'Open Add signer Priya' }))
    const dialog = () => within(screen.getByRole('dialog'))
    expect(dialog().queryByRole('button', { name: 'Show signatures' })).toBeNull()
    for (const name of ['Summary', 'Conflicts and checks', 'Security', 'Note', 'Transaction data'])
      expect(dialog().getByRole('button', { name })).toHaveAttribute('aria-expanded', 'false')
    await user.click(dialog().getByRole('button', { name: 'Note' }))
    expect(dialog().getByRole('button', { name: 'Note' })).toHaveAttribute('aria-expanded', 'true')
    await user.click(dialog().getByRole('button', { name: 'Next' }))
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Send to Contoso Ltd')
    expect(dialog().getByRole('button', { name: 'Note' })).toHaveAttribute('aria-expanded', 'false')
    await user.click(dialog().getByRole('button', { name: 'Previous' }))
    expect(dialog().getByRole('button', { name: 'Note' })).toHaveAttribute('aria-expanded', 'false')
  })
  it('keeps the signers and actions in the footer', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />)
    await user.click(allPending().getByRole('button', { name: 'Open Batch · 14 actions' }))
    const dialog = within(screen.getByRole('dialog'))
    // The signatures list starts open.
    expect(dialog.getByRole('button', { name: 'Hide signatures' })).toHaveAttribute('aria-expanded', 'true')
    expect(dialog.getByRole('button', { name: 'Copy transaction link' })).toBeVisible()
    const signers = dialog.getAllByRole('listitem').map((item) => item.textContent)
    expect(signers[0]).toMatch(/^Created by Ana/)
    expect(signers[1]).toBe('Ana0x7C21…D2e4Signed')
    await user.click(dialog.getByRole('button', { name: 'Execute' }))
    expect(dialog.getByRole('button', { name: 'Execute in preview' })).toBeVisible()
  })
  it('confirms signing without executing a blocked proposal and keeps its note', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />)
    await user.click(allPending().getByRole('button', { name: 'Open Send to Contoso Ltd' }))
    const dialog = within(screen.getByRole('dialog'))
    await user.click(dialog.getByRole('button', { name: 'Sign' }))
    await user.click(dialog.getByRole('button', { name: 'Sign in preview' }))
    expect(dialog.getByRole('status')).toHaveTextContent('Signature added')
    expect(dialog.queryByRole('button', { name: /Execute/ })).not.toBeInTheDocument()
    expect(dialog.getByRole('button', { name: 'Go to #42' })).toBeVisible()
    await user.click(dialog.getByRole('button', { name: 'Note' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Q4 vendor payment.')
  })
  it('submits after confirmation and shows Processing until it is indexed', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />)
    await user.click(allPending().getByRole('button', { name: 'Sign Send to Globex Payroll' }))
    await user.click(screen.getByRole('button', { name: 'Sign and execute in preview' }))
    expect(screen.getByRole('status')).toHaveTextContent('Send to Globex Payroll submitted in this preview.')
    expect(rowFor('Send to Globex Payroll')).toHaveTextContent(/Processing 0:0\d/)
    expect(rowFor('Add signer Priya')).toHaveTextContent('Blocked by #42')
  })
  it('creates a rejection competitor while retaining the original and its note', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />)
    await user.click(screen.getByRole('button', { name: 'More actions for Send to Contoso Ltd' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Reject' }))
    await user.click(screen.getByRole('button', { name: 'Reject in preview' }))
    await expandSections(user)
    const dialog = within(screen.getByRole('dialog'))
    expect(dialog.getByText('Cancels #44')).toBeVisible()
    expect(dialog.getByRole('status')).toHaveTextContent('Competing proposal created')
    expect(dialog.queryByRole('button', { name: 'Note' })).not.toBeInTheDocument()
    expect(screen.getByRole('dialog')).toHaveTextContent('2 transactions at #44')
    await user.click(dialog.getByRole('button', { name: 'Close' }))
    await user.click(allPending().getByRole('button', { name: 'Open Send to Contoso Ltd' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Note' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Q4 vendor payment.')
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(safeRows('Treasury Main').getAllByRole('button', { name: /^Open / })).toHaveLength(4)
  })
  it('shows signed and outstanding owners in the fraction tooltip without opening details', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />)
    const fraction = within(rowFor('Send to Globex Payroll')).getByRole('button', { name: /^2 of 3 signatures/ })
    await user.hover(fraction)
    const tooltip = (await screen.findByText(/^2 of 3 signed/)).closest('[data-slot="tooltip-content"]')
    expect(tooltip).toHaveTextContent('2 of 3 signed · 1 more from 3 signers')
    expect(tooltip).toHaveTextContent(/Ana.*Max.*You.*Jonas.*Lena/)
    await user.click(fraction)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  it('shows the signature tooltip when the ready signature fraction receives keyboard focus', async () => {
    render(<PendingQueue />)
    const fraction = within(rowFor('Batch · 14 actions')).getByRole('button', {
      name: '2 of 2 signatures, Threshold met',
    })
    act(() => fraction.focus())
    expect(fraction).toHaveFocus()
    expect(await screen.findByText(/^2 of 2 signed/)).toBeVisible()
  })
  it('identifies transfer, swap, and signer-change rows with transaction icons', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { scenario: 'conflict' } } })
    const transfer = rowFor('Send to Globex Payroll')
    const swap = rowFor('Swap USDC → ETH')
    const settings = rowFor('Add signer Priya')
    const icon = (row: HTMLElement, type: string) => within(row).getByRole('img', { name: new RegExp(`^${type}\\.`) })
    expect(icon(transfer, 'Send')).toBeVisible()
    expect(icon(swap, 'Swap')).toBeVisible()
    expect(icon(settings, 'Settings')).toBeVisible()
    expect(within(transfer).getByText('48.5 ETH').closest('td')).toContainElement(icon(transfer, 'Send'))
    expect(within(swap).getByText('200,000 USDC → 62.4 ETH').closest('td')).toContainElement(icon(swap, 'Swap'))
    expect(within(settings).getByText('Add signer Priya').closest('td')).toContainElement(icon(settings, 'Settings'))
    await user.click(icon(transfer, 'Send'))
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Send to Globex Payroll')
  })
  it('uses the selected proposal type in the review panel icon', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { scenario: 'conflict' } } })
    await user.click(allPending().getByRole('button', { name: 'Open Swap USDC → ETH' }))
    await expandSections(user)
    expect(screen.getByRole('dialog').querySelector('svg.lucide-repeat-2')).toBeVisible()
    expect(screen.getByRole('dialog').querySelector('svg.lucide-arrow-up-right')).not.toBeInTheDocument()
  })
  it('keeps one primary button per row and offers replace or reject from more actions', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />)
    const row = rowFor('Send to Contoso Ltd')
    expect(within(row).getAllByRole('button', { name: /^(Sign|Execute|Remind|Go to) / })).toHaveLength(1)
    const primary = within(row).getByRole('button', { name: 'Sign Send to Contoso Ltd' })
    expect(primary).not.toHaveClass('bg-primary')
    fireEvent.mouseMove(row)
    expect(primary).toHaveClass('bg-primary')
    fireEvent.mouseLeave(row)
    expect(primary).not.toHaveClass('bg-primary')
    await user.click(within(row).getByRole('button', { name: 'More actions for Send to Contoso Ltd' }))
    expect((await screen.findAllByRole('menuitem')).map((item) => item.textContent)).toEqual([
      'Remind signers',
      'Replace with a transfer',
      'Reject',
      'Copy link',
      'Invite signers to workspace',
      'Delete from queue',
    ])
    await user.click(screen.getByRole('menuitem', { name: 'Replace with a transfer' }))
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Send to Contoso Ltd')
    expect(screen.getByRole('button', { name: 'Propose replacement in preview' })).toBeVisible()
  })
  it('drops the hover look once the drawer closes over a clicked row', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />)
    const row = rowFor('Send to Contoso Ltd')
    const primary = within(row).getByRole('button', { name: 'Sign Send to Contoso Ltd' })
    fireEvent.mouseMove(row)
    expect(primary).toHaveClass('bg-primary')
    await user.click(within(row).getByRole('button', { name: 'Open Send to Contoso Ltd' }))
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(primary).not.toHaveClass('bg-primary')
    expect(row.className).not.toContain('focus-within')
  })
  it('puts the nonce first, before the transaction and its type icon', () => {
    render(<PendingQueue />)
    const row = rowFor('Send to Contoso Ltd')
    const [nonce, transaction] = within(row).getAllByRole('cell')
    expect(nonce).toHaveTextContent(/^44$/)
    expect(within(nonce).getByRole('button', { name: /^Nonce 44\. / })).toBeInTheDocument()
    expect(transaction).toContainElement(within(row).getByRole('img', { name: /^Send\./ }))
  })
  it('groups a Safe on several networks in one band, with a sub-header per network', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { scenario: '20-safes' } } })
    const marketMaking = await screen.findByRole('button', { name: /^(Collapse|Expand) Market making$/ })
    const subHeaders = marketMaking
      .getAttribute('aria-controls')!
      .split(' ')
      .map((id) => document.getElementById(id)!)
    expect(subHeaders.map((subHeader) => subHeader.textContent)).toEqual([
      expect.stringMatching(/^Ethereum/),
      expect.stringMatching(/^Arbitrum/),
    ])
    expect(screen.getByRole('button', { name: 'Collapse all' })).toHaveTextContent('Collapse 10 Safes')
    // A network logo shows that network only. Clicked again, it shows them all.
    const band = within(marketMaking.closest('tr')!)
    const arbitrum = band.getByRole('button', { name: 'Show Arbitrum' })
    await user.click(arbitrum)
    expect(band.getByRole('button', { name: 'Show Ethereum' })).toHaveAttribute('aria-expanded', 'false')
    expect(arbitrum).toHaveAttribute('aria-expanded', 'true')
    expect(arbitrum).toHaveAccessibleName('Show all 2 networks')
    await user.click(arbitrum)
    expect(band.getByRole('button', { name: 'Show Ethereum' })).toHaveAttribute('aria-expanded', 'true')
    await user.click(screen.getByRole('button', { name: 'Collapse Market making' }))
    subHeaders.forEach((subHeader) => expect(subHeader).not.toBeVisible())
    await user.click(band.getByRole('button', { name: 'Show Ethereum' }))
    expect(subHeaders[0]).toBeVisible()
    expect(band.getByRole('button', { name: 'Show Arbitrum' })).toHaveAttribute('aria-expanded', 'false')
  })
  it('marks the Safenet result once a transaction has a signature', () => {
    render(<PendingQueue />)
    expect(
      within(rowFor('Send to Globex Payroll')).getByRole('button', { name: 'No issues found (Safenet)' }),
    ).toBeVisible()
  })
  it('opens mobile details full screen with the actions in the footer', async () => {
    jest.mocked(useIsMobile).mockReturnValue(true)
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { view: 'table' } } })
    expect(screen.getByRole('searchbox', { name: 'Find a proposal' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Filter/ })).toBeInTheDocument()
    await user.click(allPending().getByRole('button', { name: 'Open Batch · 14 actions' }))
    await expandSections(user)
    expect(screen.getByRole('dialog')).toHaveAttribute('data-mobile-full-screen', 'true')
    const dialog = within(screen.getByRole('dialog'))
    expect(dialog.getByRole('button', { name: 'Summary' })).toHaveAttribute('aria-expanded', 'true')
    expect(dialog.queryByRole('button', { name: 'Expand to full screen' })).not.toBeInTheDocument()
    await user.click(dialog.getByRole('button', { name: 'Execute' }))
    expect(dialog.getByRole('button', { name: 'Execute in preview' })).toBeVisible()
  })
  describe('search names a filter', () => {
    const search = () => screen.getByRole('searchbox', { name: 'Find a proposal' })
    const applied = () => screen.getByRole('group', { name: 'Applied filters' })

    it('turns a network into a filter on Enter and clears the search', async () => {
      const { user } = renderWithUserEvent(<PendingQueue />)
      await user.type(search(), 'ethereum')
      expect(screen.getByRole('button', { name: 'Apply filter, Network: Ethereum' })).toHaveTextContent(
        'Apply filterEnter',
      )
      await user.keyboard('{Enter}')
      expect(applied()).toHaveTextContent('Network:Ethereum')
      expect(search()).toHaveValue('')
    })

    it('adds a status from the start of its name, with the Apply filter button', async () => {
      const { user } = renderWithUserEvent(<PendingQueue />)
      await user.type(search(), 'Signi')
      await user.click(screen.getByRole('button', { name: 'Apply filter, Status: Signing' }))
      expect(applied()).toHaveTextContent('Status:Signing')
    })

    it('adds every network of a Safe from its name', async () => {
      const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { scenario: '20-safes' } } })
      await user.type(search(), 'Treasury{Enter}')
      expect(applied()).toHaveTextContent(/^Safe:TreasuryClear$/)
    })

    it.each(['Waiting', 'Blocked', 'Signing', 'Execute'])('previews the %s status while typing', async (word) => {
      const { user } = renderWithUserEvent(<PendingQueue />)
      const all = openRows().length
      await user.type(search(), word)
      const preview = openRows().length
      expect(preview).toBeGreaterThan(0)
      expect(preview).toBeLessThan(all)
      await user.keyboard('{Enter}')
      expect(openRows()).toHaveLength(preview)
    })

    it('finds a signer by name and offers the Signer filter', async () => {
      const { user } = renderWithUserEvent(<PendingQueue />)
      await user.type(search(), 'Jonas')
      expect(openRows().length).toBeGreaterThan(0)
      await user.keyboard('{Enter}')
      expect(applied()).toHaveTextContent('Signer:Jonas')
      expect(search()).toHaveValue('')
      expect(openRows().length).toBeGreaterThan(0)
    })

    it('clears every filter with Esc, as the Clear tooltip says', async () => {
      const { user } = renderWithUserEvent(<PendingQueue />)
      await user.type(search(), 'ethereum{Enter}')
      await user.hover(within(applied()).getByRole('button', { name: 'Clear' }))
      expect(await screen.findByText('Clear all filters')).toBeVisible()
      await user.click(document.body)
      await user.keyboard('{Escape}')
      expect(screen.queryByRole('group', { name: 'Applied filters' })).not.toBeInTheDocument()
    })

    it('keeps plain text as a search', async () => {
      const { user } = renderWithUserEvent(<PendingQueue />)
      await user.type(search(), 'Globex')
      expect(screen.queryByRole('button', { name: /^Apply filter/ })).not.toBeInTheDocument()
      await user.keyboard('{Enter}')
      expect(screen.queryByRole('group', { name: 'Applied filters' })).not.toBeInTheDocument()
      expect(search()).toHaveValue('Globex')
    })
  })
  it('filters by network and clears all filters back to the default table', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />)
    await toggleFilter(user, 'Network', 'Base', 'Arbitrum')
    expect(safeToggle('Treasury Main')).not.toBeInTheDocument()
    expect(openRows()).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Expand Grants' })).toBeInTheDocument()
    fireEvent.change(screen.getByRole('searchbox', { name: 'Find a proposal' }), { target: { value: 'Fabrikam' } })
    expect(openRows()).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(screen.getByRole('searchbox', { name: 'Find a proposal' })).toHaveValue('')
    expect(screen.queryByRole('group', { name: 'Applied filters' })).not.toBeInTheDocument()
    expect(openRows()).toHaveLength(5)
    expect(screen.getByRole('button', { name: 'Collapse Treasury Main' })).toBeVisible()
  })
  it('shows only the empty state when nothing is pending', () => {
    render(<PendingQueue />, { routerProps: { query: { state: 'empty' } } })
    expect(screen.getByRole('heading', { name: 'Nothing pending' })).toBeVisible()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByText('No matching proposals')).not.toBeInTheDocument()
  })
  describe('edge cases with many competing proposals', () => {
    const heavy = (query: Record<string, string> = {}) => ({
      routerProps: { query: { scenario: 'conflict-heavy', ...query } },
    })

    it('keeps competing proposals together under one conflict sub-header', () => {
      render(<PendingQueue />, heavy())
      const notice = 'Only 1/4 transactions can execute. Once it does, the others become invalid.'
      expect(screen.getAllByText(notice, { exact: false })).toHaveLength(1)
      expect(screen.getByRole('link', { name: 'Learn more' })).toHaveAttribute('target', '_blank')
      const titles = openRows().map((button) => button.getAttribute('aria-label'))
      const competing = [
        'Open Send to Globex Payroll',
        'Open Batch · 46 actions',
        'Open Add signer Marco',
        'Open Change threshold to 2',
      ]
      const first = titles.indexOf(competing[0])
      expect(titles.slice(first, first + 4).sort()).toEqual([...competing].sort())
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
      // The batch total moves to the summary tooltip, so the row stays on one line.
      expect(screen.getByRole('button', { name: 'Open Batch · 14 actions' }).closest('td')).not.toHaveTextContent(
        '32,400 USDC',
      )
    })
    it('reviews and bulk executes one Safe batch from its band', async () => {
      const { user } = renderWithUserEvent(<PendingQueue />, heavy())
      await user.click(screen.getByRole('button', { name: 'Bulk execute 2' }))
      const dialog = within(screen.getByRole('dialog'))
      const payroll = within(dialog.getByRole('region', { name: 'Ops Payroll batch' }))
      expect(payroll.getByText('2 transactions · #17–#18')).toBeVisible()
      expect(payroll.getByText('Batch · 14 actions')).toBeVisible()
      await user.click(dialog.getByRole('button', { name: 'Execute 2 transactions in preview' }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Open Batch · 14 actions' })).not.toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveTextContent('2 transactions executed in this preview across 1 Safe.')
      expect(screen.queryByRole('button', { name: /^Bulk execute/ })).not.toBeInTheDocument()
    })
    it('offers bulk execute on a Safe label without collapsing it', async () => {
      const { user } = renderWithUserEvent(<PendingQueue />, heavy())
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
    const rowTitles = () => openRows().map((button) => button.getAttribute('aria-label')!.replace('Open ', ''))
    const dialog = () => within(screen.getByRole('dialog'))

    it('summarises the transaction in the open Summary section without repeating the amount', async () => {
      const { user } = renderWithUserEvent(<PendingQueue />)
      await user.click(allPending().getByRole('button', { name: 'Open Send to Globex Payroll' }))
      await user.click(dialog().getByRole('button', { name: 'Summary' }))
      expect(dialog().getByRole('button', { name: 'Summary' })).toHaveAttribute('aria-expanded', 'true')
      // The dollar value is a tooltip on the amount, not text.
      expect(dialog().queryByText(/\$155,200/)).toBeNull()
      const text = screen.getByRole('dialog').textContent
      expect(text).toContain('FromTreasury Main')
      expect(text).toContain('ToGlobex Payroll')
      expect(text).toContain('Created byAna')
      expect(text).toContain('Nonce #42 · Ethereum')
      expect(text).toMatch(/Proposed[A-Z][a-z]{2} \d{1,2}, \d{4} - \d{1,2}:\d{2}:\d{2} [AP]M · 3d ago/)
      expect(screen.getByRole('dialog')).not.toHaveTextContent('September contractor payouts')
      expect(dialog().getByRole('button', { name: 'Note' })).toHaveAttribute('aria-expanded', 'false')
      await user.click(dialog().getByRole('button', { name: 'Note' }))
      expect(dialog().getByText(/September contractor payouts/)).toBeVisible()
      expect(screen.getByRole('dialog')).toHaveTextContent(/Ana · 6 Oct, 09:15/)
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
    it('leaves no row highlighted after closing a drawer opened with a click', async () => {
      const { user } = renderWithUserEvent(<PendingQueue />)
      const titles = rowTitles()
      await user.click(allPending().getByRole('button', { name: `Open ${titles[0]}` }))
      await user.click(screen.getByRole('button', { name: 'Close' }))
      expect(document.querySelector('tr[data-cursor]')).toBeNull()
    })
    it('keeps the J/K cursor on its row after closing a drawer opened with Enter', async () => {
      const { user } = renderWithUserEvent(<PendingQueue />)
      const titles = rowTitles()
      await user.keyboard('j{Enter}{Escape}')
      expect(
        within(document.querySelector('tr[data-cursor]') as HTMLElement).getByRole('button', {
          name: `Open ${titles[0]}`,
        }),
      ).toBeInTheDocument()
    })
    it('shows the position only in full screen, next to the drawer controls', async () => {
      const { user } = renderWithUserEvent(<PendingQueue />)
      const titles = rowTitles()
      await user.click(allPending().getByRole('button', { name: `Open ${titles[0]}` }))
      expect(dialog().getByText(`1 of ${titles.length}`)).toHaveClass('sr-only')
      await user.click(dialog().getByRole('button', { name: 'Expand to full screen' }))
      expect(dialog().getByText(`1 of ${titles.length}`)).not.toHaveClass('sr-only')
    })
    it('titles the drawer with the Safe and nonce, and puts the type and action in Summary', async () => {
      const { user } = renderWithUserEvent(<PendingQueue />)
      await user.click(allPending().getByRole('button', { name: 'Open Send to Globex Payroll' }))
      await user.click(dialog().getByRole('button', { name: 'Summary' }))
      expect(dialog().getByRole('heading', { name: 'Treasury Main' })).toBeVisible()
      expect(screen.getByRole('dialog')).toHaveTextContent('Nonce #42 · Ethereum')
      expect(screen.getByRole('dialog')).toHaveTextContent('TypeSendAction48.5 ETH')
      expect(screen.getByRole('dialog')).toHaveAccessibleName('Send to Globex Payroll')
      await user.click(screen.getByRole('button', { name: 'Close' }))
      await user.click(allPending().getByRole('button', { name: 'Open Batch · 14 actions' }))
      await user.click(dialog().getByRole('button', { name: 'Summary' }))
      expect(screen.getByRole('dialog')).toHaveTextContent('TypeBatchAction14 actions')
    })
    it('keeps every section expanded while stepping after Expand all, and resets on a fresh open', async () => {
      const { user } = renderWithUserEvent(<PendingQueue />)
      const titles = rowTitles()
      await user.click(allPending().getByRole('button', { name: `Open ${titles[0]}` }))
      await user.click(dialog().getByRole('button', { name: 'Expand all sections' }))
      for (const name of ['Summary', 'Security', 'Note', 'Transaction data'])
        expect(dialog().getByRole('button', { name })).toHaveAttribute('aria-expanded', 'true')
      await user.click(dialog().getByRole('button', { name: 'Next' }))
      expect(screen.getByRole('dialog')).toHaveAccessibleName(titles[1])
      expect(dialog().getByRole('button', { name: 'Collapse all sections' })).toBeVisible()
      for (const name of ['Security', 'Transaction data'])
        expect(dialog().getByRole('button', { name })).toHaveAttribute('aria-expanded', 'true')
      await user.click(screen.getByRole('button', { name: 'Close' }))
      await user.click(allPending().getByRole('button', { name: `Open ${titles[1]}` }))
      expect(dialog().getByRole('button', { name: 'Expand all sections' })).toBeVisible()
      expect(dialog().getByRole('button', { name: 'Security' })).toHaveAttribute('aria-expanded', 'false')
    })
    it('steps through transactions in table order with buttons and J/K', async () => {
      const { user } = renderWithUserEvent(<PendingQueue />)
      const titles = rowTitles()
      await user.click(allPending().getByRole('button', { name: `Open ${titles[0]}` }))
      expect(dialog().getByText(`1 of ${titles.length}`)).toBeInTheDocument()
      expect(dialog().getByRole('button', { name: 'Previous' })).toBeDisabled()
      await user.click(dialog().getByRole('button', { name: 'Next' }))
      expect(screen.getByRole('dialog')).toHaveAccessibleName(titles[1])
      await user.keyboard('j')
      expect(screen.getByRole('dialog')).toHaveAccessibleName(titles[2])
      await user.keyboard('k')
      expect(screen.getByRole('dialog')).toHaveAccessibleName(titles[1])
      for (let index = 2; index < titles.length; index++) await user.keyboard('j')
      expect(screen.getByRole('dialog')).toHaveAccessibleName(titles[titles.length - 1])
      expect(dialog().getByRole('button', { name: 'Next' })).toBeDisabled()
    })
    it('skips collapsed Safes and ignores J while typing', async () => {
      const { user } = renderWithUserEvent(<PendingQueue />)
      await user.click(screen.getByRole('button', { name: 'Collapse Treasury Main' }))
      const titles = rowTitles()
      expect(titles).toEqual(['Batch · 14 actions', 'Send to Fabrikam'])
      await user.click(screen.getByRole('button', { name: 'More actions for Send to Fabrikam' }))
      await user.click(await screen.findByRole('menuitem', { name: 'Replace with a transfer' }))
      expect(dialog().getByText(`2 of ${titles.length}`)).toBeInTheDocument()
      const field = dialog().getByRole('textbox', { name: 'Recipient' })
      await user.click(field)
      await user.keyboard('j')
      expect((field as HTMLInputElement).value.endsWith('j')).toBe(true)
      expect(screen.getByRole('dialog')).toHaveAccessibleName('Send to Fabrikam')
    })
    it('disables navigation for a proposal opened outside the visible list', async () => {
      const { user } = renderWithUserEvent(<PendingQueue />)
      fireEvent.change(screen.getByRole('searchbox', { name: 'Find a proposal' }), {
        target: { value: 'Add signer Priya' },
      })
      await user.click(allPending().getByRole('button', { name: 'Open Add signer Priya' }))
      await expandSections(user)
      await user.click(dialog().getByRole('button', { name: /^Runs after #42.*Send 48\.5 ETH/ }))
      expect(screen.getByRole('dialog')).toHaveAccessibleName('Send to Globex Payroll')
      expect(dialog().getByRole('button', { name: 'Previous' })).toBeDisabled()
      expect(dialog().getByRole('button', { name: 'Next' })).toBeDisabled()
      expect(dialog().queryByText(/^\d+ of \d+$/)).not.toBeInTheDocument()
    })
  })
  it('filters by transaction type and shows it as an applied filter', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { scenario: 'conflict-heavy' } } })
    await toggleFilter(user, 'Type', 'Batch')
    expect(openRows().map((button) => button.getAttribute('aria-label'))).toEqual([
      'Open Batch · 46 actions',
      'Open Batch · 14 actions',
    ])
    expect(screen.getByRole('button', { name: /^Filter/ })).toHaveAccessibleName('Filter')
    expect(screen.getByRole('group', { name: 'Applied filters' })).toHaveTextContent('Type:Batch')
    await openFilter(user, 'Type')
    expect(await screen.findByRole('menuitem', { name: 'Type' })).toHaveTextContent('Type1')
    await closeMenus(user)
    await user.click(
      within(screen.getByRole('group', { name: 'Applied filters' })).getByRole('button', { name: 'Remove' }),
    )
    expect(screen.queryByRole('group', { name: 'Applied filters' })).not.toBeInTheDocument()
    expect(openRows()).toHaveLength(8)
    expect(screen.getByRole('button', { name: 'Expand Grants' })).toBeInTheDocument()
  })
  it.each([undefined, 'flat', 'cards', 'table'])(
    'opens the typical 8-Safe team as the Status list, partly loaded, whatever the old option link says (%s)',
    (option) => {
      localStorage.clear()
      baseRender(<PendingQueue />, option ? { routerProps: { query: { option } } } : undefined)
      expect(screen.queryByRole('tablist', { name: 'Design direction' })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Group by Status' })).toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: 'Scenario' })).toHaveTextContent('8 Safes · typical')
      expect(screen.getByRole('combobox', { name: 'State' })).toHaveTextContent('Partial loading')
      expect(screen.getByRole('button', { name: '4 Safes not loaded' })).toBeInTheDocument()
      expect(screen.getByText('Logged in to Hypernative')).toBeInTheDocument()
      expect(
        allPending()
          .getAllByRole('row')
          .filter((row) => /^\d+/.test(row.textContent ?? '')),
      ).toHaveLength(8)
      // Nine transactions on eight nonces: two options at Grants #9 conflict
      expect(allPending().getAllByText('Conflicting')).toHaveLength(1)
      expect(allPending().getAllByRole('button', { name: /^Note for / })).toHaveLength(4)
      // Recipients missing from the address book show a short address
      expect(allPending().getAllByText(/^0x[0-9a-f]{4}…[0-9a-f]{4}$/).length).toBeGreaterThanOrEqual(2)
    },
  )
  it('filters by signer, with no Proposal date section', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />)
    await openFilter(user, 'Signer')
    const [first] = await screen.findAllByRole('menuitemcheckbox')
    const name = first.textContent!.replace(/\d+$/, '').replace(/ \(.*\)$/, '')
    const count = Number(first.textContent?.match(/\d+$/)?.[0])
    fireEvent.click(first)
    await closeMenus(user)
    expect(screen.getByRole('group', { name: 'Applied filters' })).toHaveTextContent(`Signer:${name}`)
    expect(allPending().getAllByRole('button', { name: /^\d+ of \d+ signatures/ })).toHaveLength(count)
    await user.click(screen.getByRole('button', { name: /^Filter/ }))
    expect(screen.queryByRole('menuitem', { name: 'Proposal date' })).not.toBeInTheDocument()
  })
  it('shows a stuck execution, locks its conflict, and finishes after Speed up', async () => {
    jest.useFakeTimers()
    try {
      render(<PendingQueue />, { routerProps: { query: { state: 'executing' } } })
      const batch = rowFor('Batch · 14 actions')
      expect(batch).toHaveTextContent(/Processing 1:1\d/)
      expect(rowFor('On-chain rejection')).toHaveTextContent('Locked')
      expect(within(rowFor('On-chain rejection')).getByRole('button', { name: /locked$/ })).toBeDisabled()
      expect(screen.getByRole('button', { name: /1 executing/ })).toBeVisible()
      fireEvent.click(within(batch).getByRole('button', { name: 'Speed up Batch · 14 actions' }))
      await act(async () => {
        jest.advanceTimersByTime(5_000)
      })
      expect(rowFor('Batch · 14 actions')).toHaveTextContent('Indexing')
      await act(async () => {
        jest.advanceTimersByTime(5_000)
      })
      expect(allPending().queryByRole('button', { name: 'Open Batch · 14 actions' })).toBeNull()
      expect(allPending().queryByRole('button', { name: 'Open On-chain rejection' })).toBeNull()
      expect(screen.getByRole('status')).toHaveTextContent('now invalid')
    } finally {
      jest.useRealTimers()
    }
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
    expect(openRows()).toHaveLength(3)
  })
  describe('realistic scenario', () => {
    const renderRealistic = () =>
      renderWithUserEvent(<PendingQueue />, { routerProps: { query: { scenario: 'realistic' } } })

    it('shows the Safe App in place of the type, and contract logos or the code icon', async () => {
      const { user } = renderRealistic()
      await user.click(screen.getByRole('button', { name: 'Expand Grants' }))
      const app = rowFor('Call setPreSignature on GPv2Settlement')
      expect(within(app).getByRole('img', { name: /^CoW Swap\./ })).toBeVisible()
      expect(within(app).queryByText('Contract')).toBeNull()
      const proxy = rowFor('Call withdraw on InitializableImmutableAdminUpgradeabilityProxy')
      expect(within(proxy).getByText('withdraw')).toBeVisible()
      expect(within(proxy).getByText('InitializableImmutableAdminUpgradeabilityProxy')).toHaveClass('truncate')
      expect(within(rowFor('Call approve on Aave v3 UNI')).getByText('Contract')).toBeVisible()
    })
    it('shows the status words and an untrusted transaction flag', async () => {
      const { user } = renderRealistic()
      expect(rowFor('Add signer Priya')).toHaveTextContent('Blocked by #42')
      expect(rowFor('Send to Globex Payroll')).toHaveTextContent(/Signing|Ready to sign/)
      expect(rowFor('Send to Globex Payroll')).not.toHaveTextContent('Needs your signature')
      await user.click(screen.getByRole('button', { name: 'Expand Grants' }))
      const [grant, unsigned] = allPending()
        .getAllByRole('button', { name: 'Open Send to Tailspin Labs' })
        .map((button) => button.closest('tr')!)
      expect(grant).toHaveTextContent(/Signing|Ready to sign/)
      expect(within(grant).queryByText('Untrusted transaction')).toBeNull()
      expect(unsigned).toHaveTextContent('Blocked by #8')
      expect(within(unsigned).getByText('Untrusted transaction')).toBeVisible()
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
      expect(rowFor('Bridge ETH to Unknown network')).toHaveTextContent('Bridge0.04 ETH')
    })
    it('filters by a Status option and shows a count on each', async () => {
      const { user } = renderRealistic()
      await openFilter(user, 'Status')
      const blocked = await screen.findByRole('menuitemcheckbox', { name: /^Blocked/ })
      const count = Number(blocked.textContent?.replace(/\D/g, ''))
      expect(count).toBeGreaterThan(0)
      fireEvent.click(blocked)
      expect(blocked).toHaveAttribute('aria-checked', 'true')
      await closeMenus(user)
      expect(openRows()).toHaveLength(count)
      // An expired order still counts, as in production.
      expect(allPending().getAllByText(/^(Blocked by #\d+|Expired)$/).length).toBeGreaterThan(0)
      expect(allPending().queryAllByText(/^(Ready to execute|Ready to sign|Signing)$/)).toHaveLength(0)
      await openFilter(user, 'Status')
      fireEvent.click(await screen.findByRole('menuitemcheckbox', { name: /^Blocked/ }))
      await closeMenus(user)
      expect(openRows().length).toBeGreaterThan(count)
    })
    it('leads with the warnings, then the summary and security checks', async () => {
      const { user } = renderRealistic()
      await user.click(allPending().getByRole('button', { name: 'Open Bridge ETH to Unknown network' }))
      await expandSections(user)
      const dialog = within(screen.getByRole('dialog'))
      expect(dialog.getByRole('alert')).toHaveTextContent('Unknown network')
      expect(dialog.getByRole('alert').compareDocumentPosition(dialog.getByRole('button', { name: 'Summary' }))).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      )
      expect(screen.getByRole('dialog')).toHaveTextContent('Unknown network · 999')
      expect(dialog.getByRole('button', { name: 'Security' })).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByRole('dialog')).toHaveTextContent('Issues found')
      await user.click(dialog.getByRole('button', { name: 'Next' }))
      expect(screen.getByRole('dialog')).toHaveAccessibleName('Call execute on Uniswap Universal Router')
      expect(dialog.queryByRole('alert')).toBeNull()
    })
    it('lists who has signed in the footer, including you', async () => {
      const { user } = renderRealistic()
      await user.click(allPending().getByRole('button', { name: 'Open Send to Globex Payroll' }))
      const dialog = within(screen.getByRole('dialog'))
      expect(screen.getByRole('dialog')).toHaveTextContent('2/3 Signatures')
      const rows = dialog.getAllByRole('listitem')
      expect(rows[3]).toHaveTextContent(/^Dev \(you\).*Your signature required$/)
      expect(dialog.getByRole('button', { name: 'Copy transaction link' })).toBeVisible()
    })
  })
  it('filters by signer from the Filter menu, Lena first, and offers to remind her', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { scenario: '50-safes' } } })
    await openFilter(user, 'Signer')
    const [lena] = await screen.findAllByRole('menuitemcheckbox')
    expect(lena).toHaveTextContent(/^Lena\d+$/)
    const count = Number(lena.textContent?.replace(/\D/g, ''))
    fireEvent.click(lena)
    await closeMenus(user)
    const applied = within(screen.getByRole('group', { name: 'Applied filters' }))
    expect(screen.getByRole('group', { name: 'Applied filters' })).toHaveTextContent('Signer:Lena')
    expect(applied.getByRole('button', { name: 'Remind Lena' })).toBeVisible()
    const signatures = allPending().getAllByRole('button', { name: /^\d+ of \d+ signatures/ })
    expect(signatures).toHaveLength(count)
    for (const fraction of signatures) expect(fraction.getAttribute('aria-label')).toContain('Lena')
  })
})

describe('Group by', () => {
  beforeEach(() => localStorage.clear())
  const flat = {}
  const headings = () =>
    allPending()
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent)
  const columnTitles = () => screen.getAllByRole('columnheader').map((header) => header.textContent)

  it('opens as the Status list: one table, no group rows', () => {
    render(<PendingQueue />, flat)
    expect(screen.getAllByRole('table')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Group by Status' })).toHaveTextContent('Group by: Status')
    expect(allPending().queryAllByRole('heading', { level: 3 })).toHaveLength(0)
    expect(screen.queryByRole('button', { name: /^(Collapse|Expand) all/ })).toBeNull()
    expect(columnTitles().slice(0, 3)).toEqual(['Nonce', 'Transaction', 'To'])
    expect(screen.queryByRole('columnheader', { name: 'Safe' })).toBeNull()
  })

  it('sorts the Status list most urgent first: your actions, then the rest, with blocked rows last', () => {
    render(<PendingQueue />, { routerProps: { query: { scenario: '20-safes' } } })
    const rows = allPending()
      .getAllByRole('row')
      // Conflict header rows also start with the nonce
      .filter((row) => /^\d+/.test(row.textContent ?? '') && !/^\d+Conflicting/.test(row.textContent ?? ''))
    const yours = rows.map((row) => !!within(row).queryByRole('button', { name: /^(Sign|Execute)/ }))
    const blockedOnly = rows.map((row, index) => !yours[index] && /Blocked by #|Expired/.test(row.textContent ?? ''))
    expect(yours[0]).toBe(true)
    expect(yours.lastIndexOf(true)).toBeLessThan(yours.indexOf(false))
    const others = rows.map((_, index) => !yours[index] && !blockedOnly[index])
    expect(blockedOnly.indexOf(true)).toBeGreaterThan(others.lastIndexOf(true))
  })

  it('offers Status, Up next, Safe and Network, with Status chosen, and goes back to Status', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, flat)
    await user.click(screen.getByRole('button', { name: /^Group by/ }))
    const choices = await screen.findAllByRole('menuitemradio')
    expect(choices.map((choice) => choice.textContent)).toEqual([
      expect.stringMatching(/^Status/),
      expect.stringMatching(/^Up next/),
      expect.stringMatching(/^Safe/),
      expect.stringMatching(/^Network/),
    ])
    expect(choices[0]).toHaveAttribute('aria-checked', 'true')
    await user.click(choices[3])
    expect(headings().length).toBeGreaterThan(0)
    await groupBy(user, /^Status/)
    expect(allPending().queryAllByRole('heading', { level: 3 })).toHaveLength(0)
  })

  it('collapses every group from the header, and opens them again', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, flat)
    await groupBy(user, /^Network/)
    await user.click(screen.getByRole('button', { name: 'Collapse all' }))
    expect(allPending().queryAllByRole('button', { name: /^Open / })).toHaveLength(0)
    await user.click(screen.getByRole('button', { name: 'Expand all' }))
    expect(allPending().getAllByRole('button', { name: /^Open / }).length).toBeGreaterThan(0)
  })

  it('offers bulk execute only on each Safe row, grouped by Safe', async () => {
    const heavyFlat = { routerProps: { query: { scenario: 'conflict-heavy' } } }
    const { user } = renderWithUserEvent(<PendingQueue />, heavyFlat)
    expect(screen.queryByRole('button', { name: /^Bulk execute/ })).toBeNull()
    await groupBy(user, /^Safe/)
    await user.click(screen.getByRole('button', { name: 'Bulk execute 2' }))
    const dialog = within(screen.getByRole('dialog'))
    expect(dialog.getByRole('region', { name: 'Ops Payroll batch' })).toBeVisible()
    expect(screen.queryByRole('button', { name: /^Bulk execute \d+ transactions/ })).toBeNull()
  })

  it('adds a search field to long filter lists, such as signers', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, {
      routerProps: { query: { scenario: '20-safes' } },
    })
    await openFilter(user, 'Signer')
    const search = await screen.findByRole('searchbox', { name: 'Search signers' })
    const before = screen.getAllByRole('menuitemcheckbox').length
    fireEvent.change(search, { target: { value: 'zzz' } })
    expect(screen.getByText('No signers match')).toBeInTheDocument()
    fireEvent.change(search, { target: { value: '' } })
    expect(screen.getAllByRole('menuitemcheckbox')).toHaveLength(before)
  })

  it('keeps Status and Safe inside the Filter menu, with no standalone buttons', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, flat)
    expect(screen.queryByRole('button', { name: /^Status/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Safe/ })).toBeNull()
    await user.click(screen.getByRole('button', { name: /^Filter/ }))
    expect(await screen.findByRole('menuitem', { name: /^Status/ })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /^Safe account/ })).toBeInTheDocument()
  })

  it('remembers the grouping', async () => {
    const { user, unmount } = renderWithUserEvent(<PendingQueue />, flat)
    await groupBy(user, /^Network/)
    unmount()
    render(<PendingQueue />, flat)
    expect(screen.getByRole('button', { name: 'Group by Network' })).toBeInTheDocument()
  })

  it('grouped by Safe, shows the Safe table with Nonce first and a sub-header per network', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, {
      routerProps: { query: { scenario: '20-safes' } },
    })
    await groupBy(user, /^Safe/)
    expect(columnTitles()[0]).toBe('Nonce')
    const marketMaking = await screen.findByRole('button', { name: /^(Collapse|Expand) Market making$/ })
    const subHeaders = marketMaking
      .getAttribute('aria-controls')!
      .split(' ')
      .map((id) => document.getElementById(id)!)
    expect(subHeaders.map((subHeader) => subHeader.textContent)).toEqual([
      expect.stringMatching(/^Ethereum/),
      expect.stringMatching(/^Arbitrum/),
    ])
  })

  it('shows the Safenet mark next to the signatures in every grouping', () => {
    render(<PendingQueue />, flat)
    expect(allPending().getAllByRole('button', { name: /\(Safenet\)$/ }).length).toBeGreaterThan(0)
  })

  it('groups by next nonce, then the rest of the queue, with the network in each Safe tag', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, flat)
    await groupBy(user, /^Up next/)
    expect(headings().map((heading) => heading?.replace(/\d+$/, ''))).toEqual(['Next in line', 'Behind it'])
    expect(screen.queryByRole('columnheader', { name: 'Network' })).toBeNull()
  })
})

describe('rows in every grouping', () => {
  beforeEach(() => localStorage.clear())
  const columnTitles = () => screen.getAllByRole('columnheader').map((header) => header.textContent)

  it('keeps the same columns in every grouping, Nonce first', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />)
    // The last header cell also holds Collapse all, whose label names the groups.
    const flat = columnTitles().slice(0, -1)
    expect(flat.slice(0, 4)).toEqual(['Nonce', 'Transaction', 'To', 'Proposed'])
    // The network sits in the Safe tag, so there's no Network column.
    expect(allPending().getAllByAltText(/^on (Ethereum|Base|Arbitrum)$/).length).toBeGreaterThan(0)
    for (const name of [/^Safe/, /^Network/, /^Up next/]) {
      await groupBy(user, name)
      expect(columnTitles().slice(0, -1)).toEqual(flat)
    }
    await groupBy(user, /^Network/)
    expect(screen.getByRole('button', { name: 'Collapse Ethereum' })).toBeInTheDocument()
  })

  it('names the earlier nonce only on rows behind one', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />)
    await groupBy(user, /^Up next/)
    const next = document.getElementById('rows-next')!
    const behind = document.getElementById('rows-queue')!
    expect(within(next).getAllByText(/^(Ready to execute|Ready to sign|Signing)$/).length).toBeGreaterThan(0)
    expect(within(next).queryByText(/Blocked by #/)).toBeNull()
    expect(within(behind).getAllByText(/^Blocked by #\d+$/).length).toBeGreaterThan(0)
  })

  it('reads to, via and on as plain words between the amount and the other party', () => {
    render(<PendingQueue />)
    expect(allPending().getAllByText(/^(to|via|on)$/).length).toBeGreaterThan(0)
    // The To column header stays for screen readers.
    expect(allPending().queryAllByText(/^(To|Via|On)$/, { ignore: '.sr-only' })).toHaveLength(0)
  })

  it('on a phone, shows rows with Nonce, Transaction and the action', () => {
    jest.mocked(useIsMobile).mockReturnValue(true)
    render(<PendingQueue />, { routerProps: { query: { view: 'table' } } })
    expect(columnTitles().map((title) => title?.replace(/Collapse.*|Expand.*/, ''))).toEqual([
      'Nonce',
      'Transaction',
      'Action',
    ])
    expect(allPending().getAllByRole('button', { name: /^(Sign|Execute)/ }).length).toBeGreaterThan(0)
  })

  it('marks rows a proposer created next to 0 signatures, and shows Awaiting parent when a signer Safe approves it', () => {
    render(<PendingQueue />, { routerProps: { query: { scenario: '5-safes' } } })
    expect(allPending().getAllByRole('button', { name: /^0 of \d+ signatures/ }).length).toBeGreaterThan(0)
    expect(allPending().getAllByLabelText('Created by a proposer').length).toBeGreaterThan(0)
    expect(allPending().queryByText('Proposal')).toBeNull()
    expect(allPending().getByLabelText(/^Awaiting parent signature\. Ops Payroll #20$/)).toBeInTheDocument()
  })

  it('starts each transaction with its Safe as a tag, in place of the Safe column', () => {
    render(<PendingQueue />)
    expect(screen.queryByRole('columnheader', { name: 'Safe' })).toBeNull()
    const [firstRow] = allPending().getAllByRole('button', { name: /^Open / })
    expect(firstRow.textContent).toMatch(/^(Treasury Main|Ops Payroll|Market Making|Security Council|Grants)/)
  })

  it('draws conflicting options under one nonce in every grouping', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { scenario: '20-safes' } } })
    expect(allPending().getAllByRole('img', { name: /^Option 1 of \d+ at nonce/ }).length).toBeGreaterThan(0)
    for (const name of [/^Safe/, /^Network/, /^Up next/]) {
      await groupBy(user, name)
      expect(allPending().getAllByRole('img', { name: /^Option 1 of \d+ at nonce/ }).length).toBeGreaterThan(0)
    }
  })
})

describe('Safes that fail to load', () => {
  const partial = (query: Record<string, string>) => ({
    routerProps: { query: { state: 'partial', scenario: '5-safes', ...query } },
  })
  beforeEach(() => localStorage.clear())

  it('shows a toolbar chip instead of a banner, listing failed Safes by network, never undeployed ones', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, partial({ failed: '3', undeployed: '1' }))
    expect(screen.queryAllByText(/didn’t load$/)).toHaveLength(0)
    await user.click(screen.getByRole('button', { name: '3 Safes not loaded' }))
    const failed = await screen.findByRole('region', { name: '3 Safes not loaded' })
    expect(within(failed).getByRole('button', { name: 'Reload Market Making on Ethereum' })).toBeInTheDocument()
    expect(within(failed).getByText('Grants')).toBeInTheDocument()
    expect(within(failed).queryByText('Ops Payroll')).toBeNull()
    expect(screen.queryByText('Not deployed yet')).toBeNull()
  })

  it('explains the 100-Safe limit, with no Reload, when that is why Safes are left out', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, partial({ failed: '3', reason: 'limit' }))
    await user.click(screen.getByRole('button', { name: '3 Safes not loaded' }))
    const failed = await screen.findByRole('region', { name: '3 Safes not loaded' })
    expect(within(failed).getByText(/covers up to 100 Safe accounts/)).toBeInTheDocument()
    expect(within(failed).queryByRole('button', { name: /^Reload/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Reload all/ })).toBeNull()
  })

  it('puts failed Safes at the top when grouped by Safe', () => {
    groupBySafe()
    render(<PendingQueue />, partial({ failed: '3' }))
    const firstBand = allPending()
      .getAllByRole('row')
      .find((row) => /Couldn’t load|Treasury Main|Ops Payroll/.test(row.textContent ?? ''))
    expect(firstBand).toHaveTextContent('Couldn’t load')
  })

  it('keeps a band with Reload for each failed Safe when grouped by Safe', async () => {
    jest.useFakeTimers()
    groupBySafe()
    render(<PendingQueue />, partial({ failed: '3' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reload Grants on Arbitrum' }))
    act(() => jest.advanceTimersByTime(1000))
    expect(screen.queryByRole('button', { name: 'Reload Grants on Arbitrum' })).toBeNull()
    expect(screen.getByRole('button', { name: '2 Safes not loaded' })).toBeInTheDocument()
    jest.useRealTimers()
  })

  it('explains an empty page when no Safe loads, and Reload brings the queue back', () => {
    jest.useFakeTimers()
    render(<PendingQueue />, partial({ failed: 'all' }))
    expect(screen.getByRole('heading', { name: 'We couldn’t load your pending transactions' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^Reload all/ }))
    act(() => jest.advanceTimersByTime(1000))
    expect(screen.queryByRole('heading', { name: 'We couldn’t load your pending transactions' })).toBeNull()
    jest.useRealTimers()
  })
})

describe('production queue states', () => {
  const state = (value: string) => ({ routerProps: { query: { state: value, scenario: '5-safes' } } })
  beforeEach(() => localStorage.clear())

  it('says how much of a capped queue it shows, until a filter narrows it', () => {
    render(<PendingQueue />, state('capped'))
    expect(screen.getByText(/^Showing \d+ of \d+ pending transactions\.$/)).toBeInTheDocument()
    fireEvent.change(screen.getByRole('searchbox', { name: 'Find a proposal' }), { target: { value: 'Treasury' } })
    expect(screen.queryByText(/^Showing \d+ of \d+ pending transactions\.$/)).toBeNull()
  })

  it('adds a new proposal on refresh and says it needs your confirmation', () => {
    jest.useFakeTimers()
    render(<PendingQueue />, state('incoming'))
    expect(screen.queryByText('A transaction requires your confirmation.')).toBeNull()
    act(() => jest.advanceTimersByTime(4100))
    expect(screen.getByRole('status')).toHaveTextContent('A transaction requires your confirmation.')
    expect(allPending().getAllByText('12,500 USDC').length).toBeGreaterThan(0)
    jest.useRealTimers()
  })

  it('caps the search at 100 characters, as production does', () => {
    render(<PendingQueue />, state('normal'))
    expect(screen.getByRole('searchbox', { name: 'Find a proposal' })).toHaveAttribute('maxLength', '100')
  })
})

describe('without a wallet', () => {
  beforeEach(() => localStorage.clear())
  const statuses = () =>
    allPending()
      .getAllByText(/^(Ready to execute|Ready to sign|Signing|Blocked by #\d+|Expired)$/)
      .map((chip) => chip.textContent)

  it('shows the same statuses, asks nobody to sign, and offers to connect', () => {
    const { unmount } = render(<PendingQueue />)
    const connected = statuses()
    unmount()
    render(<PendingQueue />, { routerProps: { query: { wallet: 'none' } } })
    expect(statuses().sort()).toEqual(connected.sort())
    expect(allPending().queryAllByRole('button', { name: /^Sign/ })).toHaveLength(0)
    expect(screen.getByRole('button', { name: 'Connect wallet' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'No wallet' })).toHaveAttribute('aria-selected', 'true')
  })
})

describe('aligned Transaction column', () => {
  beforeEach(() => localStorage.clear())
  // The type tag's slot in each row: fixed when aligned, the tag's own width otherwise.
  const typeSlots = () => openRows().map((row) => within(row).getAllByRole('img').at(-1)!.parentElement!)

  it.each(['1', '2'])('M%s: gives every Safe tag and type tag a fixed width', (m) => {
    render(<PendingQueue />, { routerProps: { query: { m, align: 'fixed' } } })
    expect(screen.getByRole('tab', { name: 'Aligned' })).toHaveAttribute('aria-selected', 'true')
    for (const slot of typeSlots()) expect(slot).toHaveClass('w-26')
    for (const row of openRows()) {
      expect(within(row).getByRole('img', { name: /^on / }).closest('.w-36')).not.toBeNull()
    }
  })

  it('puts the age after the other party, in To, in place of the Proposed column', () => {
    render(<PendingQueue />, { routerProps: { query: { align: 'fixed' } } })
    const titles = screen.getAllByRole('columnheader').map((header) => header.textContent)
    expect(titles).not.toContain('Proposed')
    const toColumn = titles.indexOf('To')
    for (const row of openRows()) {
      const cells = within(row.closest('tr')!).getAllByRole('cell')
      expect(within(cells[toColumn]).getByLabelText(/^Proposed /)).toBeInTheDocument()
    }
  })

  it('keeps the flowing layout by default', () => {
    render(<PendingQueue />)
    expect(screen.getByRole('tab', { name: 'Flowing' })).toHaveAttribute('aria-selected', 'true')
    for (const slot of typeSlots()) expect(slot).not.toHaveClass('w-26')
  })
})

describe('mobile compact view', () => {
  beforeEach(() => localStorage.clear())
  const compactList = () => screen.queryByRole('list', { name: 'Pending transactions' })
  const STATUS = /^(Ready to execute|Ready to sign|Signing|Blocked by #\d+|Expired)$/

  it('shows only at phone width', () => {
    render(<PendingQueue />)
    expect(compactList()).not.toBeInTheDocument()
    expect(screen.queryByRole('tablist', { name: 'Phone layout' })).not.toBeInTheDocument()
  })

  it('lists every transaction with its Safe, signatures and status, and no table', () => {
    const { unmount } = render(<PendingQueue />)
    const rowCount = openRows().length
    unmount()
    jest.mocked(useIsMobile).mockReturnValue(true)
    render(<PendingQueue />)
    const rows = within(compactList()!).getAllByRole('listitem')
    expect(rows).toHaveLength(rowCount)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Compact' })).toHaveAttribute('aria-selected', 'true')
    for (const row of rows) {
      expect(within(row).getByRole('img', { name: /^on / })).toBeInTheDocument()
      expect(within(row).getByLabelText(/^\d+ of \d+ signatures$/)).toBeInTheDocument()
    }
  })

  it('M2: rows show every status and a chevron that opens the drawer, and the buttons at the right edge', async () => {
    jest.mocked(useIsMobile).mockReturnValue(true)
    const { user } = renderWithUserEvent(<PendingQueue />)
    const list = compactList()!
    const scroller = list.parentElement!
    const rows = within(list).getAllByRole('listitem')
    expect(within(list).getAllByText(STATUS)).toHaveLength(rows.length)
    // Scrolled to the start of a list wider than the screen: chevrons only.
    Object.defineProperty(scroller, 'scrollWidth', { configurable: true, value: 700 })
    Object.defineProperty(scroller, 'clientWidth', { configurable: true, value: 340 })
    fireEvent.scroll(scroller)
    expect(within(list).getAllByRole('button')).toHaveLength(rows.length)
    expect(within(list).getAllByRole('button', { name: /^Open / })).toHaveLength(rows.length)
    // At the right edge: the table's buttons.
    scroller.scrollLeft = 360
    fireEvent.scroll(scroller)
    expect(within(list).queryAllByRole('button', { name: /^Open / })).toHaveLength(0)
    expect(within(list).getAllByRole('button', { name: /^(Sign|Execute) / }).length).toBeGreaterThan(0)
    scroller.scrollLeft = 0
    fireEvent.scroll(scroller)
    await user.click(within(list).getAllByRole('button', { name: /^Open / })[0])
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })

  it("M1: rows keep the table's buttons, one filled, and drop a status the button repeats", () => {
    jest.mocked(useIsMobile).mockReturnValue(true)
    render(<PendingQueue />, { routerProps: { query: { m: '1' } } })
    const rows = within(compactList()!).getAllByRole('listitem')
    for (const row of rows) {
      expect(within(row).getByRole('button', { name: /^More actions for / })).toBeInTheDocument()
      const main = within(row).queryByRole('button', { name: /^(Sign|Execute) / })
      if (main)
        expect(within(row).queryByText(main.textContent === 'Sign' ? 'Ready to sign' : 'Ready to execute')).toBeNull()
    }
    const mains = rows.flatMap((row) => within(row).queryAllByRole('button', { name: /^(Sign|Execute) / }))
    expect(mains.length).toBeGreaterThan(1)
    expect(mains.filter((button) => button.className.includes('bg-primary'))).toHaveLength(1)
  })

  it('keeps the table on phones with ?view=table', () => {
    jest.mocked(useIsMobile).mockReturnValue(true)
    render(<PendingQueue />, { routerProps: { query: { view: 'table' } } })
    expect(compactList()).not.toBeInTheDocument()
    expect(screen.getByRole('table')).toBeInTheDocument()
  })
})

describe('M1 · what ships first', () => {
  beforeEach(() => localStorage.clear())
  const m1 = { routerProps: { query: { m: '1' } } }

  it('opens on M1, with an M1 and M2 switch in the scenario bar', () => {
    baseRender(<PendingQueue />)
    expect(screen.getByRole('tab', { name: 'M1' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'M2' })).toHaveAttribute('aria-selected', 'false')
  })

  it('opens no drawer: the row does nothing, and the action opens the transaction page', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, m1)
    await user.click(allPending().getAllByRole('button', { name: /^Open / })[0])
    expect(screen.queryByRole('dialog')).toBeNull()
    await user.click(allPending().getAllByRole('button', { name: /^(Sign|Execute|Review)/ })[0])
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent(/opens on its transaction page in the product\.$/)
  })

  it('leaves out Remind, bulk execute, the Safenet mark and Awaiting parent, and keeps Hypernative', () => {
    groupBySafe()
    render(<PendingQueue />, { routerProps: { query: { m: '1', scenario: 'conflict-heavy' } } })
    expect(allPending().queryAllByRole('button', { name: /^Remind/ })).toHaveLength(0)
    expect(screen.queryByRole('button', { name: /^Bulk execute/ })).toBeNull()
    expect(allPending().queryAllByRole('button', { name: /\(Safenet\)$/ })).toHaveLength(0)
    expect(screen.getByText('Logged in to Hypernative')).toBeInTheDocument()
    expect(allPending().queryByLabelText(/^Awaiting parent signature/)).toBeNull()
  })
})
