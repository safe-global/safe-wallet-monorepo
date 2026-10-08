import { Controller, useForm } from 'react-hook-form'
import { useContext, useEffect } from 'react'
import useSafeInfo from '@/hooks/useSafeInfo'
import { ChangeThresholdFlowFieldNames } from '@/components/tx-flow/flows/ChangeThreshold'
import { validateThreshold } from '@safe-global/utils/utils/validation'
import type { ChangeThresholdFlowProps } from '@/components/tx-flow/flows/ChangeThreshold'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { createUpdateThresholdTx } from '@/services/tx/tx-sender'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import {
  ChooseThresholdFieldView,
  ChooseThresholdView,
} from '@views/components/tx-flow/flows/ChangeThreshold/ChooseThresholdView'

export const ChooseThreshold = () => {
  const { onNext, data } = useContext(TxFlowContext)
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  const { safe, safeLoaded } = useSafeInfo()

  const formMethods = useForm<ChangeThresholdFlowProps>({
    defaultValues: data,
    mode: 'onChange',
  })

  const newThreshold = formMethods.watch(ChangeThresholdFlowFieldNames.threshold)

  // Derived rather than read from RHF: the owner set can change on-chain while
  // the flow is open, which does not re-run the field's validation. Skipped
  // until the Safe is loaded, when the owner list is still empty.
  const boundsError = safeLoaded ? validateThreshold(newThreshold, safe.owners.length) : undefined

  useEffect(() => {
    createUpdateThresholdTx(newThreshold).then(setSafeTx).catch(setSafeTxError)
  }, [newThreshold, setSafeTx, setSafeTxError])

  return (
    <ChooseThresholdView
      onSubmit={formMethods.handleSubmit(onNext)}
      thresholdField={
        <Controller
          control={formMethods.control}
          rules={{
            validate: (value) => {
              if (value === safe.threshold) {
                return `Current policy is already set to ${safe.threshold}.`
              }
              return validateThreshold(value, safe.owners.length)
            },
          }}
          name={ChangeThresholdFlowFieldNames.threshold}
          render={({ field, fieldState }) => (
            <ChooseThresholdFieldView
              value={field.value}
              onValueChange={field.onChange}
              ownerCount={safe.owners.length}
              threshold={safe.threshold}
              error={fieldState.error?.message ?? boundsError}
              isDirty={fieldState.isDirty}
            />
          )}
        />
      }
      nextDisabled={
        !!formMethods.formState.errors[ChangeThresholdFlowFieldNames.threshold] ||
        !!boundsError ||
        // Prevent initial submit before field was interacted with
        newThreshold === safe.threshold
      }
    />
  )
}
