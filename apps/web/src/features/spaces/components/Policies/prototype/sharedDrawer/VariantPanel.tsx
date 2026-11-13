import { useEffect, useState, type ReactElement, type ReactNode } from 'react'
import { Button } from '@safe-global/views/components/ui/button'
import { cn } from '@safe-global/views/utils/cn'
import { SCROLL_AREA } from '@/utils/styles'
import { M2Alert, type M2AlertTone } from '../m2Alert'
import {
  SharedDrawerHeader,
  type HeaderButtonLayout,
  type HeaderButtonSize,
  type HeaderMedia,
  type HeaderPadding,
  type HeaderStatus,
  type NameEnding,
} from './SharedDrawerHeader'
import { ActionFooter, SignaturesFooter, type FooterActions, type SignaturesFooterProps } from './SignaturesFooter'

/** One state of a side panel, described as data so every panel type renders through the same parts. */
export type PanelVariant = {
  id: string
  /** Groups the picker's list, e.g. "Recipient allowlist". */
  group?: string
  label: string
  media: HeaderMedia
  /** Replaces the title (or account name) when the Names control is set to Long. */
  longTitle?: string
  status?: HeaderStatus
  banner?: { tone: M2AlertTone; title: ReactNode; description?: ReactNode; action?: ReactNode }
  /** One muted line at the top of the body, for context that isn't a status. */
  note?: string
  body: ReactNode
  signatures?: Omit<SignaturesFooterProps, 'padding' | 'chainId' | 'onDismiss'>
  /** A footer with only buttons; ignored when `signatures` is set, which carries its own. */
  actions?: FooterActions
}

export type PanelType = { id: string; label: string; variants: PanelVariant[] }

export type PanelDesign = {
  panelWidth: number
  nameLength: 'short' | 'long'
  nameEnding: NameEnding
  showChevrons: boolean
  showExpand: boolean
  padding: HeaderPadding
  buttonSize: HeaderButtonSize
  buttonLayout: HeaderButtonLayout
}

const withLongTitle = (media: HeaderMedia, longTitle?: string): HeaderMedia => {
  if (!longTitle) return media
  return media.kind === 'account' ? { ...media, name: longTitle } : { ...media, title: longTitle }
}

/** A panel as the drawer shows it: full height, 12px from the viewport edges, with a "Reopen" stand-in once closed. */
export const VariantPanel = ({
  variant,
  design,
  onStep,
  hasPrevious = false,
  hasNext = false,
  caption,
}: {
  variant: PanelVariant
  design: PanelDesign
  /** Previous / next; chevrons only show when this is passed. */
  onStep?: (by: number) => void
  hasPrevious?: boolean
  hasNext?: boolean
  /** A label above the panel, for canvases that show many variants. */
  caption?: string
}): ReactElement => {
  const [open, setOpen] = useState(true)
  const [fullScreen, setFullScreen] = useState(false)
  const chainId = variant.media.kind === 'account' ? variant.media.chainId : '1'
  const media = design.nameLength === 'long' ? withLongTitle(variant.media, variant.longTitle) : variant.media

  const close = () => {
    setFullScreen(false)
    setOpen(false)
  }

  useEffect(() => {
    if (!fullScreen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFullScreen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fullScreen])

  // A new variant is a new panel: open it again if the previous one was closed.
  useEffect(() => setOpen(true), [variant.id])

  const steppable = design.showChevrons && onStep
  // Badges above and below already say "waiting", so a yellow banner becomes plain text.
  const quietBanner =
    variant.banner?.tone === 'warning' && variant.status?.tone === 'warning' && Boolean(variant.signatures)

  return (
    <div className="flex h-full shrink-0 flex-col gap-2" style={{ width: design.panelWidth }}>
      {caption && <span className="truncate px-1 text-xs font-medium text-muted-foreground">{caption}</span>}
      {open ? (
        <div
          className={cn(
            'flex min-h-0 flex-1 flex-col gap-3 overflow-hidden bg-zinc-50 dark:bg-[var(--color-background-main)]',
            fullScreen ? 'fixed inset-0 z-50 h-dvh w-screen' : 'rounded-3xl shadow-xl',
          )}
        >
          <SharedDrawerHeader
            media={media}
            status={variant.status}
            nameEnding={design.nameEnding}
            onPrevious={steppable ? () => onStep(-1) : undefined}
            onNext={steppable ? () => onStep(1) : undefined}
            hasPrevious={hasPrevious}
            hasNext={hasNext}
            fullScreen={fullScreen}
            onToggleFullScreen={design.showExpand ? () => setFullScreen(!fullScreen) : undefined}
            onClose={close}
            padding={design.padding}
            buttonSize={design.buttonSize}
            buttonLayout={design.buttonLayout}
          />
          <div
            key={`${variant.id}-body`}
            className={cn(SCROLL_AREA, 'flex flex-col gap-6', design.padding === 16 ? 'px-4 pb-4' : 'px-6 pb-6')}
          >
            {variant.banner &&
              (quietBanner ? (
                <p className="text-sm text-muted-foreground">
                  {variant.banner.title}
                  {typeof variant.banner.title === 'string' && !/[.!?]$/.test(variant.banner.title) && '.'}{' '}
                  {variant.banner.description}
                </p>
              ) : (
                <M2Alert {...variant.banner} />
              ))}
            {variant.note && <p className="text-sm text-muted-foreground">{variant.note}</p>}
            {variant.body}
          </div>
          {variant.signatures ? (
            <SignaturesFooter
              key={`${variant.id}-footer`}
              {...variant.signatures}
              onDismiss={close}
              padding={design.padding}
              chainId={chainId}
            />
          ) : (
            variant.actions && <ActionFooter actions={variant.actions} onDismiss={close} padding={design.padding} />
          )}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-3xl border border-dashed border-border">
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            Reopen panel
          </Button>
        </div>
      )}
    </div>
  )
}
