import type { ReactElement, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import css from './styles.module.css'
import classnames from 'classnames'

export type MultisendActionsHeaderViewProps = {
  onExpandAll: () => void
  onCollapseAll: () => void
  compact?: boolean
  title?: string
}

export const MultisendActionsHeaderView = ({
  onExpandAll,
  onCollapseAll,
  compact = false,
  title = 'All actions',
}: MultisendActionsHeaderViewProps) => {
  return (
    <div data-testid="all-actions" className={classnames(css.actionsHeader, { [css.compactHeader]: compact })}>
      <span className="text-base">{title}</span>
      <div className="flex flex-row">
        <Button data-testid="expande-all-btn" onClick={onExpandAll} variant="ghost" size="xs">
          Expand all
        </Button>
        <Button data-testid="collapse-all-btn" onClick={onCollapseAll} variant="ghost" size="xs">
          Collapse all
        </Button>
      </div>
    </div>
  )
}

export type MultisendItemProps = {
  variant: 'outlined' | 'elevation'
  radius: 'none'
}

export type MultisendViewProps = {
  header: ReactNode
  compact: boolean
  renderItems: (props: MultisendItemProps) => ReactNode
}

export const MultisendView = ({ header, compact, renderItems }: MultisendViewProps): ReactElement => {
  const actionItems = renderItems({ variant: compact ? 'outlined' : 'elevation', radius: 'none' })

  return (
    <>
      {header}

      {compact ? (
        <Card variant="muted" size="none">
          <CardContent>
            {/* Same padding-outside / clipping-inside pair as ExecuteBatch's DecodedTxs, which renders
                this identical block: 8px = the card's 16px less the 8px inset, so the white action
                rows stay concentric with the grey card's curve. */}
            <div className="p-2">
              <div className="flex flex-col divide-y divide-border overflow-hidden rounded-sm">{actionItems}</div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col divide-y divide-border">{actionItems}</div>
      )}
    </>
  )
}
