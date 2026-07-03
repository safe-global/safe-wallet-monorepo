import { useCallback, useMemo } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import { ApprovalModule } from '@safe-global/utils/services/security/modules/ApprovalModule'
import {
  PSEUDO_APPROVAL_VALUES,
  type ApprovalInfo,
} from '@safe-global/utils/components/tx/ApprovalEditor/utils/approvals'
import { UNLIMITED_APPROVAL_AMOUNT, UNLIMITED_PERMIT2_AMOUNT } from '@safe-global/utils/utils/tokens'
import { safeFormatUnits } from '@safe-global/utils/utils/formatters'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useBalances } from '@/src/hooks/useBalances'
import { useAppSelector } from '@/src/store/hooks'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { selectChainById } from '@/src/store/chains'
import { useGetErc20TokenInfosQuery } from '@/src/store/signersBalance'
import type { DraftTx } from '@/src/store/draftTxSlice'

const DEFAULT_DECIMALS = 18

const ApprovalModuleInstance = new ApprovalModule()

// A token the Safe never held is missing from balances, so fall back to the
// token metadata the CGW /preview attached to the draft (tokenInfoIndex) —
// without decimals the approval cannot be re-encoded.
const findTokenInfo = (
  tokenAddress: string,
  balances: Balances | undefined,
  tokenInfoIndex: TransactionData['tokenInfoIndex'],
): ApprovalInfo['tokenInfo'] => {
  const fromBalances = balances?.items.find((item) => sameAddress(item.tokenInfo.address, tokenAddress))?.tokenInfo
  if (fromBalances) {
    return fromBalances
  }
  return tokenInfoIndex
    ? Object.entries(tokenInfoIndex).find(([address]) => sameAddress(address, tokenAddress))?.[1]
    : undefined
}

export type ApprovalInfoWithSeverity = ApprovalInfo & {
  /** Unlimited, above the Safe's balance of the token, or the balance is unknown */
  isHighValue: boolean
}

/**
 * Scans a draft transaction for ERC-20 approve / increaseAllowance calls
 * (including inside multiSend batches) and resolves token metadata from the
 * Safe's balances, the draft's CGW preview, or on-chain — in that order,
 * mirroring web's useApprovalInfos. A token found nowhere keeps `tokenInfo:
 * undefined` and cannot be re-encoded.
 */
export const useApprovalInfos = (draft: DraftTx | undefined): ApprovalInfoWithSeverity[] | undefined => {
  const activeSafe = useAppSelector(selectActiveSafe)
  const chain = useAppSelector((state) => (activeSafe ? selectChainById(state, activeSafe.chainId) : undefined))
  // trusted: false — the high-value check must see untrusted and dust holdings too
  const { balances } = useBalances(false, undefined, false)

  const scannedApprovals = useMemo(() => {
    const { to, data } = draft?.buildParams ?? {}
    if (!to || !data) {
      return undefined
    }
    const scanResult = ApprovalModuleInstance.scanTransaction({ safeTransaction: { data: { to, data } } })
    return scanResult.payload?.length ? scanResult.payload : undefined
  }, [draft])

  const resolveStatic = useCallback(
    (tokenAddress: string) => findTokenInfo(tokenAddress, balances, draft?.txDetails.txData?.tokenInfoIndex),
    [balances, draft],
  )

  const unresolvedAddresses = useMemo(
    () =>
      scannedApprovals?.filter((approval) => !resolveStatic(approval.tokenAddress)).map((a) => a.tokenAddress) ?? [],
    [scannedApprovals, resolveStatic],
  )

  const { data: onChainTokenInfos } = useGetErc20TokenInfosQuery(
    unresolvedAddresses.length > 0 && chain ? { addresses: unresolvedAddresses, chain } : skipToken,
  )

  return useMemo(() => {
    if (!scannedApprovals) {
      return undefined
    }

    return scannedApprovals.map((approval) => {
      const tokenInfo = resolveStatic(approval.tokenAddress) ?? onChainTokenInfos?.[approval.tokenAddress.toLowerCase()]
      const isUnlimited = approval.amount === UNLIMITED_APPROVAL_AMOUNT || approval.amount === UNLIMITED_PERMIT2_AMOUNT
      const amountFormatted = isUnlimited
        ? PSEUDO_APPROVAL_VALUES.UNLIMITED
        : safeFormatUnits(approval.amount, tokenInfo?.decimals ?? DEFAULT_DECIMALS)
      const balance = balances?.items.find((item) =>
        sameAddress(item.tokenInfo.address, approval.tokenAddress),
      )?.balance
      const isHighValue = isUnlimited || balance === undefined || approval.amount > BigInt(balance)

      return { ...approval, tokenInfo, amountFormatted, isHighValue }
    })
  }, [scannedApprovals, resolveStatic, onChainTokenInfos, balances])
}
