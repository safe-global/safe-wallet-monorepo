/**
 * Shared transaction hooks for the tx-flow system
 *
 * These hooks provide core transaction functionality used across
 * all action components (Sign, Execute, Batch, etc.)
 *
 * @module tx/shared/hooks
 */
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { assertTx, assertOnboard, assertChainInfo, assertProvider } from '@/utils/helpers'
import { useContext, useMemo } from 'react'
import { type TransactionOptions, type SafeTransaction } from '@safe-global/types-kit'
import { sameAddress } from '@safe-global/utils/utils/addresses'
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
import useAsync from '@safe-global/utils/hooks/useAsync'
import { useUpdateBatch } from '@/features/batching'
import { useCurrentChain } from '@/hooks/useChains'
import { useLoadFeature } from '@/features/__core__'
import { GTFFeature } from '@/features/gtf'
import { mergeGtfFeeParams } from '@/features/gtf/services'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import type { SignerWallet } from '@/components/common/WalletProvider'
import { supportsNestedTxEnvelope, type NestedTxEnvelope } from '@/services/tx/nestedTxEnvelope'

// The signer is a Safe: either the in-app nested signer (`isSafe`) or a Safe connected directly,
// e.g. via WalletConnect (`isConnectedSafe`). Such a signer creates an on-chain
// approveHash/execTransaction in its own Safe instead of signing/executing directly.
const isSafeSigner = (signer: SignerWallet): boolean => Boolean(signer.isSafe) || Boolean(signer.isConnectedSafe)

// Whether the signer executes the on-chain tx immediately (returning a real tx hash) rather than
// queuing it in its own Safe (returning a safeTxHash). True for EOAs and non-Safe smart accounts;
// among Safe signers, only the in-app nested signer at threshold 1 executes synchronously.
const executesImmediately = (signer: SignerWallet): boolean =>
  !isSafeSigner(signer) || (Boolean(signer.isSafe) && signer.threshold === 1)

// A smart-account signer creates an on-chain approveHash tx in its own Safe, so signing lands in
// a "nested signing" state rather than adding an off-chain signature.
type SignResult = { txId: string; isNestedSigning: boolean }
// `isExecuted` is false when a smart-account executor only queued the tx in its own Safe (so the
// returned hash is a safeTxHash, not an on-chain tx hash).
type ExecuteResult = { txId: string; isExecuted: boolean }

type TxActions = {
  addToBatch: (safeTx?: SafeTransaction, origin?: string) => Promise<string>
  signTx: (safeTx?: SafeTransaction, txId?: string, origin?: string) => Promise<SignResult>
  executeTx: (
    txOptions: TransactionOptions,
    safeTx?: SafeTransaction,
    txId?: string,
    origin?: string,
    isRelayed?: boolean,
    acceptUnverifiedSimulation?: boolean,
  ) => Promise<ExecuteResult>
  signProposerTx: (safeTx?: SafeTransaction, origin?: string) => Promise<string>
  proposeTx: (safeTx: SafeTransaction, txId?: string, origin?: string) => Promise<TransactionDetails>
}

/**
 * Returns transaction action functions for signing, executing, and batching
 *
 * @returns Object containing signTx, executeTx, addToBatch, signProposerTx, proposeTx
 */
export const useTxActions = (): TxActions => {
  const { safe } = useSafeInfo()
  const onboard = useOnboard()
  const signer = useSigner()
  const wallet = useWallet()
  const [addTxToBatch] = useUpdateBatch()
  const chain = useCurrentChain()
  const dispatch = useAppDispatch()
  const gtfFeature = useLoadFeature(GTFFeature)
  const { gtfPaymentMode, gtfSelectedGasToken } = useContext(SafeTxContext)
  const currency = useAppSelector(selectCurrency)
  // A verified child tx received via a nested approveHash envelope (e.g. over WalletConnect):
  // proposed alongside the parent tx so the service learns about it without a proposal from
  // the child Safe
  const { data: flowData } = useContext(TxFlowContext) as TxFlowContextType<{ nestedChildTx?: NestedTxEnvelope }>
  const nestedChildTx = flowData?.nestedChildTx

  return useMemo<TxActions>(() => {
    const safeAddress = safe.address.value
    const { chainId } = safe

    const withGtfFeeParams = (safeTx: SafeTransaction) =>
      mergeGtfFeeParams({
        safeTx,
        chain,
        gtfPaymentMode,
        gtfSelectedGasToken,
        gtfFeature,
        chainId,
        safeAddress,
        numberSignatures: safe.threshold,
        currency,
        dispatch,
      })

    const _propose = async (sender: string, safeTx: SafeTransaction, txId?: string, origin?: string) => {
      return dispatchTxProposal({
        chainId,
        safeAddress,
        sender,
        safeTx,
        txId,
        origin,
        nestedTransaction: nestedChildTx,
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

      safeTx = await withGtfFeeParams(safeTx)

      // Smart contracts cannot sign transactions off-chain
      if (await isSmartContractWallet(signer.chainId, signer.address)) {
        throw new Error('Cannot relay an unsigned transaction from a smart contract wallet')
      }
      return await dispatchTxSigning(safeTx, signer.provider, txId)
    }

    const signTx: TxActions['signTx'] = async (safeTx, txId, origin) => {
      assertTx(safeTx)
      assertProvider(signer?.provider)
      assertOnboard(onboard)

      safeTx = await withGtfFeeParams(safeTx)

      // Any smart contract wallet must sign via an on-chain approveHash tx (they can't sign
      // off-chain). Only a Safe signer (in-app nested or a Safe connected via WalletConnect) gets
      // the nested success screen; other smart accounts keep the plain flow.
      const viaSafe = isSafeSigner(signer)
      const isSmartAccount = viaSafe || (await isSmartContractWallet(signer.chainId, signer.address))
      if (isSmartAccount) {
        // A Safe signer skips the CGW proposal only when the child tx travels to the parent inside
        // the approveHash envelope, which then proposes it alongside the parent tx. The skip must
        // use the same predicate as appending the envelope (dispatchOnChainSigning) — if they
        // diverged, the child tx data would be lost entirely. Envelope-less signers (older child
        // Safes, non-Safe smart accounts) have to propose w/o signatures — otherwise the backend
        // won't pick up the tx. The signature will be added once the on-chain signature is indexed.
        const carriesEnvelope = viaSafe && supportsNestedTxEnvelope(safe.version)
        const id = txId || (carriesEnvelope ? undefined : (await _propose(signer.address, safeTx, txId, origin)).txId)
        const signedTxId = await dispatchOnChainSigning(
          safeTx,
          id,
          signer.provider,
          chainId,
          signer.address,
          safeAddress,
          viaSafe,
          executesImmediately(signer),
          safe.version,
        )
        return { txId: signedTxId, isNestedSigning: viaSafe }
      }

      // Otherwise, sign off-chain
      const signedTx = await dispatchTxSigning(safeTx, signer.provider, txId)
      const tx = await _propose(signer.address, signedTx, txId, origin)
      return { txId: tx.txId, isNestedSigning: false }
    }

    const signProposerTx: TxActions['signProposerTx'] = async (safeTx, origin) => {
      assertTx(safeTx)
      assertProvider(wallet?.provider)
      assertOnboard(onboard)

      const signedTx = await dispatchProposerTxSigning(safeTx, wallet)

      const tx = await _propose(wallet.address, signedTx, undefined, origin)
      return tx.txId
    }

    const executeTx: TxActions['executeTx'] = async (
      txOptions,
      safeTx,
      txId,
      origin,
      isRelayed,
      acceptUnverifiedSimulation,
    ) => {
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

      // Relayed txs must be known to the service, so propose them regardless of the signer type
      if (isRelayed) {
        if (!txId || rePropose) {
          tx = await _propose(signer.address, safeTx, txId, origin)
          txId = tx.txId
        }
        await dispatchTxRelay(safeTx, safe, txId, chain, txOptions.gasLimit, acceptUnverifiedSimulation)
        return { txId, isExecuted: true }
      }

      const viaSafe = isSafeSigner(signer)
      // Propose the tx if there's no id yet ("immediate execution"). A Safe executor never
      // proposes the child tx to CGW — only the parent proposes: its execTransaction calldata
      // carries the full child tx, which the service picks up once it executes on-chain.
      if (!txId && !viaSafe) {
        tx = await _propose(signer.address, safeTx, txId, origin)
        txId = tx.txId
      }

      const isSmartAccount = viaSafe || (await isSmartContractWallet(signer.chainId, signer.address))
      // A Safe executor submits to its own Safe and gets back a safeTxHash, not an on-chain tx hash
      // — UNLESS it's the in-app nested signer at threshold 1, which executes immediately and
      // returns a real hash. EOAs and non-Safe smart accounts execute directly (real hash / their
      // own semantics), so treat them as executed and keep the plain processing flow.
      const executed = executesImmediately(signer)
      const executedTxId = await dispatchTxExecution(
        safe.chainId,
        safeTx,
        txOptions,
        txId,
        signer.provider,
        signer.address,
        safeAddress,
        isSmartAccount,
        executed,
      )

      return { txId: executedTxId, isExecuted: executed }
    }

    return { addToBatch, signTx, executeTx, signProposerTx, proposeTx }
  }, [
    safe,
    wallet,
    signer,
    addTxToBatch,
    onboard,
    chain,
    dispatch,
    gtfFeature,
    gtfPaymentMode,
    gtfSelectedGasToken,
    currency,
    nestedChildTx,
  ])
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
  return wallet ? sameAddress(wallet.address, safeAddress) : false
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
