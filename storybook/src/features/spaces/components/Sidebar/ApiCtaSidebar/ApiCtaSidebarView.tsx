import type { ReactElement } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import { SidebarMenuItem, SidebarMenuButton, useSidebar } from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'
import css from '@/features/spaces/components/Sidebar/styles.module.css'

export type ApiCtaSidebarViewProps = {
  apiDocsUrl: string
  isCollapsed: boolean
  onCollapsedChange: (isCollapsed: boolean) => void
}

export const ApiCtaSidebarView = ({
  apiDocsUrl,
  isCollapsed,
  onCollapsedChange,
}: ApiCtaSidebarViewProps): ReactElement => {
  const { state } = useSidebar()
  const isIconCollapsed = state === 'collapsed'
  const showCollapsedButton = isCollapsed || isIconCollapsed

  if (showCollapsedButton) {
    return (
      <SidebarMenuItem className={css.footerHelpRow}>
        <SidebarMenuButton
          className={cn('h-9 min-w-0 flex-1 gap-3', css.sidebarInteractive, css.sidebarNavItem)}
          onClick={!isIconCollapsed ? () => onCollapsedChange(false) : undefined}
          data-testid="api-cta-collapsed"
          aria-label="API"
          render={isIconCollapsed ? <a href={apiDocsUrl} target="_blank" rel="noopener noreferrer" /> : undefined}
        >
          <Tooltip>
            <TooltipTrigger render={<div />} className="flex min-w-0 cursor-pointer items-center gap-3">
              <Image
                src="/images/spaces/api-sidebar.svg"
                alt="API"
                width={16}
                height={16}
                className="dark:brightness-0 dark:invert"
              />
              <span className="min-w-0 flex-1 truncate group-data-[collapsible=icon]:hidden">API</span>
            </TooltipTrigger>
            <TooltipContent side="right">API</TooltipContent>
          </Tooltip>
        </SidebarMenuButton>
        <div
          className={cn(css.footerHelpStatus, !isIconCollapsed && 'cursor-pointer')}
          onClick={!isIconCollapsed ? () => onCollapsedChange(false) : undefined}
        >
          <Badge size="sm" className="tabular-nums group-data-[collapsible=icon]:hidden">
            New
          </Badge>
        </div>
      </SidebarMenuItem>
    )
  }

  return (
    <SidebarMenuItem>
      <div
        className="flex flex-col gap-1.5 rounded-md bg-secondary p-2 group-data-[collapsible=icon]:hidden"
        data-testid="api-cta-sidebar"
      >
        <div className="flex w-full items-start justify-between">
          <Image
            src="/images/spaces/api-sidebar.svg"
            alt="API"
            width={24}
            height={24}
            className="shrink-0 dark:brightness-0 dark:invert"
          />
          <button
            className="shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => onCollapsedChange(true)}
            aria-label="Minimize API section"
            data-testid="api-cta-minimize"
          >
            <X className="size-4" />
          </button>
        </div>

        <Typography variant="paragraph-small" color="muted" className="leading-snug">
          Authenticated access, predictable quotas, and webhooks for teams that rely on Safe as critical infrastructure.
        </Typography>

        <Button
          variant="outline"
          size="sm"
          className="w-auto self-start"
          render={<a href={apiDocsUrl} target="_blank" rel="noopener noreferrer" />}
        >
          Get API key
        </Button>
      </div>
    </SidebarMenuItem>
  )
}
