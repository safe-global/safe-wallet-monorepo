import { render, screen } from '@/tests/test-utils'
import { ORDER_BY_RESET_VERSION, OrderByOption } from '@/store/orderByPreferenceSlice'
import SafeListSortToggle from '.'

// The popup/menu open state is verified in the browser: base-ui menus don't open in jsdom
// (the repo mocks dropdown-menu elsewhere), so here we cover that the trigger mounts and
// reflects the persisted order preference.
describe('SafeListSortToggle', () => {
  it('renders the trigger reflecting the default sort option (Name)', () => {
    render(<SafeListSortToggle />)

    const trigger = screen.getByTestId('safe-list-sort-toggle')
    expect(trigger).toBeInTheDocument()
    expect(trigger).toHaveTextContent('Name')
  })

  it('labels the last-visited sort as "Last visited"', () => {
    render(<SafeListSortToggle />, {
      // resetVersion must match or the store's hydration reducer reverts to the default order.
      initialReduxState: {
        orderByPreference: { orderBy: OrderByOption.LAST_VISITED, resetVersion: ORDER_BY_RESET_VERSION },
      },
    })

    expect(screen.getByTestId('safe-list-sort-toggle')).toHaveTextContent('Last visited')
  })

  it('labels the manual sort as "Manual"', () => {
    render(<SafeListSortToggle />, {
      initialReduxState: {
        orderByPreference: { orderBy: OrderByOption.MANUAL, resetVersion: ORDER_BY_RESET_VERSION },
      },
    })

    expect(screen.getByTestId('safe-list-sort-toggle')).toHaveTextContent('Manual')
  })
})
