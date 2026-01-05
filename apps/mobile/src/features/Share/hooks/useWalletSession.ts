import * as React from 'react'
import { connectSession, type Session } from '@openlv/react-native'

const DUMMY_SIGNATURE = `0x${'11'.repeat(65)}` as const

export function useWalletSession(activeSafeAddress: string) {
  const [connectionUrl, setConnectionUrl] = React.useState<string>('')
  const [status, setStatus] = React.useState<string>('idle')
  const [logLines, setLogLines] = React.useState<string[]>([])
  const [session, setSession] = React.useState<Session | null>(null)

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

      const nextSession = await connectSession(connectionUrl.trim(), async (message) => {
        appendLog(`RPC <= ${JSON.stringify(message)}`)
        const req = message as { method?: string; params?: unknown }

        if (req.method === 'eth_accounts' || req.method === 'eth_requestAccounts') {
          return [activeSafeAddress]
        }

        if (req.method === 'personal_sign') {
          return DUMMY_SIGNATURE
        }

        return 'Unsupported method'
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
  }
}
