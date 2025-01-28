import useAsync from '@/hooks/useAsync'
import useBalances from '@/hooks/useBalances'
import { type Approval, ApprovalModule } from '@/services/security/modules/ApprovalModule'
import { sameAddress } from '@/utils/addresses'
import {
  getERC20TokenInfoOnChain,
  getErc721Symbol,
  isErc721Token,
  UNLIMITED_APPROVAL_AMOUNT,
  UNLIMITED_PERMIT2_AMOUNT,
} from '@/utils/tokens'
import { type SafeTransaction } from '@safe-global/safe-core-sdk-types'
import { type EIP712TypedData, type TokenInfo, TokenType } from '@safe-global/safe-gateway-typescript-sdk'
import { formatUnits } from 'ethers'
import { useMemo } from 'react'
import { PSEUDO_APPROVAL_VALUES } from '../utils/approvals'

export type ApprovalInfo = {
  tokenInfo: (Omit<TokenInfo, 'logoUri' | 'name'> & { logoUri?: string }) | undefined
  tokenAddress: string
  spender: any
  amount: any
  amountFormatted: string
  method: Approval['method']
  /** Index of approval transaction within (batch) transaction */
  transactionIndex: number
}

const ApprovalModuleInstance = new ApprovalModule()

export const useApprovalInfos = (payload: {
  safeTransaction?: SafeTransaction
  safeMessage?: EIP712TypedData
}): [ApprovalInfo[] | undefined, Error | undefined, boolean] => {
  const { safeTransaction, safeMessage } = payload
  const { balances } = useBalances()
  const approvals = useMemo(() => {
    if (safeTransaction) {
      return ApprovalModuleInstance.scanTransaction({ safeTransaction })
    }
    if (safeMessage) {
      return ApprovalModuleInstance.scanMessage({ safeMessage })
    }
  }, [safeMessage, safeTransaction])

  const hasApprovalSignatures = !!approvals && !!approvals.payload && approvals.payload.length > 0

  const [approvalInfos, error, loading] = useAsync<ApprovalInfo[] | undefined>(
    async () => {
      if (!hasApprovalSignatures) return

      return Promise.all(
        approvals.payload.map(async (approval) => {
          let tokenInfo: Omit<TokenInfo, 'name' | 'logoUri'> | undefined = balances.items.find((item) =>
            sameAddress(item.tokenInfo.address, approval.tokenAddress),
          )?.tokenInfo

          if (!tokenInfo) {
            try {
              tokenInfo = await getERC20TokenInfoOnChain(approval.tokenAddress)
            } catch (e) {
              const isErc721 = await isErc721Token(approval.tokenAddress)
              const symbol = await getErc721Symbol(approval.tokenAddress)

              tokenInfo = {
                address: approval.tokenAddress,
                symbol,
                decimals: 1, // Doesn't exist for ERC-721 tokens
                type: isErc721 ? TokenType.ERC721 : TokenType.ERC20,
              }
            }
          }

          const amountFormatted =
            UNLIMITED_APPROVAL_AMOUNT == approval.amount || UNLIMITED_PERMIT2_AMOUNT == approval.amount
              ? PSEUDO_APPROVAL_VALUES.UNLIMITED
              : formatUnits(approval.amount, tokenInfo?.decimals ?? 0)

          return { ...approval, tokenInfo, amountFormatted }
        }),
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasApprovalSignatures, balances.items.length],
    false, // Do not clear data on balance updates
  )

  return [hasApprovalSignatures ? approvalInfos : [], error, loading]
}
