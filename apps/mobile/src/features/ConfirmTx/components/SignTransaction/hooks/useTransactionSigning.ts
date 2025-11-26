import { useCallback, useState } from 'react'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppSelector } from '@/src/store/hooks'
import { selectChainById } from '@/src/store/chains'
import { RootState } from '@/src/store'
import { getPrivateKey } from '@/src/hooks/useSign/useSign'
import { signTx } from '@/src/services/tx/tx-sender/sign'
import { useTransactionsAddConfirmationV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import logger from '@/src/utils/logger'
import { selectSignerByAddress } from '@/src/store/signersSlice'
import { SigningResponse, ledgerSafeSigningService } from '@/src/services/ledger/ledger-safe-signing.service'
import { Chain as ChainInfo } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { SafeVersion } from '@safe-global/types-kit'
import useSafeInfo from '@/src/hooks/useSafeInfo'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useAppDispatch } from '@/src/store/hooks'
import { setSigningError, setSigningSuccess, startSigning } from '@/src/store/signingStateSlice'
import { asError } from '@safe-global/utils/services/exceptions/utils'
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

  const [addConfirmation, { isLoading: isApiLoading, data: apiData, isError: isApiError }] =
    useTransactionsAddConfirmationV1Mutation()

  const executeSign = useCallback(async () => {
    setStatus(SigningStatus.LOADING)
    dispatch(startSigning(txId))
    try {
      let signedTx: SigningResponse

      // Check if this is a Ledger signer
      if (signer?.type === 'ledger') {
        // Handle Ledger signing
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
        })
      }

      await addConfirmation({
        chainId: activeSafe.chainId,
        safeTxHash: signedTx.safeTransactionHash,
        addConfirmationDto: {
          // TODO: we need to add this signature type in the auto generated types, because it was included recently in CGW
          // @ts-ignore
          signature: signedTx.signature,
        },
      })

      // Mark signing as successful - SigningMonitor will handle cleanup
      dispatch(setSigningSuccess(txId))

      // Invalidate the transactions cache
      dispatch(cgwApi.util.invalidateTags(['transactions']))

      setStatus(SigningStatus.SUCCESS)
    } catch (error) {
      logger.error('Error signing transaction:', error)
      setStatus(SigningStatus.ERROR)

      dispatch(setSigningError({ txId, error: asError(error).message }))

      // Re-throw error so it can be handled imperatively by the caller
      throw error
    }
  }, [activeChain, activeSafe, txId, signerAddress, addConfirmation, signer, safe.version, dispatch])

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
