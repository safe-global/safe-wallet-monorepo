import type { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd'
import { fireEvent, render, screen } from '@/tests/test-utils'
import SafeAccountTableRow, { type RowCheckbox } from '../SafeAccountTableRow'
import { SELECT_COLUMN, type SafeAccountColumn } from '../columns'
import type { AccountLine } from '../useSafeAccountRows'

// Keep the heavy per-cell widgets out of the way; this suite covers row-level link/selection wiring.
// Stub the lazy overview fetch — its own suite covers it (and it needs an IntersectionObserver).
jest.mock('../useRowOverviews', () => ({ useRowOverviews: () => ({ current: null }) }))
jest.mock('@/components/common/Identicon', () => ({ __esModule: true, default: () => <div data-testid="identicon" /> }))
jest.mock('../../AccountItem', () => ({
  AccountItem: { Icon: () => null, ChainBadge: () => null, ContextMenu: () => null },
}))
jest.mock('@/components/common/AccountBadges', () => ({ PendingBadge: () => null, ThresholdBadge: () => null }))
jest.mock('@/components/common/FiatBalance', () => ({ __esModule: true, default: () => null }))
jest.mock('../cells', () => ({ WorkspaceAvatars: () => null }))
jest.mock('@/components/common/SafeListContextMenu/MultiAccountContextMenu', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('@/hooks/useChains', () => ({
  useChain: () => ({
    chainId: '1',
    blockExplorerUriTemplate: {
      address: 'https://etherscan.io/address/{{address}}',
      txHash: 'https://etherscan.io/tx/{{txHash}}',
      api: 'https://api.etherscan.io/api',
    },
  }),
}))

const columns: SafeAccountColumn[] = [SELECT_COLUMN, { id: 'name', label: 'Name', sortable: false }]

const leaf = (over: Partial<AccountLine> = {}): AccountLine => ({
  key: '1:0xabc',
  variant: 'single',
  source: { chainId: '1', address: '0xabc', isReadOnly: false, isPinned: true, lastVisited: 0, name: 'My Safe' },
  address: '0xabc',
  chainId: '1',
  displayName: 'My Safe',
  showAddress: true,
  expandable: false,
  thresholdMixed: false,
  workspaces: [],
  pending: 0,
  awaitingConfirmation: 0,
  dataLoaded: true,
  undeployed: false,
  isActivating: false,
  href: '/home?safe=eth:0xabc',
  contextMenu: {
    type: 'single',
    name: 'My Safe',
    address: '0xabc',
    chainId: '1',
    addNetwork: false,
    undeployedSafe: false,
  },
  ...over,
})

const renderRow = (props: Partial<Parameters<typeof SafeAccountTableRow>[0]>) =>
  render(
    <table>
      <tbody>
        <SafeAccountTableRow line={leaf()} columns={columns} {...props} />
      </tbody>
    </table>,
  )

const checkbox = (over: Partial<RowCheckbox> = {}): RowCheckbox => ({
  checked: false,
  indeterminate: false,
  disabled: false,
  ...over,
})

describe('SafeAccountTableRow', () => {
  it('renders the name as a navigation link when not in selection mode', () => {
    renderRow({})
    expect(screen.getByTestId('account-row-link')).toHaveAttribute('href', '/home?safe=eth:0xabc')
  })

  it('does not navigate in selection mode — the whole row toggles the checkbox instead', () => {
    const onSelectToggle = jest.fn()
    renderRow({ checkbox: checkbox(), onSelectToggle })

    expect(screen.queryByTestId('account-row-link')).not.toBeInTheDocument()

    screen.getByTestId('account-table-row').click()
    expect(onSelectToggle).toHaveBeenCalledWith(true)
  })

  it('toggles off a selected row on click', () => {
    const onSelectToggle = jest.fn()
    renderRow({ checkbox: checkbox({ checked: true }), onSelectToggle })

    screen.getByTestId('account-table-row').click()
    expect(onSelectToggle).toHaveBeenCalledWith(false)
  })

  it('does not toggle a disabled row on click', () => {
    const onSelectToggle = jest.fn()
    renderRow({ checkbox: checkbox({ disabled: true, disabledReason: 'Already added' }), onSelectToggle })

    screen.getByTestId('account-table-row').click()
    expect(onSelectToggle).not.toHaveBeenCalled()
  })

  describe('whole-row navigation (non-selection surfaces)', () => {
    // Include a stat cell so a click can land somewhere other than the name link.
    const navColumns: SafeAccountColumn[] = [
      { id: 'name', label: 'Name', sortable: false },
      { id: 'balance', label: 'Balance', sortable: false },
    ]

    const renderNavRow = (props: Partial<Parameters<typeof SafeAccountTableRow>[0]>, push = jest.fn()) => {
      render(
        <table>
          <tbody>
            <SafeAccountTableRow line={leaf()} columns={navColumns} {...props} />
          </tbody>
        </table>,
        { routerProps: { push } },
      )
      return push
    }

    it('navigates to the safe and tracks the click when a non-interactive cell is clicked', () => {
      const onLinkClick = jest.fn()
      const push = renderNavRow({ onLinkClick })

      fireEvent.click(screen.getByTestId('account-cell-balance'))

      expect(push).toHaveBeenCalledWith('/home?safe=eth:0xabc')
      expect(onLinkClick).toHaveBeenCalledWith(expect.objectContaining({ address: '0xabc' }))
    })

    it('does not navigate when an in-row affordance (explorer link) is clicked', () => {
      const onLinkClick = jest.fn()
      const push = renderNavRow({ onLinkClick })

      fireEvent.click(screen.getByTestId('safe-item-row-explorer-link'))

      expect(push).not.toHaveBeenCalled()
      expect(onLinkClick).not.toHaveBeenCalled()
    })

    it('toggles a group row instead of navigating when its body is clicked', () => {
      const onToggle = jest.fn()
      const push = jest.fn()
      render(
        <table>
          <tbody>
            <SafeAccountTableRow
              line={leaf({ variant: 'group', expandable: true, href: undefined })}
              columns={navColumns}
              onToggle={onToggle}
            />
          </tbody>
        </table>,
        { routerProps: { push } },
      )

      fireEvent.click(screen.getByTestId('account-cell-balance'))

      expect(onToggle).toHaveBeenCalled()
      expect(push).not.toHaveBeenCalled()
    })
  })

  describe('balance cell', () => {
    const balanceColumns: SafeAccountColumn[] = [{ id: 'balance', label: 'Balance', sortable: false }]

    const renderBalance = (over: Partial<AccountLine>) =>
      render(
        <table>
          <tbody>
            <SafeAccountTableRow line={leaf(over)} columns={balanceColumns} />
          </tbody>
        </table>,
      )

    it('shows the Not activated badge in place of the balance for an undeployed safe', () => {
      renderBalance({ undeployed: true })
      expect(screen.getByTestId('not-activated-badge')).toHaveAttribute('aria-label', 'Inactive')
    })

    it('shows the Activating badge while an undeployed safe is being activated', () => {
      renderBalance({ undeployed: true, isActivating: true })
      expect(screen.getByTestId('not-activated-badge')).toHaveAttribute('aria-label', 'Activating')
    })

    it('renders the balance (no badge) for a deployed safe', () => {
      renderBalance({ undeployed: false })
      expect(screen.queryByTestId('not-activated-badge')).not.toBeInTheDocument()
    })
  })

  it('reveals a copy button and explorer link on the address line', () => {
    renderRow({ checkbox: checkbox(), onSelectToggle: jest.fn() })

    expect(screen.getByRole('button', { name: 'Copy address' })).toBeInTheDocument()
    expect(screen.getByTestId('safe-item-row-explorer-link')).toHaveAttribute(
      'href',
      'https://etherscan.io/address/0xabc',
    )
  })

  it('hides the address and copy button on multi-chain child rows', () => {
    renderRow({ line: leaf({ variant: 'child', showAddress: false, displayName: 'Ethereum' }) })

    expect(screen.queryByTestId('safe-item-address')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Copy address' })).not.toBeInTheDocument()
  })

  it('keeps the per-chain explorer link on a multi-chain child row (next to the chain name)', () => {
    renderRow({ line: leaf({ variant: 'child', showAddress: false, displayName: 'Ethereum' }) })

    expect(screen.getByTestId('safe-item-row-explorer-link')).toHaveAttribute(
      'href',
      'https://etherscan.io/address/0xabc',
    )
  })

  it('omits the explorer link on a multi-chain parent row — its chain would be arbitrary', () => {
    renderRow({ line: leaf({ variant: 'group', expandable: true }) })

    expect(screen.queryByTestId('safe-item-row-explorer-link')).not.toBeInTheDocument()
  })

  it('shows the rename pencil and calls onRename with the row when provided', () => {
    const onRename = jest.fn()
    renderRow({ onRename })

    fireEvent.click(screen.getByTestId('safe-item-rename-btn'))
    expect(onRename).toHaveBeenCalledWith(expect.objectContaining({ address: '0xabc' }))
  })

  it('omits the rename pencil without onRename (e.g. inside modals)', () => {
    renderRow({})
    expect(screen.queryByTestId('safe-item-rename-btn')).not.toBeInTheDocument()
  })

  describe('reorder handle', () => {
    it('renders the grip on a draggable row while keeping the name navigable', () => {
      renderRow({
        rowDraggableProps: {} as never,
        dragHandleProps: {} as DraggableProvidedDragHandleProps,
      })

      expect(screen.getByTestId('account-drag-handle')).toBeInTheDocument()
      // The grip floats in the gutter, so the name is still a plain navigation link (no reflow).
      expect(screen.getByTestId('account-row-link')).toHaveAttribute('href', '/home?safe=eth:0xabc')
    })

    it('renders no grip on a non-draggable child row, which stays navigable', () => {
      renderRow({ line: leaf({ variant: 'child', showAddress: false, displayName: 'Ethereum' }) })

      // Only the parent carries the handle — children move with it, so they get none.
      expect(screen.queryByTestId('account-drag-handle')).not.toBeInTheDocument()
      expect(screen.getByTestId('account-row-link')).toHaveAttribute('href', '/home?safe=eth:0xabc')
    })

    it('renders the grip alongside the checkbox in selection mode (Manage list)', () => {
      renderRow({
        checkbox: checkbox(),
        onSelectToggle: jest.fn(),
        rowDraggableProps: {} as never,
        dragHandleProps: {} as DraggableProvidedDragHandleProps,
      })

      // Both affordances render: the grip hosts on the leading checkbox cell, left of the checkbox.
      expect(screen.getByTestId('account-drag-handle')).toBeInTheDocument()
      expect(screen.getByTestId('account-select-checkbox')).toBeInTheDocument()
    })
  })
})
