import * as React from 'react'
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
  const [logLines, setLogLines] = React.useState<string[]>([])
  const [session, setSession] = React.useState<Session | null>(null)

  const [pendingRequest, setPendingRequest] = React.useState<PendingRequest | null>(null)
  const requestResolver = React.useRef<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolve: (val: any) => void
    reject: (err: Error) => void
  } | null>(null)

  const activeSigner = useSelector((state: RootState) => state.activeSigner[activeSafeAddress as Address])

  const appendLog = React.useCallback((line: string) => {
    setLogLines((prev) => [line, ...prev].slice(0, 50))
  }, [])

  const startSession = React.useCallback(async () => {
    try {
      if (!connectionUrl.trim()) {
        throw new Error('Missing connection URL')
      }

      setStatus('connecting')
      appendLog('Connecting…')

      const nextSession = await connectSession(connectionUrl.trim(), async (message): Promise<object> => {
        appendLog(`RPC <= ${JSON.stringify(message)}`)
        const req = message as { method?: string; params?: unknown[] }

        if (req.method === 'eth_accounts' || req.method === 'eth_requestAccounts') {
          return [activeSafeAddress]
        }

        if (req.method === 'personal_sign') {
          const params = req.params || []
          const msg = params[0] as string
          return new Promise((resolve, reject) => {
            setPendingRequest({
              type: 'personal_sign',
              message: msg,
              params: params,
            })
            requestResolver.current = { resolve, reject }
          })
        }

        return { error: 'Unsupported method' }
      })

      nextSession.emitter.on('state_change', (state) => {
        if (typeof state !== 'undefined') {
          appendLog(`session state => ${state.status}`)
          setStatus(`session: ${state.status}`)
        }
      })

      setSession(nextSession)

      await nextSession.connect()

      appendLog('Connected; waiting for link…')
      void nextSession.waitForLink().then(() => {
        appendLog('Linked! (transport should start)')
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      appendLog(`ERROR: ${msg}`)
      setStatus('error')
    }
  }, [appendLog, connectionUrl, activeSafeAddress])

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
      appendLog('Request approved')
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e))
      appendLog(`Sign Error: ${err.message}`)
      requestResolver.current.reject(err)
    } finally {
      setPendingRequest(null)
      requestResolver.current = null
    }
  }, [pendingRequest, activeSigner, appendLog])

  const rejectRequest = React.useCallback(() => {
    if (requestResolver.current) {
      requestResolver.current.reject(new Error('User rejected request'))
    }
    setPendingRequest(null)
    requestResolver.current = null
    appendLog('User rejected request')
  }, [appendLog])

  const closeSession = React.useCallback(async () => {
    try {
      if (!session) {
        return
      }
      appendLog('Closing session…')
      await session.close()
      setSession(null)
      setStatus('idle')
      appendLog('Closed.')
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      appendLog(`ERROR: ${msg}`)
    }
  }, [appendLog, session])

  return {
    connectionUrl,
    setConnectionUrl,
    status,
    logLines,
    session,
    startSession,
    closeSession,
    pendingRequest,
    confirmRequest,
    rejectRequest,
  }
}
