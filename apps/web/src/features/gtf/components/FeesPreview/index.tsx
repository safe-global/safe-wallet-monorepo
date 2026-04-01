import type { ReactElement, ReactNode } from 'react'
import { Skeleton, SvgIcon, Tooltip, Typography } from '@mui/material'
import InfoIcon from '@/public/images/notifications/info.svg'
import type { FeesPreviewData } from '../../hooks/useFeesPreview'
import css from './styles.module.css'

const FeeRow = ({
  label,
  amount,
  currency,
  loading,
  error,
  tooltip,
}: {
  label: string
  amount?: string
  currency?: string
  loading?: boolean
  error?: boolean
  tooltip?: ReactNode
}): ReactElement => (
  <div className={css.feeRow}>
    <div className={css.feeLabel}>
      <Typography variant="body2" letterSpacing="0.17px">
        {label}
      </Typography>
      {tooltip && (
        <Tooltip title={tooltip} placement="top" arrow>
          <span style={{ display: 'inline-flex' }}>
            <SvgIcon component={InfoIcon} inheritViewBox sx={{ fontSize: '16px' }} color="border" />
          </span>
        </Tooltip>
      )}
    </div>
    {loading ? (
      <Skeleton variant="text" sx={{ minWidth: '7em' }} />
    ) : error ? (
      <Typography variant="body2" letterSpacing="0.17px" color="warning.main">
        Cannot estimate
      </Typography>
    ) : amount ? (
      <Typography variant="body2" letterSpacing="0.17px">
        {amount} {currency}
      </Typography>
    ) : null}
  </div>
)

const FeesPreview = (props: FeesPreviewData): ReactElement => {
  const { gasFee } = props

  return (
    <div className={css.container}>
      <Typography variant="subtitle2" fontWeight={700}>
        Fees
      </Typography>

      <div className={css.feeBreakdownWide}>
        <FeeRow
          label={gasFee.label}
          amount={gasFee.amount}
          currency={gasFee.currency}
          loading={props.loading}
          error={props.error}
          tooltip="Network cost required to process this transaction. Currently paid by your signing wallet, soon from your Safe balance."
        />
      </div>
    </div>
  )
}

export default FeesPreview
