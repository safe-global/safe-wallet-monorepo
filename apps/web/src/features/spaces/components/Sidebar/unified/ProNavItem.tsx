import { useId, useState, type ReactElement } from 'react'
import Link from 'next/link'
import { SidebarMenuButton, SidebarMenuItem, useSidebar } from '@safe-global/views/components/ui/sidebar'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@safe-global/views/components/ui/hover-card'
import { cn } from '@safe-global/views/utils/cn'
import ProChip from '@/public/images/safe-pro/pro-chip.svg'
import css from '../styles.module.css'
import { REASSURANCE, TRIAL_CTA } from './fixtures'
import type { Role } from './scenario'
import type { ShellHref, ShellPage } from './shellPages'

type ProNavItemProps = {
  page: ShellPage
  /** Overrides the page's own label and description, for a row that stands for two pages. */
  label?: string
  what?: string
  href: ShellHref
  isActive: boolean
  role: Role
  /** The user's own Safe, named in the example. */
  safeName: string
  /** Its group label already carries the Pro chip, which leaves the row's width to the label. */
  isInLockedGroup?: boolean
}

/** A locked item. Always a real link, never `disabled`, so keyboards and screen readers reach it on every plan. */
export const ProNavItem = ({
  page,
  label = page.label,
  what = page.what ?? '',
  href,
  isActive,
  role,
  safeName,
  isInLockedGroup = false,
}: ProNavItemProps): ReactElement => {
  const { isMobile, setOpenMobile } = useSidebar()
  const descriptionId = useId()
  const [isOpen, setIsOpen] = useState(false)

  const button = (
    <SidebarMenuButton
      size="lg"
      isActive={isActive}
      className={cn('h-9 gap-3 text-muted-foreground', css.sidebarInteractive, css.sidebarNavItem)}
      render={<Link href={href} aria-describedby={descriptionId} />}
      onClick={() => isMobile && setOpenMobile(false)}
      data-testid={`unified-pro-item-${page.key}`}
    >
      <div className={cn('opacity-60', isActive && css.activeIcon)}>
        <page.icon />
      </div>
      <span className="truncate group-data-[collapsible=icon]:hidden">{label}</span>
      {!isInLockedGroup && (
        <span className="ml-auto block h-3.5 w-6 shrink-0 group-data-[collapsible=icon]:hidden" aria-hidden>
          <ProChip className="size-full" />
        </span>
      )}
    </SidebarMenuButton>
  )

  return (
    <SidebarMenuItem>
      <span id={descriptionId} className="sr-only">
        Safe Pro feature, not on your plan. {what} Opens a read-only preview.
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
            {label}
            <span className="block h-4 w-7" aria-hidden>
              <ProChip className="size-full" />
            </span>
          </span>
          <p className="text-muted-foreground">{what}</p>
          {page.example && <p className="rounded-md bg-muted p-2 text-xs">{page.example(safeName)}</p>}
          <p className="text-xs font-semibold text-green-500">
            {role === 'admin' ? TRIAL_CTA : 'Ask an admin to start a free 30-day trial'}
          </p>
          <p className="text-xs text-muted-foreground">{REASSURANCE}</p>
        </HoverCardContent>
      </HoverCard>
    </SidebarMenuItem>
  )
}
