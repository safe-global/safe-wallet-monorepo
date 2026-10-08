import type { ComponentProps, FormEventHandler, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type NameInput from '@/components/common/NameInput'
import type AddressBookInput from '@/components/common/AddressBookInput'
import type { EthHashInfoProps } from '@/components/common/EthHashInfo/SrcEthHashInfo'
import TxCard, { TxCardActions } from '@/components/tx-flow/common/TxCard'
import InfoIcon from '@/public/images/notifications/info.svg'
import commonCss from '@/components/tx-flow/common/styles.module.css'
import { TOOLTIP_TITLES } from '@/components/tx-flow/common/constants'
import { maybePlural } from '@safe-global/utils/utils/formatters'

export type ChooseOwnerThresholdSelectViewProps = {
  value: number
  onValueChange: (value: number | null) => void
  ownerCount: number
  newNumberOfOwners: number
  hasRemovedOwner: boolean
  hasError: boolean
}

export const ChooseOwnerThresholdSelectView = ({
  value,
  onValueChange,
  ownerCount,
  newNumberOfOwners,
  hasRemovedOwner,
  hasError,
}: ChooseOwnerThresholdSelectViewProps) => (
  <Select value={value} onValueChange={onValueChange}>
    <SelectTrigger data-testid="owner-number-dropdown" aria-invalid={hasError}>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {Array.from({ length: ownerCount }).map((_, idx) => (
        <SelectItem key={idx + 1} value={idx + 1}>
          {idx + 1}
        </SelectItem>
      ))}
      {!hasRemovedOwner && (
        <SelectItem key={newNumberOfOwners} value={newNumberOfOwners}>
          {newNumberOfOwners}
        </SelectItem>
      )}
    </SelectContent>
  </Select>
)

export type ChooseOwnerViewProps = {
  onSubmit: FormEventHandler<HTMLFormElement>
  removedOwner?: { address: string }
  fallbackName?: string
  resolving: boolean
  showThreshold: boolean
  thresholdSelect: ReactNode
  newNumberOfOwners: number
  thresholdError?: string
  isValid: boolean
  renderAddress: (props: EthHashInfoProps) => ReactNode
  renderNameInput: (props: ComponentProps<typeof NameInput>) => ReactNode
  renderAddressInput: (props: Pick<ComponentProps<typeof AddressBookInput>, 'name' | 'label' | 'required'>) => ReactNode
}

export const ChooseOwnerView = ({
  onSubmit,
  removedOwner,
  fallbackName,
  resolving,
  showThreshold,
  thresholdSelect,
  newNumberOfOwners,
  thresholdError,
  isValid,
  renderAddress,
  renderNameInput,
  renderAddressInput,
}: ChooseOwnerViewProps) => {
  return (
    <TxCard>
      <form onSubmit={onSubmit} className={commonCss.form}>
        {removedOwner && (
          <>
            <Typography variant="paragraph-small" className="block mb-2">
              {removedOwner &&
                'Review the signer you want to replace in the active Safe account, then specify the new signer you want to replace it with:'}
            </Typography>
            <div className="my-6">
              <Typography variant="paragraph-small" className="block mb-2 text-muted-foreground">
                Current signer
              </Typography>
              {renderAddress({
                address: removedOwner.address,
                showCopyButton: true,
                shortAddress: false,
                hasExplorer: true,
              })}
            </div>
          </>
        )}

        <div className="mb-7 w-full">
          {renderNameInput({
            inputSize: 'hero',
            label: 'New signer',
            name: 'newOwner.name',
            placeholder: fallbackName || 'Signer name',
            InputLabelProps: { shrink: true },
            InputProps: {
              endAdornment: resolving && <Spinner className="size-5" />,
            },
          })}
        </div>

        <div className="mb-7 w-full">
          {renderAddressInput({ name: 'newOwner.address', label: 'Signer address or ENS', required: true })}
        </div>

        <Separator bleed="6" />

        {showThreshold && (
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
              <div>{thresholdSelect}</div>
              <div>
                <Typography>
                  out of {newNumberOfOwners} signer{maybePlural(newNumberOfOwners)}
                </Typography>
              </div>
            </div>
          </div>
        )}

        {/* Outside the threshold block on purpose: Replace signer has no
            threshold selector, so the gate below must never be silent. */}
        {thresholdError && <Typography className="mb-2 text-destructive">{thresholdError}</Typography>}

        <Separator bleed="6" />

        <TxCardActions>
          <Button data-testid="add-owner-next-btn" type="submit" disabled={!isValid || resolving || !!thresholdError}>
            Next
          </Button>
        </TxCardActions>
      </form>
    </TxCard>
  )
}
