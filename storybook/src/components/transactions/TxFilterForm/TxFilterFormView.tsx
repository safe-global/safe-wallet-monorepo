import type { FormEventHandler, ReactElement, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import type { NumberFieldViewProps } from '@/components/common/NumberField/NumberFieldView'

import css from './styles.module.css'

export type FilterTypeField = {
  value: string
  onChange: (value: string) => void
  onBlur: () => void
}

export type NumberFieldRenderProps = {
  inputSize: NumberFieldViewProps['inputSize']
  variant: NumberFieldViewProps['variant']
  getLabel: (errorMessage?: string) => string
}

type DateFieldRender = (props: { label: string; invalidMessage: string }) => ReactNode
type AddressFieldRender = (props: { label: string }) => ReactNode

export type TxFilterFormViewProps = {
  onSubmit: FormEventHandler<HTMLFormElement>
  filterTypes: string[]
  renderFilterTypeField: (render: (field: FilterTypeField) => ReactElement) => ReactNode
  isIncomingFilter: boolean
  isMultisigFilter: boolean
  isModuleFilter: boolean
  nativeCurrencySymbol?: string
  renderFromDate: DateFieldRender
  renderToDate: DateFieldRender
  renderAmountField: (props: NumberFieldRenderProps) => ReactNode
  renderTokenInput: AddressFieldRender
  renderRecipientInput: AddressFieldRender
  renderNonceField: (props: NumberFieldRenderProps) => ReactNode
  renderModuleInput: AddressFieldRender
  canClear: boolean
  isValid: boolean
  onClear: () => void
}

export const TxFilterFormView = ({
  onSubmit,
  filterTypes,
  renderFilterTypeField,
  isIncomingFilter,
  isMultisigFilter,
  isModuleFilter,
  nativeCurrencySymbol,
  renderFromDate,
  renderToDate,
  renderAmountField,
  renderTokenInput,
  renderRecipientInput,
  renderNonceField,
  renderModuleInput,
  canClear,
  isValid,
  onClear,
}: TxFilterFormViewProps): ReactElement => {
  return (
    <div className={css.filterWrapper}>
      <form onSubmit={onSubmit}>
        <div data-testid="filter-modal" className="flex min-w-0 flex-col md:min-h-[320px] md:flex-row">
          <div className="w-full shrink-0 p-6 md:w-[220px] md:p-8">
            <div className="flex w-full flex-col">
              <Label className={css.filterSectionTitle}>Transaction type</Label>
              {renderFilterTypeField((field) => (
                <RadioGroup value={field.value} onValueChange={field.onChange} onBlur={field.onBlur} className="gap-4">
                  {filterTypes.map((value) => (
                    <div key={value} className={css.radioOption}>
                      <RadioGroupItem value={value} id={`filter-type-${value}`} />
                      <Label htmlFor={`filter-type-${value}`} className="font-normal">
                        {value}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ))}
            </div>
          </div>

          <Separator orientation="vertical" className="hidden md:block md:self-stretch" />

          <div className="w-full min-w-0 flex-1 p-6 md:p-8">
            <div className="flex w-full flex-col">
              <Label className={css.filterSectionTitle}>Parameters</Label>
              <div className="flex flex-col gap-4">
                {!isModuleFilter && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className={css.paramField} data-testid="start-date">
                      {renderFromDate({ label: 'From', invalidMessage: 'Must be before "To" date' })}
                    </div>
                    <div className={css.paramField} data-testid="end-date">
                      {renderToDate({ label: 'To', invalidMessage: 'Must be after "From" date' })}
                    </div>
                  </div>
                )}

                {!isModuleFilter && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className={css.paramField}>
                      {renderAmountField({
                        inputSize: 'hero',
                        variant: 'surface',
                        getLabel: (errorMessage) =>
                          errorMessage ||
                          (isIncomingFilter ? 'Amount' : `Amount (only ${nativeCurrencySymbol || 'ETH'})`),
                      })}
                    </div>

                    {isIncomingFilter && (
                      <div className={css.paramField}>{renderTokenInput({ label: 'Token address' })}</div>
                    )}

                    {isMultisigFilter && (
                      <div className={css.paramField}>{renderRecipientInput({ label: 'Recipient' })}</div>
                    )}
                  </div>
                )}

                {isMultisigFilter && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className={css.paramField}>
                      {renderNonceField({
                        inputSize: 'hero',
                        variant: 'surface',
                        getLabel: (errorMessage) => errorMessage || 'Nonce',
                      })}
                    </div>
                  </div>
                )}

                {isModuleFilter && <div className={css.paramField}>{renderModuleInput({ label: 'Module' })}</div>}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button data-testid="clear-btn" type="button" variant="ghost" onClick={onClear} disabled={!canClear}>
                Clear
              </Button>
              <Button data-testid="apply-btn" type="submit" disabled={!isValid}>
                Apply
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
