import { fireEvent, render, screen } from '@/tests/test-utils'
import SafeProPlanSwitchedModal from '../index'

describe('SafeProPlanSwitchedModal', () => {
  it('names the plan, says when the trial ends and what follows, and closes from the CTA', () => {
    const onOpenChange = jest.fn()
    render(
      <SafeProPlanSwitchedModal
        open
        onOpenChange={onOpenChange}
        planName="Starter"
        trialEndsAt={Date.UTC(2026, 8, 20)}
        price="€189/mo"
        seatsLabel="2 Safe accounts"
      />,
    )

    expect(screen.getByRole('heading')).toHaveTextContent("You're on Starter!")
    expect(screen.getByTestId('subscription-seats')).toHaveTextContent('Starter · 2 Safe accounts')
    expect(
      screen.getByText("Your free access continues until Sep 20, 2026. After that, you'll pay €189/mo."),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Get started' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('leaves the date out when the trial end is unknown', () => {
    render(
      <SafeProPlanSwitchedModal open onOpenChange={jest.fn()} planName="Starter" trialEndsAt={null} price="€189/mo" />,
    )

    expect(screen.getByText("Your free access continues. After that, you'll pay €189/mo.")).toBeInTheDocument()
    expect(screen.queryByTestId('subscription-seats')).not.toBeInTheDocument()
  })
})
