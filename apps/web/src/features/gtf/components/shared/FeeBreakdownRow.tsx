import type { ReactElement, ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'

import InfoIcon from '@/public/images/notifications/info.svg'
import type { FeeRow } from '../../hooks/useFeesPreview'
import css from './FeeBreakdownRow.module.css'

export type FeeBreakdownRowProps = FeeRow & {
  loading?: boolean
  error?: boolean
  tooltip?: ReactNode
  /**
   * History view uses semantic `<del>` while the live preview uses a class-based strikethrough
   * (so the "free" copy isn't picked up by AT as deleted content during signing). Defaults to
   * the class variant.
   */
  strikeAs?: 'del' | 'class'
}

export const FeeBreakdownRow = ({
  label,
  amount,
  currency,
  fiatAmount,
  isFree,
  note,
  loading,
  error,
  tooltip,
  strikeAs = 'class',
}: FeeBreakdownRowProps): ReactElement => (
  <div className={css.feeRow}>
    <div className={css.feeLabel}>
      <Typography variant="paragraph-small">{label}</Typography>
      {tooltip && (
        <Tooltip>
          <TooltipTrigger render={<span className={css.tooltipIcon} />}>
            <InfoIcon className="size-4 text-border" />
          </TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      )}
    </div>

    <div className={css.feeValue}>
      {loading ? (
        <Skeleton className="h-4 min-w-[7em]" />
      ) : error ? (
        <Typography variant="paragraph-small" className="text-[var(--color-warning-main)]">
          Cannot estimate
        </Typography>
      ) : note ? (
        <Typography variant="paragraph-small" color="muted">
          {note}
        </Typography>
      ) : (
        <>
          <div className={css.feeAmount}>
            {isFree && (
              <Typography variant="paragraph-small-bold" as="span" className="text-[var(--color-success-main)]">
                FREE
              </Typography>
            )}
            {amount &&
              (isFree && strikeAs === 'del' ? (
                <Typography variant="paragraph-small" as="del" color="muted">
                  {amount} {currency}
                </Typography>
              ) : (
                <Typography variant="paragraph-small" as="span" className={isFree ? css.strikethrough : undefined}>
                  {amount} {currency}
                </Typography>
              ))}
          </div>
          {fiatAmount && (
            <Typography variant="paragraph-mini" color="muted">
              {fiatAmount}
            </Typography>
          )}
        </>
      )}
    </div>
  </div>
)
