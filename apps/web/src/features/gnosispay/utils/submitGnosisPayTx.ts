import type { Delay } from '@gnosis.pm/zodiac'
import type { TransactionResponse } from 'ethers'
import type { GnosisPayTxItem } from '../types'
import { didRevert } from '@/utils/ethers-utils'

export const assertGnosisPayExecution = async (contract: Delay, walletAddress: string, item?: GnosisPayTxItem) => {
  if (!(await contract.isModuleEnabled(walletAddress))) throw new Error('Connected wallet is not a Gnosis Pay owner')
  if (!item) return
  const [nonce, createdAt, cooldown, expiration] = await Promise.all([
    contract.txNonce(),
    contract.txCreatedAt(item.queueNonce),
    contract.txCooldown(),
    contract.txExpiration(),
  ])
  if (nonce !== BigInt(item.queueNonce)) throw new Error('This transaction is not next in the Delay queue')
  const now = BigInt(Math.floor(Date.now() / 1000))
  const readyAt = createdAt + cooldown
  if (createdAt === 0n || now < readyAt) throw new Error('Transaction cooldown has not elapsed')
  if (expiration !== 0n && now >= readyAt + expiration) throw new Error('Transaction has expired')
}

export const waitForGnosisPayReceipt = async (tx: TransactionResponse | undefined) => {
  const receipt = await tx?.wait()
  if (!receipt) throw new Error('No transaction receipt found')
  if (didRevert(receipt)) throw new Error('Transaction reverted by EVM')
  return receipt
}
