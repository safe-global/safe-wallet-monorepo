import {
  type SIWESession,
  type SIWEVerifyMessageArgs,
  type SIWECreateMessageArgs,
  createSIWEConfig,
  formatMessage,
} from '@reown/appkit-siwe'
import { BACKEND_AUTH_URI } from '@/config/constants'
import { AppKitNetwork } from '@reown/appkit/networks'

export async function getSession() {
  const res = await fetch(BACKEND_AUTH_URI + '/session', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  })
  if (!res.ok) {
    throw new Error('Network response was not ok')
  }

  const data = await res.json()
  return data == '{}' ? null : (data as SIWESession)
}

const verifyMessage = async ({ message, signature }: SIWEVerifyMessageArgs) => {
  try {
    const response = await fetch(BACKEND_AUTH_URI + '/verify', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      body: JSON.stringify({ message, signature }),
      credentials: 'include',
    })

    if (!response.ok) {
      return false
    }

    const result = await response.json()
    return result === true
  } catch (error) {
    return false
  }
}

const signOut = async (): Promise<boolean> => {
  const res = await fetch(BACKEND_AUTH_URI + '/signout', {
    method: 'GET',
    credentials: 'include',
  })
  if (!res.ok) {
    throw new Error('Network response was not ok')
  }

  const data = await res.json()
  return data == '{}'
}

const getNonce = async (): Promise<string> => {
  const res = await fetch(BACKEND_AUTH_URI + '/nonce', {
    method: 'GET',
    credentials: 'include',
  })
  if (!res.ok) {
    throw new Error('Network response was not ok')
  }
  const nonce = await res.text()
  console.log('Nonce:', nonce)
  return nonce
}

export const createSIWE = (chains: [AppKitNetwork, ...AppKitNetwork[]]) => {
  return createSIWEConfig({
    signOutOnAccountChange: true,
    signOutOnDisconnect: true,
    getMessageParams: async () => ({
      domain: window.location.host,
      uri: window.location.origin,
      chains: chains.map((chain: AppKitNetwork) => parseInt(chain.id.toString())),
      statement: 'Welcome to SuperAccounts!\nPlease sign this message',
    }),
    sessionRefetchIntervalMs: 1000 * 60 * 5,
    createMessage: ({ address, ...args }: SIWECreateMessageArgs) => formatMessage(args, address),
    getNonce,
    getSession,
    verifyMessage,
    signOut,
  })
}
