import Cookies from 'js-cookie'

import { BEAMER_ID } from '@/config/constants'
import { APP_VERSION } from '@/config/version'
import local from '@/services/local-storage/local'

export const BEAMER_SELECTOR = 'whats-new-button'

const enum CustomBeamerAttribute {
  CHAIN = 'chain',
}

// Beamer script tag singleton
let scriptRef: HTMLScriptElement | null = null

const isBeamerLoaded = (): boolean => !!scriptRef

export const loadBeamer = async (shortName: string): Promise<void> => {
  if (isBeamerLoaded()) return

  const BEAMER_URL = '/beamer-embed.js?v=' + APP_VERSION

  if (!BEAMER_ID) {
    console.warn('[Beamer] In order to use Beamer you need to add a `product_id`')
    return
  }

  window.beamer_config = {
    product_id: BEAMER_ID,
    selector: BEAMER_SELECTOR,
    display: 'left',
    bounce: false,
    display_position: 'right',
    [CustomBeamerAttribute.CHAIN]: shortName,
  }

  scriptRef = document.createElement('script')
  scriptRef.type = 'text/javascript'
  scriptRef.defer = true
  scriptRef.src = BEAMER_URL

  const firstScript = document.getElementsByTagName('script')[0]
  firstScript?.parentNode?.insertBefore(scriptRef, firstScript)

  scriptRef.addEventListener('load', () => window.Beamer?.init(), { once: true })
}

export const updateBeamer = async (shortName: string): Promise<void> => {
  if (!isBeamerLoaded() || !window?.Beamer) {
    return
  }

  window.Beamer.update({
    [CustomBeamerAttribute.CHAIN]: shortName,
  })
}

export const unloadBeamer = (): void => {
  const BEAMER_LS_RE = /^_BEAMER_/

  const BEAMER_COOKIES = [
    '_BEAMER_LAST_POST_SHOWN_',
    '_BEAMER_DATE_',
    '_BEAMER_FIRST_VISIT_',
    '_BEAMER_USER_ID_',
    '_BEAMER_FILTER_BY_URL_',
    '_BEAMER_LAST_UPDATE_',
    '_BEAMER_BOOSTED_ANNOUNCEMENT_DATE_',
    '_BEAMER_NPS_LAST_SHOWN_',
  ]

  if (!window?.Beamer || !scriptRef) {
    return
  }

  window.Beamer.destroy()
  scriptRef.remove()
  scriptRef = null

  const domain = location.host.split('.').slice(-2).join('.')

  setTimeout(() => {
    local.removeMatching(BEAMER_LS_RE)
    BEAMER_COOKIES.forEach((name) => Cookies.remove(name, { domain, path: '/' }))
  }, 100)
}
