import { getBytes, keccak256, toUtf8Bytes, type BrowserProvider } from 'ethers'
import { joinSignature, splitSignature } from '@/utils/ethers-utils'
import { getToken, getMessaging } from 'firebase/messaging'
import { DeviceType } from '@safe-global/safe-gateway-typescript-sdk'
import type { RegisterNotificationsRequest } from '@safe-global/safe-gateway-typescript-sdk'

import { FIREBASE_VAPID_KEY, initializeFirebaseApp } from '@/services/push-notifications/firebase'
import packageJson from '../../../../package.json'
import { logError } from '@/services/exceptions'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { isLedger } from '@/utils/wallets'
import { createWeb3 } from '@/hooks/wallets/web3'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }

// We store UUID locally to track device registration
export type NotificationRegistration = WithRequired<RegisterNotificationsRequest, 'uuid'>

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (Notification.permission === 'granted') {
    return true
  }

  let permission: NotificationPermission | undefined

  try {
    permission = await Notification.requestPermission()
  } catch (e) {
    logError(ErrorCodes._400, e)
  }

  return permission === 'granted'
}

// Ledger produces vrs signatures with a canonical v value of {0,1}
// Ethereum's ecrecover call only accepts a non-standard v value of {27,28}.

// @see https://github.com/ethereum/go-ethereum/issues/19751
export const _adjustLedgerSignatureV = (signature: string): string => {
  const split = splitSignature(signature)

  // @ts-ignore
  if (split.v === 0 || split.v === 1) {
    split.v += 27
  }

  return joinSignature(split)
}

const getSafeRegistrationSignature = async ({
  safeAddresses,
  web3,
  timestamp,
  uuid,
  token,
  isLedger,
}: {
  safeAddresses: Array<string>
  web3: BrowserProvider
  timestamp: string
  uuid: string
  token: string
  isLedger: boolean
}) => {
  const MESSAGE_PREFIX = 'gnosis-safe'

  // Signature must sign `keccack256('gnosis-safe{timestamp-epoch}{uuid}{cloud_messaging_token}{safes_sorted}':
  //   - `{timestamp-epoch}` must be an integer (no milliseconds)
  //   - `{safes_sorted}` must be checksummed safe addresses sorted and joined with no spaces

  // @see https://github.com/safe-global/safe-transaction-service/blob/3644c08ac4b01b6a1c862567bc1d1c81b1a8c21f/safe_transaction_service/notifications/views.py#L19-L24

  const message = MESSAGE_PREFIX + timestamp + uuid + token + safeAddresses.sort().join('')
  const hashedMessage = keccak256(toUtf8Bytes(message))

  const signature = await (await web3.getSigner()).signMessage(getBytes(hashedMessage))

  if (!isLedger) {
    return signature
  }

  return _adjustLedgerSignatureV(signature)
}

export type NotifiableSafes = { [chainId: string]: Array<string> }

export const getRegisterDevicePayload = async ({
  safesToRegister,
  uuid,
  wallet,
}: {
  safesToRegister: NotifiableSafes
  uuid: string
  wallet: ConnectedWallet
}): Promise<RegisterNotificationsRequest> => {
  const BUILD_NUMBER = '0' // Required value, but does not exist on web
  const BUNDLE = 'safe'

  const [serviceWorkerRegistration] = await navigator.serviceWorker.getRegistrations()

  // Get Firebase token
  const app = initializeFirebaseApp()
  const messaging = getMessaging(app)

  const token = await getToken(messaging, {
    vapidKey: FIREBASE_VAPID_KEY,
    serviceWorkerRegistration,
  })

  const web3 = createWeb3(wallet.provider)
  const isLedgerWallet = isLedger(wallet)

  // If uuid is not provided a new device will be created.
  // If a uuid for an existing Safe is provided the FirebaseDevice will be updated with all the new data provided.
  // Safes provided on the request are always added and never removed/replaced

  // @see https://github.com/safe-global/safe-transaction-service/blob/3644c08ac4b01b6a1c862567bc1d1c81b1a8c21f/safe_transaction_service/notifications/views.py#L19-L24

  const timestamp = Math.floor(new Date().getTime() / 1000).toString()

  let safeRegistrations: RegisterNotificationsRequest['safeRegistrations'] = []

  // We cannot `Promise.all` here as Ledger/Trezor return a "busy" error when signing multiple messages at once
  for await (const [chainId, safeAddresses] of Object.entries(safesToRegister)) {
    const checksummedSafeAddresses = safeAddresses.map((address) => checksumAddress(address))

    // We require a signature for confirmation request notifications
    const signature = await getSafeRegistrationSignature({
      safeAddresses: checksummedSafeAddresses,
      web3,
      uuid,
      timestamp,
      token,
      isLedger: isLedgerWallet,
    })

    safeRegistrations.push({
      chainId,
      safes: checksummedSafeAddresses,
      signatures: [signature],
    })
  }

  return {
    uuid,
    cloudMessagingToken: token,
    buildNumber: BUILD_NUMBER,
    bundle: BUNDLE,
    deviceType: DeviceType.WEB,
    version: packageJson.version,
    timestamp,
    safeRegistrations,
  }
}
