import type { ReactElement, ReactNode } from 'react'
import { Skeleton, SvgIcon, Tooltip, Typography } from '@mui/material'
import InfoIcon from '@/public/images/notifications/info.svg'
import ArrowUpRightIcon from '@/public/images/common/arrow-up-right.svg'
import ExternalLink from '@/components/common/ExternalLink'
import type { FeesPreviewData } from '../../hooks/useFeesPreview'
import css from './styles.module.css'

// TODO: replace with actual GTF docs URL
const FEES_LEARN_MORE_URL = 'https://safe.global'

const FeeRow = ({
  label,
  amount,
  currency,
  isFree,
  loading,
  tooltip,
}: {
  label: string
  amount?: string
  currency?: string
  isFree?: boolean
  loading?: boolean
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
    ) : isFree ? (
      <Typography variant="body2" fontWeight={700} color="success.main" letterSpacing="0.1px">
        FREE
      </Typography>
    ) : amount ? (
      <Typography variant="body2" letterSpacing="0.17px">
        {amount} {currency}
      </Typography>
    ) : null}
  </div>
)

const feeTooltip = (text: string) => text

const FeesPreview = (props: FeesPreviewData): ReactElement => {
  const { executionFee, gasFee } = props

  return (
    <div className={css.container}>
      <div className={css.feesHeader}>
        <Typography variant="subtitle2" fontWeight={700}>
          Fees
        </Typography>
        <ExternalLink href={FEES_LEARN_MORE_URL} noIcon className={css.gradientTag} color="inherit" underline="none">
          How fees work
          <SvgIcon component={ArrowUpRightIcon} inheritViewBox sx={{ fontSize: '16px' }} />
        </ExternalLink>
      </div>

      <div className={css.feeBreakdownWide}>
        <FeeRow
          label={executionFee.label}
          isFree
          tooltip={feeTooltip(
            'Covers third-party services required to securely execute this transaction. Currently free while the new model is introduced, soon will be based on the transaction amount.',
          )}
        />
        <FeeRow
          label={gasFee.label}
          amount={gasFee.amount}
          currency={gasFee.currency}
          loading={props.loading}
          tooltip={feeTooltip(
            'Network cost required to process this transaction. Currently paid by your signing wallet, soon from your Safe balance.',
          )}
        />
      </div>
    </div>
  )
}

export default FeesPreview
