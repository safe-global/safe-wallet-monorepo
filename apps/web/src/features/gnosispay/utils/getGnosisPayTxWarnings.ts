import { type MetaTransactionData, type SafeTransaction } from '@safe-global/types-kit'
import {
  APPROVAL_SIGNATURE_HASH,
  INCREASE_ALLOWANCE_SIGNATURE_HASH,
} from '@safe-global/utils/components/tx/ApprovalEditor/utils/approvals'
import { Gnosis_safe__factory } from '@safe-global/utils/types/contracts/factories/@safe-global/safe-deployments/dist/assets/v1.3.0'
import { ERC20__factory } from '@safe-global/utils/types/contracts/factories/@openzeppelin/contracts/build/contracts/ERC20__factory'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { id } from 'ethers'
import { isMultiSendCalldata } from '@/utils/transaction-calldata'
import { decodeMultiSendData } from '@safe-global/protocol-kit'

/**
 * Gnosis Pay Safes have special setups once activated:
 * - The owner gets removed and replaced by a sentinel owner `0x00..002`
 * - Roles modifier gets setup such that the payments can get handles (EURe can be withdrawn up to a spending limit)
 * - Delay modifier gets setup with the previous owner as module
 *
 * Allowing arbitrary transactions carries the risk of breaking some of these setups or even bricking the entire Safe by removing all modules for instance.
 *
 * This hook checks if any of the transactions might interfere with the Safe's Gnosis Pay functionalities.
 *
 * It generates warnings for transactions that:
 * -  Enable new modules
 * -  Disable existing modules
 * -  Change the Cooldown / Expiration periods of the delay modifier
 * -  Add or remove roles in the Roles modifier
 * -  Add / Replace owners
 * -  Add Guards
 * -  Setting ERC20 approvals for EURe
 *
 * @param safeTx
 */

export const EURE_TOKEN_ADDRESS = '0xcB444e90D8198415266c6a2724b7900fb12FC56E'

const SAFE_INTERFACE = Gnosis_safe__factory.createInterface()
const ERC20_INTERFACE = ERC20__factory.createInterface()

type TxCheck = (tx: MetaTransactionData, safe: SafeState) => string | void

const isEUReApproval: TxCheck = (tx) => {
  if (!sameAddress(tx.to, EURE_TOKEN_ADDRESS)) {
    return
  }

  if (tx.data.startsWith(APPROVAL_SIGNATURE_HASH)) {
    const [, amount] = ERC20_INTERFACE.decodeFunctionData('approve', tx.data)
    if (BigInt(amount) > BigInt(0)) {
      return 'This transaction gives an EURe allowance. EURe allowances will be deducted from your spendable balances.'
    }
  }

  if (tx.data.startsWith(INCREASE_ALLOWANCE_SIGNATURE_HASH)) {
    const [, amount] = ERC20_INTERFACE.decodeFunctionData('increaseAllowance', tx.data)
    if (BigInt(amount) > BigInt(0)) {
      return 'This transaction increases an EURe allowance. EURe allowances will be deducted from your spendable balances.'
    }
  }
}

const isChangingOwners: TxCheck = (tx, safe) => {
  const CHANGE_OWNERS_SELECTORS = [
    SAFE_INTERFACE.getFunction('addOwnerWithThreshold').selector,
    SAFE_INTERFACE.getFunction('swapOwner').selector,
  ]
  if (sameAddress(tx.to, safe.address.value) && CHANGE_OWNERS_SELECTORS.includes(tx.data.slice(0, 10))) {
    return 'This transaction changes or adds owners. This change might disrupt your Gnosis Pay functionality.'
  }
}

const isChangingModulesOrGuards: TxCheck = (tx, safe) => {
  const CHANGE_MODULE_SELECTORS = [
    SAFE_INTERFACE.getFunction('enableModule').selector,
    SAFE_INTERFACE.getFunction('setGuard').selector,
    SAFE_INTERFACE.getFunction('disableModule').selector,
  ]
  if (sameAddress(tx.to, safe.address.value) && CHANGE_MODULE_SELECTORS.includes(tx.data.slice(0, 10))) {
    return "This transaction changes or adds your Safe's modules. This change might cause you to lose access to your Safe or disrupt your Gnosis Pay functionality."
  }
}

const isChangingDelayModifier: TxCheck = (tx, safe) => {
  const CHANGE_DELAY_SELECTORS = [
    id('setTxCooldown(uint256)').slice(0, 10),
    id('setTxExpiration(uint256)').slice(0, 10),
  ]
  if (
    safe.modules?.map((module) => module.value.toLowerCase()).includes(tx.to.toLowerCase()) &&
    CHANGE_DELAY_SELECTORS.includes(tx.data.slice(0, 10))
  ) {
    return 'This transaction changes the Delay modifier parameters. This change might disrupt your Gnosis Pay functionality.'
  }
}

const TX_CHECKS = [isChangingDelayModifier, isChangingModulesOrGuards, isChangingOwners, isEUReApproval]

const runChecks = (tx: MetaTransactionData, safe: SafeState): string[] =>
  TX_CHECKS.map((check) => check(tx, safe)).filter(Boolean) as string[]

export const getGnosisPayTxWarnings = (safeTx: SafeTransaction | undefined, safe: SafeState) => {
  if (!safeTx) {
    return []
  }

  if (isMultiSendCalldata(safeTx.data.data)) {
    const txs = decodeMultiSendData(safeTx.data.data)
    return txs.flatMap((tx) => runChecks(tx, safe))
  }

  return runChecks(
    {
      to: safeTx.data.to,
      value: safeTx.data.value,
      data: safeTx.data.data,
      operation: safeTx.data.operation,
    },
    safe,
  )
}
