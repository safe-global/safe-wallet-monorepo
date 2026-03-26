import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Typography, CircularProgress } from '@mui/material'

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
const FRAME_DIMENSIONS = {
  DEFAULT_WIDTH: 360,
  DEFAULT_HEIGHT: 520,
  MIN_WIDTH: 300,
  MAX_WIDTH: 420,
  MIN_HEIGHT: 420,
} as const

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

const ERROR_STATE = {
  heading: 'Support chat is unavailable',
  subheading: 'Please try again later or reach out via support@safe.global.',
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
    <Box
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1300,
        pointerEvents: 'none',
      }}
    >
      <Box
        sx={{
          position: 'fixed',
          bottom: { xs: 0, sm: 72 },
          right: { xs: 0, sm: 24 },
          width: { xs: '100vw', sm: chatWidth },
          maxWidth: { xs: '100vw', sm: chatWidth },
          height: { xs: '100vh', sm: 'auto' },
          maxHeight: { xs: '100vh', sm: 'calc(100vh - 88px)' },
          zIndex: 1300,
          pointerEvents: 'auto',
          animation: 'supportChatOpen 150ms ease-out',
          transformOrigin: 'bottom right',
          '@keyframes supportChatOpen': {
            from: { opacity: 0, transform: 'scale(0.95) translateY(8px)' },
            to: { opacity: 1, transform: 'scale(1) translateY(0)' },
          },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: isError ? FRAME_DIMENSIONS.DEFAULT_WIDTH : chatWidth,
            maxWidth: '100%',
            height: isError ? FRAME_DIMENSIONS.MIN_HEIGHT : chatHeight,
            maxHeight: '100%',
            minWidth: isError ? FRAME_DIMENSIONS.MIN_WIDTH : undefined,
            minHeight: isError ? FRAME_DIMENSIONS.MIN_HEIGHT : undefined,
            bgcolor: showPlaceholder ? 'background.paper' : 'transparent',
            borderRadius: showPlaceholder ? { xs: 0, sm: 2 } : 0,
            overflow: 'visible',
            boxShadow: showPlaceholder ? { xs: 'none', sm: 8 } : 'none',
            alignSelf: 'flex-end',
            flexShrink: 0,
            transition: 'background-color 120ms ease, box-shadow 120ms ease',
          }}
        >
          {showPlaceholder && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                px: 3,
                textAlign: 'center',
                zIndex: 1,
                bgcolor: 'background.paper',
              }}
            >
              {isError ? (
                <Box
                  sx={{
                    bgcolor: 'transparent',
                    borderRadius: 2,
                    boxShadow: 'none',
                    p: 3,
                    maxWidth: 320,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="h5">{ERROR_STATE.heading}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {error || ERROR_STATE.subheading}
                  </Typography>
                </Box>
              ) : (
                <>
                  <CircularProgress size={32} />
                  <Typography variant="body1">Launching support chat…</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Please wait while we connect you to Safe Support.
                  </Typography>
                </>
              )}
            </Box>
          )}

          {chatUrl && (
            <iframe
              key={frameKey}
              ref={iframeRef}
              src={chatUrl}
              title="Safe Support Chat"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              style={{
                border: 0,
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                visibility: isError ? 'hidden' : 'visible',
              }}
              onLoad={() => {
                setStatus((prev) => (prev === 'ready' ? prev : 'waiting'))
              }}
            />
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default SupportChatDrawer
