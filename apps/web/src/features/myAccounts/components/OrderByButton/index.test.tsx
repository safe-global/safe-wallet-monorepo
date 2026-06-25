import { render, screen } from '@/tests/test-utils'
import { fireEvent } from '@testing-library/react'
import OrderByButton from '.'
import { OrderByOption } from '@/store/orderByPreferenceSlice'

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

describe('OrderByButton', () => {
  it('shows the current order in the trigger', () => {
    render(<OrderByButton orderBy={OrderByOption.LAST_VISITED} onOrderByChange={jest.fn()} />)
    expect(screen.getByTestId('sortby-button')).toHaveTextContent('Last visited')
  })

  it('shows Name when the order is Balance (this control cannot sort by balance)', () => {
    render(<OrderByButton orderBy={OrderByOption.BALANCE} onOrderByChange={jest.fn()} />)
    const trigger = screen.getByTestId('sortby-button')
    expect(trigger).toHaveTextContent('Name')
    expect(trigger).not.toHaveTextContent('Balance')
  })

  it('does not re-dispatch when the displayed (coerced) option is clicked', async () => {
    const onOrderByChange = jest.fn()
    render(<OrderByButton orderBy={OrderByOption.BALANCE} onOrderByChange={onOrderByChange} />)
    fireEvent.click(screen.getByTestId('sortby-button'))
    // Name is shown selected because Balance is coerced to Name here; clicking it must not clobber Balance.
    fireEvent.click(await screen.findByTestId('name-option'))
    expect(onOrderByChange).not.toHaveBeenCalled()
  })

  it('dispatches when a different order is chosen', async () => {
    const onOrderByChange = jest.fn()
    render(<OrderByButton orderBy={OrderByOption.BALANCE} onOrderByChange={onOrderByChange} />)
    fireEvent.click(screen.getByTestId('sortby-button'))
    fireEvent.click(await screen.findByTestId('last-visited-option'))
    expect(onOrderByChange).toHaveBeenCalledWith(OrderByOption.LAST_VISITED)
  })
})
