import type { MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import ExternalLink from '@/components/common/ExternalLink'
import { NOT_AVAILABLE } from '@/components/transactions/TxDetails'
import { Typography } from '@/components/ui/typography'
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
      <Typography data-testid="onchain-rejection" className="mr-4">
        {message}
      </Typography>
      {!isTxExecuted && (
        <div className="mt-4 w-fit">
          <ExternalLink href={HelpCenterArticle.CANCELLING_TRANSACTIONS} title={title}>
            <div className="flex items-center gap-1.5">
              <Typography className="underline">{title}</Typography>
            </div>
          </ExternalLink>
        </div>
      )}
    </>
  )
}

export default RejectionTxInfo
