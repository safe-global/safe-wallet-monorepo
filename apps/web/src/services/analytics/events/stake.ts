const STAKE_CATEGORY = 'stake'

export const STAKE_EVENTS = {
  OPEN_STAKE: {
    action: 'Open stake',
    category: STAKE_CATEGORY,
  },
  STAKE_VIEWED: {
    action: 'Stake viewed',
    category: STAKE_CATEGORY,
  },
}

export enum STAKE_LABELS {
  dashboard = 'dashboard',
  sidebar = 'sidebar',
  asset = 'asset',
}
