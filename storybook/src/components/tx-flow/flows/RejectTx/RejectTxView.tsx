import type { ReactElement } from 'react'
import { Typography } from '@/components/ui/typography'

export type RejectTxViewProps = {
  txNonce?: number
}

export const RejectTxView = ({ txNonce }: RejectTxViewProps): ReactElement => (
  <>
    <Typography className="mb-4">
      To reject the transaction, a separate rejection transaction will be created to replace the original one.
    </Typography>

    <Typography className="mb-4">
      Transaction nonce: <b>{txNonce}</b>
    </Typography>

    <Typography className="mb-4">
      You will need to confirm the rejection transaction with your currently connected wallet.
    </Typography>
  </>
)
