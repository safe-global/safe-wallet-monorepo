import { EventType } from '@/services/analytics'

const RECOVERY_CATEGORY = 'recovery'

export const RECOVERY_EVENTS = {
  SETUP_RECOVERY: {
    action: 'Start recovery setup',
    category: RECOVERY_CATEGORY,
  },
  SELECT_RECOVERY_METHOD: {
    action: 'Select recovery method',
    category: RECOVERY_CATEGORY,
  },
  CONTINUE_WITH_RECOVERY: {
    action: 'Continue with recovery method',
    category: RECOVERY_CATEGORY,
  },
  CONTINUE_TO_WAITLIST: {
    action: 'Continue to waitlist',
    category: RECOVERY_CATEGORY,
  },
  SYGNUM_APP: {
    action: 'Go to Sygnum app',
    category: RECOVERY_CATEGORY,
  },
  RECOVERY_SETTINGS: {
    action: 'Recovery settings',
    category: RECOVERY_CATEGORY,
    event: EventType.META,
  },
  EDIT_RECOVERY: {
    action: 'Start edit recovery',
    category: RECOVERY_CATEGORY,
  },
  REMOVE_RECOVERY: {
    action: 'Start recovery removal',
    category: RECOVERY_CATEGORY,
  },
  START_RECOVERY: {
    action: 'Start recovery proposal',
    category: RECOVERY_CATEGORY,
  },
  CANCEL_RECOVERY: {
    action: 'Start recovery cancellation',
    category: RECOVERY_CATEGORY,
  },
  SHOW_ADVANCED: {
    action: 'Show advanced recovery settings',
    category: RECOVERY_CATEGORY,
  },
  DISMISS_PROPOSAL_CARD: {
    action: 'Dismiss recovery proposal card',
    category: RECOVERY_CATEGORY,
  },
  LEARN_MORE: {
    action: 'Recovery info click',
    category: RECOVERY_CATEGORY,
  },
  GO_BACK: {
    action: 'Recovery cancellation back',
    category: RECOVERY_CATEGORY,
  },
  GIVE_US_FEEDBACK: {
    action: 'Recovery feedback click',
    category: RECOVERY_CATEGORY,
    event: EventType.CLICK,
  },
  CHECK_RECOVERY_PROPOSAL: {
    action: 'Check recovery proposal',
    category: RECOVERY_CATEGORY,
  },
  SUBMIT_RECOVERY_CREATE: {
    action: 'Submit recovery setup',
    category: RECOVERY_CATEGORY,
    event: EventType.META,
  },
  SUBMIT_RECOVERY_EDIT: {
    action: 'Submit recovery edit',
    category: RECOVERY_CATEGORY,
    event: EventType.META,
  },
  SUBMIT_RECOVERY_REMOVE: {
    action: 'Submit recovery remove',
    category: RECOVERY_CATEGORY,
    event: EventType.META,
  },
  SUBMIT_RECOVERY_ATTEMPT: {
    action: 'Submit recovery attempt',
    category: RECOVERY_CATEGORY,
    event: EventType.META,
  },
  SUBMIT_RECOVERY_CANCEL: {
    action: 'Submit recovery cancel',
    category: RECOVERY_CATEGORY,
    event: EventType.META,
  },
}
