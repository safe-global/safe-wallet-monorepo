import { useCallback, useContext, useEffect, useRef } from 'react'
import type { CreatePolicyConfigurationRequestDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { SubmitCallback } from '@/components/tx-flow/TxFlow'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { useSaveAllowlistConfiguration } from './useSaveAllowlistConfiguration'

/** Stores the configurations in CGW before the transaction is signed; submit waits for a built request and the save. */
export const useSaveBeforeSubmit = (
  request: CreatePolicyConfigurationRequestDto | undefined,
  onSubmit: SubmitCallback,
): SubmitCallback => {
  const { save, isSaving } = useSaveAllowlistConfiguration()
  const { setIsSubmitLoading, setIsSubmitDisabled } = useContext(TxFlowContext)

  useEffect(() => {
    setIsSubmitLoading(isSaving)
  }, [isSaving, setIsSubmitLoading])

  useEffect(() => {
    setIsSubmitDisabled(!request || isSaving)
  }, [request, isSaving, setIsSubmitDisabled])

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
      if (!request || isSubmittingRef.current) return
      isSubmittingRef.current = true
      try {
        if (await save(request)) onSubmit(args)
      } finally {
        isSubmittingRef.current = false
      }
    },
    [request, save, onSubmit],
  )
}
