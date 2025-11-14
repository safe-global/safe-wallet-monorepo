import { IS_PRODUCTION } from '@/config/constants'

export const hnSecurityReportBtnConfig = {
  text: 'Review security report',
  baseUrl: IS_PRODUCTION
    ? 'https://app.hypernative.xyz/guardian/alert'
    : 'https://stage.app.hypernative.xyz/guardian/alert',
} as const
