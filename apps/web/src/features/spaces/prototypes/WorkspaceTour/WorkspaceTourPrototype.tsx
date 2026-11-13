import * as React from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowRightLeft,
  ChevronRight,
  ChevronsUpDown,
  CircleHelp,
  Coins,
  Landmark,
  Laptop,
  LayoutGrid,
  type LucideIcon,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
  Users,
  UsersRound,
  Wallet,
  WalletCards,
  X,
} from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@safe-global/views/components/ui/card'
import { overlayVariants } from '@safe-global/views/components/ui/overlay'
import { usePortalContainerElement } from '@safe-global/views/components/ui/ShadcnProvider'
import SpaceSettingsSection, {
  SpaceSettingsSectionTitle,
} from '@safe-global/views/features/spaces/components/SpaceSettings/SpaceSettingsSection'
import { Typography } from '@safe-global/views/components/ui/typography'
import { cn } from '@safe-global/views/utils/cn'
import SpaceDashboardPage from '@/pages/spaces'
import SpaceTransactionsPage from '@/pages/spaces/transactions'
import SpaceSafeAccountsPage from '@/pages/spaces/safe-accounts'
import SpaceAddressBookPage from '@/pages/spaces/address-book'
import SpacePoliciesPage from '@/pages/spaces/policies'
import SpaceActivityPage from '@/pages/spaces/activity'
import SpaceMembersPage from '@/pages/spaces/members'
import SpaceSecurityPage from '@/pages/spaces/security'
import SpaceSettingsPage from '@/pages/spaces/settings/general'
import SpacePlansPage from '@/pages/spaces/plans'

type PageId =
  | 'dashboard'
  | 'transactions'
  | 'safe-accounts'
  | 'address-book'
  | 'policies'
  | 'activity'
  | 'team'
  | 'security'
  | 'settings'
  | 'plans'

const PAGES: Record<PageId, React.ComponentType> = {
  dashboard: SpaceDashboardPage,
  transactions: SpaceTransactionsPage,
  'safe-accounts': SpaceSafeAccountsPage,
  'address-book': SpaceAddressBookPage,
  policies: SpacePoliciesPage,
  activity: SpaceActivityPage,
  team: SpaceMembersPage,
  security: SpaceSecurityPage,
  settings: SpaceSettingsPage,
  plans: SpacePlansPage,
}

type Placement = 'right' | 'bottom' | 'bottom-end' | 'center'

type TourStep = {
  id: string
  /** CSS selectors for the real app element, tried in order. */
  target?: string[]
  page?: PageId
  placement: Placement
  icon: LucideIcon
  title: string
  body: string
  tip?: string
  /** What lives inside the highlighted thing, listed under the body. */
  inside?: { icon: LucideIcon; label: string; description: string }[]
  /** Clicked once when the step opens, e.g. to switch to the tab being explained. */
  select?: string
}

const TAKE_TOUR_TEST_ID = 'settings-take-tour'

const navTarget = (label: string) => [`[data-testid="sidebar-item-${label}"]`]

/** Sidebar test-id suffix → prototype page, so the real sidebar links switch pages in Storybook. */
const SIDEBAR_PAGES: Record<string, PageId> = {
  dashboard: 'dashboard',
  transactions: 'transactions',
  'safe-accounts': 'safe-accounts',
  'address-book': 'address-book',
  policies: 'policies',
  activity: 'activity',
  team: 'team',
  'security-hub': 'security',
  settings: 'settings',
  plans: 'plans',
}
const addressBookTab = (position: number) =>
  `main [data-slot="tabs-list"] [data-slot="tabs-trigger"]:nth-child(${position})`
const ADDRESS_BOOK_TABS = ['main [data-slot="tabs"]']

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    page: 'dashboard',
    placement: 'center',
    icon: Sparkles,
    title: 'Welcome to your workspace',
    body: '',
  },
  {
    id: 'switcher',
    target: ['[data-testid="space-selector-button"]'],
    page: 'dashboard',
    placement: 'right',
    icon: ChevronsUpDown,
    title: 'Your workspace',
    body: 'Switch between workspaces here.',
  },
  {
    id: 'signed-in',
    target: ['[data-testid="header-account-info"]'],
    page: 'dashboard',
    placement: 'bottom-end',
    icon: UserRound,
    title: 'Signed in as',
    body: 'Your Sign-In with Ethereum account. It sets which workspaces you see and your role.',
    tip: 'Signing in can’t approve transactions.',
  },
  {
    id: 'wallet',
    target: ['[data-testid="connect-wallet-btn"]', '[data-testid="open-account-center"]'],
    page: 'dashboard',
    placement: 'bottom-end',
    icon: Wallet,
    title: 'Connect a wallet to sign',
    body: 'Connect a Safe signer to approve transactions. It can differ from your sign-in wallet.',
    tip: 'Not needed to look around.',
  },
  {
    id: 'safe-row',
    target: ['[data-testid="safe-accounts-table"] tbody tr', '[data-testid="safe-list-item"]'],
    page: 'safe-accounts',
    placement: 'bottom',
    icon: ChevronRight,
    title: 'Open a Safe to work inside it',
    body: 'The workspace is your overview. Everything for a single Safe lives inside that Safe:',
    inside: [
      { icon: Coins, label: 'Assets', description: 'Tokens and NFTs it holds' },
      { icon: ArrowRightLeft, label: 'Transactions', description: 'Send, sign and execute' },
      { icon: LayoutGrid, label: 'Apps', description: 'Connect dApps and build batches' },
      { icon: TrendingUp, label: 'DeFi', description: 'Positions across protocols' },
      { icon: Settings, label: 'Settings', description: 'Signers, threshold and modules' },
    ],
    tip: 'Click a Safe to open it. The sidebar then shows a way back to the workspace.',
  },
  {
    id: 'address-book-workspace',
    target: ADDRESS_BOOK_TABS,
    select: addressBookTab(1),
    page: 'address-book',
    placement: 'bottom',
    icon: Users,
    title: 'Workspace contacts',
    body: 'Address book entries everyone in the workspace can see.',
    tip: 'Admins edit them. Members propose new ones.',
  },
  {
    id: 'address-book-local',
    target: ADDRESS_BOOK_TABS,
    select: addressBookTab(2),
    page: 'address-book',
    placement: 'bottom',
    icon: Laptop,
    title: 'Local contacts',
    body: 'Only you see these, and only in this browser.',
    tip: 'Use "Add to Workspace" to share one.',
  },
  {
    id: 'replay',
    target: [`[data-testid="${TAKE_TOUR_TEST_ID}"]`],
    page: 'settings',
    placement: 'bottom',
    icon: CircleHelp,
    title: 'Take the tour again',
    body: 'Replay it anytime from Settings.',
  },
  {
    id: 'done',
    page: 'dashboard',
    placement: 'center',
    icon: Sparkles,
    title: 'You are ready to go',
    body: '',
  },
]

const ANCHORED_STEPS = TOUR_STEPS.filter((step) => step.placement !== 'center')

const WELCOME_HIGHLIGHTS: { icon: LucideIcon; text: string }[] = [
  { icon: WalletCards, text: 'Every Safe and balance in one place' },
  { icon: UsersRound, text: 'Approve transactions as a team' },
  { icon: ShieldCheck, text: 'Set rules and check security' },
]

const NEXT_ACTIONS: { icon: LucideIcon; label: string; description: string; page: PageId }[] = [
  {
    icon: WalletCards,
    label: 'Add a Safe account',
    description: 'Bring in an existing Safe',
    page: 'safe-accounts',
  },
  { icon: UsersRound, label: 'Invite your team', description: 'Add your co-signers', page: 'team' },
  { icon: Landmark, label: 'Set up a policy', description: 'Add a limit or allowlist', page: 'policies' },
]

const CARD_GAP = 12
const VIEWPORT_MARGIN = 16
const TARGET_WAIT_MS = 4000
const POLL_MS = 150

type Rect = { top: number; left: number; width: number; height: number; radius: number }

const findTarget = (selectors?: string[]): Element | null => {
  for (const selector of selectors ?? []) {
    const element = document.querySelector(selector)
    if (element && element.getBoundingClientRect().width > 0) return element
  }
  return null
}

const toRect = (element: Element): Rect => {
  const box = element.getBoundingClientRect()
  const left = Math.max(box.left, 0)
  const top = Math.max(box.top, 0)
  const right = Math.min(box.right, window.innerWidth)
  const bottom = Math.min(box.bottom, window.innerHeight)
  const radius = parseFloat(getComputedStyle(element).borderTopLeftRadius) || 0
  return { top, left, width: right - left, height: bottom - top, radius }
}

const sameRect = (a: Rect | null, b: Rect | null) =>
  a === b ||
  (!!a &&
    !!b &&
    a.top === b.top &&
    a.left === b.left &&
    a.width === b.width &&
    a.height === b.height &&
    a.radius === b.radius)

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max))

const getCardPosition = (rect: Rect, placement: Placement, card: { width: number; height: number }) => {
  const maxLeft = window.innerWidth - card.width - VIEWPORT_MARGIN
  const maxTop = window.innerHeight - card.height - VIEWPORT_MARGIN

  if (placement === 'right') {
    return {
      left: clamp(rect.left + rect.width + CARD_GAP, VIEWPORT_MARGIN, maxLeft),
      top: clamp(rect.top + rect.height / 2 - card.height / 2, VIEWPORT_MARGIN, maxTop),
    }
  }
  const left =
    placement === 'bottom-end' ? rect.left + rect.width - card.width : rect.left + rect.width / 2 - card.width / 2
  return {
    left: clamp(left, VIEWPORT_MARGIN, maxLeft),
    top: clamp(rect.top + rect.height + CARD_GAP, VIEWPORT_MARGIN, maxTop),
  }
}

/** The page minus a rounded hole the shape of the target, so the scrim never covers its corners. */
const spotlightClipPath = ({ top: y, left: x, width: w, height: h, radius }: Rect) => {
  const r = Math.min(radius, w / 2, h / 2)
  const hole = `M${x + r},${y} H${x + w - r} A${r},${r} 0 0 1 ${x + w},${y + r} V${y + h - r} A${r},${r} 0 0 1 ${x + w - r},${y + h} H${x + r} A${r},${r} 0 0 1 ${x},${y + h - r} V${y + r} A${r},${r} 0 0 1 ${x + r},${y} Z`
  return `path(evenodd, "M0,0 H${window.innerWidth} V${window.innerHeight} H0 Z ${hole}")`
}

/** Follows a real app element as it mounts, loads data and moves; reports `missing` when it never shows up. */
const useTrackedTarget = (selectors: string[] | undefined, stepKey: string, select?: string) => {
  const [tracked, setTracked] = React.useState<{ key: string; rect: Rect | null; missing: boolean }>({
    key: stepKey,
    rect: null,
    missing: false,
  })
  const setRect = (update: (previous: Rect | null) => Rect | null) =>
    setTracked((previous) => {
      const rect = update(previous.key === stepKey ? previous.rect : null)
      return previous.key === stepKey && previous.rect === rect ? previous : { key: stepKey, rect, missing: false }
    })
  const setMissing = (missing: boolean) => setTracked({ key: stepKey, rect: null, missing })

  React.useEffect(() => {
    if (!selectors) return

    const startedAt = Date.now()
    let scrolled = false
    const tick = () => {
      const element = findTarget(selectors)
      if (!element) {
        if (Date.now() - startedAt > TARGET_WAIT_MS) setMissing(true)
        return
      }
      if (!scrolled) {
        element.scrollIntoView({ block: 'nearest' })
        const toSelect = select ? document.querySelector(select) : null
        if (toSelect instanceof HTMLElement) toSelect.click()
        scrolled = true
      }
      const next = toRect(element)
      setRect((previous) => (sameRect(previous, next) ? previous : next))
    }
    tick()
    const interval = window.setInterval(tick, POLL_MS)
    return () => window.clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepKey])

  const isCurrent = tracked.key === stepKey
  return { rect: isCurrent ? tracked.rect : null, missing: isCurrent && tracked.missing }
}

const StepIcon = ({ icon: Icon }: { icon: LucideIcon }) => (
  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
    <Icon className="size-4" />
  </div>
)

const WelcomeCard = ({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) => (
  <Card elevated size="lg">
    <CardHeader>
      <div className="flex flex-col gap-3">
        <StepIcon icon={Sparkles} />
        <Typography variant="h4">Welcome to your workspace</Typography>
        <CardDescription>Where your team runs its Safe accounts together. Here is a quick look around.</CardDescription>
      </div>
    </CardHeader>
    <CardContent>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          {WELCOME_HIGHLIGHTS.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <Icon className="size-4 shrink-0 text-muted-foreground" />
              <Typography variant="paragraph-small">{text}</Typography>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-2">
          <Typography variant="paragraph-mini" color="muted">
            About 1 minute
          </Typography>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onSkip}>
              Skip for now
            </Button>
            <Button size="sm" onClick={onStart}>
              Show me around
            </Button>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
)

const DoneCard = ({ onBack, onFinish }: { onBack: () => void; onFinish: (page?: PageId) => void }) => (
  <Card elevated size="lg">
    <CardHeader>
      <div className="flex flex-col gap-3">
        <StepIcon icon={Sparkles} />
        <Typography variant="h4">You are ready to go</Typography>
        <CardDescription>Good first steps for a new workspace:</CardDescription>
      </div>
    </CardHeader>
    <CardContent>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          {NEXT_ACTIONS.map(({ icon, label, description, page }) => (
            <Button
              key={label}
              variant="outline"
              size="xl"
              className="w-full justify-start"
              onClick={() => onFinish(page)}
            >
              <StepIcon icon={icon} />
              <span className="flex flex-1 flex-col items-start">
                <Typography variant="paragraph-small-medium">{label}</Typography>
                <Typography variant="paragraph-mini" color="muted">
                  {description}
                </Typography>
              </span>
              <ChevronRight />
            </Button>
          ))}
        </div>
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            Back
          </Button>
          <Button size="sm" onClick={() => onFinish()}>
            Done
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
)

type TourOverlayProps = {
  stepIndex: number
  direction: 1 | -1
  onGoTo: (index: number, direction: 1 | -1) => void
  onSkip: () => void
  onFinish: (page?: PageId) => void
}

const TourOverlay = ({ stepIndex, direction, onGoTo, onSkip, onFinish }: TourOverlayProps) => {
  const portalContainer = usePortalContainerElement() ?? document.body
  const step = TOUR_STEPS[stepIndex]
  const isCentered = step.placement === 'center'
  const { rect, missing } = useTrackedTarget(step.target, step.id, step.select)
  const cardRef = React.useRef<HTMLDivElement>(null)
  const [cardSize, setCardSize] = React.useState({ width: 320, height: 220 })

  const next = React.useCallback(() => onGoTo(Math.min(stepIndex + 1, TOUR_STEPS.length - 1), 1), [onGoTo, stepIndex])
  const back = React.useCallback(() => onGoTo(Math.max(stepIndex - 1, 0), -1), [onGoTo, stepIndex])

  React.useEffect(() => {
    if (missing) onGoTo(stepIndex + direction, direction)
  }, [missing, stepIndex, direction, onGoTo])

  React.useLayoutEffect(() => {
    if (!cardRef.current) return
    const { width, height } = cardRef.current.getBoundingClientRect()
    setCardSize((previous) => (previous.width === width && previous.height === height ? previous : { width, height }))
  })

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onSkip()
      if (event.key === 'ArrowRight') next()
      if (event.key === 'ArrowLeft') back()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [next, back, onSkip])

  const anchoredIndex = ANCHORED_STEPS.findIndex((anchored) => anchored.id === step.id)
  const showAnchored = !isCentered && rect
  const cardPosition = showAnchored ? getCardPosition(rect, step.placement, cardSize) : null

  return createPortal(
    <>
      <div
        className={overlayVariants({ transition: 'mount' })}
        style={showAnchored ? { clipPath: spotlightClipPath(rect) } : undefined}
        onClick={onSkip}
      />

      {showAnchored && (
        <div
          className="pointer-events-none fixed z-[calc(var(--z-overlay)+1)] border-2 border-mint transition-all duration-300"
          style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height, borderRadius: rect.radius }}
        />
      )}

      {(isCentered || showAnchored) && (
        <div
          ref={cardRef}
          role="dialog"
          aria-label={step.title}
          className={cn(
            'fixed z-[calc(var(--z-overlay)+2)] transition-all duration-300',
            isCentered ? 'top-1/2 left-1/2 w-[440px] -translate-x-1/2 -translate-y-1/2' : 'w-[340px]',
          )}
          style={cardPosition ?? undefined}
        >
          {step.id === 'welcome' && <WelcomeCard onStart={next} onSkip={onSkip} />}
          {step.id === 'done' && <DoneCard onBack={back} onFinish={onFinish} />}
          {!isCentered && (
            <Card elevated size="sm">
              <CardContent>
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <Typography variant="paragraph-bold">{step.title}</Typography>
                    <Button variant="ghost" size="icon-xs" aria-label="Close tour" onClick={onSkip}>
                      <X />
                    </Button>
                  </div>
                  <Typography variant="paragraph-small" color="muted">
                    {step.body}
                  </Typography>
                  {step.inside && (
                    <div className="flex flex-col gap-2">
                      {step.inside.map(({ icon: Icon, label, description }) => (
                        <div key={label} className="flex items-center gap-3">
                          <StepIcon icon={Icon} />
                          <div className="flex flex-col">
                            <Typography variant="paragraph-small-medium">{label}</Typography>
                            <Typography variant="paragraph-mini" color="muted">
                              {description}
                            </Typography>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {step.tip && (
                    <Typography variant="paragraph-mini" color="muted">
                      {step.tip}
                    </Typography>
                  )}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <Typography variant="paragraph-mini" color="muted">
                      {anchoredIndex + 1} of {ANCHORED_STEPS.length}
                    </Typography>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={back}>
                        Back
                      </Button>
                      <Button size="sm" onClick={next}>
                        {anchoredIndex === ANCHORED_STEPS.length - 1 ? 'Finish' : 'Next'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </>,
    portalContainer,
  )
}

/** Prototype-only "Workspace tour" section, slotted into the real Settings page above its Danger zone. */
const TourSettingsSection = ({ onReplay }: { onReplay: () => void }) => {
  const [slot, setSlot] = React.useState<HTMLElement | null>(null)

  React.useEffect(() => {
    let created: HTMLElement | null = null
    const interval = window.setInterval(() => {
      const settingsPage = document.querySelector('[data-testid="settings-general-page"]')
      if (!settingsPage || created) return
      created = document.createElement('div')
      settingsPage.insertBefore(created, settingsPage.lastElementChild)
      setSlot(created)
      window.clearInterval(interval)
    }, POLL_MS)
    return () => {
      window.clearInterval(interval)
      created?.remove()
    }
  }, [])

  if (!slot) return null

  return createPortal(
    <SpaceSettingsSection>
      <SpaceSettingsSectionTitle>Workspace tour</SpaceSettingsSectionTitle>
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Typography variant="paragraph-small" color="muted">
          A one-minute look at what your workspace can do.
        </Typography>
        <Button data-testid={TAKE_TOUR_TEST_ID} variant="outline" onClick={onReplay}>
          <Sparkles />
          Take the tour
        </Button>
      </div>
    </SpaceSettingsSection>,
    slot,
  )
}

const ReplayHint = ({ onClose, onReplay }: { onClose: () => void; onReplay: () => void }) => {
  const portalContainer = usePortalContainerElement() ?? document.body
  const { rect } = useTrackedTarget(navTarget('settings'), 'replay-hint')
  if (!rect) return null
  const position = getCardPosition(rect, 'right', { width: 288, height: 112 })

  return createPortal(
    <>
      <div
        className="pointer-events-none fixed z-[var(--z-overlay)] border-2 border-mint"
        style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height, borderRadius: rect.radius }}
      />
      <div className="fixed z-[var(--z-overlay)] w-72" style={position}>
        <Card elevated size="sm">
          <CardContent>
            <div className="flex flex-col gap-3">
              <Typography variant="paragraph-small">
                Take the tour anytime from <strong>Settings</strong>.
              </Typography>
              <div className="flex justify-end gap-1">
                <Button size="xs" variant="ghost" onClick={onReplay}>
                  Take the tour
                </Button>
                <Button size="xs" variant="outline" onClick={onClose}>
                  Got it
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>,
    portalContainer,
  )
}

export type WorkspaceTourPrototypeProps = {
  /** Open the tour on mount, as for a first-time visitor. */
  startOpen?: boolean
  /** Step to open on, by id (e.g. "safe-row"). */
  initialStepId?: string
}

/** Prototype: a first-visit tour drawn over the real workspace shell and pages. */
export const WorkspaceTourPrototype = ({
  startOpen = true,
  initialStepId,
}: WorkspaceTourPrototypeProps): React.ReactElement => {
  const initialIndex = Math.max(
    0,
    TOUR_STEPS.findIndex((step) => step.id === initialStepId),
  )
  const [stepIndex, setStepIndex] = React.useState<number | null>(startOpen ? initialIndex : null)
  const [direction, setDirection] = React.useState<1 | -1>(1)
  const [page, setPage] = React.useState<PageId>(TOUR_STEPS[initialIndex].page ?? 'dashboard')
  const [showReplayHint, setShowReplayHint] = React.useState(!startOpen)

  const goTo = React.useCallback((index: number, nextDirection: 1 | -1) => {
    const step = TOUR_STEPS[index]
    if (!step) return
    if (step.page) setPage(step.page)
    setDirection(nextDirection)
    setStepIndex(index)
  }, [])

  const skip = React.useCallback(() => {
    setStepIndex(null)
    setShowReplayHint(true)
  }, [])

  const finish = React.useCallback((target?: PageId) => {
    setStepIndex(null)
    setPage(target ?? 'dashboard')
  }, [])

  const replay = () => {
    setShowReplayHint(false)
    goTo(0, 1)
  }

  React.useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest('[data-testid^="sidebar-item-"]')
      const target = link && SIDEBAR_PAGES[link.getAttribute('data-testid')!.replace('sidebar-item-', '')]
      if (!target) return
      event.preventDefault()
      event.stopPropagation()
      setPage(target)
      if (target === 'settings') setShowReplayHint(false)
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  const Page = PAGES[page]

  return (
    <>
      <Page key={page} />
      {page === 'settings' && <TourSettingsSection onReplay={replay} />}
      {stepIndex !== null && (
        <TourOverlay stepIndex={stepIndex} direction={direction} onGoTo={goTo} onSkip={skip} onFinish={finish} />
      )}
      {stepIndex === null && showReplayHint && (
        <ReplayHint onClose={() => setShowReplayHint(false)} onReplay={replay} />
      )}
    </>
  )
}
