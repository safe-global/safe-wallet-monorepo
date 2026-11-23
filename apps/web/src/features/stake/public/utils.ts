import { id } from 'ethers'
import type { BaseTransaction } from '@safe-global/safe-apps-sdk'

const WITHDRAW_SIGHASH = id('requestValidatorsExit(bytes)').slice(0, 10)
const CLAIM_SIGHASH = id('batchWithdrawCLFee(bytes)').slice(0, 10)

export const getStakeTitle = (txs: BaseTransaction[] | undefined) => {
  const hashToLabel = {
    [WITHDRAW_SIGHASH]: 'Withdraw request',
    [CLAIM_SIGHASH]: 'Claim',
  }

  const stakeTitle = txs
    ?.map((tx) => hashToLabel[tx.data.slice(0, 10)])
    .filter(Boolean)
    .join(' and ')

  return stakeTitle
}
