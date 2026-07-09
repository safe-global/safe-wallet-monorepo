import { fireEvent, render, screen } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import type { AllSafeItems } from '@/hooks/safes'
import SafeAccountsTable from '../index'
import type { RowCheckbox } from '../SafeAccountTableRow'
import { useSafeAccountRows, type AccountGroup, type AccountLine } from '../useSafeAccountRows'

jest.mock('../useSafeAccountRows', () => {
  const actual = jest.requireActual('../useSafeAccountRows')
  return { ...actual, useSafeAccountRows: jest.fn() }
})

// Stub the row so the shell's sort/expand/column logic is tested in isolation from the
// heavy per-cell rendering (identicons, chain badges, context menus, balances).
jest.mock('../SafeAccountTableRow', () => ({
  __esModule: true,
  default: ({
    line,
    onToggle,
    checkbox,
    onSelectToggle,
    dragHandleProps,
    rowRef,
    rowDraggableProps,
  }: {
    line: { key: string; displayName: string }
    onToggle?: () => void
    checkbox?: RowCheckbox
    onSelectToggle?: (next: boolean) => void
    dragHandleProps?: object | null
    rowRef?: (el: HTMLElement | null) => void
    rowDraggableProps?: object
  }) => (
    <tr data-testid="row" data-key={line.key} ref={rowRef} {...rowDraggableProps}>
      <td>
        {dragHandleProps !== undefined && (
          <button data-testid={`drag-${line.key}`} {...dragHandleProps} type="button" aria-label="drag" />
        )}
        {checkbox && (
          <button
            data-testid={`select-${line.key}`}
            data-checked={checkbox.checked}
            data-indeterminate={checkbox.indeterminate}
            data-disabled={checkbox.disabled}
            data-reason={checkbox.disabledReason ?? ''}
            onClick={() => onSelectToggle?.(!checkbox.checked)}
            type="button"
          />
        )}
        {line.displayName}
        {onToggle && (
          <button data-testid={`toggle-${line.key}`} onClick={onToggle} type="button">
            toggle
          </button>
        )}
      </td>
    </tr>
  ),
}))

const mockUseSafeAccountRows = useSafeAccountRows as jest.Mock

const line = (over: Partial<AccountLine> & Pick<AccountLine, 'key' | 'displayName'>): AccountLine => ({
  variant: 'single',
  source: { chainId: '1', address: '0x0', isReadOnly: false, isPinned: true, lastVisited: 0, name: undefined },
  address: '0x0',
  chainId: '1',
  showAddress: true,
  indent: false,
  expandable: false,
  thresholdMixed: false,
  workspaces: [],
  pending: 0,
  dataLoaded: true,
  contextMenu: { type: 'single', name: '', address: '0x0', chainId: '1', addNetwork: false, undeployedSafe: false },
  ...over,
})

const groups: AccountGroup[] = [
  {
    parent: line({ key: '0xB', displayName: 'Bravo' }),
    children: [],
    sort: { name: 'bravo', threshold: 2, networks: 1, workspaces: 0 },
  },
  {
    parent: line({ key: '0xA', displayName: 'Alpha' }),
    children: [],
    sort: { name: 'alpha', threshold: 5, networks: 1, workspaces: 2 },
  },
  {
    parent: line({ key: '0xG', displayName: 'Group', expandable: true, variant: 'group' }),
    children: [line({ key: '0xG:1', displayName: 'Ethereum', variant: 'child', indent: true })],
    sort: { name: 'group', threshold: 3, networks: 3, workspaces: 1 },
  },
]

// Non-empty items array so the table doesn't early-return; content is irrelevant (hook is mocked).
const items = [{}, {}, {}] as unknown as AllSafeItems

const rowNames = () => screen.getAllByTestId('row').map((row) => row.textContent?.replace('toggle', '').trim())

describe('SafeAccountsTable', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSafeAccountRows.mockReturnValue({ groups, isLoading: false })
  })

  it('renders parent rows in the provided order by default', () => {
    render(<SafeAccountsTable items={items} />)
    expect(rowNames()).toEqual(['Bravo', 'Alpha', 'Group'])
  })

  it('returns null when there are no items', () => {
    render(<SafeAccountsTable items={[]} />)
    expect(screen.queryByTestId('safe-accounts-table')).not.toBeInTheDocument()
  })

  it('sorts by name when the Name header is clicked', async () => {
    render(<SafeAccountsTable items={items} />)
    await userEvent.click(screen.getByTestId('account-sort-name'))
    expect(rowNames()).toEqual(['Alpha', 'Bravo', 'Group'])
  })

  it('sorts by threshold ascending then descending on repeated clicks', async () => {
    render(<SafeAccountsTable items={items} />)
    const header = screen.getByTestId('account-sort-threshold')

    await userEvent.click(header)
    expect(rowNames()).toEqual(['Bravo', 'Group', 'Alpha']) // 2, 3, 5

    await userEvent.click(header)
    expect(rowNames()).toEqual(['Alpha', 'Group', 'Bravo']) // 5, 3, 2
  })

  it('reveals multi-chain children only when the group is expanded', async () => {
    render(<SafeAccountsTable items={items} />)
    expect(screen.queryByText('Ethereum')).not.toBeInTheDocument()

    await userEvent.click(screen.getByTestId('toggle-0xG'))
    expect(screen.getByText('Ethereum')).toBeInTheDocument()

    await userEvent.click(screen.getByTestId('toggle-0xG'))
    expect(screen.queryByText('Ethereum')).not.toBeInTheDocument()
  })

  it('renders only the requested columns', () => {
    render(<SafeAccountsTable items={items} columns={['name', 'balance']} />)
    expect(screen.getByTestId('account-sort-name')).toBeInTheDocument()
    expect(screen.queryByTestId('account-sort-threshold')).not.toBeInTheDocument()
    expect(screen.queryByTestId('account-sort-workspaces')).not.toBeInTheDocument()
  })

  it('does not render checkboxes without a selection prop', () => {
    render(<SafeAccountsTable items={items} />)
    expect(screen.queryByTestId('select-0xB')).not.toBeInTheDocument()
  })

  it('renders rows without a column header in embedded mode', () => {
    render(<SafeAccountsTable items={items} embedded columns={['name', 'threshold', 'networks', 'balance']} />)

    // Rows still render...
    expect(rowNames()).toEqual(['Bravo', 'Alpha', 'Group'])
    // ...but the sortable column header is gone (no header row to click).
    expect(screen.queryByTestId('account-sort-name')).not.toBeInTheDocument()
    expect(screen.queryByTestId('account-sort-threshold')).not.toBeInTheDocument()
  })
})

describe('SafeAccountsTable — reorder mode', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSafeAccountRows.mockReturnValue({ groups, isLoading: false })
  })

  it('renders a drag handle for every top-level account, in the provided order', () => {
    render(<SafeAccountsTable items={items} reorder={{ onReorder: jest.fn() }} />)
    expect(screen.getByTestId('drag-0xB')).toBeInTheDocument()
    expect(screen.getByTestId('drag-0xA')).toBeInTheDocument()
    expect(screen.getByTestId('drag-0xG')).toBeInTheDocument()
    expect(rowNames()).toEqual(['Bravo', 'Alpha', 'Group'])
  })

  it('suppresses column-header sorting while reordering', () => {
    render(<SafeAccountsTable items={items} reorder={{ onReorder: jest.fn() }} />)
    expect(screen.queryByTestId('account-sort-name')).not.toBeInTheDocument()
    expect(screen.queryByTestId('account-sort-threshold')).not.toBeInTheDocument()
  })

  it('does not render drag handles without a reorder prop', () => {
    render(<SafeAccountsTable items={items} />)
    expect(screen.queryByTestId('drag-0xB')).not.toBeInTheDocument()
  })
})

describe('SafeAccountsTable — selection mode', () => {
  const selectionGroups: AccountGroup[] = [
    {
      parent: line({ key: '0xB', displayName: 'Bravo' }),
      children: [],
      sort: { name: 'bravo', threshold: 2, networks: 1, workspaces: 0 },
    },
    {
      parent: line({ key: '0xG', displayName: 'Group', expandable: true, variant: 'group' }),
      children: [
        line({ key: '1:0xG', displayName: 'Ethereum', variant: 'child', indent: true }),
        line({ key: '2:0xG', displayName: 'Base', variant: 'child', indent: true }),
      ],
      sort: { name: 'group', threshold: 3, networks: 2, workspaces: 0 },
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSafeAccountRows.mockReturnValue({ groups: selectionGroups, isLoading: false })
  })

  it('renders a checkbox per row reflecting selectedKeys', () => {
    render(<SafeAccountsTable items={items} selection={{ selectedKeys: new Set(['0xB']), onToggle: jest.fn() }} />)
    expect(screen.getByTestId('select-0xB')).toHaveAttribute('data-checked', 'true')
    expect(screen.getByTestId('select-0xG')).toHaveAttribute('data-checked', 'false')
  })

  it('marks a multi-chain parent indeterminate when only some children are selected', () => {
    render(<SafeAccountsTable items={items} selection={{ selectedKeys: new Set(['1:0xG']), onToggle: jest.fn() }} />)
    const group = screen.getByTestId('select-0xG')
    expect(group).toHaveAttribute('data-checked', 'false')
    expect(group).toHaveAttribute('data-indeterminate', 'true')
  })

  it('marks a multi-chain parent checked when all children are selected', () => {
    render(
      <SafeAccountsTable
        items={items}
        selection={{ selectedKeys: new Set(['1:0xG', '2:0xG']), onToggle: jest.fn() }}
      />,
    )
    const group = screen.getByTestId('select-0xG')
    expect(group).toHaveAttribute('data-checked', 'true')
    expect(group).toHaveAttribute('data-indeterminate', 'false')
  })

  it('calls onToggle with the line and the next checked state', () => {
    const onToggle = jest.fn()
    render(<SafeAccountsTable items={items} selection={{ selectedKeys: new Set(), onToggle }} />)
    fireEvent.click(screen.getByTestId('select-0xB'))
    expect(onToggle).toHaveBeenCalledWith(expect.objectContaining({ key: '0xB' }), true)
  })

  it('disables unselected leaves when at the limit', () => {
    render(
      <SafeAccountsTable
        items={items}
        selection={{ selectedKeys: new Set(['0xB']), onToggle: jest.fn(), isAtLimit: true }}
      />,
    )
    // Selected leaf stays enabled so it can be unchecked; the empty group is disabled (can't grow).
    expect(screen.getByTestId('select-0xB')).toHaveAttribute('data-disabled', 'false')
    expect(screen.getByTestId('select-0xG')).toHaveAttribute('data-disabled', 'true')
  })

  it('disables a leaf listed in disabledKeys and surfaces the disabled reason', () => {
    render(
      <SafeAccountsTable
        items={items}
        selection={{
          selectedKeys: new Set(),
          onToggle: jest.fn(),
          disabledKeys: new Set(['0xB']),
          disabledReason: 'Already in workspace',
        }}
      />,
    )
    const box = screen.getByTestId('select-0xB')
    expect(box).toHaveAttribute('data-disabled', 'true')
    expect(box).toHaveAttribute('data-reason', 'Already in workspace')
  })

  it('locks a multi-chain group whose every child is in disabledKeys', () => {
    render(
      <SafeAccountsTable
        items={items}
        selection={{
          selectedKeys: new Set(['1:0xG', '2:0xG']),
          onToggle: jest.fn(),
          disabledKeys: new Set(['1:0xG', '2:0xG']),
          disabledReason: 'Already in workspace',
        }}
      />,
    )
    const group = screen.getByTestId('select-0xG')
    expect(group).toHaveAttribute('data-disabled', 'true')
    expect(group).toHaveAttribute('data-reason', 'Already in workspace')
  })
})
