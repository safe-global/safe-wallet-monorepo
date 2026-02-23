const ATTENTION_PANEL_CATEGORY = 'attention_panel'

export const ATTENTION_PANEL_EVENTS = {
  // Unsupported Mastercopy
  MIGRATE_MASTERCOPY: {
    action: 'Migrate unsupported mastercopy',
    category: ATTENTION_PANEL_CATEGORY,
  },
  GET_CLI_MASTERCOPY: {
    action: 'Get CLI for unsupported mastercopy',
    category: ATTENTION_PANEL_CATEGORY,
  },

  // Inconsistent Signers
  REVIEW_SIGNERS: {
    action: 'Review inconsistent signers',
    category: ATTENTION_PANEL_CATEGORY,
  },

  CHECK_RECOVERY_PROPOSAL: {
    action: 'Check recovery proposal',
    category: ATTENTION_PANEL_CATEGORY,
  },

  TRUST_SAFE: {
    action: 'Trust Safe from warning',
    category: ATTENTION_PANEL_CATEGORY,
  },
}
