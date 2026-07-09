import { fireEvent, render, screen } from '@/tests/test-utils'
import SafeAccountTableRow, { type RowCheckbox } from '../SafeAccountTableRow'
import { SELECT_COLUMN, type SafeAccountColumn } from '../columns'
import type { AccountLine } from '../useSafeAccountRows'

// Keep the heavy per-cell widgets out of the way; this suite covers row-level link/selection wiring.
jest.mock('@/components/common/Identicon', () => ({ __esModule: true, default: () => <div data-testid="identicon" /> }))
jest.mock('../../AccountItem', () => ({
  AccountItem: { Icon: () => null, ChainBadge: () => null, ContextMenu: () => null },
}))
jest.mock('@/components/common/AccountBadges', () => ({ PendingBadge: () => null, ThresholdBadge: () => null }))
jest.mock('@/features/spaces', () => ({ FiatBalance: () => null }))
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
  indent: false,
  expandable: false,
  thresholdMixed: false,
  workspaces: [],
  pending: 0,
  dataLoaded: true,
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

  it('reveals a copy button and explorer link on the address line', () => {
    renderRow({ checkbox: checkbox(), onSelectToggle: jest.fn() })

    expect(screen.getByRole('button', { name: 'Copy address' })).toBeInTheDocument()
    expect(screen.getByTestId('safe-item-row-explorer-link')).toHaveAttribute(
      'href',
      'https://etherscan.io/address/0xabc',
    )
  })

  it('hides the address and its affordances on multi-chain child rows', () => {
    renderRow({ line: leaf({ variant: 'child', showAddress: false, displayName: 'Ethereum' }) })

    expect(screen.queryByTestId('safe-item-address')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Copy address' })).not.toBeInTheDocument()
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
})
