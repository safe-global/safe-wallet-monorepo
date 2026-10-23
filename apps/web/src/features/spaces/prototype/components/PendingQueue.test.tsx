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

// These tests cover option A on the everyday queue unless they say otherwise.
type RenderOptions = Parameters<typeof baseRender>[1]
const withDefaults = (options: RenderOptions = {}): RenderOptions => ({
  ...options,
  routerProps: {
    ...options?.routerProps,
    query: { option: 'table', scenario: 'everyday', ...options?.routerProps?.query },
  },
})
const render = (ui: Parameters<typeof baseRender>[0], options?: RenderOptions) => baseRender(ui, withDefaults(options))
const renderWithUserEvent = (ui: Parameters<typeof baseRenderWithUserEvent>[0], options?: RenderOptions) =>
  baseRenderWithUserEvent(ui, withDefaults(options))

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

describe('queue design exploration', () => {
  it('defaults to one table grouped by Safe, and opens execute without running it', () => {
    render(<PendingQueue />)
    expect(screen.getAllByRole('table')).toHaveLength(1)
    const table = within(screen.getByRole('table', { name: 'Pending transactions' }))
    const headers = table.getAllByRole('columnheader')
    expect(headers.slice(0, -1).map((header) => header.textContent)).toEqual([
      'Nonce',
      'Transaction',
      'To',
      'Chain',
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
    const dialog = within(screen.getByRole('dialog'))
    expect(dialog.getByRole('button', { name: 'Conflicts and checks' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('dialog')).toHaveTextContent('2 transactions at #42')
    expect(dialog.getByRole('button', { name: /Swap 200,000 USDC → 62\.4 ETH/ })).toBeVisible()
  })
  it('filters from the Status and Safe dropdowns', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />)
    expect(screen.queryByRole('group', { name: 'Quick filters' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^Safe/ }))
    expect(await screen.findByText('Sorted by actionable transactions')).toBeVisible()
    fireEvent.click(await screen.findByRole('menuitemcheckbox', { name: /^Grants/ }))
    expect(await screen.findByRole('menuitem', { name: /^Clear/ })).toHaveTextContent('Clear1 selected')
    await closeMenus(user)
    expect(screen.getByRole('button', { name: /^Safe/ })).toHaveAccessibleName('Safe')
    expect(safeToggle('Treasury Main')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Filter/ })).toHaveAccessibleName('Filter')
    expect(screen.getByRole('group', { name: 'Applied filters' })).toHaveTextContent('Safe:Grants')
    await openFilter(user, 'Safe account')
    expect(await screen.findByRole('menuitemcheckbox', { name: /^Grants/ })).toHaveAttribute('aria-checked', 'true')
    await closeMenus(user)
    await user.click(screen.getByRole('button', { name: /^Filter/ }))
    const reset = await screen.findByRole('menuitem', { name: /^Reset all filters/ })
    expect(reset).toHaveTextContent('1 applied')
    await user.click(reset)
    expect(screen.getByRole('button', { name: 'Collapse Treasury Main' })).toBeInTheDocument()
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
  it('opens with the summary open and the rest collapsed, and resets them for another proposal', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />)
    await user.click(allPending().getByRole('button', { name: 'Open Add signer Priya' }))
    const dialog = () => within(screen.getByRole('dialog'))
    expect(dialog().getByRole('button', { name: 'Summary' })).toHaveAttribute('aria-expanded', 'true')
    expect(dialog().getByRole('button', { name: 'Conflicts and checks' })).toHaveAttribute('aria-expanded', 'true')
    for (const name of ['Security', 'Note', 'Transaction data'])
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
    expect(dialog.getByRole('button', { name: 'Show signatures' })).toHaveAttribute('aria-expanded', 'false')
    expect(dialog.getByRole('button', { name: 'Copy transaction link' })).toBeVisible()
    await user.click(dialog.getByRole('button', { name: 'Show signatures' }))
    expect(dialog.getByRole('button', { name: 'Hide signatures' })).toHaveAttribute('aria-expanded', 'true')
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
  it('names the chain in its own column and leaves the Safe to its band', () => {
    render(<PendingQueue />)
    const row = rowFor('Add signer Priya')
    expect(within(row).getByRole('img', { name: /^Settings\./ })).toBeVisible()
    expect(within(row).getByRole('button', { name: /^Nonce 43\. / })).toBeVisible()
    expect(row).not.toHaveTextContent('Treasury Main')
    expect(within(within(row).getAllByRole('cell')[3]).getByRole('img', { name: 'Ethereum' })).toBeVisible()
    expect(row).toHaveTextContent('Blocked by #42')
    expect(within(safeBand('Treasury Main')).queryByText('Ethereum')).toBeNull()
  })
  it('opens mobile details full screen with the actions in the footer', async () => {
    jest.mocked(useIsMobile).mockReturnValue(true)
    const { user } = renderWithUserEvent(<PendingQueue />)
    expect(screen.getByRole('searchbox', { name: 'Find a proposal' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Filter/ })).toBeInTheDocument()
    await user.click(allPending().getByRole('button', { name: 'Open Batch · 14 actions' }))
    expect(screen.getByRole('dialog')).toHaveAttribute('data-mobile-full-screen', 'true')
    const dialog = within(screen.getByRole('dialog'))
    expect(dialog.getByRole('button', { name: 'Summary' })).toHaveAttribute('aria-expanded', 'true')
    expect(dialog.queryByRole('button', { name: 'Expand to full screen' })).not.toBeInTheDocument()
    await user.click(dialog.getByRole('button', { name: 'Execute' }))
    expect(dialog.getByRole('button', { name: 'Execute in preview' })).toBeVisible()
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
  it('keeps the amount under the transaction and the note icon in its own column on wide screens', () => {
    render(<PendingQueue />)
    const title = allPending().getByRole('button', { name: 'Open Send to Globex Payroll' })
    expect(title.closest('td')).toHaveTextContent(/^Send48\.5 ETH$/)
    expect(title.closest('td')?.nextElementSibling).toHaveTextContent(/^To.*Globex Payroll$/)
    expect(title.closest('tr')).not.toHaveTextContent('September contractor payouts')
    const note = within(title.closest('tr')!).getByRole('button', { name: 'Note for Send to Globex Payroll' })
    expect(note).toBeVisible()
    expect(title.closest('td')).not.toContainElement(note)
  })
  it('drops the note column below 1280px, moving the note beside the title', () => {
    setViewport({ wide: false })
    render(<PendingQueue />)
    const table = within(screen.getByRole('table', { name: 'Pending transactions' }))
    expect(
      table
        .getAllByRole('columnheader')
        .slice(0, -1)
        .map((header) => header.textContent),
    ).toEqual(['Nonce', 'Transaction', 'To', 'Chain', 'Proposed', 'Signatures', 'Status'])
    const row = rowFor('Send to Globex Payroll')
    const [nonce, , , , proposed, , status] = within(row).getAllByRole('cell')
    expect(nonce).toHaveTextContent(/^42$/)
    expect(proposed).toHaveTextContent(/^3d ago$/)
    expect(status).toHaveTextContent(/^Sign$/)
    expect(within(row).getByRole('button', { name: 'Open Send to Globex Payroll' }).closest('td')).toContainElement(
      within(row).getByRole('button', { name: 'Note for Send to Globex Payroll' }),
    )
    expect(within(row).getByRole('button', { name: 'Sign Send to Globex Payroll' })).toBeInTheDocument()
  })
  it('keeps the full table on mobile with the nonce pinned left and the action pinned right', () => {
    jest.mocked(useIsMobile).mockReturnValue(true)
    setViewport({ wide: false })
    render(<PendingQueue />)
    const table = within(screen.getByRole('table', { name: 'Pending transactions' }))
    const headers = table.getAllByRole('columnheader')
    expect(headers).toHaveLength(8)
    expect(headers[0]).toHaveClass('max-md:sticky', 'max-md:left-0')
    expect(headers.at(-1)).toHaveClass('sticky', 'right-0')
    const row = rowFor('Send to Globex Payroll')
    const cells = within(row).getAllByRole('cell')
    expect(cells).toHaveLength(8)
    expect(cells[0]).toHaveClass('max-md:sticky', 'max-md:left-0', 'max-md:bg-card')
    expect(cells.at(-1)).toHaveClass('sticky', 'right-0')
    fireEvent.click(row)
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Send to Globex Payroll')
  })
  it('shows only the empty state when nothing is pending', () => {
    render(<PendingQueue />, { routerProps: { query: { scenario: 'empty' } } })
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
      expect(dialog().getByRole('heading', { name: 'Treasury Main' })).toBeVisible()
      expect(screen.getByRole('dialog')).toHaveTextContent('Nonce #42 · Ethereum')
      expect(screen.getByRole('dialog')).toHaveTextContent('TypeSendAction48.5 ETH')
      expect(screen.getByRole('dialog')).toHaveAccessibleName('Send to Globex Payroll')
      await user.click(screen.getByRole('button', { name: 'Close' }))
      await user.click(allPending().getByRole('button', { name: 'Open Batch · 14 actions' }))
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
  it('opens on option A with 5 Safes when the link has no options', () => {
    baseRender(<PendingQueue />)
    expect(screen.getByRole('tab', { name: 'A · Safe table' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByRole('group', { name: 'Fleet overview' })).not.toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Scenario' })).toHaveTextContent('5 Safes')
    expect(screen.getByRole('combobox', { name: 'State' })).toHaveTextContent('Normal')
  })
  it('filters by signer in option A, without the Fleet admin Proposal date section', async () => {
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
  it('gives the other party its own To column, and opens old option C links on the Safe table', () => {
    render(<PendingQueue />, { routerProps: { query: { option: 'aligned' } } })
    const headers = within(screen.getByRole('table', { name: 'Pending transactions' }))
      .getAllByRole('columnheader')
      .map((header) => header.textContent?.trim())
    expect(headers.slice(0, 3)).toEqual(['Nonce', 'Transaction', 'To'])
    const row = rowFor('Send to Globex Payroll')
    const [, transaction, to] = within(row).getAllByRole('cell')
    expect(transaction).not.toHaveTextContent('Globex Payroll')
    expect(to).toHaveTextContent(/^ToGlobex Payroll$/)
  })
  it('shows a stuck execution, locks its conflict, and finishes after Speed up', async () => {
    jest.useFakeTimers()
    try {
      render(<PendingQueue />, { routerProps: { query: { scenario: 'executing' } } })
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
  it('scopes the Milestone 1 view: no side panel, no filter counts, and Sign runs straight away', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { m1: '1' } } })
    await user.click(within(rowFor('Add signer Priya')).getByRole('button', { name: 'Open Add signer Priya' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent('opens on its transaction page')
    await user.click(within(rowFor('Send to Contoso Ltd')).getByRole('button', { name: 'Sign Send to Contoso Ltd' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent('Signature added')
    await openFilter(user, 'Safe account')
    expect(await screen.findByRole('menuitemcheckbox', { name: /^Treasury Main/ })).toHaveTextContent(/^Treasury Main$/)
  })
  it('opens old scenario links on the closest scenario and state', () => {
    render(<PendingQueue />, { routerProps: { query: { scenario: 'partial' } } })
    expect(screen.getByRole('combobox', { name: 'Scenario' })).toHaveTextContent('5 Safes')
    expect(screen.getByRole('combobox', { name: 'State' })).toHaveTextContent('Partial loading')
    expect(screen.getByRole('alert')).toHaveTextContent('Showing proposals from 4 of 5 Safes')
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
  it('combines Status options and keeps the toolbar dropdown in sync with the Filter menu', async () => {
    const { user } = renderWithUserEvent(<PendingQueue />, { routerProps: { query: { scenario: 'realistic' } } })
    await user.click(screen.getByRole('button', { name: /^Status/ }))
    const execute = await screen.findByRole('menuitemcheckbox', { name: /^Execute/ })
    const blocked = screen.getByRole('menuitemcheckbox', { name: /^Blocked/ })
    const total = (option: HTMLElement) => Number(option.textContent?.replace(/\D/g, ''))
    const expected = total(execute) + total(blocked)
    fireEvent.click(execute)
    fireEvent.click(blocked)
    await closeMenus(user)
    expect(openRows()).toHaveLength(expected)
    expect(screen.getByRole('group', { name: 'Applied filters' })).toHaveTextContent('Status:Ready to execute, Blocked')
    await openFilter(user, 'Status')
    expect(await screen.findByRole('menuitemcheckbox', { name: /^Blocked/ })).toHaveAttribute('aria-checked', 'true')
    await closeMenus(user)
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
      expect(within(rowFor('Send to Globex Payroll')).getAllByRole('cell').at(-2)).toHaveTextContent(/^Sign$/)
      await user.click(screen.getByRole('button', { name: 'Expand Grants' }))
      const [grant, unsigned] = allPending()
        .getAllByRole('button', { name: 'Open Send to Tailspin Labs' })
        .map((button) => button.closest('tr')!)
      expect(grant).toHaveTextContent('Waiting')
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
      await user.click(screen.getByRole('button', { name: /^Status/ }))
      const blocked = await screen.findByRole('menuitemcheckbox', { name: /^Blocked/ })
      const count = Number(blocked.textContent?.replace(/\D/g, ''))
      expect(count).toBeGreaterThan(0)
      fireEvent.click(blocked)
      expect(blocked).toHaveAttribute('aria-checked', 'true')
      await closeMenus(user)
      expect(openRows()).toHaveLength(count)
      expect(allPending().getAllByText(/^Blocked by #/)).toHaveLength(count)
      await user.click(screen.getByRole('button', { name: /^Status/ }))
      fireEvent.click(await screen.findByRole('menuitemcheckbox', { name: /^Blocked/ }))
      await closeMenus(user)
      expect(openRows().length).toBeGreaterThan(count)
    })
    it('leads with the warnings, then the summary and security checks', async () => {
      const { user } = renderRealistic()
      await user.click(allPending().getByRole('button', { name: 'Open Bridge ETH to Unknown network' }))
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
      expect(screen.getByRole('dialog')).toHaveTextContent('2/3 Signatures· Your signature required')
      await user.click(dialog.getByRole('button', { name: 'Show signatures' }))
      const rows = dialog.getAllByRole('listitem')
      expect(rows[3]).toHaveTextContent(/^Dev \(you\).*Your signature required$/)
      expect(dialog.getByRole('button', { name: 'Copy transaction link' })).toBeVisible()
    })
  })
  describe('fleet admin', () => {
    // The protocol fixture renders 50 Safes, which is slow under a full parallel run.
    const FLEET_TIMEOUT = 20_000
    const renderFleet = () =>
      renderWithUserEvent(<PendingQueue />, { routerProps: { query: { option: 'fleet', scenario: '50-safes' } } })
    const pulse = (label: string) =>
      within(screen.getByRole('group', { name: 'Fleet overview' })).getByRole('button', {
        name: new RegExp(label.replace(/[+.]/g, '\\$&')),
      })

    it(
      'shows the fleet overview cards',
      () => {
        renderFleet()
        const counters = within(screen.getByRole('group', { name: 'Fleet overview' })).getAllByRole('button')
        expect(counters.map((counter) => counter.textContent?.replace(/^\d+\s*/, ''))).toEqual([
          'Safes',
          'Signers',
          'Conflicting',
          'Blocked',
          'Stale 7 days',
        ])
        expect(pulse('Safes')).toHaveTextContent(/^50\s*Safes$/)
        expect(pulse('Conflicting')).toHaveTextContent(/^7\s*Conflicting$/)
        expect(pulse('Conflicting')).toHaveAttribute('aria-pressed', 'false')
      },
      FLEET_TIMEOUT,
    )
    it(
      'narrows to conflicting proposals from its card as the Status filter, and clears it on a second click',
      async () => {
        const { user } = renderFleet()
        await user.click(pulse('Conflicting'))
        expect(pulse('Conflicting')).toHaveAttribute('aria-pressed', 'true')
        expect(screen.getByRole('group', { name: 'Applied filters' })).toHaveTextContent('Status:Conflicting')
        const rows = openRows()
        expect(rows).toHaveLength(parseInt(pulse('Conflicting').textContent ?? ''))
        await user.click(screen.getByRole('button', { name: /^Status/ }))
        expect(await screen.findByRole('menuitemcheckbox', { name: /^Conflicting/ })).toHaveAttribute(
          'aria-checked',
          'true',
        )
        await closeMenus(user)
        await user.click(pulse('Conflicting'))
        expect(pulse('Conflicting')).toHaveAttribute('aria-pressed', 'false')
        expect(screen.queryByRole('group', { name: 'Applied filters' })).not.toBeInTheDocument()
        expect(openRows().length).toBeGreaterThan(rows.length)
      },
      FLEET_TIMEOUT,
    )
    it(
      'unselects a card when its filter tag is removed',
      async () => {
        const { user } = renderFleet()
        await user.click(pulse('Stale 7 days'))
        expect(openRows()).toHaveLength(parseInt(pulse('Stale 7 days').textContent ?? ''))
        const applied = within(screen.getByRole('group', { name: 'Applied filters' }))
        expect(screen.getByRole('group', { name: 'Applied filters' })).toHaveTextContent('Status:Stale 7 days')
        await user.click(applied.getAllByRole('button')[0])
        expect(pulse('Stale 7 days')).toHaveAttribute('aria-pressed', 'false')
        expect(screen.queryByRole('group', { name: 'Applied filters' })).not.toBeInTheDocument()
      },
      FLEET_TIMEOUT,
    )
    it(
      'keeps one card selected at a time',
      async () => {
        const { user } = renderFleet()
        await user.click(pulse('Blocked'))
        await user.click(pulse('Stale 7 days'))
        expect(pulse('Blocked')).toHaveAttribute('aria-pressed', 'false')
        expect(pulse('Stale 7 days')).toHaveAttribute('aria-pressed', 'true')
        expect(screen.getByRole('group', { name: 'Applied filters' })).toHaveTextContent(/^Status:Stale 7 daysClear$/)
        await user.click(pulse('Safes'))
        expect(pulse('Stale 7 days')).toHaveAttribute('aria-pressed', 'false')
        expect(screen.getByRole('group', { name: 'Applied filters' })).toHaveTextContent(/^Show:Safes/)
        expect(screen.getByRole('group', { name: 'Applied filters' })).not.toHaveTextContent('Status:')
        await user.click(pulse('Blocked'))
        expect(screen.queryByRole('table', { name: 'Safes in this workspace' })).not.toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: /^Status/ }))
        expect(await screen.findByRole('menuitemcheckbox', { name: /^Blocked/ })).toHaveAttribute(
          'aria-checked',
          'true',
        )
        expect(screen.getByRole('menuitemcheckbox', { name: /^Stale 7 days/ })).toHaveAttribute('aria-checked', 'false')
      },
      FLEET_TIMEOUT,
    )
    it(
      'explains why a transaction is urgent in the drawer',
      async () => {
        const { user } = renderFleet()
        await user.click(screen.getByRole('button', { name: 'Expand Security council Ethereum' }))
        await user.click(allPending().getByRole('button', { name: /^Open Call pause/ }))
        const alert = within(screen.getByRole('dialog')).getAllByRole('alert')[0]
        expect(alert).toHaveTextContent('Urgent')
        expect(alert).toHaveTextContent('Monitoring flagged unusual outflows from the bridge router')
      },
      FLEET_TIMEOUT,
    )
    it(
      'swaps the queue for every Safe, with a tag to go back, and shows one Safe back in the queue',
      async () => {
        const { user } = renderFleet()
        await user.click(pulse('Safes'))
        expect(pulse('Safes')).toHaveAttribute('aria-pressed', 'true')
        expect(screen.getByRole('group', { name: 'Applied filters' })).toHaveTextContent('Show:Safes')
        const table = within(screen.getByRole('table', { name: 'Safes in this workspace' }))
        const [show] = table
          .getAllByRole('button', { name: 'Show' })
          .filter((button) => !button.hasAttribute('disabled'))
        await user.click(show)
        expect(screen.queryByRole('table', { name: 'Safes in this workspace' })).not.toBeInTheDocument()
        expect(pulse('Safes')).toHaveAttribute('aria-pressed', 'false')
        expect(screen.getByRole('group', { name: 'Applied filters' })).toHaveTextContent('Safe:')
      },
      FLEET_TIMEOUT,
    )
    it(
      'filters by signer from the Filter menu, Lena first, and offers to remind her',
      async () => {
        const { user } = renderFleet()
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
      },
      FLEET_TIMEOUT,
    )
    it(
      'opens a Safe from the Safes list, and links to a signer',
      async () => {
        const { user } = renderWithUserEvent(<PendingQueue />, {
          routerProps: { query: { option: 'fleet', scenario: '20-safes' } },
        })
        await user.click(pulse('Safes'))
        const table = within(screen.getByRole('table', { name: 'Safes in this workspace' }))
        expect(table.getAllByRole('row')).toHaveLength(21)
        await user.click(table.getByText('Payroll Base'))
        const drawer = within(screen.getByRole('dialog', { name: 'Safe details' }))
        expect(drawer.getByText('1 of 3 met')).toBeVisible()
        expect(drawer.getByText('Waiting on Sam')).toBeVisible()
        expect(drawer.getByText('Differs: adds Nadia, no Sam')).toBeVisible()
        await user.click(drawer.getByRole('button', { name: /^Sam.*Browser wallet/ }))
        const member = within(screen.getByRole('dialog', { name: 'Team member' }))
        expect(member.getByText('No attestation on Payroll Base.')).toBeVisible()
        expect(member.getByText('Browser wallet')).toBeVisible()
      },
      FLEET_TIMEOUT,
    )
    it(
      'opens a Safe from its band in the queue',
      async () => {
        const { user } = renderWithUserEvent(<PendingQueue />, {
          routerProps: { query: { option: 'fleet', scenario: '20-safes' } },
        })
        await user.click(screen.getByRole('button', { name: 'Details for Payroll Gnosis' }))
        const drawer = within(screen.getByRole('dialog', { name: 'Safe details' }))
        expect(drawer.getByText('Differs from Base')).toBeVisible()
      },
      FLEET_TIMEOUT,
    )
    it(
      'swaps the queue for pending signatures by signer, and shows one signer back in the queue',
      async () => {
        const { user } = renderFleet()
        expect(pulse('Signers')).toHaveTextContent(/^8\s*Signers$/)
        await user.click(pulse('Signers'))
        expect(pulse('Signers')).toHaveAttribute('aria-pressed', 'true')
        expect(screen.queryByRole('table', { name: 'Pending transactions' })).not.toBeInTheDocument()
        const [, lena] = within(screen.getByRole('table', { name: 'Pending signatures by signer' })).getAllByRole('row')
        expect(lena).toHaveTextContent(/^Lena/)
        await user.click(within(lena).getByRole('button', { name: 'Show' }))
        expect(screen.queryByRole('table', { name: 'Pending signatures by signer' })).not.toBeInTheDocument()
        expect(pulse('Signers')).toHaveAttribute('aria-pressed', 'false')
        expect(screen.getByRole('group', { name: 'Applied filters' })).toHaveTextContent('Signer:Lena')
        for (const fraction of allPending().getAllByRole('button', { name: /^\d+ of \d+ signatures/ }))
          expect(fraction.getAttribute('aria-label')).toContain('Lena')
      },
      FLEET_TIMEOUT,
    )
  })

  describe('option C, action first', () => {
    const renderSimple = () => renderWithUserEvent(<PendingQueue />, { routerProps: { query: { option: 'simple' } } })

    it('loads the workspace once, then lists what needs you above the Safes waiting on others', async () => {
      const { user } = renderSimple()
      expect(screen.getByLabelText('Loading transactions')).toBeInTheDocument()
      const needsYou = await screen.findByRole('table', { name: 'Needs you' }, { timeout: 3000 })
      expect(
        within(needsYou)
          .getAllByRole('columnheader')
          .map((header) => header.textContent),
      ).toEqual(['Nonce', 'Transaction', 'To', 'Safe', 'Proposed', 'Note', 'Signatures', 'Status', 'Action'])
      const [lastSignature] = within(needsYou).getAllByRole('button', { name: /^Sign & execute / })
      // The status pill says the same as the button.
      expect(within(lastSignature.closest('tr')!).getAllByText('Sign & execute')).toHaveLength(2)
      expect(within(needsYou).getAllByRole('button', { name: /^Sign / }).length).toBeGreaterThan(0)
      const bySafe = screen.getByRole('table', { name: 'Pending transactions' })
      expect(within(bySafe).getAllByRole('button', { name: /^Expand / }).length).toBeGreaterThan(0)
      expect(screen.getByText(/^Updated just now/)).toBeInTheDocument()
      // Safe and Status only.
      expect(screen.queryByRole('button', { name: /^Filter/ })).not.toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /^Status/ }))
      expect(
        (await screen.findAllByRole('menuitemcheckbox')).map((item) => item.textContent?.replace(/\d+$/, '')),
      ).toEqual(['Needs your signature', 'Ready to execute', 'Blocked', 'Conflicting'])
    })
  })
})
