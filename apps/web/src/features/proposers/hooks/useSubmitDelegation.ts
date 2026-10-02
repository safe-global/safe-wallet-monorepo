import { useCallback, useState } from 'react'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { encodeEIP1271Signature } from '@/features/proposers/utils/utils'
import { useDelegateMutations } from './useDelegateMutations'
import { isTotpValid } from '@/features/proposers/utils/totp'
import { PROPOSER_LABEL_PLACEHOLDER } from '@/features/proposers/constants'
import useChainId from '@/hooks/useChainId'
import useSafeAddress from '@/hooks/useSafeAddress'
import type { PendingDelegation } from '@/features/proposers/types'

/**
 * Submits a confirmed delegation (threshold met) to the delegate API.
 * Wraps the preparedSignature in EIP-1271 format and calls the appropriate endpoint.
 */
export const useSubmitDelegation = () => {
  const chainId = useChainId()
  const safeAddress = useSafeAddress()
  const { addDelegate, deleteDelegate } = useDelegateMutations()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<Error>()

  const submitDelegation = useCallback(
    async (delegation: PendingDelegation) => {
      if (!isTotpValid(delegation.totp)) {
        throw new Error('Delegation has expired. Please create a new delegation request.')
      }

      if (!delegation.preparedSignature) {
        throw new Error('Cannot submit delegation: preparedSignature is not available')
      }

      setIsSubmitting(true)
      setSubmitError(undefined)

      try {
        const eip1271Signature = await encodeEIP1271Signature(
          delegation.parentSafeAddress,
          delegation.preparedSignature,
        )

        if (delegation.action === 'add') {
          await addDelegate({
            chainId,
            createDelegateDto: {
              safe: safeAddress,
              delegate: delegation.delegateAddress,
              delegator: delegation.parentSafeAddress,
              signature: eip1271Signature,
              label: PROPOSER_LABEL_PLACEHOLDER,
            },
          })
        } else if (delegation.action === 'remove') {
          await deleteDelegate({
            chainId,
            delegateAddress: delegation.delegateAddress,
            deleteDelegateDto: {
              delegator: delegation.parentSafeAddress,
              safe: safeAddress,
              signature: eip1271Signature,
            },
          })
        }
      } catch (error) {
        const err = asError(error)
        setSubmitError(err)
        throw err
      } finally {
        setIsSubmitting(false)
      }
    },
    [chainId, safeAddress, addDelegate, deleteDelegate],
  )

  return { submitDelegation, isSubmitting, submitError }
}
