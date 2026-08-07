import { useCallback, useState } from 'react'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppSelector } from '@/src/store/hooks'
import { selectChainById } from '@/src/store/chains'
import { RootState } from '@/src/store'
import { BiometryInvalidationError } from '@/src/services/key-storage'
import { getPrivateKey } from '@/src/hooks/useSign/useSign'
import { signTx } from '@/src/services/tx/tx-sender/sign'
import { useTransactionsAddConfirmationV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import logger from '@/src/utils/logger'
import { selectSignerByAddress } from '@/src/store/signersSlice'
import { SigningResponse, ledgerSafeSigningService } from '@/src/services/ledger/ledger-safe-signing.service'
import { useWalletConnectContext } from '@/src/features/WalletConnect/Signer/context/WalletConnectContext'
import { Chain as ChainInfo } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { SafeVersion } from '@safe-global/types-kit'
import useSafeInfo from '@/src/hooks/useSafeInfo'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useAppDispatch } from '@/src/store/hooks'
import { setSigningError, setSigningSuccess, startSigning } from '@/src/store/signingStateSlice'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { selectDraftByHash } from '@/src/store/draftTxSlice'
import { addSignaturesToTx, createTx } from '@/src/services/tx/tx-sender/create'
import proposeNewTransaction from '@/src/services/tx/proposeNewTransaction'
export enum SigningStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}

interface UseTransactionSigningProps {
  txId: string
  signerAddress: string
}

export function useTransactionSigning({ txId, signerAddress }: UseTransactionSigningProps) {
  const dispatch = useAppDispatch()
  const [status, setStatus] = useState<SigningStatus>(SigningStatus.IDLE)
  const activeSafe = useDefinedActiveSafe()
  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))
  const signer = useAppSelector((state: RootState) => selectSignerByAddress(state, signerAddress))
  const { safe } = useSafeInfo()
  const { sign: signWithWc } = useWalletConnectContext()
  const draft = useAppSelector((state: RootState) => selectDraftByHash(state, txId))

  const [addConfirmation, { isLoading: isApiLoading, data: apiData, isError: isApiError }] =
    useTransactionsAddConfirmationV1Mutation()

  const executeSign = useCallback(async () => {
    setStatus(SigningStatus.LOADING)
    dispatch(startSigning(txId))
    try {
      if (draft) {
        // Guard against the active Safe/chain having changed since the
        // draft was composed. Sign-time uses the singleton SDK + active
        // chain/safe to build the EIP-712 domain; if these no longer
        // match the draft we'd produce a signature bound to the wrong
        // Safe — never silently proceed.
        if (draft.chainId !== activeSafe.chainId) {
          throw new Error(
            `Cannot sign: draft was composed on chain ${draft.chainId} but active chain is ${activeSafe.chainId}.`,
          )
        }
        if (draft.safeAddress.toLowerCase() !== activeSafe.address.toLowerCase()) {
          throw new Error('Cannot sign: draft was composed for a different Safe than the one currently active.')
        }
      }

      // Defence in depth: the signer must be a current owner of the
      // active Safe. Upstream UI already filters the picker, but
      // asserting locally prevents future regressions if a deep link
      // or notification routes a non-owner address into this hook.
      const ownerMatches = safe.owners?.some((owner) => owner.value.toLowerCase() === signerAddress.toLowerCase())
      if (!ownerMatches) {
        throw new Error('Selected signer is not an owner of this Safe.')
      }

      // For drafts (un-proposed transactions composed on this device) we
      // build the SafeTransaction from the stored params so the sign
      // services don't have to fetch a non-existent tx from CGW.
      const prebuiltSafeTx = draft ? await createTx(draft.buildParams) : undefined

      let signedTx: SigningResponse

      if (signer?.type === 'walletconnect') {
        signedTx = await signWithWc({
          chain: activeChain as ChainInfo,
          activeSafe,
          txId,
          signerAddress,
          safeVersion: safe.version ?? undefined,
          prebuiltSafeTx,
        })
      } else if (signer?.type === 'ledger') {
        if (!signer.derivationPath) {
          throw new Error('Ledger signer missing derivation path')
        }

        if (!safe.version) {
          throw new Error('Safe version not available for Ledger signing')
        }

        // Ensure Ledger device is connected
        await ledgerSafeSigningService.ensureLedgerConnection()

        signedTx = await ledgerSafeSigningService.signSafeTransaction({
          chain: activeChain as ChainInfo,
          activeSafe,
          txId,
          signerAddress,
          derivationPath: signer.derivationPath,
          safeVersion: safe.version as SafeVersion,
          prebuiltSafeTx,
        })
      } else {
        // Handle private key signing (existing flow)
        const privateKey = await getPrivateKey(signerAddress)

        if (!privateKey) {
          throw new Error('Failed to retrieve private key')
        }

        signedTx = await signTx({
          chain: activeChain as ChainInfo,
          activeSafe,
          txId,
          privateKey,
          prebuiltSafeTx,
        })
      }

      if (draft && prebuiltSafeTx) {
        // Draft path: bundle the signature into a fresh /propose call so
        // CGW creates the queue entry and registers the first confirmation
        // in a single round-trip (mirrors web's behaviour). The signer at
        // sign time becomes the proposer recorded by CGW — not whoever
        // happened to be selected on the compose screen. The draft is
        // cleared automatically by the slice's extraReducer matching
        // transactionsProposeTransactionV1.matchFulfilled.
        addSignaturesToTx(prebuiltSafeTx, { [signerAddress]: signedTx.signature })
        await proposeNewTransaction({
          chainId: draft.chainId,
          safeAddress: draft.safeAddress,
          sender: signerAddress,
          signedTx: prebuiltSafeTx,
          safeTxHash: signedTx.safeTransactionHash,
          dispatch,
        })
      } else {
        await addConfirmation({
          chainId: activeSafe.chainId,
          safeTxHash: signedTx.safeTransactionHash,
          addConfirmationDto: {
            signature: signedTx.signature,
          },
        })
      }

      // Mark signing as successful - SigningMonitor will handle cleanup
      dispatch(setSigningSuccess(txId))

      // Invalidate the transactions cache
      dispatch(cgwApi.util.invalidateTags(['transactions']))

      setStatus(SigningStatus.SUCCESS)
    } catch (error) {
      setStatus(SigningStatus.ERROR)

      if (!(error instanceof BiometryInvalidationError)) {
        logger.error('Error signing transaction:', error)
      }

      dispatch(setSigningError({ txId, error: asError(error).message }))
      throw error
    }
  }, [
    activeChain,
    activeSafe,
    txId,
    signerAddress,
    addConfirmation,
    signer,
    safe.version,
    safe.owners,
    dispatch,
    signWithWc,
    draft,
  ])

  const retry = useCallback(() => {
    executeSign()
  }, [executeSign])

  const reset = useCallback(() => {
    setStatus(SigningStatus.IDLE)
  }, [])

  return {
    status,
    executeSign,
    retry,
    reset,
    isApiLoading,
    apiData,
    isApiError,
    signer,
  }
}
