import { render } from '@/tests/test-utils'
import TransactionDetailsError, { TX_DETAILS_LOAD_ERROR } from './TransactionDetailsError'

describe('TransactionDetailsError', () => {
  it('renders the default load failure copy with a reload CTA', async () => {
    const onReload = jest.fn()
    const screen = render(<TransactionDetailsError onReload={onReload} />)

    expect(screen.getByText(TX_DETAILS_LOAD_ERROR)).toBeInTheDocument()

    const reload = screen.getByRole('button', { name: 'Reload' })
    reload.click()

    expect(onReload).toHaveBeenCalledTimes(1)
  })

  it('renders a custom message', () => {
    const screen = render(<TransactionDetailsError message="Nothing here." onReload={jest.fn()} />)

    expect(screen.getByText('Nothing here.')).toBeInTheDocument()
    expect(screen.queryByText(TX_DETAILS_LOAD_ERROR)).not.toBeInTheDocument()
  })

  it('omits the CTA when reloading cannot recover the state', () => {
    const screen = render(<TransactionDetailsError />)

    expect(screen.queryByRole('button', { name: 'Reload' })).not.toBeInTheDocument()
  })
})
