import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { FormEventHandler, ReactElement, ReactNode } from 'react'

import AddIcon from '@/public/images/common/add.svg'
import InfoIcon from '@/public/images/notifications/info.svg'
import commonCss from '@/components/tx-flow/common/styles.module.css'
import TxCard, { TxCardActions } from '@/components/tx-flow/common/TxCard'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import { SETTINGS_EVENTS, SETTINGS_LABELS } from '@/services/analytics/events/settings'
import Track from '@/components/common/Track'

export type SignersThresholdSelectViewProps = {
  value: number
  onValueChange: (value: number | null) => void
  ownerCount: number
}

export function SignersThresholdSelectView({
  value,
  onValueChange,
  ownerCount,
}: SignersThresholdSelectViewProps): ReactElement {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger data-testid="threshold-selector">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Array.from({ length: ownerCount }).map((_, index) => (
          <SelectItem key={index + 1} value={index + 1}>
            {index + 1}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export type SignersStructureViewViewProps = {
  onSubmit: FormEventHandler<HTMLFormElement>
  signerRows: ReactNode
  onAdd: () => void
  thresholdSelect: ReactNode
  ownerCount: number
  nextDisabled: boolean
}

export function SignersStructureViewView({
  onSubmit,
  signerRows,
  onAdd,
  thresholdSelect,
  ownerCount,
  nextDisabled,
}: SignersStructureViewViewProps): ReactElement {
  return (
    <TxCard>
      <form onSubmit={onSubmit} className={commonCss.form}>
        <>
          {signerRows}

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

        <Separator bleed="6" />

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
                The threshold of a Safe account specifies how many signers need to confirm a Safe account transaction
                before it can be executed.
              </TooltipContent>
            </Tooltip>
          </Typography>

          <Typography variant="paragraph-small" className="mb-4 block">
            Any transaction requires the confirmation of:
          </Typography>

          <div className="flex flex-row items-center gap-4 pt-2">
            <div>{thresholdSelect}</div>
            <div>
              <Typography>
                out of {ownerCount} signer{maybePlural(ownerCount)}
              </Typography>
            </div>
          </div>
        </div>

        <Separator bleed="6" />

        <TxCardActions>
          <Button data-testId="submit-next" type="submit" disabled={nextDisabled}>
            Next
          </Button>
        </TxCardActions>
      </form>
    </TxCard>
  )
}
