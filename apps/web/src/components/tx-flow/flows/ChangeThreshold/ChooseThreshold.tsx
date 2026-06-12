import { Controller, useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useContext, useEffect } from 'react'
import useSafeInfo from '@/hooks/useSafeInfo'
import TxCard from '@/components/tx-flow/common/TxCard'
import { ChangeThresholdFlowFieldNames } from '@/components/tx-flow/flows/ChangeThreshold'
import type { ChangeThresholdFlowProps } from '@/components/tx-flow/flows/ChangeThreshold'
import InfoIcon from '@/public/images/notifications/info.svg'
import { TOOLTIP_TITLES } from '@/components/tx-flow/common/constants'
import commonCss from '@/components/tx-flow/common/styles.module.css'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { createUpdateThresholdTx } from '@/services/tx/tx-sender'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'

export const ChooseThreshold = () => {
  const { onNext, data } = useContext(TxFlowContext)
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  const { safe } = useSafeInfo()

  const formMethods = useForm<ChangeThresholdFlowProps>({
    defaultValues: data,
    mode: 'onChange',
  })

  const newThreshold = formMethods.watch(ChangeThresholdFlowFieldNames.threshold)

  useEffect(() => {
    createUpdateThresholdTx(newThreshold).then(setSafeTx).catch(setSafeTxError)
  }, [newThreshold, setSafeTx, setSafeTxError])

  return (
    <TxCard>
      <div>
        <Typography variant="h3" className="inline-flex items-center gap-1 font-bold">
          Threshold
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="flex text-[var(--color-border-main)]">
                  <InfoIcon className="size-4" />
                </span>
              }
            />
            <TooltipContent>{TOOLTIP_TITLES.THRESHOLD}</TooltipContent>
          </Tooltip>
        </Typography>

        <Typography>Any transaction will require the confirmation of:</Typography>
      </div>
      <form onSubmit={formMethods.handleSubmit(onNext)}>
        <div className="mb-4">
          <Controller
            control={formMethods.control}
            rules={{
              validate: (value) => {
                if (value === safe.threshold) {
                  return `Current policy is already set to ${safe.threshold}.`
                }
              },
            }}
            name={ChangeThresholdFlowFieldNames.threshold}
            render={({ field, fieldState }) => {
              const isError = !!fieldState.error

              return (
                <div className="flex flex-row flex-wrap items-center gap-4">
                  <div>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-invalid={isError}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {safe.owners.map((_, idx) => (
                          <SelectItem data-testid="threshold-item" key={idx + 1} value={idx + 1}>
                            {idx + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Typography>
                      out of {safe.owners.length} signer{maybePlural(safe.owners)}
                    </Typography>
                  </div>
                  <div className="w-full">
                    {isError ? (
                      <Typography className="mb-4 text-destructive">{fieldState.error?.message}</Typography>
                    ) : (
                      <Typography className="mb-4">
                        {fieldState.isDirty ? 'Previous policy was ' : 'Current policy is '}
                        <b>
                          {safe.threshold} out of {safe.owners.length}
                        </b>
                        .
                      </Typography>
                    )}
                  </div>
                </div>
              )
            }}
          />
        </div>

        <Separator className={commonCss.nestedDivider} />

        <div className="flex items-center p-2">
          <Button
            data-testid="threshold-next-btn"
            type="submit"
            disabled={
              !!formMethods.formState.errors[ChangeThresholdFlowFieldNames.threshold] ||
              // Prevent initial submit before field was interacted with
              newThreshold === safe.threshold
            }
          >
            Next
          </Button>
        </div>
      </form>
    </TxCard>
  )
}
