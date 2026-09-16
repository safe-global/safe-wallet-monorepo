import type { ReactElement } from 'react'
import { Typography } from '@/components/ui/typography'
import RecoveryPlusIcon from '@/public/images/common/recovery-plus.svg'
import txTypeCss from '@/components/transactions/TxType/styles.module.css'
import pendingTxCss from '@/components/dashboard/PendingTxs/styles.module.css'
import { DateTime } from '@/components/common/DateTime/DateTime'

export default function RecoveryType({
  isMalicious,
  date,
  isDashboard = false,
}: {
  isMalicious: boolean
  date?: bigint
  isDashboard?: boolean
}): ReactElement {
  return (
    <div className={txTypeCss.txType} style={isDashboard ? { gap: '12px' } : undefined}>
      <div className={isDashboard ? pendingTxCss.iconWrapper : undefined}>
        <RecoveryPlusIcon className="size-[1em] [&_path]:fill-[var(--color-warning-main)]" />
      </div>
      <div>
        <Typography className={isMalicious ? 'text-[var(--color-error-main)]' : undefined}>
          {isMalicious ? 'Malicious transaction' : 'Account recovery'}
        </Typography>

        {date && (
          <Typography variant="paragraph-small" className="text-[var(--color-primary-light)]">
            <DateTime value={Number(date)} showDateTime={false} showTime={false} />
          </Typography>
        )}
      </div>
    </div>
  )
}
