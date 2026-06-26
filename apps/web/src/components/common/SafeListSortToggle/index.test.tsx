import { render, screen } from '@/tests/test-utils'
import {
  ORDER_BY_RESET_VERSION,
  OrderByOption,
  ALL_SORT_OPTIONS,
  setOrderByPreference,
} from '@/store/orderByPreferenceSlice'
import SafeListSortToggle, { sortChangeAction } from '.'

// The popup/menu open state is verified in the browser: base-ui menus don't open in jsdom,
// so here we cover that the trigger mounts and reflects the persisted preference.
describe('SafeListSortToggle', () => {
  it('renders the trigger reflecting the default sort option (Name)', () => {
    render(<SafeListSortToggle />)
    const trigger = screen.getByTestId('safe-list-sort-toggle')
    expect(trigger).toBeInTheDocument()
    expect(trigger).toHaveTextContent('Name')
  })

  it('labels the last-visited sort as "Last visited"', () => {
    render(<SafeListSortToggle />, {
      initialReduxState: {
        orderByPreference: { orderBy: OrderByOption.LAST_VISITED, resetVersion: ORDER_BY_RESET_VERSION },
      },
    })
    expect(screen.getByTestId('safe-list-sort-toggle')).toHaveTextContent('Last visited')
  })

  it('shows "Balance" on the trigger when given the extended options', () => {
    render(<SafeListSortToggle options={ALL_SORT_OPTIONS} />, {
      initialReduxState: {
        orderByPreference: { orderBy: OrderByOption.BALANCE, resetVersion: ORDER_BY_RESET_VERSION },
      },
    })
    expect(screen.getByTestId('safe-list-sort-toggle')).toHaveTextContent('Balance')
  })

  it('falls back to Name when the persisted order is Balance but the basic options are used (modal)', () => {
    render(<SafeListSortToggle />, {
      initialReduxState: {
        orderByPreference: { orderBy: OrderByOption.BALANCE, resetVersion: ORDER_BY_RESET_VERSION },
      },
    })
    const trigger = screen.getByTestId('safe-list-sort-toggle')
    expect(trigger).toHaveTextContent('Name')
    expect(trigger).not.toHaveTextContent('Balance')
  })
})

describe('sortChangeAction', () => {
  it('returns a setOrderByPreference action for a newly chosen option', () => {
    expect(sortChangeAction(OrderByOption.BALANCE, OrderByOption.NAME)).toEqual(
      setOrderByPreference({ orderBy: OrderByOption.BALANCE }),
    )
  })

  it('returns null when re-selecting the shown option (no clobber)', () => {
    expect(sortChangeAction(OrderByOption.NAME, OrderByOption.NAME)).toBeNull()
  })
})
