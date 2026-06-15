import { render, screen } from '@/tests/test-utils'
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
})
