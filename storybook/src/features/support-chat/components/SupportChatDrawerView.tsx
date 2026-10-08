import type { Ref } from 'react'
import { Typography } from '@/components/ui/typography'
import { Spinner } from '@/components/ui/spinner'
import { overlayVariants } from '@/components/ui/overlay'
import { cn } from '@/utils/cn'

export const FRAME_DIMENSIONS = {
  DEFAULT_WIDTH: 360,
  DEFAULT_HEIGHT: 520,
  MIN_WIDTH: 300,
  MAX_WIDTH: 420,
  MIN_HEIGHT: 420,
} as const

const ERROR_STATE = {
  heading: 'Support chat is unavailable',
  subheading: 'Please try again later or reach out via support@safe.global.',
}

export type SupportChatDrawerViewProps = {
  onClose: () => void
  isError: boolean
  showPlaceholder: boolean
  error: string
  chatUrl: string | null
  chatWidth: number
  chatHeight: number
  frameKey: number
  iframeRef: Ref<HTMLIFrameElement>
  onFrameLoad: () => void
}

export function SupportChatDrawerView({
  onClose,
  isError,
  showPlaceholder,
  error,
  chatUrl,
  chatWidth,
  chatHeight,
  frameKey,
  iframeRef,
  onFrameLoad,
}: SupportChatDrawerViewProps) {
  return (
    <>
      {/* Same scrim as every dialog/sheet/drawer; only the layer differs (the chat panel above
          sits at 1301, below the overlay layer the modal surfaces share). */}
      <div aria-hidden onClick={onClose} className={cn(overlayVariants({ transition: 'mount' }), 'z-[1300]')} />
      <div
        className="fixed bottom-0 left-0 z-[1301] h-screen max-h-screen w-screen max-w-[100vw] origin-bottom-left animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-150 sm:bottom-[72px] sm:left-6 sm:h-auto sm:max-h-[calc(100vh-88px)] sm:w-[var(--chat-w)] sm:max-w-[var(--chat-w)]"
        style={{ ['--chat-w' as string]: `${chatWidth}px` }}
      >
        <div
          className={cn(
            'relative max-h-full max-w-full shrink-0 self-start overflow-visible transition-[background-color,box-shadow] duration-[120ms] ease-linear',
            showPlaceholder
              ? 'bg-[var(--color-background-paper)] sm:rounded-lg sm:shadow-lg'
              : 'bg-transparent shadow-none',
          )}
          style={{
            width: isError ? FRAME_DIMENSIONS.DEFAULT_WIDTH : chatWidth,
            height: isError ? FRAME_DIMENSIONS.MIN_HEIGHT : chatHeight,
            minWidth: isError ? FRAME_DIMENSIONS.MIN_WIDTH : undefined,
            minHeight: isError ? FRAME_DIMENSIONS.MIN_HEIGHT : undefined,
          }}
        >
          {showPlaceholder && (
            <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-4 bg-[var(--color-background-paper)] px-6 text-center">
              {isError ? (
                <div className="max-w-[320px] rounded-lg bg-transparent p-6 text-center shadow-none">
                  <Typography variant="h3">{ERROR_STATE.heading}</Typography>
                  <Typography variant="paragraph-small" color="muted">
                    {error || ERROR_STATE.subheading}
                  </Typography>
                </div>
              ) : (
                <>
                  <Spinner className="size-8" />
                  <Typography variant="paragraph">Launching support chat…</Typography>
                  <Typography variant="paragraph-small" color="muted">
                    Please wait while we connect you to Safe Support.
                  </Typography>
                </>
              )}
            </div>
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
              onLoad={onFrameLoad}
            />
          )}
        </div>
      </div>
    </>
  )
}
