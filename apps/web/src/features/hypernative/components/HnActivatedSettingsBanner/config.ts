import { IS_PRODUCTION } from '@/config/constants'

export const hnActivatedSettingsBannerConfig = {
  title: 'Hypernative Guardian',
  description:
    'Automatically monitor and block risky transactions using advanced, user-defined security policies powered by Hypernative.',
  statusLabel: 'Active',
  buttonLabel: 'View on Hypernative',
  // Dummy URL for now
  dashboardUrl: IS_PRODUCTION ? 'https://app.hypernative.xyz/guardian' : 'https://stage.app.hypernative.xyz/guardian',
} as const
