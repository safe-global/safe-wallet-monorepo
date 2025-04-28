import { getModuleInstance, KnownContracts } from '@gnosis.pm/zodiac'
import { type SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import type { TransactionAddedEvent } from '@gnosis.pm/zodiac/dist/cjs/types/Delay'
import type { Eip1193Provider, Overrides, TransactionResponse } from 'ethers'

import { didReprice, didRevert } from '@/utils/ethers-utils'
import { recoveryDispatch, RecoveryEvent, RecoveryTxType } from './recoveryEvents'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { getUncheckedSigner } from '../../../services/tx/tx-sender/sdk'
import { isSmartContractWallet } from '@/utils/wallets'

async function getDelayModifierContract({
  provider,
  chainId,
  delayModifierAddress,
  signerAddress,
}: {
  provider: Eip1193Provider
  chainId: string
  delayModifierAddress: string
  signerAddress: string
}) {
  const isSmartContract = await isSmartContractWallet(chainId, signerAddress)

  const signer = await getUncheckedSigner(provider)
  const delayModifier = getModuleInstance(KnownContracts.DELAY, delayModifierAddress, signer).connect(signer)

  return {
    isUnchecked: isSmartContract,
    delayModifier,
  }
}

function waitForRecoveryTx({
  tx,
  ...payload
}: {
  moduleAddress: string
  recoveryTxHash: string
  tx: TransactionResponse
  txType: RecoveryTxType
}) {
  const event = {
    ...payload,
    txHash: tx.hash,
  }

  recoveryDispatch(RecoveryEvent.PROCESSING, event)
  tx.wait()
    .then((receipt) => {
      if (didRevert(receipt!)) {
        recoveryDispatch(RecoveryEvent.REVERTED, {
          ...event,
          error: new Error('Transaction reverted by EVM'),
        })
      } else {
        recoveryDispatch(RecoveryEvent.PROCESSED, event)
      }
    })
    .catch((error) => {
      if (didReprice(error)) {
        recoveryDispatch(RecoveryEvent.PROCESSED, event)
      } else {
        recoveryDispatch(RecoveryEvent.FAILED, {
          ...event,
          error: asError(error),
        })
      }
    })
}

export async function dispatchRecoveryProposal({
  provider,
  safe,
  safeTx,
  delayModifierAddress,
  signerAddress,
  overrides,
}: {
  provider: Eip1193Provider
  safe: SafeState
  safeTx: SafeTransaction
  delayModifierAddress: string
  signerAddress: string
  overrides: Overrides
}) {
  const { delayModifier, isUnchecked } = await getDelayModifierContract({
    provider,
    chainId: safe.chainId,
    delayModifierAddress,
    signerAddress,
  })

  const txType = RecoveryTxType.PROPOSAL
  let recoveryTxHash: string | undefined

  try {
    // Get recovery tx hash as a form of ID for FAILED event in event bus
    recoveryTxHash = await delayModifier.getTransactionHash(
      safeTx.data.to,
      safeTx.data.value,
      safeTx.data.data,
      safeTx.data.operation,
    )

    const tx = await delayModifier.execTransactionFromModule(
      safeTx.data.to,
      safeTx.data.value,
      safeTx.data.data,
      safeTx.data.operation,
      overrides,
    )

    if (isUnchecked) {
      recoveryDispatch(RecoveryEvent.PROCESSING_BY_SMART_CONTRACT_WALLET, {
        moduleAddress: delayModifierAddress,
        recoveryTxHash,
        txType,
        txHash: tx.hash,
      })
    } else {
      waitForRecoveryTx({
        moduleAddress: delayModifierAddress,
        recoveryTxHash,
        txType,
        tx,
      })
    }
  } catch (error) {
    recoveryDispatch(RecoveryEvent.FAILED, {
      moduleAddress: delayModifierAddress,
      recoveryTxHash,
      txType,
      error: asError(error),
    })

    throw error
  }
}

export async function dispatchRecoveryExecution({
  provider,
  chainId,
  args,
  delayModifierAddress,
  signerAddress,
  overrides,
}: {
  provider: Eip1193Provider
  chainId: string
  args: TransactionAddedEvent.Log['args']
  delayModifierAddress: string
  signerAddress: string
  overrides: Overrides
}) {
  const { delayModifier, isUnchecked } = await getDelayModifierContract({
    provider,
    chainId,
    delayModifierAddress,
    signerAddress,
  })

  const txType = RecoveryTxType.EXECUTION

  try {
    const tx = await delayModifier.executeNextTx(args.to, args.value, args.data, args.operation, overrides)

    if (isUnchecked) {
      recoveryDispatch(RecoveryEvent.PROCESSING_BY_SMART_CONTRACT_WALLET, {
        moduleAddress: delayModifierAddress,
        recoveryTxHash: args.txHash,
        txType,
        txHash: tx.hash,
      })
    } else {
      waitForRecoveryTx({
        moduleAddress: delayModifierAddress,
        recoveryTxHash: args.txHash,
        txType,
        tx,
      })
    }
  } catch (error) {
    recoveryDispatch(RecoveryEvent.FAILED, {
      moduleAddress: delayModifierAddress,
      recoveryTxHash: args.txHash,
      txType,
      error: asError(error),
    })

    throw error
  }
}

export async function dispatchRecoverySkipExpired({
  provider,
  chainId,
  delayModifierAddress,
  recoveryTxHash,
  signerAddress,
}: {
  provider: Eip1193Provider
  chainId: string
  delayModifierAddress: string
  recoveryTxHash: string
  signerAddress: string
}) {
  const { delayModifier, isUnchecked } = await getDelayModifierContract({
    provider,
    chainId,
    delayModifierAddress,
    signerAddress,
  })

  const txType = RecoveryTxType.SKIP_EXPIRED

  try {
    const tx = await delayModifier.skipExpired()

    if (isUnchecked) {
      recoveryDispatch(RecoveryEvent.PROCESSING_BY_SMART_CONTRACT_WALLET, {
        moduleAddress: delayModifierAddress,
        recoveryTxHash,
        txType,
        txHash: tx.hash,
      })
    } else {
      waitForRecoveryTx({
        moduleAddress: delayModifierAddress,
        recoveryTxHash,
        txType,
        tx,
      })
    }
  } catch (error) {
    recoveryDispatch(RecoveryEvent.FAILED, {
      moduleAddress: delayModifierAddress,
      recoveryTxHash,
      txType,
      error: asError(error),
    })

    throw error
  }
}
