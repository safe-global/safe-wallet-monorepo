import { Box, Divider, Typography } from '@mui/material'
import React, { useContext } from 'react'

import commonCss from '@/components/tx-flow/common/styles.module.css'
import useSafeInfo from '@/hooks/useSafeInfo'
import { ChangeThresholdReviewContext } from '@/components/tx-flow/flows/ChangeThreshold/context'
import { ChangeSignerSetupWarning } from '@/features/multichain/components/SignerSetupWarning/ChangeSignerSetupWarning'
import { type TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import { isChangeThresholdView } from '../utils'

interface ChangeThresholdProps {
  txDetails?: TransactionDetails
}

function ChangeThreshold({ txDetails }: ChangeThresholdProps) {
  const { safe } = useSafeInfo()
  const { newThreshold } = useContext(ChangeThresholdReviewContext)
  const threshold = txDetails && isChangeThresholdView(txDetails.txInfo) && txDetails.txInfo.settingsInfo?.threshold

  return (
    <>
      <ChangeSignerSetupWarning />

      <div>
        <Typography variant="body2" color="text.secondary" mb={0.5}>
          Any transaction will require the confirmation of:
        </Typography>

        <Typography aria-label="threshold">
          <b>{newThreshold || threshold}</b> out of <b>{safe.owners.length} signer(s)</b>
        </Typography>
      </div>
      <Box my={1}>
        <Divider className={commonCss.nestedDivider} />
      </Box>
    </>
  )
}

export default ChangeThreshold
