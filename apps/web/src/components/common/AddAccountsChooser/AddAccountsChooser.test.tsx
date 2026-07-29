import { render, screen } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import AddAccountsChooser from './index'

const mockTrackEvent = jest.fn()
jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
}))

describe('AddAccountsChooser (My accounts)', () => {
  beforeEach(() => {
    mockTrackEvent.mockClear()
  })

  const renderChooser = (props: Parameters<typeof AddAccountsChooser>[0] = {}, push = jest.fn()) => {
    render(<AddAccountsChooser {...props} />, {
      routerProps: { push, pathname: '/welcome/accounts', query: {} },
    })
    return push
  }

  const openChooser = () => userEvent.click(screen.getByTestId('open-add-accounts-chooser-button'))

  it('renders the trigger with the "Add accounts" label', () => {
    renderChooser()
    expect(screen.getByTestId('open-add-accounts-chooser-button')).toHaveTextContent('Add accounts')
  })

  it('does not render the dialog until the trigger is clicked', () => {
    renderChooser()
    expect(screen.queryByRole('heading', { name: 'Add Safe accounts' })).not.toBeInTheDocument()
  })

  it('opens the chooser dialog with both options', async () => {
    renderChooser()
    await openChooser()

    expect(screen.getByRole('heading', { name: 'Add Safe accounts' })).toBeInTheDocument()
    expect(screen.getByTestId('add-accounts-select-existing')).toHaveTextContent('Select existing')
    expect(screen.getByTestId('add-accounts-create-new')).toHaveTextContent('Create new')
  })

  it('navigates to /new-safe/load with the current page as `next` when selecting existing', async () => {
    const push = renderChooser()
    await openChooser()
    await userEvent.click(screen.getByTestId('add-accounts-select-existing'))

    expect(push).toHaveBeenCalledWith({ pathname: '/new-safe/load', query: { next: '/welcome/accounts' } })
    expect(mockTrackEvent).toHaveBeenCalledWith(expect.objectContaining({ action: 'Add Safe to watchlist' }))
  })

  it('navigates to /new-safe/create with the current page as `next` when creating new', async () => {
    const push = renderChooser()
    await openChooser()
    await userEvent.click(screen.getByTestId('add-accounts-create-new'))

    expect(push).toHaveBeenCalledWith({ pathname: '/new-safe/create', query: { next: '/welcome/accounts' } })
    expect(mockTrackEvent).toHaveBeenCalledWith(expect.objectContaining({ action: 'Create new Safe' }))
  })

  it('calls onLinkClick when a row navigates (closes the sidebar drawer)', async () => {
    const onLinkClick = jest.fn()
    renderChooser({ onLinkClick })
    await openChooser()
    await userEvent.click(screen.getByTestId('add-accounts-create-new'))

    expect(onLinkClick).toHaveBeenCalledTimes(1)
  })
})
