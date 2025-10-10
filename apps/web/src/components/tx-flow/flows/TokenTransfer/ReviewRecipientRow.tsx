import { useMemo } from 'react'
import usePortfolio from '@/hooks/usePortfolio'
import SendAmountBlock from '@/components/tx-flow/flows/TokenTransfer/SendAmountBlock'
import SendToBlock from '@/components/tx/SendToBlock'
import type { TokenTransferParams } from '.'
import { safeParseUnits } from '@safe-global/utils/utils/formatters'
import { Stack } from '@mui/material'
import { sameAddress } from '@safe-global/utils/utils/addresses'

const ReviewRecipientRow = ({ params, name }: { params: TokenTransferParams; name: string }) => {
  const { tokenBalances } = usePortfolio()

  const token = useMemo(
    () => tokenBalances.find(({ tokenInfo }) => sameAddress(tokenInfo.address, params.tokenAddress)),
    [tokenBalances, params.tokenAddress],
  )

  const amountInWei = useMemo(
    () => safeParseUnits(params.amount, token?.tokenInfo.decimals)?.toString() || '0',
    [params.amount, token?.tokenInfo.decimals],
  )

  return (
    <Stack gap={2}>
      {token && <SendAmountBlock amountInWei={amountInWei} tokenInfo={token.tokenInfo} />}
      <SendToBlock address={params.recipient} name={name} avatarSize={32} />
    </Stack>
  )
}

export default ReviewRecipientRow
