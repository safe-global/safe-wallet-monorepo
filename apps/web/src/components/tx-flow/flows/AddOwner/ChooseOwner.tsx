import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useForm, FormProvider, Controller } from 'react-hook-form'

import AddressBookInput from '@/components/common/AddressBookInput'
import { useSafeShieldForAddressPoisoning } from '@/features/safe-shield/SafeShieldContext'
import NameInput from '@/components/common/NameInput'
import { useAddressResolver } from '@/hooks/useAddressResolver'
import useSafeInfo from '@/hooks/useSafeInfo'
import { uniqueAddress, addressIsNotCurrentSafe } from '@safe-global/utils/utils/validation'
import type { AddOwnerFlowProps } from '.'
import type { ReplaceOwnerFlowProps } from '../ReplaceOwner'
import TxCard from '../../common/TxCard'
import InfoIcon from '@/public/images/notifications/info.svg'
import commonCss from '@/components/tx-flow/common/styles.module.css'
import { TOOLTIP_TITLES } from '@/components/tx-flow/common/constants'
import EthHashInfo from '@/components/common/EthHashInfo'
import { maybePlural } from '@safe-global/utils/utils/formatters'

type FormData = Pick<AddOwnerFlowProps | ReplaceOwnerFlowProps, 'newOwner' | 'threshold'>

export enum ChooseOwnerMode {
  REPLACE,
  ADD,
}

export const ChooseOwner = ({
  params,
  onSubmit,
  mode,
}: {
  params: AddOwnerFlowProps | ReplaceOwnerFlowProps
  onSubmit: (data: FormData) => void
  mode: ChooseOwnerMode
}) => {
  const { safe, safeAddress } = useSafeInfo()

  const formMethods = useForm<FormData>({
    defaultValues: params,
    mode: 'onChange',
  })
  const { handleSubmit, formState, watch, control } = formMethods
  const isValid = Object.keys(formState.errors).length === 0 // do not use formState.isValid because names can be empty

  const notAlreadyOwner = uniqueAddress(safe.owners.map((owner) => owner.value))
  const notCurrentSafe = addressIsNotCurrentSafe(safeAddress)
  const combinedValidate = (address: string) => notAlreadyOwner(address) || notCurrentSafe(address)

  const address = watch('newOwner.address')

  // Copilot address-poisoning check for the new owner (poisoning-only entry in the recipient card)
  useSafeShieldForAddressPoisoning([address])

  const { name, ens, resolving } = useAddressResolver(address)

  // Address book, ENS
  const fallbackName = name || ens

  const onFormSubmit = handleSubmit((formData: FormData) => {
    onSubmit({
      ...formData,
      newOwner: {
        ...formData.newOwner,
        name: formData.newOwner.name || fallbackName,
      },
      threshold: formData.threshold,
    })
  })

  const newNumberOfOwners = safe.owners.length + (!params.removedOwner ? 1 : 0)

  return (
    <TxCard>
      <FormProvider {...formMethods}>
        <form onSubmit={onFormSubmit} className={commonCss.form}>
          {params.removedOwner && (
            <>
              <Typography variant="paragraph-small" className="block mb-2">
                {params.removedOwner &&
                  'Review the signer you want to replace in the active Safe account, then specify the new signer you want to replace it with:'}
              </Typography>
              <div className="my-6">
                <Typography variant="paragraph-small" className="block mb-2 text-muted-foreground">
                  Current signer
                </Typography>
                <EthHashInfo address={params.removedOwner.address} showCopyButton shortAddress={false} hasExplorer />
              </div>
            </>
          )}

          <div className="mb-7 w-full">
            <NameInput
              label="New signer"
              name="newOwner.name"
              placeholder={fallbackName || 'Signer name'}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                endAdornment: resolving && <Spinner className="size-5" />,
              }}
            />
          </div>

          <div className="mb-7 w-full">
            <AddressBookInput
              name="newOwner.address"
              label="Signer address or ENS"
              validate={combinedValidate}
              required
            />
          </div>

          <Separator className={commonCss.nestedDivider} />

          {mode === ChooseOwnerMode.ADD && (
            <div className="mb-7 w-full">
              <Typography variant="h4" className="mt-6 inline-flex items-center gap-1 font-bold">
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

              <Typography variant="paragraph-small" className="mb-2 block">
                Any transaction requires the confirmation of:
              </Typography>

              <div className="flex flex-row items-center gap-4 pt-2">
                <div>
                  <Controller
                    control={control}
                    name="threshold"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger data-testid="owner-number-dropdown">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {safe.owners.map((_, idx) => (
                            <SelectItem key={idx + 1} value={idx + 1}>
                              {idx + 1}
                            </SelectItem>
                          ))}
                          {!params.removedOwner && (
                            <SelectItem key={newNumberOfOwners} value={newNumberOfOwners}>
                              {newNumberOfOwners}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div>
                  <Typography>
                    out of {newNumberOfOwners} signer{maybePlural(newNumberOfOwners)}
                  </Typography>
                </div>
              </div>
            </div>
          )}

          <Separator className={commonCss.nestedDivider} />

          <div className="flex items-center p-2">
            <Button data-testid="add-owner-next-btn" type="submit" disabled={!isValid || resolving}>
              Next
            </Button>
          </div>
        </form>
      </FormProvider>
    </TxCard>
  )
}
