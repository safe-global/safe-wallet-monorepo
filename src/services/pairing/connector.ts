import WalletConnect from '@walletconnect/client'
import bowser from 'bowser'

import packageJson from '../../../package.json'
import { IS_PRODUCTION, SAFE_REACT_URL } from '@/config/constants'
import ExternalStore from '@/services/ExternalStore'

export const PAIRING_MODULE_STORAGE_ID = 'pairingConnector'

export const getClientMeta = () => {
  const APP_META = {
    name: `Safe Web v${packageJson.version}`,
    url: SAFE_REACT_URL,
    icons: [`${SAFE_REACT_URL}/images/favicons/logo_120x120.png`],
  }

  if (typeof window === 'undefined') {
    return {
      description: APP_META.name,
      ...APP_META,
    }
  }

  const parsed = bowser.getParser(window.navigator.userAgent)
  const os = parsed.getOS()
  const browser = parsed.getBrowser()

  return {
    description: `${browser.name} ${browser.version} (${os.name});${APP_META.name}`,
    ...APP_META,
  }
}

export const {
  getStore: getPairingConnector,
  setStore: setPairingConnector,
  useStore: usePairingConnector,
} = new ExternalStore<WalletConnect>()

export enum WalletConnectEvents {
  CONNECT = 'connect',
  DISPLAY_URI = 'display_uri',
  DISCONNECT = 'disconnect',
  CALL_REQUEST = 'call_request',
  SESSION_REQUEST = 'session_request',
  SESSION_UPDATE = 'session_update',
  WC_SESSION_REQUEST = 'wc_sessionRequest',
  WC_SESSION_UPDATE = 'wc_sessionUpdate',
}

if (!IS_PRODUCTION) {
  Object.values(WalletConnectEvents).forEach((event) => {
    getPairingConnector()?.on(event, (...args) => console.info('[Pairing]', event, ...args))
  })
}
