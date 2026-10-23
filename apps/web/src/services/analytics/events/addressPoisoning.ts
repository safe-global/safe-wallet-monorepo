const ADDRESS_POISONING_CATEGORY = 'address-poisoning'

/** Both take a `Location` property — see `LookalikeWarningLocation`. */
export const ADDRESS_POISONING_EVENTS = {
  WARNING_SHOWN: {
    action: 'Look-alike address warning shown',
    category: ADDRESS_POISONING_CATEGORY,
  },
  WARNING_CONTINUED: {
    action: 'Look-alike address warning continued',
    category: ADDRESS_POISONING_CATEGORY,
  },
}
