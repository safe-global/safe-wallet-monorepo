import { GTM_EVENT } from '@/services/analytics/analytics'

const TX_LIST_CATEGORY = 'tx-list'

export const TX_LIST_EVENTS = {
  QUEUED_TXS: {
    event: GTM_EVENT.META,
    action: 'Queued transactions',
    category: TX_LIST_CATEGORY,
  },
  ADDRESS_BOOK: {
    action: 'Update address book',
    category: TX_LIST_CATEGORY,
  },
  COPY_DEEPLINK: {
    action: 'Copy deeplink',
    category: TX_LIST_CATEGORY,
  },
  CONFIRM: {
    action: 'Confirm transaction',
    category: TX_LIST_CATEGORY,
  },
  EXECUTE: {
    action: 'Execute transaction',
    category: TX_LIST_CATEGORY,
  },
  REJECT: {
    action: 'Reject transaction',
    category: TX_LIST_CATEGORY,
  },
  FILTER: {
    action: 'Filter transactions',
    category: TX_LIST_CATEGORY,
  },
  BATCH_EXECUTE: {
    action: 'Batch Execute',
    category: TX_LIST_CATEGORY,
  },
}
