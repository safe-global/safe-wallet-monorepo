/**
 * Shared transaction hooks for the tx-flow system
 *
 * These hooks provide core transaction functionality used across
 * all action components (Sign, Execute, Batch, etc.)
 *
 * @module tx/shared/hooks
 */
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { assertTx, assertOnboard, assertChainInfo, assertProvider, assertWallet } from '@/utils/helpers'
import { useContext, useMemo } from 'react'
import { type TransactionOptions, type SafeTransaction } from '@safe-global/types-kit'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope/context'
import useWallet, { useSigner } from '@/hooks/wallets/useWallet'
import useOnboard from '@/hooks/wallets/useOnboard'
import { isSafeSigner, isSmartContractWallet } from '@/utils/wallets'
import {
  dispatchProposerTxSigning,
  dispatchNestedTxCreation,
  dispatchOnChainSigning,
  dispatchTxConfirmation,
  dispatchTxExecution,
  dispatchTxProposal,
  dispatchTxRelay,
  dispatchTxSigning,
} from '@/services/tx/tx-sender'
import { useHasPendingTxs } from '@/hooks/usePendingTxs'
import { runExecutionPreChecks } from '@/services/tx/executionPreChecks'
import { getSafeTxGas, getNonces } from '@/services/tx/tx-sender/recommendedNonce'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { useCurrentChain } from '@/hooks/useChains'
import { useLoadFeature } from '@/features/__core__'
import { FeePaymentFeature } from '@/features/fee-payment'
import { FeePayerContext } from '@/components/tx-flow/FeePayerContext'
import { mergePayFromSafeFeeParams } from '@/features/fee-payment/services'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import type { SignerWallet } from '@/components/common/WalletProvider'
import { supportsNestedTxEnvelope, type NestedTxEnvelope } from '@/services/tx/nestedTxEnvelope'

// The in-app nested signer only ever proposes in its parent
const executesImmediately = (signer: SignerWallet): boolean =>
  !signer.isSafe && (!signer.isConnectedSafe || signer.threshold === 1)

type SignResult = { txId: string; isNestedSigning: boolean }
// false → the returned hash is the executor Safe's safeTxHash
type ExecuteResult = { txId: string; isExecuted: boolean }

type TxActions = {
  signTx: (safeTx?: SafeTransaction, txId?: string, origin?: string) => Promise<SignResult>
  executeTx: (
    txOptions: TransactionOptions,
    safeTx?: SafeTransaction,
    txId?: string,
    origin?: string,
    isRelayed?: boolean,
    acceptUnverifiedSimulation?: boolean,
    /** The Safe Pro Workspace paying for the relay, when the Safe is on a plan. */
    sponsorSpaceId?: string | null,
    isPayFromSafe?: boolean,
  ) => Promise<ExecuteResult>
  signProposerTx: (safeTx?: SafeTransaction, origin?: string) => Promise<string>
  proposeTx: (safeTx: SafeTransaction, origin?: string) => Promise<TransactionDetails>
}

/**
 * Returns transaction action functions for signing, executing and proposing
 *
 * @returns Object containing signTx, executeTx, signProposerTx, proposeTx
 */
export const useTxActions = (): TxActions => {
  const { safe } = useSafeInfo()
  const scope = useSafeScope()
  const onboard = useOnboard()
  const signer = useSigner()
  const wallet = useWallet()
  const chain = useCurrentChain()
  const dispatch = useAppDispatch()
  const feePaymentFeature = useLoadFeature(FeePaymentFeature)
  const { feeGasToken } = useContext(SafeTxContext)
  const signStepPaysFromSafe = useContext(FeePayerContext)?.isPayFromSafe ?? false
  const currency = useAppSelector(selectCurrency)
  const { data: flowData } = useContext(TxFlowContext) as TxFlowContextType<{ nestedChildTx?: NestedTxEnvelope }>
  const nestedChildTx = flowData?.nestedChildTx

  return useMemo<TxActions>(() => {
    // While a scoped Safe's SafeState is still loading, `safe` is `defaultSafeInfo` — the scope's own
    // chainId/safeAddress are already known, so prefer them over the placeholder.
    const safeAddress = scope?.safeAddress ?? safe.address.value
    const chainId = scope?.chainId ?? safe.chainId

    const withPayFromSafeFeeParams = (safeTx: SafeTransaction, isPayFromSafe: boolean) =>
      mergePayFromSafeFeeParams({
        safeTx,
        chain,
        isPayFromSafe,
        feeGasToken,
        feePaymentFeature,
        chainId,
        safeAddress,
        numberSignatures: safe.threshold,
        currency,
        dispatch,
      })

    const _propose = async (sender: string, safeTx: SafeTransaction, origin?: string) => {
      return dispatchTxProposal({
        chainId,
        safeAddress,
        sender,
        safeTx,
        origin,
        scope,
        nestedTransaction: nestedChildTx,
      })
    }

    // A tx with a txId is already known to CGW, so only the new signature is sent
    const _proposeOrConfirm = async (
      sender: string,
      safeTx: SafeTransaction,
      txId?: string,
      origin?: string,
    ): Promise<string> => {
      if (txId) {
        const confirmedTx = await dispatchTxConfirmation({ chainId, safeAddress, sender, safeTx, txId, scope })
        return confirmedTx.txId
      }
      const proposedTx = await _propose(sender, safeTx, origin)
      return proposedTx.txId
    }

    const proposeTx: TxActions['proposeTx'] = async (safeTx, origin) => {
      assertTx(safeTx)
      return _propose(wallet?.address || safe.owners[0].value, safeTx, origin)
    }

    // Merging the Safe-pays fee changes the hash, so a proposal is proposed again as a new tx instead of confirmed.
    const confirmableTxId = (txId: string | undefined, feesMerged: boolean) => (feesMerged ? undefined : txId)

    const signRelayedTx = async (
      safeTx: SafeTransaction,
      txId: string | undefined,
      isPayFromSafe: boolean,
    ): Promise<{ signedTx: SafeTransaction; txId?: string }> => {
      assertProvider(signer?.provider)

      const { safeTx: txToSign, feesMerged } = await withPayFromSafeFeeParams(safeTx, isPayFromSafe)
      const confirmTxId = confirmableTxId(txId, feesMerged)

      if (await isSmartContractWallet(signer.chainId, signer.address)) {
        throw new Error('Cannot relay an unsigned transaction from a smart contract wallet')
      }
      return { signedTx: await dispatchTxSigning(txToSign, signer.provider, confirmTxId, scope), txId: confirmTxId }
    }

    const signTx: TxActions['signTx'] = async (safeTx, txId, origin) => {
      assertTx(safeTx)
      assertProvider(signer?.provider)
      assertOnboard(onboard)

      const { safeTx: txToSign, feesMerged } = await withPayFromSafeFeeParams(safeTx, signStepPaysFromSafe)
      const confirmTxId = confirmableTxId(txId, feesMerged)

      // Smart contract wallets can't sign off-chain
      const viaSafe = isSafeSigner(signer)
      const isSmartAccount = viaSafe || (await isSmartContractWallet(signer.chainId, signer.address))
      if (isSmartAccount) {
        // Must match the envelope predicate in dispatchOnChainSigning, or the child tx is lost
        const carriesEnvelope = viaSafe && supportsNestedTxEnvelope(safe.version)

        // The queue rejects unsigned proposals, so the nested signer's EOA signs the child hash first
        if (signer.isSafe && !confirmTxId && !carriesEnvelope) {
          assertWallet(wallet)
          const nestedTxId = await dispatchNestedTxCreation({
            safeTx: txToSign,
            wallet,
            parentSafeAddress: signer.address,
            parentProvider: signer.provider,
            chainId,
            safeAddress,
            executed: executesImmediately(signer),
            origin,
            scope,
            nestedTransaction: nestedChildTx,
          })
          return { txId: nestedTxId, isNestedSigning: true }
        }

        const id =
          confirmTxId || (carriesEnvelope ? undefined : (await _propose(signer.address, txToSign, origin)).txId)
        const signedTxId = await dispatchOnChainSigning(
          txToSign,
          id,
          signer.provider,
          chainId,
          signer.address,
          safeAddress,
          viaSafe,
          executesImmediately(signer),
          safe.version,
          scope,
        )
        return { txId: signedTxId, isNestedSigning: viaSafe }
      }

      // Otherwise, sign off-chain
      const signedTx = await dispatchTxSigning(txToSign, signer.provider, confirmTxId, scope)
      const signedTxId = await _proposeOrConfirm(signer.address, signedTx, confirmTxId, origin)
      return { txId: signedTxId, isNestedSigning: false }
    }

    const signProposerTx: TxActions['signProposerTx'] = async (safeTx, origin) => {
      assertTx(safeTx)
      assertProvider(wallet?.provider)
      assertOnboard(onboard)

      const signedTx = await dispatchProposerTxSigning(safeTx, wallet, scope)

      const tx = await _propose(wallet.address, signedTx, origin)
      return tx.txId
    }

    const executeTx: TxActions['executeTx'] = async (
      txOptions,
      safeTx,
      txId,
      origin,
      isRelayed,
      acceptUnverifiedSimulation,
      sponsorSpaceId,
      isPayFromSafe = false,
    ) => {
      assertTx(safeTx)
      assertProvider(signer?.provider)
      assertOnboard(onboard)
      assertChainInfo(chain)

      // Catch the three GS026 causes (stale nonce, non-signer executor, bad
      // signature) before anything is broadcast — an on-chain GS026
      // revert would cost the user gas for a guaranteed failure (WA-3005).
      await runExecutionPreChecks({ safeTx, safe, signerAddress: signer.address, scope })

      if (isRelayed) {
        // The relayer has no implicit approval, so the last signer of an m/n Safe signs before relaying
        const needsSignature = safeTx.signatures.size < safe.threshold
        const { signedTx, txId: knownTxId } = needsSignature
          ? await signRelayedTx(safeTx, txId, isPayFromSafe)
          : { signedTx: safeTx, txId }

        // Relayed txs must be known to the service
        const relayTxId =
          !knownTxId || needsSignature
            ? await _proposeOrConfirm(signer.address, signedTx, knownTxId, origin)
            : knownTxId
        await dispatchTxRelay(
          signedTx,
          safe,
          relayTxId,
          chain,
          txOptions.gasLimit,
          acceptUnverifiedSimulation,
          scope,
          sponsorSpaceId,
        )
        return { txId: relayTxId, isExecuted: true }
      }

      const viaSafe = isSafeSigner(signer)
      const isSmartAccount = viaSafe || (await isSmartContractWallet(signer.chainId, signer.address))

      // A Safe executor never proposes the child tx; the parent proposes it as `nestedTransaction`
      if (!viaSafe && !txId) {
        txId = (await _propose(signer.address, safeTx, origin)).txId
      }

      // Above threshold 1 a Safe executor only queues and gets back a safeTxHash
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
        viaSafe,
        safe.version,
        scope,
      )

      return { txId: executedTxId, isExecuted: executed }
    }

    return { signTx, executeTx, signProposerTx, proposeTx }
  }, [
    safe,
    scope,
    wallet,
    signer,
    onboard,
    chain,
    dispatch,
    feePaymentFeature,
    signStepPaysFromSafe,
    feeGasToken,
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
