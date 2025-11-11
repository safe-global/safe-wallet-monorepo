import { IS_PRODUCTION } from '@/config/constants'

export const hnSecurityReportBtnConfig = {
  text: 'Review security report',
  baseUrl: IS_PRODUCTION
    ? 'https://app.hypernative.xyz/guardian/transaction-risks'
    : 'https://stage.app.hypernative.xyz/guardian/transaction-risks',
} as const
