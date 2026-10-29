import { useId, useState, type ReactElement } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { SidebarMenuButton, SidebarMenuItem, useSidebar } from '@safe-global/views/components/ui/sidebar'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@safe-global/views/components/ui/hover-card'
import { cn } from '@safe-global/views/utils/cn'
import ProChip from '@/public/images/safe-pro/pro-chip.svg'
import css from '../styles.module.css'
import { REASSURANCE, TRIAL_CTA } from './fixtures'
import { PREVIEW_ROUTE, type ProItem } from './proItems'
import type { Role } from './scenario'

type ProNavItemProps = {
  item: ProItem
  /** The plan includes it: a plain nav item, no popover. */
  isIncluded: boolean
  role: Role
  safe: string | undefined
  safeName: string
  otherSafeName: string
}

/** Always a real link, never `disabled`, so keyboards and screen readers reach it on every plan. */
export const ProNavItem = ({
  item,
  isIncluded,
  role,
  safe,
  safeName,
  otherSafeName,
}: ProNavItemProps): ReactElement => {
  const { pathname, query } = useRouter()
  const { isMobile, setOpenMobile } = useSidebar()
  const descriptionId = useId()
  const [isOpen, setIsOpen] = useState(false)
  const href = { pathname: PREVIEW_ROUTE, query: { ...(safe ? { safe } : {}), feature: item.key } }
  const isActive = pathname === PREVIEW_ROUTE && query.feature === item.key
  const isLocked = !isIncluded && item.key !== 'plan'

  const button = (
    <SidebarMenuButton
      size="lg"
      isActive={isActive}
      className={cn('h-9 gap-3', css.sidebarInteractive, css.sidebarNavItem, isLocked && 'text-muted-foreground')}
      render={<Link href={href} aria-describedby={isLocked ? descriptionId : undefined} />}
      onClick={() => isMobile && setOpenMobile(false)}
      data-testid={`unified-pro-item-${item.key}`}
    >
      <div className={cn(isActive && css.activeIcon, isLocked && 'opacity-60')}>
        <item.icon />
      </div>
      <span className="truncate group-data-[collapsible=icon]:hidden">{item.label}</span>
      {isLocked && (
        <span className="ml-auto block h-3.5 w-6 shrink-0 group-data-[collapsible=icon]:hidden" aria-hidden>
          <ProChip className="size-full" />
        </span>
      )}
    </SidebarMenuButton>
  )

  if (!isLocked) return <SidebarMenuItem>{button}</SidebarMenuItem>

  return (
    <SidebarMenuItem>
      <span id={descriptionId} className="sr-only">
        Safe Pro feature, not on your plan. {item.what} Opens a preview.
      </span>
      <HoverCard open={isOpen} onOpenChange={setIsOpen}>
        {/* The preview card opens on hover only, so keyboard focus opens it here. */}
        <HoverCardTrigger
          delay={250}
          render={button}
          onFocus={(event) => event.currentTarget.matches(':focus-visible') && setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          onKeyDown={(event) => event.key === 'Escape' && setIsOpen(false)}
        />
        <HoverCardContent side="right" align="start" sideOffset={8} className="flex w-72 flex-col gap-2">
          <span className="flex items-center gap-2 font-semibold">
            {item.label}
            <span className="block h-4 w-7" aria-hidden>
              <ProChip className="size-full" />
            </span>
          </span>
          <p className="text-muted-foreground">{item.what}</p>
          <p className="rounded-md bg-muted p-2 text-xs">{item.example(safeName, otherSafeName)}</p>
          <p className="text-xs font-semibold text-green-500">
            {role === 'admin' ? TRIAL_CTA : 'Ask an admin to start a free 30-day trial'}
          </p>
          <p className="text-xs text-muted-foreground">{REASSURANCE}</p>
        </HoverCardContent>
      </HoverCard>
    </SidebarMenuItem>
  )
}
