import { useState, type CSSProperties, type ReactNode } from 'react'
import { ArrowRightLeft, Menu, Search, Bell, User } from 'lucide-react'
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@safe-global/views/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@safe-global/views/components/ui/avatar'
import SafeLogo from '@/components/common/SafeLogo'
import { Button } from '@safe-global/views/components/ui/button'
import { FeedbackButton, PENDING_QUEUE_FEEDBACK } from './FeedbackButton'
import { spacesMainNavigation, spacesSetupGroup } from '../../components/Sidebar/config'

const navigation = [
  spacesMainNavigation[0],
  { icon: ArrowRightLeft, label: 'Transactions' },
  ...spacesMainNavigation.slice(1),
]

export function PrototypeFrame({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <SidebarProvider
      openMobile={mobileOpen}
      onOpenMobileChange={setMobileOpen}
      style={{ '--sidebar-width': '230px', '--sidebar-width-icon': '52px' } as CSSProperties}
      className="bg-secondary dark:bg-background"
    >
      <Sidebar
        collapsible="icon"
        variant="floating"
        containerClassName="!p-0 border-r-0 group-data-[side=left]:border-r-0"
        innerClassName="rounded-[0_12px_12px_0] group-data-[variant=floating]:rounded-[0_12px_12px_0] shadow-none group-data-[variant=floating]:ring-0"
      >
        <SidebarHeader>
          <div className="relative flex h-10 items-center justify-between">
            <SafeLogo href="/prototypes/pending-queue" showHomeLabel showProLockup />
            <SidebarTrigger />
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton disabled tooltip="Acme Inc · Design preview">
                <Avatar size="sm">
                  <AvatarFallback>A</AvatarFallback>
                </Avatar>
                <span>Acme Inc</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    disabled={item.label !== 'Transactions'}
                    isActive={item.label === 'Transactions'}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>{spacesSetupGroup.label}</SidebarGroupLabel>
            <SidebarMenu>
              {spacesSetupGroup.items.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton disabled tooltip={item.label}>
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <div className="min-w-0 flex-1">
        <header className="@container flex flex-wrap items-start gap-y-2 px-6 pt-6 pb-4 bg-secondary dark:bg-background">
          <div className="mr-2 md:hidden">
            <Button variant="ghost" size="icon" aria-label="Open sidebar menu" onClick={() => setMobileOpen(true)}>
              <Menu />
            </Button>
          </div>
          <div className="flex h-14 shrink-0 items-center @max-[660px]:order-last @max-[660px]:basis-full">
            <Button
              variant="secondary"
              size="xl"
              disabled
              className="w-64 justify-start md:w-80"
              aria-label="Global search unavailable in preview"
            >
              <Search />
              Search for anything
            </Button>
          </div>
          <div className="ml-auto flex min-w-0 flex-wrap items-center gap-1 rounded-xl bg-card p-2 @max-[660px]:ml-0">
            <FeedbackButton {...PENDING_QUEUE_FEEDBACK} />
            <Button variant="ghost" size="icon" disabled aria-label="Notifications unavailable in preview">
              <Bell />
            </Button>
            <Button variant="ghost" size="icon" disabled aria-label="Preview account">
              <User />
            </Button>
          </div>
        </header>
        {children}
      </div>
    </SidebarProvider>
  )
}
