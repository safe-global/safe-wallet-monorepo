import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ReactElement, ReactNode, SyntheticEvent } from 'react'

import type { EthHashInfoProps } from '@/components/common/EthHashInfo/SrcEthHashInfo'
import TxCard, { TxCardActions } from '@/components/tx-flow/common/TxCard'
import InfoIcon from '@/public/images/notifications/info.svg'
import { TOOLTIP_TITLES } from '@/components/tx-flow/common/constants'

import { maybePlural } from '@safe-global/utils/utils/formatters'

export type SetThresholdViewProps = {
  onSubmit: (e: SyntheticEvent) => void
  removedOwnerAddress: string
  renderAddress: (props: EthHashInfoProps) => ReactNode
  selectedThreshold: number
  onThresholdChange: (value: number | null) => void
  optionCount: number
  newNumberOfOwners: number
  thresholdError?: string
}

export const SetThresholdView = ({
  onSubmit,
  removedOwnerAddress,
  renderAddress,
  selectedThreshold,
  onThresholdChange,
  optionCount,
  newNumberOfOwners,
  thresholdError,
}: SetThresholdViewProps): ReactElement => {
  return (
    <TxCard>
      <form onSubmit={onSubmit}>
        <div className="mb-6">
          <Typography className="mb-4">Review the signer you want to remove from the active Safe account:</Typography>

          {renderAddress({
            address: removedOwnerAddress,
            shortAddress: false,
            showCopyButton: true,
            hasExplorer: true,
          })}
        </div>

        <Separator bleed="6" />

        <div className="my-6">
          <Typography variant="h4" className="inline-flex items-center gap-1 font-bold">
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
          <Typography>Any transaction requires the confirmation of:</Typography>
          <div className="mt-4 flex flex-row items-center gap-2">
            <div>
              <Select value={selectedThreshold} onValueChange={onThresholdChange}>
                <SelectTrigger data-testid="threshold-selector">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: optionCount }).map((_, idx) => (
                    <SelectItem key={idx + 1} value={idx + 1}>
                      {idx + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Typography>
                out of {newNumberOfOwners} signer{maybePlural(newNumberOfOwners)}
              </Typography>
            </div>
          </div>
        </div>

        {thresholdError && <Typography className="mb-4 text-destructive">{thresholdError}</Typography>}

        <Separator bleed="6" />

        <TxCardActions>
          <Button data-testid="next-btn" type="submit" disabled={!!thresholdError}>
            Next
          </Button>
        </TxCardActions>
      </form>
    </TxCard>
  )
}
