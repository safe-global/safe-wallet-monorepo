import { fireEvent, render, screen, waitFor } from '@/tests/test-utils'
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
    onRename,
    checkbox,
    onSelectToggle,
    dragHandleProps,
    rowRef,
    rowDraggableProps,
    showDivider,
  }: {
    line: { key: string; displayName: string }
    onToggle?: () => void
    onRename?: (line: { key: string }) => void
    checkbox?: RowCheckbox
    onSelectToggle?: (next: boolean) => void
    dragHandleProps?: object | null
    rowRef?: (el: HTMLElement | null) => void
    rowDraggableProps?: object
    showDivider?: boolean
  }) => (
    <tr
      data-testid="row"
      data-key={line.key}
      data-divider={showDivider ? '' : undefined}
      ref={rowRef}
      {...rowDraggableProps}
    >
      <td>
        {dragHandleProps !== undefined && (
          // A <span> like the real ReorderHandle — dnd refuses to lift from interactive elements (e.g. <button>).
          <span data-testid={`drag-${line.key}`} {...dragHandleProps} aria-label="drag" />
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
        {onRename && (
          <button data-testid={`rename-${line.key}`} onClick={() => onRename(line)} type="button" aria-label="rename" />
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
  expandable: false,
  thresholdMixed: false,
  workspaces: [],
  pending: 0,
  awaitingConfirmation: 0,
  dataLoaded: true,
  undeployed: false,
  isActivating: false,
  contextMenu: { type: 'single', name: '', address: '0x0', chainId: '1', addNetwork: false, undeployedSafe: false },
  ...over,
})

const groups: AccountGroup[] = [
  {
    parent: line({ key: '0xB', displayName: 'Bravo' }),
    children: [],
    sort: { name: 'bravo', threshold: 2, owners: 3, networks: 'ethereum', workspaces: 0 },
  },
  {
    parent: line({ key: '0xA', displayName: 'Alpha' }),
    children: [],
    sort: { name: 'alpha', threshold: 5, owners: 7, networks: 'ethereum', workspaces: 2 },
  },
  {
    parent: line({ key: '0xG', displayName: 'Group', expandable: true, variant: 'group' }),
    children: [line({ key: '0xG:1', displayName: 'Ethereum', variant: 'child' })],
    sort: { name: 'group', threshold: 3, owners: 5, networks: 'gnosis', workspaces: 1 },
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

  it('makes headers non-interactive and keeps the provided order when sortableColumns is false', async () => {
    render(<SafeAccountsTable items={items} sortableColumns={false} />)

    // The header label still shows, but it is not a clickable sort control.
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.queryByTestId('account-sort-name')).not.toBeInTheDocument()
    expect(screen.queryByTestId('account-sort-threshold')).not.toBeInTheDocument()

    // Rows stay in the provided (external) order regardless.
    expect(rowNames()).toEqual(['Bravo', 'Alpha', 'Group'])
  })

  it('clears an active column sort when sortableColumns switches off', async () => {
    const { rerender } = render(<SafeAccountsTable items={items} />)
    await userEvent.click(screen.getByTestId('account-sort-name'))
    expect(rowNames()).toEqual(['Alpha', 'Bravo', 'Group'])

    // Switching the surface to a non-Name mode drops the column sort back to the provided order.
    rerender(<SafeAccountsTable items={items} sortableColumns={false} />)
    expect(rowNames()).toEqual(['Bravo', 'Alpha', 'Group'])
  })

  it('renders rows without a column header in embedded mode', () => {
    render(<SafeAccountsTable items={items} embedded columns={['name', 'threshold', 'networks', 'balance']} />)

    // Rows still render...
    expect(rowNames()).toEqual(['Bravo', 'Alpha', 'Group'])
    // ...but the sortable column header is gone (no header row to click).
    expect(screen.queryByTestId('account-sort-name')).not.toBeInTheDocument()
    expect(screen.queryByTestId('account-sort-threshold')).not.toBeInTheDocument()
  })

  it('draws the card outline by default and drops it with bordered={false}, keeping the header', () => {
    const container = () => screen.getByTestId('safe-accounts-table').firstElementChild as HTMLElement

    // Asserted on the classes, not on computed style: the outline moved from an MUI `sx` prop to the
    // colocated CSS module, and jsdom does not evaluate CSS modules — `toHaveStyle` would fail even
    // when the border renders. `containerBorderless` is what zeroes it.
    const { rerender } = render(<SafeAccountsTable items={items} />)
    expect(container().className).toContain('container')
    expect(container().className).not.toContain('containerBorderless')

    rerender(<SafeAccountsTable items={items} bordered={false} />)
    expect(container().className).toContain('containerBorderless')
    // Unlike embedded mode, the borderless table keeps its column header.
    expect(screen.getByTestId('account-sort-name')).toBeInTheDocument()
  })

  it('draws dividers between groups, but not after the last row', () => {
    render(<SafeAccountsTable items={items} />)
    const dividers = screen.getAllByTestId('row').map((row) => row.hasAttribute('data-divider'))
    expect(dividers).toEqual([true, true, false])
  })

  it('draws no dividers in embedded mode', () => {
    render(<SafeAccountsTable items={items} embedded columns={['name', 'threshold', 'networks', 'balance']} />)
    const dividers = screen.getAllByTestId('row').map((row) => row.hasAttribute('data-divider'))
    expect(dividers).toEqual([false, false, false])
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

  it('keeps column-header sorting available while reordering (callers gate it via sortableColumns)', () => {
    render(<SafeAccountsTable items={items} reorder={{ onReorder: jest.fn() }} />)
    expect(screen.getByTestId('account-sort-name')).toBeInTheDocument()
    expect(screen.getByTestId('account-sort-threshold')).toBeInTheDocument()
  })

  it('suppresses column-header sorting while reordering when sortableColumns is off', () => {
    render(<SafeAccountsTable items={items} sortableColumns={false} reorder={{ onReorder: jest.fn() }} />)
    expect(screen.queryByTestId('account-sort-name')).not.toBeInTheDocument()
    expect(screen.queryByTestId('account-sort-threshold')).not.toBeInTheDocument()
  })

  it('does not render drag handles without a reorder prop', () => {
    render(<SafeAccountsTable items={items} />)
    expect(screen.queryByTestId('drag-0xB')).not.toBeInTheDocument()
  })

  it('lets a multi-chain group expand to reveal its per-chain children while reordering', async () => {
    render(<SafeAccountsTable items={items} reorder={{ onReorder: jest.fn() }} />)
    expect(screen.queryByText('Ethereum')).not.toBeInTheDocument()

    await userEvent.click(screen.getByTestId('toggle-0xG'))
    expect(screen.getByText('Ethereum')).toBeInTheDocument()

    await userEvent.click(screen.getByTestId('toggle-0xG'))
    expect(screen.queryByText('Ethereum')).not.toBeInTheDocument()
  })

  it('keeps the drag handle on the parent only — expanded children are not draggable', async () => {
    render(<SafeAccountsTable items={items} reorder={{ onReorder: jest.fn() }} />)
    await userEvent.click(screen.getByTestId('toggle-0xG'))

    expect(screen.getByText('Ethereum')).toBeInTheDocument()
    expect(screen.getByTestId('drag-0xG')).toBeInTheDocument()
    expect(screen.queryByTestId('drag-0xG:1')).not.toBeInTheDocument()
  })
})

describe('SafeAccountsTable — selection mode', () => {
  const selectionGroups: AccountGroup[] = [
    {
      parent: line({ key: '0xB', displayName: 'Bravo' }),
      children: [],
      sort: { name: 'bravo', threshold: 2, owners: 3, networks: 'ethereum', workspaces: 0 },
    },
    {
      parent: line({ key: '0xG', displayName: 'Group', expandable: true, variant: 'group' }),
      children: [
        line({ key: '1:0xG', displayName: 'Ethereum', variant: 'child' }),
        line({ key: '2:0xG', displayName: 'Base', variant: 'child' }),
      ],
      sort: { name: 'group', threshold: 3, owners: 5, networks: 'base', workspaces: 0 },
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

  it('suppresses the rename action on a selection surface by default', () => {
    render(<SafeAccountsTable items={items} selection={{ selectedKeys: new Set(), onToggle: jest.fn() }} />)
    expect(screen.queryByTestId('rename-0xB')).not.toBeInTheDocument()
  })

  it('re-enables the rename action when allowRenameInDialog is set', () => {
    render(
      <SafeAccountsTable
        items={items}
        allowRenameInDialog
        selection={{ selectedKeys: new Set(), onToggle: jest.fn() }}
      />,
    )
    expect(screen.getByTestId('rename-0xB')).toBeInTheDocument()
  })

  it('opens the rename dialog when the rename action is clicked', () => {
    render(
      <SafeAccountsTable
        items={items}
        allowRenameInDialog
        selection={{ selectedKeys: new Set(), onToggle: jest.fn() }}
      />,
    )
    fireEvent.click(screen.getByTestId('rename-0xB'))
    expect(screen.getByTestId('entry-dialog')).toBeInTheDocument()
  })
})

describe('SafeAccountsTable — reorder mode with pinned similarity clusters', () => {
  const clusteredGroups: AccountGroup[] = [
    {
      parent: line({ key: '0xB', displayName: 'Bravo', address: '0xB' }),
      children: [],
      sort: { name: 'bravo', threshold: 2, owners: 3, networks: 'ethereum', workspaces: 0 },
    },
    {
      parent: line({ key: '0xA', displayName: 'Alpha', address: '0xA' }),
      children: [],
      sort: { name: 'alpha', threshold: 5, owners: 7, networks: 'ethereum', workspaces: 2 },
    },
    {
      parent: line({ key: '0xG', displayName: 'Golf', address: '0xG' }),
      children: [],
      sort: { name: 'golf', threshold: 3, owners: 5, networks: 'gnosis', workspaces: 1 },
    },
  ]
  // Alpha is in a similarity cluster → pinned on top, excluded from dragging.
  const similarityGroups = new Map([['0xa', 'cluster-1']])

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSafeAccountRows.mockReturnValue({ groups: clusteredGroups, isLoading: false })
  })

  it('pins the clustered row on top under a single band header, without a drag handle', () => {
    render(<SafeAccountsTable items={items} reorder={{ onReorder: jest.fn() }} similarityGroups={similarityGroups} />)

    expect(rowNames()).toEqual(['Alpha', 'Bravo', 'Golf'])
    expect(screen.getAllByText('Address poisoning warning')).toHaveLength(1)
    expect(screen.queryByTestId('drag-0xA')).not.toBeInTheDocument()
    expect(screen.getByTestId('drag-0xB')).toBeInTheDocument()
    expect(screen.getByTestId('drag-0xG')).toBeInTheDocument()
  })

  it('reports the woven stored order after a drop: pinned keeps its slot, only draggables move', async () => {
    const onReorder = jest.fn()
    render(<SafeAccountsTable items={items} reorder={{ onReorder }} similarityGroups={similarityGroups} />)

    // hello-pangea keyboard drag: lift Bravo (space), move one position down, drop (space). The
    // lift/move work is async (dimension collection in animation frames), so gate each step on the
    // dnd screen-reader announcement instead of firing blind.
    const announcement = () => document.querySelector('[id^="rfd-announcement"]')?.textContent ?? ''
    const handle = screen.getByTestId('drag-0xB')
    handle.focus()
    fireEvent.keyDown(handle, { keyCode: 32 })
    await waitFor(() => expect(announcement()).toContain('lifted'))
    // The lifted row is portaled to <body>, detaching `handle`; the in-drag key bindings live on
    // window and ignore the event target, so fire the remaining keys there.
    fireEvent.keyDown(window, { keyCode: 40 })
    await waitFor(() => expect(announcement()).toContain('moved'))
    fireEvent.keyDown(window, { keyCode: 32 })

    // Draggables were [Bravo, Golf] → [Golf, Bravo]; Alpha (pinned) keeps stored slot #2.
    await waitFor(() => expect(onReorder).toHaveBeenCalledWith(['0xG', '0xA', '0xB']))
  })
})
