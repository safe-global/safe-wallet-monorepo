import { useCallback, useContext, useEffect, useRef } from 'react'
import type { CreatePolicyConfigurationRequestDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { SubmitCallback } from '@/components/tx-flow/TxFlow'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { useSaveAllowlistConfiguration } from './useSaveAllowlistConfiguration'

/** Stores the configurations in CGW before the transaction is signed; submit waits for the built requests and every save. */
export const useSaveBeforeSubmit = (
  requests: CreatePolicyConfigurationRequestDto[] | undefined,
  onSubmit: SubmitCallback,
): SubmitCallback => {
  const { save, isSaving } = useSaveAllowlistConfiguration()
  const { setIsSubmitLoading, setIsSubmitDisabled } = useContext(TxFlowContext)

  useEffect(() => {
    setIsSubmitLoading(isSaving)
  }, [isSaving, setIsSubmitLoading])

  useEffect(() => {
    setIsSubmitDisabled(!requests || isSaving)
  }, [requests, isSaving, setIsSubmitDisabled])

  useEffect(
    () => () => {
      setIsSubmitLoading(false)
      setIsSubmitDisabled(false)
    },
    [setIsSubmitLoading, setIsSubmitDisabled],
  )

  // The disabled state lands a render late, so a fast double click would otherwise save twice.
  const isSubmittingRef = useRef(false)

  return useCallback<SubmitCallback>(
    async (args) => {
      if (!requests || isSubmittingRef.current) return
      isSubmittingRef.current = true
      try {
        const saved = await Promise.all(requests.map((request) => save(request)))
        if (saved.every(Boolean)) onSubmit(args)
      } finally {
        isSubmittingRef.current = false
      }
    },
    [requests, save, onSubmit],
  )
}
