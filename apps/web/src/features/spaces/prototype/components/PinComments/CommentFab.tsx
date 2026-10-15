import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { MessageSquarePlus, X } from 'lucide-react'
import { Kbd } from '@safe-global/views/components/ui/kbd'
import { usePortalContainerElement } from '@safe-global/views/components/ui/ShadcnProvider'
import { PIN_LAYER_ATTR } from './pinTarget'

const FAB_ATTR = 'data-comment-fab'
const INTERCEPTED = ['pointerdown', 'mousedown', 'touchstart', 'click'] as const

// A modal drawer closes on any outside press, so the button handles its events on window before the drawer sees them.
export function CommentFab({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  const portal = usePortalContainerElement()
  const toggle = useRef(onToggle)
  toggle.current = onToggle

  useEffect(() => {
    const intercept = (event: Event) => {
      if (!(event.target as Element | null)?.closest?.(`[${FAB_ATTR}]`)) return
      event.stopPropagation()
      if (event.type === 'click') toggle.current()
    }
    INTERCEPTED.forEach((type) => window.addEventListener(type, intercept, true))
    return () => INTERCEPTED.forEach((type) => window.removeEventListener(type, intercept, true))
  }, [])

  return createPortal(
    <button
      {...{ [PIN_LAYER_ATTR]: '', [FAB_ATTR]: '' }}
      type="button"
      aria-label={active ? 'Cancel comment' : 'Add a comment'}
      aria-pressed={active}
      className={`group fixed bottom-16 left-4 z-[2147483640] flex size-10 cursor-pointer items-center justify-center rounded-full border shadow-lg outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 ${active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:bg-muted'}`}
    >
      {active ? <X className="size-4" /> : <MessageSquarePlus className="size-4" />}
      <span className="pointer-events-none absolute left-12 hidden items-center gap-1.5 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-background group-hover:flex group-focus-visible:flex">
        {active ? 'Cancel comment' : 'Comment'} <Kbd>C</Kbd> or <Kbd>⌘C</Kbd>
      </span>
    </button>,
    portal ?? document.body,
  )
}
