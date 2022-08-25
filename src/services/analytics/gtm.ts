import TagManager, { TagManagerArgs } from 'react-gtm-module'
import Cookies from 'js-cookie'
import {
  IS_PRODUCTION,
  GOOGLE_TAG_MANAGER_ID,
  GOOGLE_TAG_MANAGER_AUTH_LIVE,
  GOOGLE_TAG_MANAGER_AUTH_LATEST,
  GOOGLE_TAG_MANAGER_DEVELOPMENT_AUTH,
} from '@/config/constants'
import { AnalyticsEvent, EventLabel, EventType } from './types'

type GTMEnvironment = 'LIVE' | 'LATEST' | 'DEVELOPMENT'
type GTMEnvironmentArgs = Required<Pick<TagManagerArgs, 'auth' | 'preview'>>

const GOOGLE_ANALYTICS_COOKIE_LIST = ['_ga', '_gat', '_gid']

const GTM_ENV_AUTH: Record<GTMEnvironment, GTMEnvironmentArgs> = {
  LIVE: {
    auth: GOOGLE_TAG_MANAGER_AUTH_LIVE,
    preview: 'env-1',
  },
  LATEST: {
    auth: GOOGLE_TAG_MANAGER_AUTH_LATEST,
    preview: 'env-2',
  },
  DEVELOPMENT: {
    auth: GOOGLE_TAG_MANAGER_DEVELOPMENT_AUTH,
    preview: 'env-3',
  },
}

let _chainId: string = ''

export const setChainId = (chainId: string): void => {
  _chainId = chainId
}

export const gtmInit = (): void => {
  const GTM_ENVIRONMENT = IS_PRODUCTION ? GTM_ENV_AUTH.LIVE : GTM_ENV_AUTH.DEVELOPMENT

  if (!GOOGLE_TAG_MANAGER_ID || !GTM_ENVIRONMENT.auth) {
    console.warn('[GTM] - Unable to initialize Google Tag Manager. `id` or `gtm_auth` missing.')
    return
  }

  TagManager.initialize({
    gtmId: GOOGLE_TAG_MANAGER_ID,
    ...GTM_ENVIRONMENT,
    dataLayer: {
      // Block JS variables and custom scripts
      // @see https://developers.google.com/tag-platform/tag-manager/web/restrict
      'gtm.blocklist': ['j', 'jsm', 'customScripts'],
    },
  })
}

export const gtmClear = (): void => {
  if (!window.dataLayer) return

  // Delete GA cookies
  const path = '/'
  const domain = `.${location.host.split('.').slice(-2).join('.')}`
  GOOGLE_ANALYTICS_COOKIE_LIST.forEach((cookie) => {
    Cookies.remove(cookie, { path, domain })
  })
}

type GtmEvent = {
  event: EventType
  chainId: string
  eventCategory: string
  eventAction: string
  eventLabel?: EventLabel
}

export const gtmTrack = (eventData: AnalyticsEvent): void => {
  if (!window.dataLayer) return

  const gtmEvent: GtmEvent = {
    event: eventData.event || EventType.CLICK,
    chainId: _chainId,
    eventCategory: eventData.category,
    eventAction: eventData.action,
    eventLabel: eventData.label,
  }

  TagManager.dataLayer({
    dataLayer: gtmEvent,
  })
}
