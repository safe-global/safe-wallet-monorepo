import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

import React from 'react'
import useSafeInfo from '@/hooks/useSafeInfo'
import { ChangeSignerSetupWarning } from '@/features/multichain'
import { isChangeThresholdView } from '../utils'
import { ChangeThresholdView } from '@views/components/tx/confirmation-views/ChangeThreshold/ChangeThresholdView'

interface ChangeThresholdProps {
  txInfo?: TransactionDetails['txInfo']
}

function ChangeThreshold({ txInfo }: ChangeThresholdProps) {
  const { safe } = useSafeInfo()
  const threshold = txInfo && isChangeThresholdView(txInfo) && txInfo.settingsInfo?.threshold

  return (
    <ChangeThresholdView
      threshold={threshold}
      ownersCount={safe.owners.length}
      warning={<ChangeSignerSetupWarning />}
    />
  )
}

export default ChangeThreshold
