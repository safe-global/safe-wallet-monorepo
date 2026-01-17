import * as React from 'react'
import { Keyboard } from 'react-native'
import { connectSession, type Session } from '@openlv/react-native'
import { useSelector } from 'react-redux'
import { RootState } from '@/src/store'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { keyStorageService } from '@/src/services/key-storage'
import { Wallet, getBytes, TypedDataDomain } from 'ethers'
import { Address } from '@/src/types/address'
import { generateSafeMessageTypedData } from '@safe-global/utils/utils/safe-messages'
import { adjustVInSignature } from '@safe-global/protocol-kit/dist/src/utils/signatures'
import { SigningMethod } from '@safe-global/protocol-kit'
import useSafeInfo from '@/src/hooks/useSafeInfo'

export interface PendingRequest {
  type: string
  message: string
  params?: unknown[]
  id?: number | string
  error?: string
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

  const activeSafe = useSelector(selectActiveSafe)
  const activeSigner = useSelector((state: RootState) => state.activeSigner[activeSafeAddress as Address])
  const { safe: safeInfo, safeLoaded } = useSafeInfo()

  const startSession = React.useCallback(async () => {
    try {
      if (!connectionUrl.trim()) {
        throw new Error('Missing connection URL')
      }

      Keyboard.dismiss()
      setStatus('connecting')

      const nextSession = await connectSession(connectionUrl.trim(), async (message): Promise<object | string> => {
        const req = message as { method?: string; params?: unknown[] }

        if (req.method === 'eth_accounts' || req.method === 'eth_requestAccounts') {
          return [activeSafeAddress]
        }

        if (req.method === 'eth_chainId') {
          const chainId = activeSafe?.chainId ? parseInt(activeSafe.chainId) : 1
          return `0x${chainId.toString(16)}`
        }

        if (req.method === 'personal_sign') {
          const params = req.params || []
          const msg = params[0] as string

          if (!activeSigner) {
            setPendingRequest({
              type: 'personal_sign',
              message: msg,
              params: params,
              error: 'No signer available for this Safe. You need to import or create a signer key to sign messages.',
            })
            return Promise.reject({ code: 4100, message: 'No signer available for this Safe' })
          }

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

      if (!safeLoaded || !safeInfo.version) {
        throw new Error('Safe info not loaded')
      }

      const privKey = await keyStorageService.getPrivateKey(activeSigner.value)
      if (!privKey) {
        throw new Error('Could not retrieve private key')
      }

      const wallet = new Wallet(privKey)

      // Decode hex-encoded message if needed
      const rawMessage = pendingRequest.message
      const messageToSign = rawMessage.startsWith('0x') ? new TextDecoder().decode(getBytes(rawMessage)) : rawMessage

      // Generate SafeMessage EIP-712 typed data and sign
      const typedData = generateSafeMessageTypedData(
        safeInfo as Parameters<typeof generateSafeMessageTypedData>[0],
        messageToSign,
      )

      let signature = await wallet.signTypedData(
        typedData.domain as TypedDataDomain,
        typedData.types,
        typedData.message,
      )

      signature = await adjustVInSignature(SigningMethod.ETH_SIGN_TYPED_DATA, signature)

      requestResolver.current.resolve(signature)
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e))
      requestResolver.current.reject(err)
    } finally {
      setPendingRequest(null)
      requestResolver.current = null
    }
  }, [pendingRequest, activeSigner, safeInfo, safeLoaded])

  const rejectRequest = React.useCallback(() => {
    if (requestResolver.current) {
      requestResolver.current.reject(new Error('User rejected request'))
    }
    setPendingRequest(null)
    requestResolver.current = null
  }, [])

  const closeSession = React.useCallback(async () => {
    await session?.close().catch(() => undefined)
    setSession(null)
    setStatus('idle')
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
