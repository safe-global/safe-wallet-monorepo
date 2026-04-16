import { useCallback, useState } from 'react'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppSelector } from '@/src/store/hooks'
import { selectChainById } from '@/src/store/chains'
import { RootState } from '@/src/store'
import { getPrivateKey } from '@/src/hooks/useSign/useSign'
import { signTx } from '@/src/services/tx/tx-sender/sign'
import { signWithPasskey } from '@/src/services/tx/tx-sender/signWithPasskey'
import { getPasskeyMetadata, updateDeployedChains } from '@/src/services/passkey/passkey-storage.service'
import {
  isIdentityDeployed,
  deployIdentityContract,
  waitForDeployment,
} from '@/src/services/passkey/identity-contract.service'
import { useTransactionsAddConfirmationV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useRelayRelayV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/relay'
import { useLazyRelayGetTaskStatusV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/relay'
import logger from '@/src/utils/logger'
import { selectSignerByAddress } from '@/src/store/signersSlice'
import { SigningResponse, ledgerSafeSigningService } from '@/src/services/ledger/ledger-safe-signing.service'
import { useWalletConnectContext } from '@/src/features/WalletConnect/context/WalletConnectContext'
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
  const { sign: signWithWc } = useWalletConnectContext()

  const [addConfirmation, { isLoading: isApiLoading, data: apiData, isError: isApiError }] =
    useTransactionsAddConfirmationV1Mutation()
  const [relayMutation] = useRelayRelayV1Mutation()
  const [triggerTaskStatus] = useLazyRelayGetTaskStatusV1Query()

  const executeSign = useCallback(async () => {
    setStatus(SigningStatus.LOADING)
    dispatch(startSigning(txId))
    try {
      let signedTx: SigningResponse

      if (signer?.type === 'walletconnect') {
        signedTx = await signWithWc({
          chain: activeChain as ChainInfo,
          activeSafe,
          txId,
          signerAddress,
          safeVersion: safe.version ?? undefined,
        })
      } else if (signer?.type === 'passkey') {
        // Handle passkey signing
        const passkeyMetadata = await getPasskeyMetadata()
        if (!passkeyMetadata) {
          throw new Error('Passkey metadata not found')
        }

        // Check if identity contract is deployed on this chain
        // Use cached deployment status first, only hit RPC if not cached
        const cachedDeployed = passkeyMetadata.deployedOnChains.includes(activeSafe.chainId)
        const deployed =
          cachedDeployed ||
          (await isIdentityDeployed(passkeyMetadata.identityContractAddress, activeChain as ChainInfo))

        if (!deployed) {
          const { taskId } = await deployIdentityContract({
            signer: {
              rawId: passkeyMetadata.rawId,
              coordinates: passkeyMetadata.coordinates,
            },
            activeSafe,
            chain: activeChain as ChainInfo,
            relayMutation: async (args) => {
              const result = await relayMutation(args).unwrap()
              return result
            },
          })

          await waitForDeployment({
            taskId,
            chainId: activeSafe.chainId,
            pollTaskStatus: async (args) => {
              const result = await triggerTaskStatus(args).unwrap()
              return result
            },
          })

          // Cache deployment status to skip RPC check next time
          await updateDeployedChains(activeSafe.chainId)
        }

        // Sign with passkey (triggers OS biometric prompt)
        signedTx = await signWithPasskey({
          chain: activeChain as ChainInfo,
          activeSafe,
          txId,
          passkeyMetadata,
        })
      } else if (signer?.type === 'ledger') {
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

      logger.info('[passkey-confirm] sending addConfirmation:', {
        chainId: activeSafe.chainId,
        safeTxHash: signedTx.safeTransactionHash,
        signatureLength: signedTx.signature.length,
        signaturePrefix: signedTx.signature.slice(0, 66),
      })

      const confirmResult = await addConfirmation({
        chainId: activeSafe.chainId,
        safeTxHash: signedTx.safeTransactionHash,
        addConfirmationDto: {
          signature: signedTx.signature,
        },
      })

      logger.info('[passkey-confirm] addConfirmation result:', JSON.stringify(confirmResult).slice(0, 200))

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
  }, [
    activeChain,
    activeSafe,
    txId,
    signerAddress,
    addConfirmation,
    signer,
    safe.version,
    dispatch,
    relayMutation,
    triggerTaskStatus,
    signWithWc,
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
