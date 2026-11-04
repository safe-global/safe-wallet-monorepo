import { render, screen } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import OrderId from '.'

const orderId = '0xba777203a69aeb5a65fcdec0ae40fe16b398d54609bc9a3c8be3eb57d1a0fd07'
const href = `https://explorer.cow.fi/orders/${orderId}`

describe('OrderId', () => {
  it('shows a tooltip with text on the explorer link', async () => {
    render(<OrderId orderId={orderId} href={href} />)

    expect(screen.getByText('ba777203')).toBeInTheDocument()

    const link = screen.getByRole('link', { name: 'View on explorer' })
    expect(link).toHaveAttribute('href', href)

    await userEvent.hover(link)
    expect(await screen.findByText('View on explorer')).toBeVisible()
  })
})
