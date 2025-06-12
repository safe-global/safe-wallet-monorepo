import { RootState } from '@/src/store'
import { MiddlewareAPI, Dispatch } from 'redux'
import { Strategy, ActionWithPayload } from '@/src/store/utils/strategy/Strategy'
import { trackEvent } from '@/src/services/analytics'
import { selectTotalContactCount } from '@/src/store/addressBookSlice'
import {
  createContactAddedEvent,
  createContactEditedEvent,
  createContactRemovedEvent,
} from '@/src/services/analytics/events/addressBook'

/**
 * Strategy to track address book CRUD operations
 * Tracks when contacts are added, edited, or removed with total contact counts
 */
export class AddressBookTrackingStrategy implements Strategy<RootState, MiddlewareAPI<Dispatch, RootState>> {
  execute(store: MiddlewareAPI<Dispatch, RootState>, action: ActionWithPayload): void {
    const actionType = action.type

    if (actionType === 'addressBook/addContact') {
      this.trackContactAdded(store.getState())
    } else if (actionType === 'addressBook/updateContact') {
      this.trackContactEdited(store.getState())
    } else if (actionType === 'addressBook/removeContact') {
      this.trackContactRemoved(store.getState())
    }
  }

  private trackContactAdded(state: RootState): void {
    try {
      const totalContactCount = selectTotalContactCount(state)
      trackEvent(createContactAddedEvent(totalContactCount)).catch((error) => {
        console.error('[AddressBookTrackingStrategy] Error tracking contact added event:', error)
      })
    } catch (error) {
      console.error('[AddressBookTrackingStrategy] Error in trackContactAdded:', error)
    }
  }

  private trackContactEdited(state: RootState): void {
    try {
      const totalContactCount = selectTotalContactCount(state)
      trackEvent(createContactEditedEvent(totalContactCount)).catch((error) => {
        console.error('[AddressBookTrackingStrategy] Error tracking contact edited event:', error)
      })
    } catch (error) {
      console.error('[AddressBookTrackingStrategy] Error in trackContactEdited:', error)
    }
  }

  private trackContactRemoved(state: RootState): void {
    try {
      const totalContactCount = selectTotalContactCount(state)
      trackEvent(createContactRemovedEvent(totalContactCount)).catch((error) => {
        console.error('[AddressBookTrackingStrategy] Error tracking contact removed event:', error)
      })
    } catch (error) {
      console.error('[AddressBookTrackingStrategy] Error in trackContactRemoved:', error)
    }
  }
}
