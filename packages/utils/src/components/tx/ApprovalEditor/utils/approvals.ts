import { ERC20__factory } from '@safe-global/utils/types/contracts'
import { UNLIMITED_APPROVAL_AMOUNT, UNLIMITED_PERMIT2_AMOUNT } from '@safe-global/utils/utils/tokens'
import { safeFormatUnits } from '@safe-global/utils/utils/formatters'
import type { Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { Approval } from '@safe-global/utils/services/security/modules/ApprovalModule'
import { id, parseUnits } from 'ethers'

export const APPROVAL_SIGNATURE_HASH = id('approve(address,uint256)').slice(0, 10)
export const INCREASE_ALLOWANCE_SIGNATURE_HASH = id('increaseAllowance(address,uint256)').slice(0, 10)
export const MULTISEND_SIGNATURE_HASH = id('multiSend(bytes)').slice(0, 10)
export const ERC20_INTERFACE = ERC20__factory.createInterface()

export enum PSEUDO_APPROVAL_VALUES {
  UNLIMITED = 'Unlimited amount',
}

/** Minimal transaction shape shared by safe-apps-sdk's BaseTransaction and protocol-kit's MetaTransactionData */
export type ApprovalBaseTransaction = {
  to: string
  value: string
  data: string
}

export type ApprovalInfo = {
  tokenInfo: (Omit<Balance['tokenInfo'], 'logoUri' | 'name'> & { logoUri?: string }) | undefined
  tokenAddress: string
  spender: string
  amount: bigint
  amountFormatted: string
  method: Approval['method']
  /** Index of approval transaction within (batch) transaction */
  transactionIndex: number
}

const DEFAULT_DECIMALS = 18

export const isUnlimitedApproval = (amount: bigint): boolean =>
  amount === UNLIMITED_APPROVAL_AMOUNT || amount === UNLIMITED_PERMIT2_AMOUNT

export const formatApprovalAmount = (amount: bigint, decimals?: number | null): string =>
  isUnlimitedApproval(amount) ? PSEUDO_APPROVAL_VALUES.UNLIMITED : safeFormatUnits(amount, decimals ?? DEFAULT_DECIMALS)

export const parseApprovalAmount = (amount: string, decimals?: number | null) => {
  if (amount === PSEUDO_APPROVAL_VALUES.UNLIMITED) {
    return UNLIMITED_APPROVAL_AMOUNT
  }
  // Fail loudly instead of encoding an amount at the wrong scale
  if (decimals == null) {
    throw new Error('Cannot parse an approval amount without token decimals')
  }

  return parseUnits(amount, decimals)
}

export const updateApprovalTxs = <T extends ApprovalBaseTransaction>(
  approvalFormValues: string[],
  approvalInfos: ApprovalInfo[] | undefined,
  txs: T[],
): (T | ApprovalBaseTransaction)[] => {
  const updatedTxs = txs.map((tx, txIndex) => {
    const approvalIndex = approvalInfos?.findIndex((approval) => approval.transactionIndex === txIndex)
    if (approvalIndex === undefined) {
      return tx
    }
    if (tx.data.startsWith(APPROVAL_SIGNATURE_HASH) || tx.data.startsWith(INCREASE_ALLOWANCE_SIGNATURE_HASH)) {
      const newApproval = approvalFormValues[approvalIndex]
      const approvalInfo = approvalInfos?.[approvalIndex]
      if (!approvalInfo || !approvalInfo.tokenInfo || newApproval === undefined) {
        // Without decimals and spender we cannot create a new tx
        return tx
      }
      const decimals = approvalInfo.tokenInfo.decimals
      const newAmountWei = parseApprovalAmount(newApproval, decimals)
      if (tx.data.startsWith(APPROVAL_SIGNATURE_HASH)) {
        return {
          to: approvalInfo.tokenAddress,
          value: '0',
          data: ERC20_INTERFACE.encodeFunctionData('approve', [approvalInfo.spender, newAmountWei]),
        }
      } else {
        return {
          to: approvalInfo.tokenAddress,
          value: '0',
          data: ERC20_INTERFACE.encodeFunctionData('increaseAllowance', [approvalInfo.spender, newAmountWei]),
        }
      }
    }
    return tx
  })

  return updatedTxs
}
