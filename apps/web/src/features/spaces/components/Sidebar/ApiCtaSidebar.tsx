import type { ReactElement } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar'
import { cn } from '@/utils/cn'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import css from './styles.module.css'

const API_DOCS_URL = process.env.NEXT_PUBLIC_DEVELOPER_PORTAL_URL || 'https://developer.safe.global/login'
const COLLAPSED_KEY = 'api-cta-sidebar-collapsed'

export const ApiCtaSidebar = (): ReactElement => {
  const [isCollapsed = false, setIsCollapsed] = useLocalStorage<boolean>(COLLAPSED_KEY)

  if (isCollapsed) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className={cn(css.sidebarInteractive, css.footerHelp, css.sidebarNavItem)}
            onClick={() => setIsCollapsed(false)}
            data-testid="api-cta-collapsed"
          >
            <Image
              src="/images/spaces/api-sidebar.svg"
              alt="API"
              width={16}
              height={16}
              className="dark:brightness-0 dark:invert"
            />
            <span className="flex-1">API</span>
            <Badge className="text-[10px] px-1 py-0 leading-none">New</Badge>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <div
      className="flex flex-col gap-2 rounded-[8px] bg-secondary p-3 group-data-[collapsible=icon]:hidden"
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
          onClick={() => setIsCollapsed(true)}
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
        className="w-auto self-start !bg-background hover:!bg-muted"
        render={<a href={API_DOCS_URL} target="_blank" rel="noopener noreferrer" />}
      >
        Get API key
      </Button>
    </div>
  )
}
