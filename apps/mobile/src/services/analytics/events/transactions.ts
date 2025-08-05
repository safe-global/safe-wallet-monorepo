import { EventType, type AnalyticsLabel } from '../types'

const TRANSACTIONS_CATEGORY = 'transactions'

export const TRANSACTIONS_EVENTS = {
  CONFIRM: {
    eventName: EventType.TX_CONFIRMED,
    eventCategory: TRANSACTIONS_CATEGORY,
    eventAction: 'Confirm transaction',
    // eventLabel can be set when tracking the event using AnalyticsLabel
  },
  CREATE: {
    eventName: EventType.TX_CREATED,
    eventCategory: TRANSACTIONS_CATEGORY,
    eventAction: 'Create transaction',
    // eventLabel can be set when tracking the event using AnalyticsLabel
  },
  EXECUTE: {
    eventName: EventType.TX_EXECUTED,
    eventCategory: TRANSACTIONS_CATEGORY,
    eventAction: 'Execute transaction',
    // eventLabel can be set when tracking the event using AnalyticsLabel
  },
}

// Helper function to create a transaction confirm event with a specific label
export const createTxConfirmEvent = (label: AnalyticsLabel) => ({
  ...TRANSACTIONS_EVENTS.CONFIRM,
  eventLabel: label,
})

// Helper function to create a transaction create event with a specific label
export const createTxCreateEvent = (label: AnalyticsLabel) => ({
  ...TRANSACTIONS_EVENTS.CREATE,
  eventLabel: label,
})

// Helper function to create a transaction execute event with a specific label
export const createTxExecuteEvent = (label: AnalyticsLabel) => ({
  ...TRANSACTIONS_EVENTS.EXECUTE,
  eventLabel: label,
})
