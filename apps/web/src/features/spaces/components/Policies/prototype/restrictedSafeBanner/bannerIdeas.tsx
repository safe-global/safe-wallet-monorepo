import { useCallback, useEffect, useState, type ReactElement, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Popover as PopoverPrimitive } from '@base-ui/react/popover'
import { ArrowRight, ArrowUpRight, CirclePlus, ListChecks, Plus, ShieldCheck, Sparkles, X } from 'lucide-react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import ExternalLink from '@safe-global/views/components/common/ExternalLink'
import { ChooserRow } from '@safe-global/views/components/common/ChooserRow'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@safe-global/views/components/ui/dialog'
import { Link } from '@safe-global/views/components/ui/link'
import { Typography } from '@safe-global/views/components/ui/typography'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
} from '@safe-global/views/components/ui/popover'
import { cn } from '@safe-global/views/utils/cn'
import AddPolicyOptionButton from '@safe-global/views/features/spaces/components/Policies/AddPolicyDialog/AddPolicyOptionButton'
import { ADD_POLICY_OPTIONS } from '@safe-global/views/features/spaces/components/Policies/AddPolicyDialog/options'
// Same mint wash and shimmer as WorkspaceBanner.
import { CreateSafeFlow, type SafeKind } from '../allowlistSafe/allowlistSafeFlow'
import { CONTACT_GROUPS, POPULAR_TOKENS } from '../m2SetupFlow'
import Identicon from '@/components/common/Identicon'
import workspaceBannerCss from './styles.module.css'

export type BannerIdea = 'strip' | 'card' | 'chooser' | 'sidebar' | 'tooltip'
export type BannerPage = 'safe-accounts' | 'policies'

const ADD_BUTTON = {
  'safe-accounts': '[data-testid="open-add-accounts-chooser-button"]',
  policies: '[data-testid="m2-new-policy-button"]',
} as const

const COPY = {
  title: 'Protected Safe account',
  headline: 'Pay known recipients with fewer signatures',
  description: 'Transfer only tokens you pick to recipients you trust.',
  cta: 'Create Safe account',
}

/** Waits for a production element, then adds an empty node next to it to portal into. */
const usePortalSlot = (selector: string, where: 'after' | 'prepend', className?: string): HTMLElement | null => {
  const [slot, setSlot] = useState<HTMLElement | null>(null)

  useEffect(() => {
    let node: HTMLElement | null = null
    const attach = () => {
      const anchor = document.querySelector(selector)
      if (!anchor || node?.isConnected) return
      node = document.createElement('div')
      if (className) node.className = className
      if (where === 'after') anchor.after(node)
      else anchor.prepend(node)
      setSlot(node)
    }
    attach()
    const observer = new MutationObserver(attach)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
      node?.remove()
    }
  }, [selector, where, className])

  return slot
}

const useElement = (selector: string): Element | null => {
  const [element, setElement] = useState<Element | null>(null)

  useEffect(() => {
    const find = () => setElement(document.querySelector(selector))
    find()
    const observer = new MutationObserver(find)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [selector])

  return element
}

/** Opens the prototype's chooser instead of the production one when the page's add button is clicked. */
const useInterceptClick = (selector: string, onClick: () => void, isEnabled: boolean) => {
  useEffect(() => {
    if (!isEnabled) return
    const handle = (event: MouseEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest(selector)) return
      event.preventDefault()
      event.stopPropagation()
      onClick()
    }
    document.addEventListener('click', handle, true)
    return () => document.removeEventListener('click', handle, true)
  }, [selector, onClick, isEnabled])
}

const PAGE_SLOT = {
  'safe-accounts': 'main h2',
  policies: '[data-testid="policies-heading"]',
} as const

const InPageSlot = ({ page, children }: { page: BannerPage; children: ReactNode }): ReactElement | null => {
  const slot = usePortalSlot(PAGE_SLOT[page], 'after', 'mb-6')
  return slot ? createPortal(children, slot) : null
}

/** 1 · Announcement strip, as the Workspace announcement. */
const AnnouncementStrip = ({ onCreate }: { onCreate: () => void }): ReactElement => (
  <Card
    variant="outlined"
    size="none"
    radius="lg"
    className={cn(
      // eslint-disable-next-line no-restricted-syntax -- copies WorkspaceBanner's bespoke padding and shadow
      'w-full px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.05)]',
      workspaceBannerCss.banner,
    )}
  >
    <div className="flex items-center gap-3">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
        <Badge className="relative overflow-hidden">
          <span className={workspaceBannerCss.shimmer} aria-hidden="true" />
          <Sparkles className="size-3" />
          New
        </Badge>
        <span className="text-sm font-semibold tracking-[-0.01em] text-foreground">{COPY.title}</span>
        <span className="text-sm text-muted-foreground">Only pay the recipients you pick</span>
      </div>

      <Link
        render={<button type="button" onClick={onCreate} />}
        className="group inline-flex shrink-0 cursor-pointer items-center gap-1 text-xs font-medium"
      >
        Create one
        <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </Link>
    </div>
  </Card>
)

/** 2 · Feature card, as the Policies upsell card. */
const FeatureCard = ({ onCreate, onDismiss }: { onCreate: () => void; onDismiss: () => void }): ReactElement => (
  <Card radius="xl" className="relative">
    <CardContent>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          {/* eslint-disable-next-line no-restricted-syntax -- the green status pill keeps the same border as the banners */}
          <Badge variant="success" size="status" shape="status" className="border border-green-200">
            New
          </Badge>

          <Typography variant="h4" className="font-bold">
            {COPY.headline}
          </Typography>

          <Typography variant="paragraph-small" className="text-muted-foreground">
            {COPY.description}{' '}
            <ExternalLink
              noIcon
              className="font-normal text-muted-foreground underline"
              href={HelpCenterArticle.POLICIES}
            >
              Learn more
            </ExternalLink>
          </Typography>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" onClick={onDismiss}>
            Not now
          </Button>
          <Button onClick={onCreate} className="font-semibold">
            Create account
            <ArrowRight aria-hidden className="text-[var(--color-static-text-brand)]" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
)

type ChooserProps = { open: boolean; onOpenChange: (open: boolean) => void; onCreate: (kind: SafeKind) => void }

/** 3 · A new option in the page's own add dialog. */
const AddSafeAccountsChooser = ({ open, onOpenChange, onCreate }: ChooserProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent
      showCloseButton
      padding="md"
      // eslint-disable-next-line no-restricted-syntax -- same width and dark border as the production chooser
      className="max-w-[440px] dark:border dark:border-border"
    >
      <DialogHeader
        // eslint-disable-next-line no-restricted-syntax -- same header padding as the production chooser
        className="p-0 pb-3"
      >
        <DialogTitle className="font-bold">Add Safe accounts</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <ChooserRow
          icon={<Plus className="size-4" />}
          title="Select from my accounts"
          onClick={() => onOpenChange(false)}
        />
        <ChooserRow
          icon={<CirclePlus className="size-4" />}
          title="Create new Safe"
          onClick={() => onCreate('standard')}
        />
      </div>
    </DialogContent>
  </Dialog>
)

const AddPolicyChooser = ({ open, onOpenChange, onCreate }: ChooserProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent size="xs">
      <DialogHeader>
        <DialogTitle className="text-xl leading-6 font-semibold">Add policy</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-3 px-4 pb-4">
        {ADD_POLICY_OPTIONS.filter((option) => option.id !== 'suggestion').map((option) => (
          <AddPolicyOptionButton key={option.id} {...option} onClick={() => onOpenChange(false)} />
        ))}
        <AddPolicyOptionButton
          id="suggestion"
          title="Protected Safe account"
          description={COPY.description}
          Icon={ListChecks}
          onClick={() => onCreate('restricted')}
        />
        {/* The C prototype's quiet footer line in place of the suggestion tile. */}
        <div className="mt-1 flex items-center justify-between gap-3 border-t border-border pt-4">
          <Typography variant="paragraph-small" color="muted">
            Missing a policy you need?
          </Typography>
          <Button variant="ghost-muted" size="sm" onClick={() => onOpenChange(false)}>
            Suggest one
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
)

const Chooser = ({ page, ...props }: ChooserProps & { page: BannerPage }) =>
  page === 'safe-accounts' ? <AddSafeAccountsChooser {...props} /> : <AddPolicyChooser {...props} />

/** 4 · Sidebar card, as the API card in the sidebar footer. */
const SidebarCard = ({ onCreate, onDismiss }: { onCreate: () => void; onDismiss: () => void }): ReactElement | null => {
  const slot = usePortalSlot('[data-testid="sidebar-common-footer"] [data-sidebar="menu"]', 'prepend', 'mb-2')
  if (!slot) return null

  return createPortal(
    <div className="flex flex-col gap-1.5 rounded-md bg-secondary p-2 group-data-[collapsible=icon]:hidden">
      <div className="flex w-full items-start justify-between">
        <ShieldCheck className="size-6 shrink-0" />
        <button
          type="button"
          className="shrink-0 text-muted-foreground hover:text-foreground"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </button>
      </div>

      <Typography variant="paragraph-small-bold">{COPY.title}</Typography>
      <Typography variant="paragraph-small" color="muted" className="leading-snug">
        Only transfer the tokens you pick to the recipients you pick.
      </Typography>

      <Button variant="outline" size="sm" className="w-auto self-start" onClick={onCreate}>
        Create one
      </Button>
    </div>,
    slot,
  )
}

/** Tokens you pick, through the shield, to recipients you trust. */
const ProtectedPicture = (): ReactElement => (
  <div aria-hidden className="flex items-center justify-center gap-4 rounded-md bg-muted px-4 py-3">
    <div className="flex -space-x-2">
      {POPULAR_TOKENS.slice(0, 3).map(({ symbol, logoUri }) => (
        <img key={symbol} src={logoUri} alt="" className="size-6 rounded-full ring-2 ring-muted" />
      ))}
    </div>
    <ShieldCheck className="size-7 text-[var(--color-success-main)]" />
    <div className="flex -space-x-2">
      {(CONTACT_GROUPS[0]?.contacts ?? []).slice(0, 2).map(({ address }) => (
        <span key={address} className="flex rounded-full ring-2 ring-muted">
          <Identicon address={address} size={24} />
        </span>
      ))}
    </div>
  </div>
)

/** A green dot on the button the coachmark points at, gone with the coachmark. */
const PulseDot = ({ anchor }: { anchor: Element }): ReactElement | null => {
  useEffect(() => {
    if (!(anchor instanceof HTMLElement)) return
    const { position } = anchor.style
    anchor.style.position = 'relative'
    return () => {
      anchor.style.position = position
    }
  }, [anchor])

  return createPortal(
    <span aria-hidden className="pointer-events-none absolute -top-1 -right-1 flex size-3">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--color-success-main)] opacity-75" />
      <span className="relative inline-flex size-3 rounded-full bg-[var(--color-success-main)] ring-2 ring-background" />
    </span>,
    anchor,
  )
}

/** 5 · A popover on the page's add button: back on every visit until Got it. */
const OnboardingTip = ({
  page,
  onCreate,
  onDismiss,
}: {
  page: BannerPage
  onCreate: () => void
  onDismiss: () => void
}): ReactElement | null => {
  const anchor = useElement(ADD_BUTTON[page])
  if (!anchor) return null

  return (
    <>
      <PulseDot anchor={anchor} />
      <Popover open modal={false}>
        <PopoverContent
          anchor={anchor}
          side="bottom"
          align="end"
          sideOffset={12}
          initialFocus={false}
          className="w-[360px] gap-4 overflow-visible shadow-[0_32px_72px_-16px_rgba(0,0,0,0.35),0_12px_28px_-8px_rgba(0,0,0,0.18)] ring-0"
        >
          {/* Points at the button, as the app's onboarding tooltip does. */}
          <PopoverPrimitive.Arrow className="size-3 rotate-45 rounded-[2px] bg-popover data-[side=bottom]:-top-1.5" />

          <ProtectedPicture />

          <PopoverHeader className="gap-1.5">
            <div className="flex items-center gap-2">
              <PopoverTitle className="font-semibold">{COPY.title}</PopoverTitle>
              <Badge variant="success" size="status" shape="status">
                New
              </Badge>
            </div>
            <PopoverDescription>{COPY.description}</PopoverDescription>
          </PopoverHeader>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onDismiss}>
              Got it
            </Button>
            <Button size="sm" onClick={onCreate}>
              Create protected Safe account
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </>
  )
}

/** Adds one of the five pointers to a production page without changing the page itself. */
export const RestrictedSafePointer = ({
  idea,
  page,
  isDismissed: isDismissedOutside,
  onDismiss,
}: {
  idea: BannerIdea
  page: BannerPage
  /** Set to share one Got it across pages. */
  isDismissed?: boolean
  onDismiss?: () => void
}): ReactElement => {
  const [isDismissedHere, setIsDismissedHere] = useState(false)
  const isDismissed = isDismissedOutside ?? isDismissedHere
  const [isChooserOpen, setIsChooserOpen] = useState(false)
  const [creating, setCreating] = useState<SafeKind | null>(null)
  const openChooser = useCallback(() => setIsChooserOpen(true), [])
  const dismiss = onDismiss ?? (() => setIsDismissedHere(true))
  const create = (kind: SafeKind) => {
    setIsChooserOpen(false)
    setCreating(kind)
  }
  const createRestricted = () => create('restricted')

  useInterceptClick(ADD_BUTTON[page], openChooser, idea === 'chooser' || idea === 'tooltip')

  return (
    <>
      {!isDismissed && idea === 'strip' && (
        <InPageSlot page={page}>
          <AnnouncementStrip onCreate={createRestricted} />
        </InPageSlot>
      )}
      {!isDismissed && idea === 'card' && (
        <InPageSlot page={page}>
          <FeatureCard onCreate={createRestricted} onDismiss={dismiss} />
        </InPageSlot>
      )}
      {!isDismissed && idea === 'sidebar' && <SidebarCard onCreate={createRestricted} onDismiss={dismiss} />}
      {!isDismissed && idea === 'tooltip' && !isChooserOpen && !creating && (
        <OnboardingTip page={page} onCreate={createRestricted} onDismiss={dismiss} />
      )}
      <Chooser page={page} open={isChooserOpen} onOpenChange={setIsChooserOpen} onCreate={create} />
      {creating && (
        <CreateSafeFlow initialKind={creating} onClose={() => setCreating(null)} onCreate={() => setCreating(null)} />
      )}
    </>
  )
}
