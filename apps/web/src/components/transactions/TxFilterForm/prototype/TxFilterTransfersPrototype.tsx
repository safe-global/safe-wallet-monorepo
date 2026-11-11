import { Button } from '@safe-global/views/components/ui/button'
import { Separator } from '@safe-global/views/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@safe-global/views/components/ui/radio-group'
import { Label } from '@safe-global/views/components/ui/label'
import { Switch } from '@safe-global/views/components/ui/switch'
import { Field, FieldContent, FieldDescription, FieldLabel } from '@safe-global/views/components/ui/field'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import type { ReactElement } from 'react'

import AddressBookInput from '@/components/common/AddressBookInput'
import AddressInput from '@/components/common/AddressInput'
import DatePickerInput from '@/components/common/DatePickerInput'
import NumberField from '@/components/common/NumberField'
import { TxFilterType } from '@/utils/tx-history-filter'

import css from '../styles.module.css'

export type TxFilterTransfersPrototypeValues = {
  transfers: boolean
  execution_date__gte: Date | null
  execution_date__lte: Date | null
  to: string
  value: string
  token_address: string
  nonce: string
}

const emptyValues: TxFilterTransfersPrototypeValues = {
  transfers: false,
  execution_date__gte: null,
  execution_date__lte: null,
  to: '',
  value: '',
  token_address: '',
  nonce: '',
}

const TRANSFERS_SWITCH_ID = 'filter-transfers-only'

const TxFilterTransfersPrototype = ({
  initialValues,
}: {
  initialValues?: Partial<TxFilterTransfersPrototypeValues>
}): ReactElement => {
  const formMethods = useForm<TxFilterTransfersPrototypeValues>({
    mode: 'onChange',
    shouldUnregister: true,
    defaultValues: { ...emptyValues, ...initialValues },
  })
  const { control, watch } = formMethods
  const isTransfersOnly = watch('transfers')

  return (
    <div className="w-[min(720px,calc(100vw-2rem))] rounded-xl border border-border bg-card shadow-md">
      <FormProvider {...formMethods}>
        <form onSubmit={(event) => event.preventDefault()}>
          <div className="flex min-w-0 flex-col md:min-h-[320px] md:flex-row">
            <div className="w-full shrink-0 p-6 md:w-[220px] md:p-8">
              <div className="flex w-full flex-col">
                <Label className={css.filterSectionTitle}>Transaction type</Label>
                <RadioGroup value={TxFilterType.MULTISIG} className="gap-4">
                  {Object.values(TxFilterType).map((value) => (
                    <div key={value} className={css.radioOption}>
                      <RadioGroupItem value={value} id={`prototype-filter-type-${value}`} aria-label={value} />
                      <Label htmlFor={`prototype-filter-type-${value}`} className="font-normal">
                        {value}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>

            <Separator orientation="vertical" className="hidden md:block md:self-stretch" />

            <div className="w-full min-w-0 flex-1 p-6 md:p-8">
              <div className="flex w-full flex-col">
                <Label className={css.filterSectionTitle}>Parameters</Label>
                <div className="flex flex-col gap-4">
                  <Controller
                    name="transfers"
                    control={control}
                    render={({ field }) => (
                      <Field orientation="horizontal">
                        <Switch id={TRANSFERS_SWITCH_ID} checked={field.value} onCheckedChange={field.onChange} />
                        <FieldContent>
                          <FieldLabel htmlFor={TRANSFERS_SWITCH_ID}>Transfers only</FieldLabel>
                          <FieldDescription>
                            Find payments by who received them, including those sent in a batch
                          </FieldDescription>
                        </FieldContent>
                      </Field>
                    )}
                  />

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className={css.paramField}>
                      <DatePickerInput name="execution_date__gte" label="From" />
                    </div>
                    <div className={css.paramField}>
                      <DatePickerInput name="execution_date__lte" label="To" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {!isTransfersOnly && (
                      <div className={css.paramField}>
                        <Controller
                          name="value"
                          control={control}
                          render={({ field }) => (
                            <NumberField
                              inputSize="hero"
                              variant="surface"
                              label="Amount (only ETH)"
                              {...field}
                              fullWidth
                            />
                          )}
                        />
                      </div>
                    )}

                    <div className={css.paramField}>
                      <AddressBookInput label="Recipient" name="to" required={false} fullWidth />
                    </div>

                    {isTransfersOnly && (
                      <div className={css.paramField}>
                        <AddressInput label="Token address" name="token_address" required={false} fullWidth />
                      </div>
                    )}
                  </div>

                  {!isTransfersOnly && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className={css.paramField}>
                        <Controller
                          name="nonce"
                          control={control}
                          render={({ field }) => (
                            <NumberField inputSize="hero" variant="surface" label="Nonce" {...field} fullWidth />
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button type="button" variant="ghost">
                  Clear
                </Button>
                <Button type="submit">Apply</Button>
              </div>
            </div>
          </div>
        </form>
      </FormProvider>
    </div>
  )
}

export default TxFilterTransfersPrototype
