import { useEffect, useReducer, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUpRight, X } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Textarea } from '@safe-global/views/components/ui/textarea'
import { Input } from '@safe-global/views/components/ui/input'
import { usePortalContainerElement } from '@safe-global/views/components/ui/ShadcnProvider'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import {
  buildFeedbackUrl,
  feedbackDescription,
  feedbackTitle,
  linearIssueUrl,
  openLinearIssue,
  type FeedbackTarget,
} from './linearIssue'
import { completeIssue, createSubIssue } from './linearApi'
import {
  buildPinLink,
  cssPath,
  describeTarget,
  findByCssPath,
  parsePin,
  parsePinComment,
  parsePinIssue,
  PIN_LAYER_ATTR,
  resolvePinTarget,
  type Pin,
} from './pinTarget'

type Draft = Pin & { element: Element; where: string; row?: string }
type Box = { left: number; top: number; width: number; height: number }
export type PinnedNote = Pin & {
  id: string
  text: string
  where: string
  scenario: string
  tx?: string
  issue?: string
  createdAt: number
  resolved?: boolean
}

const BLOCKED_EVENTS = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'] as const
const PRESS_EVENTS = ['pointerdown', 'mousedown', 'touchstart', 'click'] as const
const TAG_ATTR = 'data-pin-tag'
const CARD_WIDTH = 288
const layer = { [PIN_LAYER_ATTR]: '' }
const LINK_NOTE_ID = 'from-link'

const currentScenario = () => new URLSearchParams(window.location.search).get('scenario') ?? 'everyday'
const boxOf = (element: Element): Box => {
  const { left, top, width, height } = element.getBoundingClientRect()
  return { left, top, width, height }
}
const pinPosition = (element: Element, pin: Pick<Pin, 'x' | 'y'>) => {
  const box = boxOf(element)
  return { x: box.left + (box.width * pin.x) / 100, y: box.top + (box.height * pin.y) / 100 }
}

// Re-render on scroll and resize so pins stay on their element.
function useLayoutTick(enabled: boolean) {
  const [, rerender] = useReducer((count: number) => count + 1, 0)
  useEffect(() => {
    if (!enabled) return
    window.addEventListener('scroll', rerender, true)
    window.addEventListener('resize', rerender)
    return () => {
      window.removeEventListener('scroll', rerender, true)
      window.removeEventListener('resize', rerender)
    }
  }, [enabled])
}

// Inside a modal drawer, anything interactive has to live in the dialog, or its focus trap and outside-press close it.
const openDialog = () => document.querySelector<HTMLElement>(`[role="dialog"]:not([${PIN_LAYER_ATTR}])`)
const cardStyle = (point: { x: number; y: number }, dialog: HTMLElement | null, height: number): CSSProperties => {
  const host = dialog?.getBoundingClientRect() ?? {
    left: 0,
    top: 0,
    width: window.innerWidth,
    height: window.innerHeight,
  }
  const left = Math.min(Math.max(point.x + 12 - host.left, 8), host.width - CARD_WIDTH - 8)
  const top = Math.min(Math.max(point.y - host.top, 8), host.height - height)
  return { position: dialog ? 'absolute' : 'fixed', left, top, width: CARD_WIDTH }
}

function PinMarker({ x, y }: { x: number; y: number }) {
  return (
    <span
      {...layer}
      aria-hidden="true"
      className="pointer-events-none fixed z-[2147483646] size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground ring-2 ring-background"
      style={{ left: x, top: y }}
    />
  )
}

function PinTag({ x, y, id, number }: { x: number; y: number; id: string; number: string }) {
  return (
    <button
      {...layer}
      {...{ [TAG_ATTR]: id }}
      type="button"
      aria-label={`Comment ${number}`}
      className="fixed z-[2147483646] flex -translate-y-full cursor-pointer items-center gap-0.5 rounded-full rounded-bl-none bg-foreground py-0.5 pr-1.5 pl-2 text-xs font-semibold tabular-nums text-background shadow-md transition-opacity hover:opacity-85"
      style={{ left: x, top: y }}
    >
      {number}
      <ArrowUpRight className="size-3" aria-hidden="true" />
    </button>
  )
}

export type PinCommentLayerProps = {
  active: boolean
  onEnter: () => void
  onExit: () => void
  target: FeedbackTarget
  transaction?: { id: string; label: string }
}

export function PinCommentLayer({ active, onEnter, onExit, target, transaction }: PinCommentLayerProps) {
  // Portal into the styled scope: the theme variables only exist inside it.
  const portal = usePortalContainerElement() ?? document.body
  const [stored = [], setStored] = useLocalStorage<PinnedNote[]>('prototypeComments')
  const [linked, setLinked] = useState<PinnedNote | null>(null)
  const [hover, setHover] = useState<Box | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [text, setText] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [apiKey, setApiKey] = useLocalStorage<string>('linearApiKey')
  const [keyInput, setKeyInput] = useState('')
  const [askKey, setAskKey] = useState(false)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')
  const openCard = useRef(setOpenId)
  openCard.current = setOpenId
  const enter = useRef(onEnter)
  enter.current = onEnter
  useLayoutTick(active)

  const exit = () => {
    setDraft(null)
    setHover(null)
    setOpenId(null)
    onExit()
  }

  useEffect(() => {
    if (!active) return
    document.documentElement.toggleAttribute('data-commenting', true)
    const inLayer = (event: Event) => (event.target as Element | null)?.closest?.(`[${PIN_LAYER_ATTR}]`)
    const block = (event: Event) => {
      if (inLayer(event)) return
      event.preventDefault()
      event.stopPropagation()
    }
    const place = (event: MouseEvent) => {
      if (inLayer(event)) return
      event.preventDefault()
      event.stopPropagation()
      const point = resolvePinTarget(event.clientX, event.clientY)
      if (!point) return
      setDraft({ ...point, path: cssPath(point.element), ...describeTarget(point.element) })
      setOpenId(null)
      setNotice('')
    }
    const track = (event: MouseEvent) => {
      const point = inLayer(event) ? null : resolvePinTarget(event.clientX, event.clientY)
      setHover(point ? boxOf(point.element) : null)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      exit()
    }
    BLOCKED_EVENTS.forEach((type) => window.addEventListener(type, type === 'click' ? place : block, true))
    window.addEventListener('mousemove', track, true)
    window.addEventListener('keydown', escape, true)
    return () => {
      document.documentElement.removeAttribute('data-commenting')
      BLOCKED_EVENTS.forEach((type) => window.removeEventListener(type, type === 'click' ? place : block, true))
      window.removeEventListener('mousemove', track, true)
      window.removeEventListener('keydown', escape, true)
    }
  })

  // Badges can sit outside an open modal drawer, which closes on any outside press, so they handle clicks on window.
  useEffect(() => {
    const onPress = (event: Event) => {
      const tag = (event.target as Element | null)?.closest?.(`[${TAG_ATTR}]`)
      if (!tag) return
      event.stopPropagation()
      if (event.type === 'click') openCard.current(tag.getAttribute(TAG_ATTR))
    }
    PRESS_EVENTS.forEach((type) => window.addEventListener(type, onPress, true))
    return () => PRESS_EVENTS.forEach((type) => window.removeEventListener(type, onPress, true))
  }, [])

  useEffect(() => {
    const pin = parsePin(window.location.search)
    if (!pin) return
    const search = window.location.search
    setLinked({
      ...pin,
      id: LINK_NOTE_ID,
      text: parsePinComment(search) ?? '',
      where: '',
      scenario: currentScenario(),
      tx: new URLSearchParams(search).get('tx') ?? undefined,
      issue: parsePinIssue(search),
      createdAt: Date.now(),
    })
    setOpenId(LINK_NOTE_ID)
    enter.current()
  }, [])

  const details = () => {
    if (!draft) return null
    const pinLinkFor = (issue?: string) =>
      buildPinLink(
        window.location.href,
        { path: draft.path, x: draft.x, y: draft.y },
        { tx: transaction?.id, theme: document.documentElement.dataset.theme, c: text.trim().slice(0, 500), issue },
      )
    const comment = {
      ...target,
      comment: text,
      where: draft.where,
      transaction: draft.row ?? transaction?.label,
      pinLink: pinLinkFor(),
      viewport: `${window.innerWidth}×${window.innerHeight}`,
      theme: document.documentElement.dataset.theme,
    }
    return { comment, pinLinkFor }
  }

  const remember = (issue?: { identifier: string }) => {
    if (!draft) return
    setStored([
      ...stored,
      {
        id: `${Date.now()}`,
        path: draft.path,
        x: draft.x,
        y: draft.y,
        text: text.trim(),
        where: draft.where,
        scenario: currentScenario(),
        tx: transaction?.id,
        issue: issue?.identifier,
        createdAt: Date.now(),
      },
    ])
    setText('')
    setDraft(null)
  }

  const openForm = () => {
    const built = details()
    if (!built) return
    openLinearIssue(buildFeedbackUrl(built.comment))
    remember()
    setNotice('Opened in Linear. Click Create there to post it.')
  }

  const post = async (key = apiKey) => {
    const built = details()
    if (!built || !text.trim() || posting) return
    if (!key) return openForm()
    setPosting(true)
    setError('')
    try {
      const issue = await createSubIssue(key, {
        parent: target.ticket,
        title: feedbackTitle(built.comment),
        description: feedbackDescription(built.comment),
        pinLink: built.pinLinkFor,
      })
      remember(issue)
      setNotice(`Created ${issue.identifier} under ${target.ticket}`)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Linear could not create the issue')
    } finally {
      setPosting(false)
    }
  }

  const saveKey = () => {
    const key = keyInput.trim()
    if (!key) return
    setApiKey(key)
    setKeyInput('')
    setAskKey(false)
    void post(key)
  }

  const resolve = async (note: PinnedNote) => {
    if (note.id === LINK_NOTE_ID) setLinked(null)
    else setStored(stored.map((item) => (item.id === note.id ? { ...item, resolved: true } : item)))
    setOpenId(null)
    if (!note.issue || !apiKey) return setNotice('Resolved here. Close the Linear issue to resolve it for everyone.')
    try {
      await completeIssue(apiKey, note.issue)
      setNotice(`Resolved ${note.issue} in Linear`)
    } catch (failure) {
      setNotice(
        `Resolved here, but couldn't close ${note.issue} in Linear: ${failure instanceof Error ? failure.message : 'unknown error'}`,
      )
    }
  }

  const numberOf = (note: PinnedNote) =>
    note.issue?.split('-')[1] ?? String(stored.findIndex((item) => item.id === note.id) + 1 || 1)
  // Only show pins made in this scenario with the same drawer open, so a path can't land on another transaction.
  const visible = [...stored, ...(linked ? [linked] : [])]
    .filter((note) => !note.resolved && note.scenario === currentScenario() && note.tx === transaction?.id)
    .map((note) => {
      const element = findByCssPath(note.path)
      return element ? { note, point: pinPosition(element, note) } : null
    })
    .filter((item) => item !== null)
  const open = visible.find((item) => item.note.id === openId)
  const draftPoint = draft ? pinPosition(draft.element, draft) : undefined
  const dialog = active && (draft || open) ? openDialog() : null

  if (!active) return null
  return (
    <>
      <style>{`html[data-commenting] body *:not([${PIN_LAYER_ATTR}]):not([${PIN_LAYER_ATTR}] *) { cursor: crosshair !important; }`}</style>
      {hover &&
        !draft &&
        createPortal(
          <span
            {...layer}
            aria-hidden="true"
            className="pointer-events-none fixed z-[2147483645] rounded-sm outline-2 outline-primary outline-dashed"
            style={hover}
          />,
          portal,
        )}
      {createPortal(
        visible.map(({ note, point }) => (
          <PinTag key={note.id} id={note.id} x={point.x} y={point.y} number={numberOf(note)} />
        )),
        portal,
      )}
      {!draft && (
        <div
          {...layer}
          role="status"
          className="fixed bottom-20 left-1/2 z-[2147483646] flex -translate-x-1/2 items-center gap-2 rounded-full bg-foreground py-2 pr-2 pl-4 text-sm text-background shadow-lg"
        >
          {notice || 'Click anywhere to pin a comment · Esc to finish'}
          {!notice && apiKey && (
            <Button variant="ghost" size="xs" onClick={() => setApiKey(() => undefined)}>
              Disconnect Linear
            </Button>
          )}
          {notice && (
            <Button variant="ghost" size="icon-xs" aria-label="Dismiss" onClick={() => setNotice('')}>
              <X />
            </Button>
          )}
        </div>
      )}
      {draft && draftPoint && createPortal(<PinMarker x={draftPoint.x} y={draftPoint.y} />, portal)}
      {draft &&
        draftPoint &&
        createPortal(
          <div
            {...layer}
            role="group"
            aria-label="New comment"
            className="z-[2147483647] space-y-2 rounded-xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur-sm"
            style={cardStyle(draftPoint, dialog, 180)}
          >
            <p className="truncate text-xs text-muted-foreground">{draft.where}</p>
            {askKey && (
              <div className="space-y-2 rounded-lg bg-muted p-2.5">
                <label htmlFor="linear-api-key" className="block text-xs font-medium">
                  Linear API key
                </label>
                <Input
                  id="linear-api-key"
                  type="password"
                  autoComplete="off"
                  placeholder="lin_api_…"
                  value={keyInput}
                  onChange={(event) => setKeyInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') saveKey()
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Create one in{' '}
                  <a
                    href={`https://linear.app/${target.workspace}/settings/account/security`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Linear settings
                  </a>{' '}
                  with only Create issues and Write on the {target.team} team. It&apos;s saved in this browser only.
                </p>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={openForm}>
                    Use the Linear form
                  </Button>
                  <Button size="sm" disabled={!keyInput.trim()} onClick={saveKey}>
                    Save and post
                  </Button>
                </div>
              </div>
            )}
            {error && (
              <p role="alert" className="text-xs text-destructive">
                {error}.{' '}
                <button type="button" className="underline" onClick={openForm}>
                  Use the Linear form instead
                </button>
              </p>
            )}
            <Textarea
              autoFocus
              aria-label="Comment"
              placeholder="What should change here?"
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
                event.preventDefault()
                void post()
              }}
            />
            <div className="flex justify-end gap-2">
              {!apiKey && !askKey && (
                <Button variant="ghost" size="sm" className="mr-auto" onClick={() => setAskKey(true)}>
                  Connect Linear
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setDraft(null)}>
                Cancel
              </Button>
              <Button size="sm" disabled={!text.trim() || posting} onClick={() => void post()}>
                {posting ? 'Posting…' : 'Post to Linear'}
              </Button>
            </div>
          </div>,
          dialog ?? portal,
        )}
      {open &&
        !draft &&
        createPortal(
          <div
            {...layer}
            role="group"
            aria-label={`Comment ${numberOf(open.note)}`}
            className="z-[2147483647] space-y-3 rounded-xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur-sm"
            style={cardStyle(open.point, dialog, 200)}
          >
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-foreground px-2 py-0.5 text-xs font-semibold tabular-nums text-background">
                {open.note.issue ?? numberOf(open.note)}
              </span>
              <a
                href={linearIssueUrl(target.workspace, open.note.issue ?? target.ticket)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Open in Linear
                <ArrowUpRight className="size-3" aria-hidden="true" />
              </a>
              <Button
                variant="ghost"
                size="icon-xs"
                className="ml-auto"
                aria-label="Close comment"
                onClick={() => setOpenId(null)}
              >
                <X />
              </Button>
            </div>
            {open.note.text ? (
              <p className="whitespace-pre-wrap text-sm">{open.note.text}</p>
            ) : (
              <p className="text-sm text-muted-foreground">The comment text is in Linear.</p>
            )}
            {open.note.where && <p className="truncate text-xs text-muted-foreground">{open.note.where}</p>}
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => resolve(open.note)}>
                Resolve
              </Button>
            </div>
          </div>,
          dialog ?? portal,
        )}
    </>
  )
}
