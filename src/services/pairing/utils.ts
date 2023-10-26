import { addDays, isAfter } from 'date-fns'
import type { IWalletConnectSession } from '@walletconnect/types'
import type WalletConnect from '@walletconnect/client'

import local from '@/services/local-storage/local'
import { PAIRING_MODULE_STORAGE_ID } from '@/services/pairing/connector'

export const formatPairingUri = (wcUri: string) => {
  const PAIRING_MODULE_URI_PREFIX = 'safe-'

  // A disconnected session returns URI with an empty `key`
  if (!wcUri || !/key=.+/.test(wcUri)) {
    return
  }

  return `${PAIRING_MODULE_URI_PREFIX}${wcUri}`
}

export const killPairingSession = (connector: InstanceType<typeof WalletConnect>) => {
  const TEMP_PEER_ID = '_tempPeerId'

  // WalletConnect throws if no `peerId` is set when attempting to `killSession`
  // We therefore manually set it in order to `killSession` without throwing
  if (!connector.peerId) {
    connector.peerId = TEMP_PEER_ID
  }

  return connector.killSession()
}

export const isPairingSupported = (disabledWallets?: string[]) => {
  return false
}

export const _isPairingSessionExpired = (session: IWalletConnectSession): boolean => {
  // WC appends 3 digits to the timestamp. NOTE: This may change in WC v2
  const sessionTimestamp = session.handshakeId.toString().slice(0, -3)
  // The session is valid for 24h (mobile clears it on their end)
  const expirationDate = addDays(new Date(+sessionTimestamp), 1)

  return isAfter(Date.now(), expirationDate)
}

export const hasValidPairingSession = (): boolean => {
  const cachedSession = local.getItem<IWalletConnectSession>(PAIRING_MODULE_STORAGE_ID)

  if (!cachedSession) {
    return false
  }

  const isExpired = _isPairingSessionExpired(cachedSession)

  if (isExpired) {
    local.removeItem(PAIRING_MODULE_STORAGE_ID)
  }

  return !isExpired
}
