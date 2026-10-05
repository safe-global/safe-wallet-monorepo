import type { ReactElement } from 'react'
import { ComboboxItem } from '@/components/ui/combobox'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { TokenOption } from '../utils/tokenOptions'
import TokenOptionRow from './TokenOptionRow'

/** Listed and searchable but not selectable; hovering it shows why. */
const DisabledTokenOption = ({ option, reason }: { option: TokenOption; reason?: string }): ReactElement => (
  <Tooltip>
    <TooltipTrigger
      render={
        <ComboboxItem
          value={option}
          disabled
          // The primitive drops pointer events on disabled items, which would keep the tooltip shut.
          className="data-[disabled]:pointer-events-auto"
          data-testid="token-option"
        />
      }
    >
      <TokenOptionRow option={option} />
    </TooltipTrigger>
    <TooltipContent>{reason}</TooltipContent>
  </Tooltip>
)

export default DisabledTokenOption
