import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import WarningIcon from '@/public/images/notifications/warning.svg'

const MaliciousTxWarning = ({ withTooltip = true }: { withTooltip?: boolean }) => {
  const icon = (
    <div className="leading-4">
      <WarningIcon className="size-4 text-[var(--color-warning-main)]" />
    </div>
  )

  return withTooltip ? (
    <Tooltip>
      <TooltipTrigger render={icon} />
      <TooltipContent>
        This token isn’t verified on major token lists and may pose risks when interacting with it or involved addresses
      </TooltipContent>
    </Tooltip>
  ) : (
    icon
  )
}

export default MaliciousTxWarning
