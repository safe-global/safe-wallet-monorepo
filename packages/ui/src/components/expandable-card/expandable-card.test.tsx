import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExpandableCard } from './expandable-card'

describe('ExpandableCard', () => {
  it('toggles the details and names the trigger for screen readers', async () => {
    render(
      <ExpandableCard summary={<span>Payroll · 3 recipients</span>} detailsLabel="recipient details">
        <p>Alice, Bob, Carol</p>
      </ExpandableCard>,
    )

    const trigger = screen.getByRole('button', { name: 'Show recipient details' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Alice, Bob, Carol')).not.toBeInTheDocument()

    await userEvent.click(trigger)

    expect(screen.getByRole('button', { name: 'Hide recipient details' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Alice, Bob, Carol')).toBeVisible()
  })

  it('starts open with defaultOpen', () => {
    render(
      <ExpandableCard summary="Tokens" detailsLabel="token details" defaultOpen>
        <p>USDC, DAI</p>
      </ExpandableCard>,
    )

    expect(screen.getByText('USDC, DAI')).toBeVisible()
  })

  it('follows open and reports changes when controlled', async () => {
    const onOpenChange = jest.fn()
    const { rerender } = render(
      <ExpandableCard summary="Tokens" detailsLabel="token details" open={false} onOpenChange={onOpenChange}>
        <p>USDC, DAI</p>
      </ExpandableCard>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Show token details' }))
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(screen.queryByText('USDC, DAI')).not.toBeInTheDocument()

    rerender(
      <ExpandableCard summary="Tokens" detailsLabel="token details" open onOpenChange={onOpenChange}>
        <p>USDC, DAI</p>
      </ExpandableCard>,
    )
    expect(screen.getByText('USDC, DAI')).toBeVisible()
  })
})
