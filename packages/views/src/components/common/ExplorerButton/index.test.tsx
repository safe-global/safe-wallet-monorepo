import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ExplorerButton from '.'

const href = 'https://explorer.cow.fi/orders/0x123'

describe('ExplorerButton', () => {
  it('names the link and fills the tooltip when no title is given', async () => {
    render(<ExplorerButton href={href} />)

    const link = screen.getByRole('link', { name: 'View on explorer' })
    expect(link).toHaveAttribute('href', href)

    await userEvent.hover(link)
    expect(await screen.findByText('View on explorer')).toBeVisible()
  })

  it('uses the given title for the link name and the tooltip', async () => {
    render(<ExplorerButton href={href} title="View on Etherscan" />)

    const link = screen.getByRole('link', { name: 'View on Etherscan' })

    await userEvent.hover(link)
    expect(await screen.findByText('View on Etherscan')).toBeVisible()
  })

  it('renders nothing without an href', () => {
    const { container } = render(<ExplorerButton />)

    expect(container).toBeEmptyDOMElement()
  })
})
