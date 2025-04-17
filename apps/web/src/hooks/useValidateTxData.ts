import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { logError } from '@/services/exceptions'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { ethers } from 'ethers'
import { useContext } from 'react'

export const useValidateTxData = (txId?: string) => {
  const { safeTx } = useContext(SafeTxContext)

  const sdk = useSafeSDK()

  return useAsync(async () => {
    if (!sdk || !safeTx) {
      return
    }
    // Validate hash
    const computedSafeTxHash = await sdk.getTransactionHash(safeTx)

    if (txId && txId.slice(-66) !== computedSafeTxHash) {
      return 'The transaction data does not match its safeTxHash'
    }

    // Validate non 1271 signatures
    for (const signature of safeTx.signatures.values()) {
      if (signature.isContractSignature) {
        continue
      }

      const sig = signature.staticPart()
      const v = parseInt(sig.slice(-2), 16)

      if (v === 0 || v === 1) {
        // We ignore pre-validated sigs and EIP1271 for now
        continue
      }
      // ECDSA signature
      if (v === 27 || v === 28) {
        try {
          const recoveredAddress = ethers.recoverAddress(computedSafeTxHash, sig)
          if (recoveredAddress !== signature.signer) {
            return `The signature for the signer ${signature.signer} is invalid`
          }
        } catch (e) {
          logError(ErrorCodes._818, e)
          return `The signature for the signer ${signature.signer} could not be validated`
        }
      }
      // ETH_SIGN signature
      if (v === 31 || v === 32) {
        try {
          const modifiedSig = `${sig.slice(0, -2)}${(v - 4).toString(16)}`
          const recoveredAddress = ethers.verifyMessage(ethers.getBytes(computedSafeTxHash), modifiedSig)
          if (recoveredAddress !== signature.signer) {
            return `The signature for the signer ${signature.signer} is invalid`
          }
        } catch (e) {
          logError(ErrorCodes._818, e)
          return `The signature for the signer ${signature.signer} could not be validated`
        }
      }
    }
  }, [sdk, safeTx, txId])
}
