import { useForm, FormProvider, useFieldArray, Controller } from 'react-hook-form'
import type { ReactElement } from 'react'

import TxCard from '../../common/TxCard'
import AddIcon from '@/public/images/common/add.svg'
import DeleteIcon from '@/public/images/common/delete.svg'
import { RecoverAccountFlowFields } from '.'
import AddressBookInput from '@/components/common/AddressBookInput'
import { useSafeShieldForAddressPoisoning } from '@/features/safe-shield/SafeShieldContext'
import { TOOLTIP_TITLES } from '../../common/constants'
import InfoIcon from '@/public/images/notifications/info.svg'
import useSafeInfo from '@/hooks/useSafeInfo'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { RecoverAccountFlowProps } from '.'
import { type AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/safes'

import commonCss from '@/components/tx-flow/common/styles.module.css'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function _isSameSetup({
  oldOwners,
  oldThreshold,
  newOwners,
  newThreshold,
}: {
  oldOwners: Array<AddressInfo>
  oldThreshold: number
  newOwners: Array<AddressInfo>
  newThreshold: number
}): boolean {
  if (oldThreshold !== newThreshold) {
    return false
  }

  if (oldOwners.length !== newOwners.length) {
    return false
  }

  return oldOwners.every((oldOwner) => {
    return newOwners.some((newOwner) => sameAddress(oldOwner.value, newOwner.value))
  })
}

export function RecoverAccountFlowSetup({
  params,
  onSubmit,
}: {
  params: RecoverAccountFlowProps
  onSubmit: (formData: RecoverAccountFlowProps) => void
}): ReactElement {
  const { safeAddress, safe } = useSafeInfo()

  const formMethods = useForm<RecoverAccountFlowProps>({
    defaultValues: params,
    mode: 'onChange',
  })

  const newOwners = formMethods.watch(RecoverAccountFlowFields.owners)

  // Copilot address-poisoning check for the recovery signers.
  useSafeShieldForAddressPoisoning(newOwners.map((owner) => owner.value))
  const newThreshold = formMethods.watch(RecoverAccountFlowFields.threshold)

  const { fields, append, remove } = useFieldArray({
    control: formMethods.control,
    name: RecoverAccountFlowFields.owners,
  })

  const isSameSetup = _isSameSetup({
    oldOwners: safe.owners,
    oldThreshold: safe.threshold,
    newOwners,
    newThreshold: Number(newThreshold),
  })

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={formMethods.handleSubmit(onSubmit)} className={commonCss.form}>
        <TxCard sx={{ mt: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
          <div>
            <Typography variant="h4" className="mb-2">
              Add signer(s)
            </Typography>

            <Typography variant="paragraph-small" className="mb-2 block">
              Set the new signer wallet(s) of this Safe account and how many need to confirm a transaction before it can
              be executed.
            </Typography>
          </div>

          <div className="flex flex-col gap-6">
            {fields.map((field, index) => (
              <div className="flex items-center gap-6" key={index}>
                <div className="flex-1">
                  <AddressBookInput
                    label={`Signer ${index + 1}`}
                    name={`${RecoverAccountFlowFields.owners}.${index}.value`}
                    required
                    fullWidth
                    key={field.id}
                    validate={(value) => {
                      if (sameAddress(value, safeAddress)) {
                        return 'The Safe account cannot own itself'
                      }

                      const isDuplicate = newOwners.filter((owner) => owner.value === value).length > 1
                      if (isDuplicate) {
                        return 'Already designated to be a signer'
                      }
                    }}
                  />
                </div>

                <div className="flex items-center justify-center">
                  {index > 0 && (
                    <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                      <DeleteIcon className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button variant="ghost" onClick={() => append({ value: '' })} className="my-2 self-start">
            <AddIcon className="size-4" />
            Add new signer
          </Button>

          <Separator className={commonCss.nestedDivider} />

          <div>
            <Typography variant="h4" className="mb-2">
              Threshold
              <Tooltip>
                <TooltipTrigger render={<span />}>
                  <InfoIcon className="ml-1 inline size-4 align-middle text-[var(--color-border-main)]" />
                </TooltipTrigger>
                <TooltipContent>{TOOLTIP_TITLES.THRESHOLD}</TooltipContent>
              </Tooltip>
            </Typography>

            <Typography variant="paragraph-small" className="mb-2 block">
              After recovery, Safe account transactions will require:
            </Typography>
          </div>

          <div className="mb-2 flex flex-row items-center gap-4">
            <div>
              <Controller
                control={formMethods.control}
                name={RecoverAccountFlowFields.threshold}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fields.map((_, index) => {
                        const value = index + 1
                        return (
                          <SelectItem key={index} value={String(value)}>
                            {value}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div>
              <Typography>
                out of {fields.length} signer{maybePlural(fields)}
              </Typography>
            </div>
          </div>

          {isSameSetup && (
            <Alert variant="destructive" className="border-0">
              <AlertDescription>The proposed Account setup is the same as the current one.</AlertDescription>
            </Alert>
          )}

          <Separator className={commonCss.nestedDivider} />

          <div className="mt-0 flex items-center">
            <Button data-testid="next-btn" variant="default" type="submit" className="mt-2" disabled={isSameSetup}>
              Next
            </Button>
          </div>
        </TxCard>
      </form>
    </FormProvider>
  )
}
