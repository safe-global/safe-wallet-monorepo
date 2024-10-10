import { getModuleInstance, KnownContracts } from '@gnosis.pm/zodiac'
import type { SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import type { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import type { TransactionAddedEvent } from '@gnosis.pm/zodiac/dist/cjs/types/Delay'
import type { TransactionResponse } from 'ethers'

import { createWeb3 } from '@/hooks/wallets/web3'
import { didReprice, didRevert } from '@/utils/ethers-utils'
import { recoveryDispatch, RecoveryEvent, RecoveryTxType } from './recoveryEvents'
import { asError } from '@/services/exceptions/utils'
import { assertWalletChain } from '../../../services/tx/tx-sender/sdk'
import { isSmartContractWallet } from '@/utils/wallets'
import { UncheckedJsonRpcSigner } from '@/utils/providers/UncheckedJsonRpcSigner'
import { ConnectedWallet } from '@/hooks/wallets/useOnboard'

async function getDelayModifierContract({
  _wallet,
  chainId,
  delayModifierAddress,
}: {
  _wallet: ConnectedWallet
  chainId: string
  delayModifierAddress: string
}) {
  // Switch signer to chain of Safe
  const wallet = await assertWalletChain(_wallet, chainId)

  const provider = createWeb3(wallet.provider)
  const isSmartContract = await isSmartContractWallet(wallet.chainId, wallet.address)

  const originalSigner = await provider.getSigner()
  // Use unchecked signer for smart contract wallets as transactions do not necessarily immediately execute
  const signer = isSmartContract
    ? new UncheckedJsonRpcSigner(provider, await originalSigner.getAddress())
    : originalSigner
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
  _wallet,
  safe,
  safeTx,
  delayModifierAddress,
}: {
  _wallet: ConnectedWallet
  safe: SafeInfo
  safeTx: SafeTransaction
  delayModifierAddress: string
}) {
  const { delayModifier, isUnchecked } = await getDelayModifierContract({
    _wallet,
    chainId: safe.chainId,
    delayModifierAddress,
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
  _wallet,
  chainId,
  args,
  delayModifierAddress,
}: {
  _wallet: ConnectedWallet
  chainId: string
  args: TransactionAddedEvent.Log['args']
  delayModifierAddress: string
}) {
  const { delayModifier, isUnchecked } = await getDelayModifierContract({
    _wallet,
    chainId,
    delayModifierAddress,
  })

  const txType = RecoveryTxType.EXECUTION

  try {
    const tx = await delayModifier.executeNextTx(args.to, args.value, args.data, args.operation)

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
  _wallet,
  chainId,
  delayModifierAddress,
  recoveryTxHash,
}: {
  _wallet: ConnectedWallet
  chainId: string
  delayModifierAddress: string
  recoveryTxHash: string
}) {
  const { delayModifier, isUnchecked } = await getDelayModifierContract({
    _wallet,
    chainId,
    delayModifierAddress,
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
