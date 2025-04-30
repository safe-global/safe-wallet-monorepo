import ExternalLink from '@/components/common/ExternalLink'
import { NOT_AVAILABLE } from '@/components/transactions/TxDetails'
import type { MultisigExecutionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import { Box, Typography } from '@mui/material'
import React from 'react'

import { HelpCenterArticle } from '@safe-global/utils/config/constants'

interface Props {
  nonce?: MultisigExecutionDetails['nonce']
  isTxExecuted: boolean
}

const RejectionTxInfo = ({ nonce, isTxExecuted }: Props) => {
  const txNonce = nonce ?? NOT_AVAILABLE
  const message = `This is an on-chain rejection that ${isTxExecuted ? "didn't" : "won't"} send any funds. ${
    isTxExecuted
      ? `This on-chain rejection replaced all transactions with nonce ${txNonce}.`
      : `Executing this on-chain rejection will replace all currently awaiting transactions with nonce ${txNonce}.`
  }`

  const title = 'Why do I need to pay to reject a transaction?'

  return (
    <>
      <Typography data-testid="onchain-rejection" mr={2}>
        {message}
      </Typography>
      {!isTxExecuted && (
        <Box mt={2} sx={{ width: 'fit-content' }}>
          <ExternalLink href={HelpCenterArticle.CANCELLING_TRANSACTIONS} title={title}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Typography sx={{ textDecoration: 'underline' }}>{title}</Typography>
            </Box>
          </ExternalLink>
        </Box>
      )}
    </>
  )
}

export default RejectionTxInfo
