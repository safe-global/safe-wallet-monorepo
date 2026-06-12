import type { ReactElement, ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
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
      <Typography variant="paragraph-small">{label}</Typography>
      {tooltip && (
        <Tooltip>
          <TooltipTrigger render={<span className="inline-flex" />}>
            <InfoIcon className="size-4 text-[var(--color-border-main)]" />
          </TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      )}
    </div>
    {loading ? (
      <Skeleton className="h-4 min-w-[7em]" />
    ) : error ? (
      <Typography variant="paragraph-small" className="text-[var(--color-warning-main)]">
        Cannot estimate
      </Typography>
    ) : amount ? (
      <Typography variant="paragraph-small">
        {amount} {currency}
      </Typography>
    ) : null}
  </div>
)

const FeesPreview = (props: FeesPreviewData): ReactElement => {
  const { gasFee } = props

  return (
    <div className={css.container}>
      <Typography variant="paragraph-small-bold">Fees</Typography>

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
