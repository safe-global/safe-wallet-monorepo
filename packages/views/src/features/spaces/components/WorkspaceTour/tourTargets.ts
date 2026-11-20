export const TOUR_TARGETS = {
  safeAccountsList: 'safe-accounts-list',
  safeAccountsEmpty: 'safe-accounts-empty',
  workspaceContactsTab: 'workspace-contacts-tab',
  localContactsTab: 'local-contacts-tab',
  takeTour: 'take-tour',
} as const

export type TourTarget = (typeof TOUR_TARGETS)[keyof typeof TOUR_TARGETS]
