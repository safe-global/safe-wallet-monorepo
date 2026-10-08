import { useMemo } from 'react'
import { useTrustedTokenBalances } from '@/hooks/loadables/useTrustedTokenBalances'
import SendAmountBlock from '@/components/tx-flow/flows/TokenTransfer/SendAmountBlock'
import SendToBlock from '@/components/tx/SendToBlock'
import type { TokenTransferParams } from '.'
import { safeParseUnits } from '@safe-global/utils/utils/formatters'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { ReviewRecipientRowView } from '@views/components/tx-flow/flows/TokenTransfer/ReviewRecipientRowView'

const ReviewRecipientRow = ({ params, name }: { params: TokenTransferParams; name: string }) => {
  const [balances] = useTrustedTokenBalances()

  const token = useMemo(
    () => balances?.items.find(({ tokenInfo }) => sameAddress(tokenInfo.address, params.tokenAddress)),
    [balances, params.tokenAddress],
  )

  const amountInWei = useMemo(
    () => safeParseUnits(params.amount, token?.tokenInfo.decimals)?.toString() || '0',
    [params.amount, token?.tokenInfo.decimals],
  )

  return (
    <ReviewRecipientRowView
      amountBlock={
        token && (
          <SendAmountBlock
            amountInWei={amountInWei}
            tokenInfo={token.tokenInfo}
            fiatConversion={token.fiatConversion}
            compact
          />
        )
      }
      sendToBlock={<SendToBlock address={params.recipient} name={name} avatarSize={32} />}
    />
  )
}

export default ReviewRecipientRow
