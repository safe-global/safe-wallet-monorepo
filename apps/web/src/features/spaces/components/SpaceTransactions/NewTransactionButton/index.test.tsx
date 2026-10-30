import { faker } from '@faker-js/faker'
import { fireEvent, render, screen } from '@testing-library/react'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { ESafeAction, openSafeActionsModal } from '../../../store'
import NewTransactionButton from '.'

const mockTrackEvent = jest.fn()
jest.mock('@/services/analytics', () => ({
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
}))

const mockDispatch = jest.fn()
jest.mock('@/store', () => ({
  useAppDispatch: () => mockDispatch,
}))

describe('NewTransactionButton', () => {
  const spaceId = faker.string.uuid()

  it('opens the Safe picker for a new transaction and tracks where it started', () => {
    render(<NewTransactionButton spaceId={spaceId} />)

    fireEvent.click(screen.getByRole('button', { name: 'New transaction' }))

    expect(mockDispatch).toHaveBeenCalledWith(openSafeActionsModal({ type: ESafeAction.NewTransaction }))
    expect(mockTrackEvent).toHaveBeenCalledWith(SPACE_EVENTS.TRANSACTION_INITIATED, {
      workspace_id: spaceId,
      action: 'new_transaction',
      entry_point: 'space_transactions',
    })
  })
})
