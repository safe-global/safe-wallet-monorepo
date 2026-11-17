import { faker } from '@faker-js/faker'
import { fireEvent, render, screen } from '@/tests/test-utils'
import { getStoreInstance } from '@/store'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { ESafeAction, selectSafeActionsModalOpen, selectSafeActionsModalType } from '../../../store'
import NewTransactionButton from '.'

jest.mock('@/services/analytics', () =>
  (
    jest.requireActual('@safe-global/test/mocks/analytics') as { createAnalyticsMock: () => object }
  ).createAnalyticsMock(),
)
const mockTrackEvent = trackEvent as jest.MockedFunction<typeof trackEvent>

describe('NewTransactionButton', () => {
  const spaceId = faker.string.uuid()

  it('opens the Safe picker for a new transaction', () => {
    render(<NewTransactionButton spaceId={spaceId} />)

    fireEvent.click(screen.getByRole('button', { name: 'New transaction' }))

    const state = getStoreInstance().getState()
    expect(selectSafeActionsModalOpen(state)).toBe(true)
    expect(selectSafeActionsModalType(state)).toBe(ESafeAction.NewTransaction)
  })

  it('tracks where the new transaction started', () => {
    render(<NewTransactionButton spaceId={spaceId} />)

    fireEvent.click(screen.getByRole('button', { name: 'New transaction' }))

    expect(mockTrackEvent).toHaveBeenCalledWith(SPACE_EVENTS.TRANSACTION_INITIATED, {
      workspace_id: spaceId,
      action: 'new_transaction',
      entry_point: 'space_transactions',
    })
  })
})
