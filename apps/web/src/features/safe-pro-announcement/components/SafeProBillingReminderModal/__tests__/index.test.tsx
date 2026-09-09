import { fireEvent, render, screen } from '@/tests/test-utils'
import SafeProBillingReminderModal from '../index'

describe('SafeProBillingReminderModal', () => {
  it('shows the lock date, dismisses from "Not now" and fires the billing CTA', () => {
    const onOpenChange = jest.fn()
    const onAddBillingDetails = jest.fn()
    render(
      <SafeProBillingReminderModal
        open
        onOpenChange={onOpenChange}
        onAddBillingDetails={onAddBillingDetails}
        trialEndsAt={Date.UTC(2026, 11, 1, 12)}
      />,
    )

    expect(screen.getByText(/by Dec 1, 2026, your Workspace will be locked/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Not now' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)

    fireEvent.click(screen.getByRole('button', { name: 'Add billing details' }))
    expect(onAddBillingDetails).toHaveBeenCalled()
  })
})
