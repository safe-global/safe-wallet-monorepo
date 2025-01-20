import { assertTx, assertOnboard, assertChainInfo, assertProvider } from '@/utils/helpers'
import { useMemo } from 'react'
import { type TransactionOptions, type SafeTransaction } from '@safe-global/safe-core-sdk-types'
import { sameString } from '@safe-global/protocol-kit/dist/src/utils'
import useSafeInfo from '@/hooks/useSafeInfo'
import useWallet, { useSigner } from '@/hooks/wallets/useWallet'
import useOnboard from '@/hooks/wallets/useOnboard'
import { isSmartContractWallet } from '@/utils/wallets'
import {
  dispatchProposerTxSigning,
  dispatchOnChainSigning,
  dispatchTxExecution,
  dispatchTxProposal,
  dispatchTxRelay,
  dispatchTxSigning,
} from '@/services/tx/tx-sender'
import { useHasPendingTxs } from '@/hooks/usePendingTxs'
import { getSafeTxGas, getNonces } from '@/services/tx/tx-sender/recommendedNonce'
import useAsync from '@/hooks/useAsync'
import { useUpdateBatch } from '@/hooks/useDraftBatch'
import { type TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import { useCurrentChain } from '@/hooks/useChains'

type TxActions = {
  addToBatch: (safeTx?: SafeTransaction, origin?: string) => Promise<string>
  signTx: (safeTx?: SafeTransaction, txId?: string, origin?: string) => Promise<string>
  executeTx: (
    txOptions: TransactionOptions,
    safeTx?: SafeTransaction,
    txId?: string,
    origin?: string,
    isRelayed?: boolean,
  ) => Promise<string>
  signProposerTx: (safeTx?: SafeTransaction, origin?: string) => Promise<string>
  proposeTx: (safeTx: SafeTransaction, txId?: string, origin?: string) => Promise<TransactionDetails>
}

export const useTxActions = (): TxActions => {
  const { safe } = useSafeInfo()
  const onboard = useOnboard()
  const signer = useSigner()
  const wallet = useWallet()
  const [addTxToBatch] = useUpdateBatch()
  const chain = useCurrentChain()

  return useMemo<TxActions>(() => {
    const safeAddress = safe.address.value
    const { chainId, version } = safe

    const _propose = async (sender: string, safeTx: SafeTransaction, txId?: string, origin?: string) => {
      return dispatchTxProposal({
        chainId,
        safeAddress,
        sender,
        safeTx,
        txId,
        origin,
      })
    }

    const proposeTx: TxActions['proposeTx'] = async (safeTx, txId, origin) => {
      assertTx(safeTx)
      return _propose(wallet?.address || safe.owners[0].value, safeTx, txId, origin)
    }

    const addToBatch: TxActions['addToBatch'] = async (safeTx, origin) => {
      assertTx(safeTx)
      assertProvider(signer?.provider)

      const tx = await _propose(signer.address, safeTx, undefined, origin)
      await addTxToBatch(tx)
      return tx.txId
    }

    const signRelayedTx = async (safeTx: SafeTransaction, txId?: string): Promise<SafeTransaction> => {
      assertTx(safeTx)
      assertProvider(signer?.provider)

      // Smart contracts cannot sign transactions off-chain
      if (await isSmartContractWallet(signer.chainId, signer.address)) {
        throw new Error('Cannot relay an unsigned transaction from a smart contract wallet')
      }
      return await dispatchTxSigning(safeTx, version, signer.provider, txId)
    }

    const signTx: TxActions['signTx'] = async (safeTx, txId, origin) => {
      assertTx(safeTx)
      assertProvider(signer?.provider)
      assertOnboard(onboard)

      // Smart contract wallets must sign via an on-chain tx
      if (signer.isSafe || (await isSmartContractWallet(signer.chainId, signer.address))) {
        // If the first signature is a smart contract wallet, we have to propose w/o signatures
        // Otherwise the backend won't pick up the tx
        // The signature will be added once the on-chain signature is indexed
        const id = txId || (await _propose(signer.address, safeTx, txId, origin)).txId
        await dispatchOnChainSigning(
          safeTx,
          id,
          signer.provider,
          chainId,
          signer.address,
          safeAddress,
          Boolean(signer.isSafe),
        )
        return id
      }

      // Otherwise, sign off-chain
      const signedTx = await dispatchTxSigning(safeTx, version, signer.provider, txId)
      const tx = await _propose(signer.address, signedTx, txId, origin)
      return tx.txId
    }

    const signProposerTx: TxActions['signProposerTx'] = async (safeTx, origin) => {
      assertTx(safeTx)
      assertProvider(wallet?.provider)
      assertOnboard(onboard)

      const signedTx = await dispatchProposerTxSigning(safeTx, wallet)

      const tx = await _propose(wallet.address, signedTx, undefined, origin)
      return tx.txId
    }

    const executeTx: TxActions['executeTx'] = async (txOptions, safeTx, txId, origin, isRelayed) => {
      assertTx(safeTx)
      assertProvider(signer?.provider)
      assertOnboard(onboard)
      assertChainInfo(chain)

      let tx: TransactionDetails | undefined
      let rePropose = false
      // Relayed transactions must be fully signed, so request a final signature if needed
      if (isRelayed && safeTx.signatures.size < safe.threshold) {
        safeTx = await signRelayedTx(safeTx)
        rePropose = true
      }

      // Propose the tx if there's no id yet ("immediate execution")
      if (!txId || rePropose) {
        tx = await _propose(signer.address, safeTx, txId, origin)
        txId = tx.txId
      }

      // Relay or execute the tx via connected wallet
      if (isRelayed) {
        await dispatchTxRelay(safeTx, safe, txId, chain, txOptions.gasLimit)
      } else {
        const isSmartAccount = await isSmartContractWallet(signer.chainId, signer.address)
        await dispatchTxExecution(safeTx, txOptions, txId, signer.provider, signer.address, safeAddress, isSmartAccount)
      }

      return txId
    }

    return { addToBatch, signTx, executeTx, signProposerTx, proposeTx }
  }, [safe, wallet, signer?.provider, signer?.address, signer?.chainId, signer?.isSafe, addTxToBatch, onboard, chain])
}

export const useValidateNonce = (safeTx: SafeTransaction | undefined): boolean => {
  const { safe } = useSafeInfo()
  return !!safeTx && safeTx?.data.nonce === safe.nonce
}

export const useImmediatelyExecutable = (): boolean => {
  const { safe } = useSafeInfo()
  const hasPending = useHasPendingTxs()
  return safe.threshold === 1 && !hasPending
}

// Check if the executor is the safe itself (it won't work)
export const useIsExecutionLoop = (): boolean => {
  const wallet = useWallet()
  const { safeAddress } = useSafeInfo()
  return wallet ? sameString(wallet.address, safeAddress) : false
}

export const useRecommendedNonce = (): number | undefined => {
  const { safeAddress, safe } = useSafeInfo()

  const [recommendedNonce] = useAsync(
    async () => {
      if (!safe.chainId || !safeAddress) return
      if (!safe.deployed) return 0

      const nonces = await getNonces(safe.chainId, safeAddress)

      return nonces?.recommendedNonce
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [safeAddress, safe.chainId, safe.txQueuedTag, safe.txHistoryTag], // update when tx queue or history changes
    false, // keep old recommended nonce while refreshing to avoid skeleton
  )

  return recommendedNonce
}

export const useSafeTxGas = (safeTx: SafeTransaction | undefined): string | undefined => {
  const { safeAddress, safe } = useSafeInfo()

  // Memoize only the necessary params so that the useAsync hook is not called every time safeTx changes
  const safeTxParams = useMemo(() => {
    return !safeTx?.data?.to
      ? undefined
      : {
          to: safeTx?.data.to,
          value: safeTx?.data?.value,
          data: safeTx?.data?.data,
          operation: safeTx?.data?.operation,
        }
  }, [safeTx?.data.to, safeTx?.data.value, safeTx?.data.data, safeTx?.data.operation])

  const [safeTxGas] = useAsync(() => {
    if (!safe.chainId || !safeAddress || !safeTxParams || !safe.version) return

    return getSafeTxGas(safe.chainId, safeAddress, safe.version, safeTxParams)
  }, [safeAddress, safe.chainId, safe.version, safeTxParams])

  return safeTxGas
}

export const useAlreadySigned = (safeTx: SafeTransaction | undefined): boolean => {
  const wallet = useSigner()
  const hasSigned =
    safeTx && wallet && (safeTx.signatures.has(wallet.address.toLowerCase()) || safeTx.signatures.has(wallet.address))
  return Boolean(hasSigned)
}
