import { useCallback, useState } from 'react'
import {
  useDelegatesPostDelegateV3Mutation,
  useDelegatesDeleteDelegateV3Mutation,
  useDelegatesUpdateDelegateV3Mutation,
} from '@safe-global/store/gateway/delegates'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { encodeEIP1271Signature } from '@/features/proposers/utils/utils'
import { isTotpValid } from '@/features/proposers/utils/totp'
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
  const [addDelegateV3] = useDelegatesPostDelegateV3Mutation()
  const [updateDelegateV3] = useDelegatesUpdateDelegateV3Mutation()
  const [deleteDelegateV3] = useDelegatesDeleteDelegateV3Mutation()
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

        if (delegation.action === 'add' || delegation.action === 'edit') {
          const createDelegateDto = {
            safe: safeAddress,
            delegate: delegation.delegateAddress,
            delegator: delegation.parentSafeAddress,
            signature: eip1271Signature,
            label: delegation.delegateLabel,
          }

          if (delegation.action === 'edit') {
            await updateDelegateV3({ chainId, createDelegateDto }).unwrap()
          } else {
            await addDelegateV3({ chainId, createDelegateDto }).unwrap()
          }
        } else if (delegation.action === 'remove') {
          await deleteDelegateV3({
            chainId,
            delegateAddress: delegation.delegateAddress,
            deleteDelegateV2Dto: {
              delegator: delegation.parentSafeAddress,
              safe: safeAddress,
              signature: eip1271Signature,
            },
          }).unwrap()
        }
      } catch (error) {
        const err = asError(error)
        setSubmitError(err)
        throw err
      } finally {
        setIsSubmitting(false)
      }
    },
    [chainId, safeAddress, addDelegateV3, updateDelegateV3, deleteDelegateV3],
  )

  return { submitDelegation, isSubmitting, submitError }
}
