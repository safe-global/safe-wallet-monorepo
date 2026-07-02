import { render, screen } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import type { AllSafeItems } from '@/hooks/safes'
import SafeAccountsTable from '../index'
import { useSafeAccountRows, type AccountGroup, type AccountLine } from '../useSafeAccountRows'

jest.mock('../useSafeAccountRows', () => {
  const actual = jest.requireActual('../useSafeAccountRows')
  return { ...actual, useSafeAccountRows: jest.fn() }
})

// Stub the row so the shell's sort/expand/column logic is tested in isolation from the
// heavy per-cell rendering (identicons, chain badges, context menus, balances).
jest.mock('../SafeAccountTableRow', () => ({
  __esModule: true,
  default: ({ line, onToggle }: { line: { key: string; displayName: string }; onToggle?: () => void }) => (
    <tr data-testid="row" data-key={line.key}>
      <td>
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
})
