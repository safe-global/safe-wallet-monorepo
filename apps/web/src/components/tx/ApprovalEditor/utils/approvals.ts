import type { DataDecoded, DataDecodedParameter } from '@safe-global/store/gateway/AUTO_GENERATED/data-decoded'
import type { BaseTransaction } from '@safe-global/safe-apps-sdk'
import { parseUnits } from 'ethers'
import { type ApprovalInfo } from '../hooks/useApprovalInfos'
import { UNLIMITED_APPROVAL_AMOUNT } from '@safe-global/utils/utils/tokens'
import {
  APPROVAL_SIGNATURE_HASH,
  ERC20_INTERFACE,
  INCREASE_ALLOWANCE_SIGNATURE_HASH,
} from '@safe-global/utils/components/tx/ApprovalEditor/utils/approvals'

const MULTISEND_METHOD = 'multiSend'

const APPROVE_METHOD = 'approve'

const _TRANSACTIONS_PARAM = 'transactions'

const _ADDRESS_TYPE = 'address'
const _UINT256_TYPE = 'uint256'

export enum PSEUDO_APPROVAL_VALUES {
  UNLIMITED = 'Unlimited amount',
}

const parseApprovalAmount = (amount: string, decimals: number) => {
  if (amount === PSEUDO_APPROVAL_VALUES.UNLIMITED) {
    return UNLIMITED_APPROVAL_AMOUNT
  }

  return parseUnits(amount, decimals)
}

function _hasMultiSendParameters(
  txs: DataDecoded & { to: string },
): txs is DataDecoded & { to: string; parameters: DataDecodedParameter[] } {
  return txs.method === MULTISEND_METHOD && txs.parameters?.length === 1
}

function _hasApproveCallParameters(
  txs: DataDecoded & { to: string },
): txs is DataDecoded & { to: string; parameters: DataDecodedParameter[] } {
  return txs.method === APPROVE_METHOD && txs.parameters?.length === 2
}

export const updateApprovalTxs = (
  approvalFormValues: string[],
  approvalInfos: ApprovalInfo[] | undefined,
  txs: BaseTransaction[],
) => {
  const updatedTxs = txs.map((tx, txIndex) => {
    const approvalIndex = approvalInfos?.findIndex((approval) => approval.transactionIndex === txIndex)
    if (approvalIndex === undefined) {
      return tx
    }
    if (tx.data.startsWith(APPROVAL_SIGNATURE_HASH) || tx.data.startsWith(INCREASE_ALLOWANCE_SIGNATURE_HASH)) {
      const newApproval = approvalFormValues[approvalIndex]
      const approvalInfo = approvalInfos?.[approvalIndex]
      if (!approvalInfo || !approvalInfo.tokenInfo) {
        // Without decimals and spender we cannot create a new tx
        return tx
      }
      const decimals = approvalInfo.tokenInfo.decimals
      const newAmountWei = parseApprovalAmount(newApproval, decimals ?? 0)
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
