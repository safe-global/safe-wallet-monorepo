import type { MouseEvent, ReactElement, ReactNode } from 'react'
import { Sparkles } from 'lucide-react'
import { SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar'
import { cn } from '@/utils/cn'
import { icons } from '@/features/spaces/components/Sidebar/config'
import css from '@/features/spaces/components/Sidebar/styles.module.css'
import { Switch } from '@/components/ui/switch'
import { Field, FieldLabel } from '@/components/ui/field'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export type SidebarCommonFooterViewProps = {
  isSafeSidebar: boolean
  showDevToggles: boolean
  isDarkMode: boolean
  onDarkModeChange: (checked: boolean) => void
  isProdGateway: boolean
  onToggleGateway: (checked: boolean) => void
  /** The banner slot is open (a banner is shown and its lazy chunk has loaded). */
  showBannerSlot: boolean
  showSafeProBanner: boolean
  showTwoFactorCard: boolean
  /** Set when the Safe Pro banner is mounted; it stays mounted (invisible) while the 2FA card shows. */
  renderSafeProBanner?: (props: { className: string }) => ReactNode
  /** Set when the 2FA awareness card is mounted. */
  renderTwoFactorCard?: (props: { className: string }) => ReactNode
  apiCta: ReactNode
  onHelpClick: (event: MouseEvent<HTMLButtonElement>) => void
  beamerId: string
  onBeamerClick: () => void
  indexingStatus: ReactNode
  helpMenu: ReactNode
}

export const SidebarCommonFooterView = ({
  isSafeSidebar,
  showDevToggles,
  isDarkMode,
  onDarkModeChange,
  isProdGateway,
  onToggleGateway,
  showBannerSlot,
  showSafeProBanner,
  showTwoFactorCard,
  renderSafeProBanner,
  renderTwoFactorCard,
  apiCta,
  onHelpClick,
  beamerId,
  onBeamerClick,
  indexingStatus,
  helpMenu,
}: SidebarCommonFooterViewProps): ReactElement => (
  <SidebarFooter data-testid="sidebar-common-footer">
    {/* Dev Toggles - only in non-production */}
    {showDevToggles && (
      <div className="flex flex-col gap-2 px-3 py-2 group-data-[collapsible=icon]:hidden">
        <Field orientation="horizontal">
          <Switch id="dark-mode-toggle" checked={isDarkMode} onCheckedChange={onDarkModeChange} />
          <FieldLabel htmlFor="dark-mode-toggle">Dark mode</FieldLabel>
        </Field>
        {isSafeSidebar && (
          <Field orientation="horizontal">
            <Switch id="prod-cgw-toggle" checked={isProdGateway} onCheckedChange={onToggleGateway} />
            <FieldLabel htmlFor="prod-cgw-toggle">Use prod CGW</FieldLabel>
          </Field>
        )}
      </div>
    )}

    <SidebarMenu className="gap-0.5">
      {showBannerSlot && (
        <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
          {/* One grid cell for both, so nothing below moves when one gives way to the other. */}
          <div className="mb-2 grid">
            {renderSafeProBanner?.({ className: cn('col-start-1 row-start-1', !showSafeProBanner && 'invisible') })}
            {renderTwoFactorCard?.({ className: cn('col-start-1 row-start-1', !showTwoFactorCard && 'invisible') })}
          </div>
        </SidebarMenuItem>
      )}

      {apiCta}

      <SidebarMenuItem
        className={cn(
          css.footerHelpRow,
          'group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-0.5',
        )}
      >
        <SidebarMenuButton
          className={cn(
            'h-9 min-w-0 flex-1 gap-3 group-data-[collapsible=icon]:flex-none',
            css.sidebarInteractive,
            css.sidebarNavItem,
          )}
          data-testid="list-item-need-help"
          onClick={onHelpClick}
        >
          <Tooltip>
            <TooltipTrigger render={<div />} className="flex min-w-0 cursor-pointer items-center gap-3">
              <icons.CircleHelp />
              <span className="truncate group-data-[collapsible=icon]:hidden">Help</span>
            </TooltipTrigger>
            <TooltipContent side="right">Help center</TooltipContent>
          </Tooltip>
        </SidebarMenuButton>
        <Tooltip>
          <TooltipTrigger
            render={
              <SidebarMenuButton
                type="button"
                id={beamerId}
                data-testid="list-item-whats-new"
                aria-label="What's new"
                className={cn(
                  'h-9 w-9 min-w-9 shrink-0 gap-0 !px-0 !py-0 text-center !justify-center !overflow-visible',
                  '[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:stroke-[1.25]',
                  css.sidebarInteractive,
                  css.footerBeamerButton,
                )}
                onClick={onBeamerClick}
              />
            }
          >
            <Sparkles aria-hidden strokeWidth={1.25} />
          </TooltipTrigger>
          <TooltipContent side="top">What&apos;s new</TooltipContent>
        </Tooltip>
        <div className={css.footerHelpStatus}>{indexingStatus}</div>
      </SidebarMenuItem>
    </SidebarMenu>

    {helpMenu}
  </SidebarFooter>
)
