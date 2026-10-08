import type { ReactNode } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import classnames from 'classnames'
import AccountItemContent from '@views/features/myAccounts/components/AccountItem/AccountItemContent'
import css from './styles.module.css'

export type MultiAccountItemViewProps = {
  expanded: boolean
  onToggle: () => void
  isCurrentSafe: boolean
  isSpaceSafe: boolean
  summary: ReactNode
  pinButton?: ReactNode
  contextMenu: ReactNode
  subItems: ReactNode
  addNetworkButton?: ReactNode
}

export const MultiAccountItemView = ({
  expanded,
  onToggle,
  isCurrentSafe,
  isSpaceSafe,
  summary,
  pinButton,
  contextMenu,
  subItems,
  addNetworkButton,
}: MultiAccountItemViewProps) => {
  return (
    <div
      data-testid="safe-list-item"
      className={classnames(css.multiListItem, css.listItem, { [css.currentListItem]: isCurrentSafe })}
    >
      <Collapsible open={expanded} onOpenChange={onToggle}>
        <CollapsibleTrigger
          data-testid="multichain-item-summary"
          // `nativeButton={false}` is required when rendering as a non-<button>: without it Base UI
          // keeps its native-button path, emitting no `role="button"` and no Enter/Space handling, so
          // keyboard users could focus this header but never expand it — locking every Safe in the
          // group behind a mouse.
          nativeButton={false}
          render={<div className="flex w-full cursor-pointer items-center p-2" />}
        >
          <div className="min-w-0 flex-1">
            <AccountItemContent data-testid="multichain-content">
              {summary}
              <span className="flex items-center" onClick={(e) => e.stopPropagation()}>
                {pinButton}
                {isSpaceSafe ? (
                  <>
                    <div className="w-10" />
                    {contextMenu}
                  </>
                ) : (
                  contextMenu
                )}
              </span>
            </AccountItemContent>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-3">
          <div data-testid="subacounts-container">{subItems}</div>
          {addNetworkButton && (
            <>
              <Separator bleed="3" />
              <div className="-mx-3 flex items-center justify-center">{addNetworkButton}</div>
            </>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
