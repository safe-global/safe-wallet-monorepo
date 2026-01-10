import * as React from 'react'
import { Keyboard } from 'react-native'
import { connectSession, type Session } from '@openlv/react-native'
import { useSelector } from 'react-redux'
import { RootState } from '@/src/store'
import { keyStorageService } from '@/src/services/key-storage'
import { Wallet, getBytes } from 'ethers'
import { Address } from '@/src/types/address'

export interface PendingRequest {
  type: string
  message: string
  params?: unknown[]
  id?: number | string
}

export function useWalletSession(activeSafeAddress: string) {
  const [connectionUrl, setConnectionUrl] = React.useState<string>('')
  const [status, setStatus] = React.useState<string>('idle')
  const [session, setSession] = React.useState<Session | null>(null)

  const [pendingRequest, setPendingRequest] = React.useState<PendingRequest | null>(null)
  const requestResolver = React.useRef<{
    resolve: (val: string) => void
    reject: (err: Error) => void
  } | null>(null)

  const activeSigner = useSelector((state: RootState) => state.activeSigner[activeSafeAddress as Address])

  const startSession = React.useCallback(async () => {
    try {
      if (!connectionUrl.trim()) {
        throw new Error('Missing connection URL')
      }

      Keyboard.dismiss()
      setStatus('connecting')

      const nextSession = await connectSession(connectionUrl.trim(), async (message): Promise<object> => {
        const req = message as { method?: string; params?: unknown[] }

        if (req.method === 'eth_accounts' || req.method === 'eth_requestAccounts') {
          return [activeSafeAddress]
        }

        if (req.method === 'personal_sign') {
          const params = req.params || []
          const msg = params[0] as string
          // The signature string is returned as the RPC result - cast to satisfy the handler type
          return new Promise<object>((resolve, reject) => {
            setPendingRequest({
              type: 'personal_sign',
              message: msg,
              params: params,
            })
            requestResolver.current = {
              resolve: resolve as unknown as (val: string) => void,
              reject,
            }
          })
        }

        return { error: 'Unsupported method' }
      })

      nextSession.emitter.on('state_change', (state) => {
        if (typeof state !== 'undefined') {
          setStatus(state.status)
        }
      })

      setSession(nextSession)

      await nextSession.connect()

      void nextSession.waitForLink().then(() => {
        setStatus('linked')
      })
    } catch {
      setStatus('error')
    }
  }, [connectionUrl, activeSafeAddress])

  const confirmRequest = React.useCallback(async () => {
    if (!pendingRequest || !requestResolver.current) {
      return
    }

    try {
      if (!activeSigner) {
        throw new Error('No active signer')
      }

      const privKey = await keyStorageService.getPrivateKey(activeSigner.value)
      if (!privKey) {
        throw new Error('Could not retrieve private key')
      }

      const wallet = new Wallet(privKey)
      let signature = ''

      if (pendingRequest.type === 'personal_sign') {
        // Try to handle hex string or plain string
        let content: string | Uint8Array = pendingRequest.message
        try {
          if (typeof content === 'string' && content.startsWith('0x')) {
            content = getBytes(content)
          }
        } catch {
          // ignore, sign as string
        }
        signature = await wallet.signMessage(content)
      }

      requestResolver.current.resolve(signature)
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e))
      requestResolver.current.reject(err)
    } finally {
      setPendingRequest(null)
      requestResolver.current = null
    }
  }, [pendingRequest, activeSigner])

  const rejectRequest = React.useCallback(() => {
    if (requestResolver.current) {
      requestResolver.current.reject(new Error('User rejected request'))
    }
    setPendingRequest(null)
    requestResolver.current = null
  }, [])

  const closeSession = React.useCallback(async () => {
    try {
      if (!session) {
        return
      }
      await session.close()
      setSession(null)
      setStatus('idle')
    } catch {
      // Session close failed, reset state anyway
      setSession(null)
      setStatus('idle')
    }
  }, [session])

  return {
    connectionUrl,
    setConnectionUrl,
    status,
    session,
    startSession,
    closeSession,
    pendingRequest,
    confirmRequest,
    rejectRequest,
  }
}
