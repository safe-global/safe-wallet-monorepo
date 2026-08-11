import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ReactElement, SyntheticEvent } from 'react'

import EthHashInfo from '@/components/common/EthHashInfo'
import useSafeInfo from '@/hooks/useSafeInfo'
import TxCard from '../../common/TxCard'
import InfoIcon from '@/public/images/notifications/info.svg'
import { TOOLTIP_TITLES } from '@/components/tx-flow/common/constants'
import type { RemoveOwnerFlowProps } from '.'

import commonCss from '@/components/tx-flow/common/styles.module.css'
import { maybePlural } from '@safe-global/utils/utils/formatters'

export const SetThreshold = ({
  params,
  onSubmit,
}: {
  params: RemoveOwnerFlowProps
  onSubmit: (data: RemoveOwnerFlowProps) => void
}): ReactElement => {
  const { safe } = useSafeInfo()
  const [selectedThreshold, setSelectedThreshold] = useState<number>(params.threshold ?? 1)

  const handleChange = (value: number | null) => {
    if (value != null) setSelectedThreshold(value)
  }

  const onSubmitHandler = (e: SyntheticEvent) => {
    e.preventDefault()
    onSubmit({ ...params, threshold: selectedThreshold })
  }

  const newNumberOfOwners = safe ? safe.owners.length - 1 : 1

  return (
    <TxCard>
      <form onSubmit={onSubmitHandler}>
        <div className="mb-6">
          <Typography className="mb-4">Review the signer you want to remove from the active Safe account:</Typography>

          <EthHashInfo address={params.removedOwner.address} shortAddress={false} showCopyButton hasExplorer />
        </div>

        <Separator className={commonCss.nestedDivider} />

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
              <Select value={selectedThreshold} onValueChange={handleChange}>
                <SelectTrigger data-testid="threshold-selector">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {safe.owners.slice(1).map((_, idx) => (
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

        <Separator className={commonCss.nestedDivider} />

        <div className="flex items-center p-2">
          <Button data-testid="next-btn" type="submit">
            Next
          </Button>
        </div>
      </form>
    </TxCard>
  )
}
