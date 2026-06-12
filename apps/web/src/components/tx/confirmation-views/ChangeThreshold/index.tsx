import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'

import React from 'react'
import commonCss from '@/components/tx-flow/common/styles.module.css'
import useSafeInfo from '@/hooks/useSafeInfo'
import { ChangeSignerSetupWarning } from '@/features/multichain'
import { isChangeThresholdView } from '../utils'
import { maybePlural } from '@safe-global/utils/utils/formatters'

interface ChangeThresholdProps {
  txInfo?: TransactionDetails['txInfo']
}

function ChangeThreshold({ txInfo }: ChangeThresholdProps) {
  const { safe } = useSafeInfo()
  const threshold = txInfo && isChangeThresholdView(txInfo) && txInfo.settingsInfo?.threshold

  return (
    <>
      <ChangeSignerSetupWarning />

      <div>
        <Typography variant="paragraph-small" className="text-muted-foreground mb-1">
          Any transaction will require the confirmation of:
        </Typography>

        <Typography aria-label="threshold">
          <b>{threshold}</b> out of{' '}
          <b>
            {safe.owners.length} signer{maybePlural(safe.owners)}
          </b>
        </Typography>
      </div>
      <div className="my-2">
        <Separator className={commonCss.nestedDivider} />
      </div>
    </>
  )
}

export default ChangeThreshold
