import type { ComponentProps, FormEventHandler, ReactElement, ReactNode } from 'react'

import TxCard, { TxCardActions } from '@/components/tx-flow/common/TxCard'
import AddIcon from '@/public/images/common/add.svg'
import DeleteIcon from '@/public/images/common/delete.svg'
import type AddressBookInput from '@/components/common/AddressBookInput'
import { TOOLTIP_TITLES } from '@/components/tx-flow/common/constants'
import InfoIcon from '@/public/images/notifications/info.svg'

import commonCss from '@/components/tx-flow/common/styles.module.css'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type RecoverAccountThresholdSelectViewProps = {
  value: string
  onValueChange: (value: string | null) => void
  signerCount: number
  hasError: boolean
}

export function RecoverAccountThresholdSelectView({
  value,
  onValueChange,
  signerCount,
  hasError,
}: RecoverAccountThresholdSelectViewProps): ReactElement {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger aria-invalid={hasError} data-testid="recovery-threshold-select">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Array.from({ length: signerCount }).map((_, index) => {
          const value = index + 1
          return (
            <SelectItem key={index} value={String(value)}>
              {value}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}

export type RecoverAccountFlowSetupViewProps = {
  onSubmit: FormEventHandler<HTMLFormElement>
  signerCount: number
  renderSignerInput: (
    index: number,
    props: Pick<ComponentProps<typeof AddressBookInput>, 'label' | 'required' | 'fullWidth'>,
  ) => ReactNode
  onRemoveSigner: (index: number) => void
  onAddSigner: () => void
  thresholdSelect: ReactNode
  thresholdError?: string
  isSameSetup: boolean
}

export function RecoverAccountFlowSetupView({
  onSubmit,
  signerCount,
  renderSignerInput,
  onRemoveSigner,
  onAddSigner,
  thresholdSelect,
  thresholdError,
  isSameSetup,
}: RecoverAccountFlowSetupViewProps): ReactElement {
  return (
    <form onSubmit={onSubmit} className={commonCss.form}>
      <TxCard>
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
          {Array.from({ length: signerCount }).map((_, index) => (
            <div className="flex items-center gap-6" key={index}>
              <div className="flex-1">
                {renderSignerInput(index, { label: `Signer ${index + 1}`, required: true, fullWidth: true })}
              </div>

              <div className="flex items-center justify-center">
                {index > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    data-testid="remove-signer-btn"
                    onClick={() => onRemoveSigner(index)}
                  >
                    <DeleteIcon className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <Button variant="ghost" onClick={onAddSigner} className="my-2 self-start">
          <AddIcon className="size-4" />
          Add new signer
        </Button>

        <Separator bleed="6" />

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
          <div>{thresholdSelect}</div>

          <div>
            <Typography>
              out of {signerCount} signer{maybePlural(signerCount)}
            </Typography>
          </div>
        </div>

        {thresholdError && <Typography className="mb-2 text-destructive">{thresholdError}</Typography>}

        {isSameSetup && (
          <Alert variant="destructive" className="border-0">
            <AlertSeverityIcon variant="destructive" />
            <AlertDescription>The proposed Account setup is the same as the current one.</AlertDescription>
          </Alert>
        )}

        <Separator bleed="6" />

        <TxCardActions className="!mt-0">
          <Button
            data-testid="next-btn"
            variant="default"
            type="submit"
            className="mt-2"
            disabled={isSameSetup || !!thresholdError}
          >
            Next
          </Button>
        </TxCardActions>
      </TxCard>
    </form>
  )
}
