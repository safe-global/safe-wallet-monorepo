import { Box, Divider, Typography } from '@mui/material'
import React, { useContext } from 'react'

import commonCss from '@/components/tx-flow/common/styles.module.css'
import useSafeInfo from '@/hooks/useSafeInfo'
import { ChangeThresholdReviewContext } from '@/components/tx-flow/flows/ChangeThreshold/context'
import { ChangeSignerSetupWarning } from '@/features/multichain/components/SignerSetupWarning/ChangeSignerSetupWarning'
import { type TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import { isChangeThresholdView } from '../utils'
import { maybePlural } from '@/utils/formatters'

interface ChangeThresholdProps {
  txInfo?: TransactionDetails['txInfo']
}

function ChangeThreshold({ txInfo }: ChangeThresholdProps) {
  const { safe } = useSafeInfo()
  const { newThreshold } = useContext(ChangeThresholdReviewContext)
  const threshold = txInfo && isChangeThresholdView(txInfo) && txInfo.settingsInfo?.threshold

  return (
    <>
      <ChangeSignerSetupWarning />

      <div>
        <Typography variant="body2" color="text.secondary" mb={0.5}>
          Any transaction will require the confirmation of:
        </Typography>

        <Typography aria-label="threshold">
          <b>{newThreshold || threshold}</b> out of{' '}
          <b>
            {safe.owners.length} signer{maybePlural(safe.owners)}
          </b>
        </Typography>
      </div>
      <Box
        sx={{
          my: 1,
        }}
      >
        <Divider className={commonCss.nestedDivider} />
      </Box>
    </>
  )
}

export default ChangeThreshold
