const ADDRESS_POISONING_CATEGORY = 'address-poisoning'

/** All take a `Location` property — see `LookalikeWarningLocation`. Dismissed also takes `Dismiss Action` (cancel / skip). */
export const ADDRESS_POISONING_EVENTS = {
  WARNING_SHOWN: {
    action: 'Look-alike address warning shown',
    category: ADDRESS_POISONING_CATEGORY,
  },
  WARNING_CONTINUED: {
    action: 'Look-alike address warning continued',
    category: ADDRESS_POISONING_CATEGORY,
  },
  WARNING_DISMISSED: {
    action: 'Look-alike address warning dismissed',
    category: ADDRESS_POISONING_CATEGORY,
  },
}
