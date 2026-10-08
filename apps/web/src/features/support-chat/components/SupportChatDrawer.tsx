import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FRAME_DIMENSIONS, SupportChatDrawerView } from '@views/features/support-chat/components/SupportChatDrawerView'

// Types
type ChatStatus = 'idle' | 'waiting' | 'config-sent' | 'ready' | 'error'

type SupportChatMessage =
  | { type: 'pylon-request-config' }
  | { type: 'pylon-chat-ready' }
  | { type: 'pylon-chat-error'; reason?: string }
  | { type: 'pylon-chat-size'; width?: number; height?: number }
  | { type: 'pylon-config'; payload?: { chatSettings?: Record<string, unknown> } }
  | { type: 'pylon-open-chat' }
  | { type: 'pylon-close-chat' }
  | { type: 'pylon-chat-closed' }

// Constants
const RATE_LIMIT_CONFIG = { MAX_MESSAGES: 10, WINDOW_MS: 1000 } as const
const PYLON_TIMING = { RETRY_DELAY_MS: 200 } as const

// Utils
function useRateLimit(maxMessages = RATE_LIMIT_CONFIG.MAX_MESSAGES, windowMs = RATE_LIMIT_CONFIG.WINDOW_MS) {
  const timestamps = useRef<number[]>([])

  const isRateLimited = useCallback(() => {
    const now = Date.now()
    timestamps.current = timestamps.current.filter((t) => now - t < windowMs)
    if (timestamps.current.length >= maxMessages) return true
    timestamps.current.push(now)
    return false
  }, [maxMessages, windowMs])

  return { isRateLimited }
}

const SENSITIVE_PATTERNS = ['APP_ID', 'PYLON', 'configuration', 'config']

function sanitizeError(error: string): string {
  const hasConfigInfo = SENSITIVE_PATTERNS.some((pattern) => error.toUpperCase().includes(pattern.toUpperCase()))
  if (hasConfigInfo) return 'Configuration error. Please contact support.'
  return 'Support chat unavailable. Please try again later.'
}

import type { SupportChatConfig, UserIdentity } from '../hooks/useSupportChat'

export interface SupportChatDrawerProps {
  open: boolean
  onClose: () => void
  config: SupportChatConfig
  user: UserIdentity
}

function SupportChatDrawer({ open, onClose, config, user }: SupportChatDrawerProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [status, setStatus] = useState<ChatStatus>('idle')
  const [error, setError] = useState<string>('')
  const [frameKey] = useState<number>(() => Date.now())
  const hasInitializedRef = useRef(false)
  const [frameDimensions, setFrameDimensions] = useState<{ width: number; height: number }>({
    width: FRAME_DIMENSIONS.DEFAULT_WIDTH,
    height: FRAME_DIMENSIONS.DEFAULT_HEIGHT,
  })

  const { isRateLimited } = useRateLimit()

  const chatUrl = useMemo(() => {
    const url = config.chatUrl
    if (!url) return null
    const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1')
    if (!isLocalhost && !url.startsWith('https://')) return null
    return url
  }, [config.chatUrl])

  const chatOrigin = useMemo(() => {
    if (!chatUrl) return null
    try {
      return new URL(chatUrl).origin
    } catch {
      return null
    }
  }, [chatUrl])

  const displayName = useMemo(() => {
    if (user.name) return user.name
    if (user.email) return user.email.split('@')[0]
    return 'Safe User'
  }, [user])

  const sendConfig = useCallback(() => {
    if (!iframeRef.current || !config.appId || !chatOrigin) {
      setError('Missing chat configuration')
      setStatus('error')
      return
    }

    if (isRateLimited()) return

    const chatSettings = {
      app_id: config.appId,
      email: user.email || `guest@${config.aliasDomain}`,
      name: displayName,
      avatar_url: user.avatarUrl,
      account_id: user.accountId,
      account_external_id: user.accountId,
    }

    try {
      iframeRef.current.contentWindow?.postMessage({ type: 'pylon-config', payload: { chatSettings } }, chatOrigin)

      iframeRef.current.contentWindow?.postMessage({ type: 'pylon-open-chat' }, chatOrigin)

      setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage({ type: 'pylon-open-chat' }, chatOrigin)
      }, PYLON_TIMING.RETRY_DELAY_MS)

      setStatus('config-sent')
    } catch {
      setError('Failed to configure support chat')
      setStatus('error')
    }
  }, [
    config.appId,
    config.aliasDomain,
    chatOrigin,
    displayName,
    isRateLimited,
    user.accountId,
    user.avatarUrl,
    user.email,
  ])

  useEffect(() => {
    if (!open) return

    if (!chatUrl) {
      setError('Invalid chat configuration')
      setStatus('error')
      return
    }

    if (!hasInitializedRef.current && status === 'idle') {
      hasInitializedRef.current = true
      setStatus('waiting')
    }

    if (status === 'ready' && iframeRef.current && chatOrigin) {
      iframeRef.current.contentWindow?.postMessage({ type: 'pylon-open-chat' }, chatOrigin)
    }
  }, [open, chatUrl, chatOrigin, status])

  useEffect(() => {
    if (!open || !chatOrigin) return

    const listener = (event: MessageEvent<SupportChatMessage>) => {
      if (!event.data) return

      const isPylonMessage = event.data.type?.startsWith('pylon-')
      if (!isPylonMessage) return

      const isValidOrigin =
        event.origin === chatOrigin ||
        (chatOrigin.startsWith('http://localhost') && event.origin.startsWith('http://localhost')) ||
        (chatOrigin.startsWith('https://localhost') && event.origin.startsWith('https://localhost'))

      if (!isValidOrigin) return
      if (isRateLimited()) return

      switch (event.data.type) {
        case 'pylon-request-config':
          sendConfig()
          break

        case 'pylon-chat-ready':
          setStatus('ready')
          iframeRef.current?.contentWindow?.postMessage({ type: 'pylon-open-chat' }, chatOrigin)
          break

        case 'pylon-chat-error':
          setStatus('error')
          setError(sanitizeError(event.data.reason || 'Unknown error'))
          break

        case 'pylon-chat-size':
          if (event.data.width && event.data.height) {
            setFrameDimensions({
              width: Math.min(FRAME_DIMENSIONS.MAX_WIDTH, Math.max(FRAME_DIMENSIONS.MIN_WIDTH, event.data.width)),
              height: Math.min(window.innerHeight - 32, Math.max(FRAME_DIMENSIONS.MIN_HEIGHT, event.data.height)),
            })
            setStatus((prev) => (prev === 'error' ? prev : 'ready'))
            iframeRef.current?.contentWindow?.postMessage({ type: 'pylon-open-chat' }, chatOrigin)
          }
          break

        case 'pylon-close-chat':
        case 'pylon-chat-closed':
          onClose()
          break

        default:
          break
      }
    }

    window.addEventListener('message', listener)
    return () => window.removeEventListener('message', listener)
  }, [chatOrigin, open, sendConfig, isRateLimited])

  const isError = status === 'error'
  const showPlaceholder = status !== 'ready'

  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768

  const chatWidth = Math.min(frameDimensions.width, viewportWidth)
  const chatHeight = Math.min(frameDimensions.height, viewportHeight)

  if (!open) return null

  return (
    <SupportChatDrawerView
      onClose={onClose}
      isError={isError}
      showPlaceholder={showPlaceholder}
      error={error}
      chatUrl={chatUrl}
      chatWidth={chatWidth}
      chatHeight={chatHeight}
      frameKey={frameKey}
      iframeRef={iframeRef}
      onFrameLoad={() => {
        setStatus((prev) => (prev === 'ready' ? prev : 'waiting'))
      }}
    />
  )
}

export default SupportChatDrawer
