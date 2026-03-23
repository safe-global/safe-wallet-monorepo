import { useMemo } from 'react'
import type { TransferTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useTrustedTokenBalances } from '@/hooks/loadables/useTrustedTokenBalances'
import { isERC20Transfer, isNativeTokenTransfer } from '@/utils/transaction-guards'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import { safeFormatUnits } from '@safe-global/utils/utils/formatters'
import { computeFiatValue } from '@/utils/fiat'

// Scoped to current/live transactions where the token is in the Safe's balance.
const useTransferFiatValue = (
  transferInfo?: TransferTransactionInfo['transferInfo'],
  enabled = true,
): number | null => {
  // Reads from Redux store cache only — no network fetch, zero cost when disabled.
  const [balances] = useTrustedTokenBalances()

  return useMemo(() => {
    if (!enabled || !balances || !transferInfo) return null

    const tokenAddress = isERC20Transfer(transferInfo) ? transferInfo.tokenAddress : ZERO_ADDRESS
    const token = balances.items.find((item) => sameAddress(item.tokenInfo.address, tokenAddress))
    if (!token) return null

    const value = isNativeTokenTransfer(transferInfo) || isERC20Transfer(transferInfo) ? transferInfo.value : null
    if (!value) return null

    return computeFiatValue(parseFloat(safeFormatUnits(value, token.tokenInfo.decimals)), token.fiatConversion)
  }, [enabled, balances, transferInfo])
}

export default useTransferFiatValue
