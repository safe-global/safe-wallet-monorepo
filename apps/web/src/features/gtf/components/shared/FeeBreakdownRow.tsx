import type { ReactElement, ReactNode } from 'react'
import { Skeleton, SvgIcon, Tooltip, Typography } from '@mui/material'

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
      <Typography variant="body2">{label}</Typography>
      {tooltip && (
        <Tooltip title={tooltip} placement="top" arrow>
          <span className={css.tooltipIcon}>
            <SvgIcon component={InfoIcon} inheritViewBox sx={{ fontSize: '16px' }} color="border" />
          </span>
        </Tooltip>
      )}
    </div>

    <div className={css.feeValue}>
      {loading ? (
        <Skeleton variant="text" sx={{ minWidth: '7em' }} />
      ) : error ? (
        <Typography variant="body2" color="warning.main">
          Cannot estimate
        </Typography>
      ) : note ? (
        <Typography variant="body2" color="text.secondary">
          {note}
        </Typography>
      ) : (
        <>
          <div className={css.feeAmount}>
            {isFree && (
              <Typography variant="body2" component="span" color="success.main" fontWeight={700}>
                FREE
              </Typography>
            )}
            {amount &&
              (isFree && strikeAs === 'del' ? (
                <Typography variant="body2" component="del" color="text.secondary">
                  {amount} {currency}
                </Typography>
              ) : (
                <Typography variant="body2" component="span" className={isFree ? css.strikethrough : undefined}>
                  {amount} {currency}
                </Typography>
              ))}
          </div>
          {fiatAmount && (
            <Typography variant="caption" color="text.secondary">
              {fiatAmount}
            </Typography>
          )}
        </>
      )}
    </div>
  </div>
)
