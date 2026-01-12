const SAFE_SHIELD_CATEGORY = 'safe-shield'

export const SAFE_SHIELD_EVENTS = {
  TRANSACTION_STARTED: {
    action: 'Transaction started',
    category: SAFE_SHIELD_CATEGORY,
  },
  RECIPIENT_DECODED: {
    action: 'Transaction recipient decoded',
    category: SAFE_SHIELD_CATEGORY,
  },
  CONTRACT_DECODED: {
    action: 'Transaction contract decoded',
    category: SAFE_SHIELD_CATEGORY,
  },
  THREAT_ANALYZED: {
    action: 'Transaction threat analyzed',
    category: SAFE_SHIELD_CATEGORY,
  },
  CUSTOM_CHECKS_ANALYZED: {
    action: 'Transaction custom checks analyzed (Hypernative)',
    category: SAFE_SHIELD_CATEGORY,
  },
  SIMULATED: {
    action: 'Transaction simulated',
    category: SAFE_SHIELD_CATEGORY,
  },
  REPORT_MODAL_OPENED: {
    action: 'Report false result modal opened',
    category: SAFE_SHIELD_CATEGORY,
  },
  REPORT_SUBMITTED: {
    action: 'Report false result submitted',
    category: SAFE_SHIELD_CATEGORY,
  },
}
