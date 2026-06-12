import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Controller, FormProvider } from 'react-hook-form'
import { useContext } from 'react'
import type { ReactElement } from 'react'

import AddIcon from '@/public/images/common/add.svg'
import InfoIcon from '@/public/images/notifications/info.svg'
import commonCss from '@/components/tx-flow/common/styles.module.css'
import TxCard from '../../common/TxCard'
import OwnerRow from '@/components/new-safe/OwnerRow'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import { ManageSignersFormFields } from '.'
import { TxFlowContext } from '../../TxFlowProvider'
import { SETTINGS_EVENTS, SETTINGS_LABELS, trackEvent } from '@/services/analytics'
import Track from '@/components/common/Track'
import type { TxFlowContextType } from '../../TxFlowProvider'
import type { ManageSignersForm } from '.'
import type { UseFormReturn, UseFieldArrayReturn } from 'react-hook-form'

type Props = {
  formMethods: UseFormReturn<ManageSignersForm>
  fieldArray: UseFieldArrayReturn<ManageSignersForm, 'owners'>
  newOwners: ManageSignersForm['owners']
  isSameSetup: boolean
  onRemove: (index: number) => void
  onAdd: () => void
}

export function SignersStructureView(props: Props): ReactElement {
  const { onNext } = useContext<TxFlowContextType<ManageSignersForm>>(TxFlowContext)

  return (
    <TxCard>
      <FormProvider {...props.formMethods}>
        <form onSubmit={props.formMethods.handleSubmit(onNext)} className={commonCss.form}>
          <Signers {...props} />

          <Separator className={commonCss.nestedDivider} />

          <Threshold {...props} />

          <Separator className={commonCss.nestedDivider} />

          <div className="flex items-center p-2">
            <Button
              data-testId="submit-next"
              type="submit"
              disabled={props.isSameSetup || !props.formMethods.formState.isValid}
            >
              Next
            </Button>
          </div>
        </form>
      </FormProvider>
    </TxCard>
  )
}

function Signers({
  fieldArray,
  onRemove: _onRemove,
  onAdd,
}: Pick<Props, 'fieldArray' | 'onAdd' | 'onRemove'>): ReactElement {
  const onRemove = (index: number) => {
    _onRemove(index)
    trackEvent({ ...SETTINGS_EVENTS.SETUP.REMOVE_OWNER, label: SETTINGS_LABELS.manage_signers })
  }

  return (
    <>
      {fieldArray.fields.map((field, index) => (
        <OwnerRow
          key={field.id}
          index={index}
          groupName={ManageSignersFormFields.owners}
          removable={fieldArray.fields.length > 1}
          remove={onRemove}
        />
      ))}

      <Track {...SETTINGS_EVENTS.SETUP.ADD_OWNER} label={SETTINGS_LABELS.manage_signers}>
        <Button
          data-testid="add-new-signer"
          variant="ghost"
          onClick={onAdd}
          size="lg"
          className="-mt-2 mb-6 self-start"
        >
          <AddIcon className="size-4" />
          Add new signer
        </Button>
      </Track>
    </>
  )
}

function Threshold({ formMethods, newOwners }: Pick<Props, 'formMethods' | 'newOwners'>): ReactElement {
  return (
    <div className="my-6">
      <Typography variant="h4" className="inline-flex items-center gap-2 font-bold">
        Threshold
        <Tooltip>
          <TooltipTrigger
            render={
              <span className="flex text-[var(--color-border-main)]">
                <InfoIcon className="size-4" />
              </span>
            }
          />
          <TooltipContent>
            The threshold of a Safe Account specifies how many signers need to confirm a Safe Account transaction before
            it can be executed.
          </TooltipContent>
        </Tooltip>
      </Typography>

      <Typography variant="paragraph-small" className="mb-4 block">
        Any transaction requires the confirmation of:
      </Typography>

      <div className="flex flex-row items-center gap-4 pt-2">
        <div>
          <Controller
            control={formMethods.control}
            name="threshold"
            render={({ field }) => {
              const onChange = (value: number | null) => {
                if (value == null) return
                field.onChange(value)
                trackEvent({ ...SETTINGS_EVENTS.SETUP.CHANGE_THRESHOLD, label: SETTINGS_LABELS.manage_signers })
              }

              return (
                <Select value={field.value} onValueChange={onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {newOwners.map((_, index) => (
                      <SelectItem key={index + 1} value={index + 1}>
                        {index + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )
            }}
          />
        </div>
        <div>
          <Typography>
            out of {newOwners.length} signer{maybePlural(newOwners)}
          </Typography>
        </div>
      </div>
    </div>
  )
}
