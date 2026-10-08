import type { ReactElement, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import { Rocket } from 'lucide-react'

export type ActivateAccountButtonViewProps = {
  isProcessing: boolean
  onActivate: () => void
  checkWallet: (render: (isOk: boolean) => ReactElement) => ReactNode
}

export const ActivateAccountButtonView = ({
  isProcessing,
  onActivate,
  checkWallet,
}: ActivateAccountButtonViewProps) => {
  return (
    <Tooltip>
      <TooltipTrigger render={<span />}>
        {checkWallet((isOk) => (
          <Button
            data-testid="activate-account-btn-cf"
            size="default"
            onClick={onActivate}
            disabled={isProcessing || !isOk}
            className="w-full group-data-[collapsible=icon]:!min-w-9 group-data-[collapsible=icon]:!w-9 group-data-[collapsible=icon]:!px-0"
          >
            {isProcessing ? (
              <>
                <Typography variant="paragraph-small" className="mr-2 group-data-[collapsible=icon]:hidden">
                  Processing
                </Typography>
                <Spinner className="size-4" />
              </>
            ) : (
              <>
                <Rocket className="hidden size-4 shrink-0 group-data-[collapsible=icon]:block" />
                <span className="group-data-[collapsible=icon]:hidden">Activate now</span>
              </>
            )}
          </Button>
        ))}
      </TooltipTrigger>
      {isProcessing && <TooltipContent>The safe activation is already in process</TooltipContent>}
    </Tooltip>
  )
}
