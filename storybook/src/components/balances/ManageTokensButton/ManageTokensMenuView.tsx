import { type ReactElement, type ReactNode } from 'react'
import { Info } from 'lucide-react'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import ExternalLink from '@/components/common/ExternalLink'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import Track from '@/components/common/Track'
import { ASSETS_EVENTS } from '@/services/analytics/events/assets'
import { cn } from '@/utils/cn'

const MenuInfoTooltip = ({ title, 'data-testid': dataTestId }: { title: ReactNode; 'data-testid'?: string }) => (
  <Tooltip>
    <TooltipTrigger
      render={
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground inline-flex shrink-0"
          onClick={(event) => event.stopPropagation()}
          data-testid={dataTestId}
        >
          <Info className="size-3.5" />
        </button>
      }
    />
    <TooltipContent side="top">{title}</TooltipContent>
  </Tooltip>
)

const MenuToggleRow = ({
  label,
  infoTooltip,
  checked,
  onCheckedChange,
  'data-testid': dataTestId,
  switchTestId,
  trackProps,
}: {
  label: string
  infoTooltip?: ReactNode
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  'data-testid'?: string
  switchTestId?: string
  trackProps?: Omit<React.ComponentProps<typeof Track>, 'children'>
}) => {
  const switchControl = (
    <Switch
      size="sm"
      checked={checked}
      onClick={(event) => event.stopPropagation()}
      onCheckedChange={onCheckedChange}
      data-testid={switchTestId}
    />
  )

  return (
    <div
      role="menuitem"
      className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-2.5 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      onClick={() => onCheckedChange(!checked)}
      data-testid={dataTestId}
    >
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <span className="text-sm font-medium">{label}</span>
        {infoTooltip}
      </div>
      {trackProps ? <Track {...trackProps}>{switchControl}</Track> : switchControl}
    </div>
  )
}

export type ManageTokensMenuViewProps = {
  hasDefaultTokenlist: boolean
  showAllTokens: boolean
  hideDust: boolean
  isSafeDeployed: boolean
  hiddenTokensCount: number
  dustThreshold: number
  onToggleShowAllTokens: (checked: boolean) => void
  onToggleHideDust: (checked: boolean) => void
  onHideTokens: () => void
}

export const ManageTokensMenuView = ({
  hasDefaultTokenlist,
  showAllTokens,
  hideDust,
  isSafeDeployed,
  hiddenTokensCount,
  dustThreshold,
  onToggleShowAllTokens,
  onToggleHideDust,
  onHideTokens,
}: ManageTokensMenuViewProps): ReactElement => {
  return (
    <DropdownMenuContent
      align="end"
      sideOffset={8}
      className={cn(
        'w-[min(100vw-2rem,280px)] overflow-hidden rounded-[var(--radius-xl)] border border-border bg-popover p-1.5 shadow-md ring-0',
      )}
      data-testid="manage-tokens-menu"
    >
      {hasDefaultTokenlist && (
        <MenuToggleRow
          label="Show all tokens"
          infoTooltip={
            <MenuInfoTooltip
              data-testid="show-all-tokens-info-tooltip"
              title={
                <Typography variant="paragraph-small">
                  Learn more about <ExternalLink href={HelpCenterArticle.SPAM_TOKENS}>default tokens</ExternalLink>
                </Typography>
              }
            />
          }
          checked={showAllTokens}
          onCheckedChange={onToggleShowAllTokens}
          data-testid="show-all-tokens-menu-item"
          switchTestId="show-all-tokens-switch"
          trackProps={{
            ...(showAllTokens ? ASSETS_EVENTS.SHOW_ALL_TOKENS : ASSETS_EVENTS.SHOW_DEFAULT_TOKENS),
          }}
        />
      )}

      {isSafeDeployed && (
        <MenuToggleRow
          label="Hide small balances"
          infoTooltip={
            <MenuInfoTooltip
              data-testid="hide-small-balances-info-tooltip"
              title={
                <Typography variant="paragraph-small">Hide tokens with a value less than ${dustThreshold}</Typography>
              }
            />
          }
          checked={hideDust}
          onCheckedChange={onToggleHideDust}
          data-testid="hide-small-balances-menu-item"
          switchTestId="hide-small-balances-switch"
        />
      )}

      <DropdownMenuSeparator data-testid="manage-tokens-menu-divider" />

      <DropdownMenuItem
        onClick={onHideTokens}
        className="cursor-pointer rounded-lg font-medium focus:bg-muted"
        data-testid="hide-tokens-menu-item"
      >
        <Track {...ASSETS_EVENTS.SHOW_HIDDEN_ASSETS}>
          <span>Hide tokens{hiddenTokensCount > 0 ? ` (${hiddenTokensCount})` : ''}</span>
        </Track>
      </DropdownMenuItem>
    </DropdownMenuContent>
  )
}
