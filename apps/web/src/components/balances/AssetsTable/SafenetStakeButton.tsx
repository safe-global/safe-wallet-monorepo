import type { ReactElement } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { useOpenSafenetStakingApp } from '@/hooks/useOpenSafenetStakingApp'
import StakeIcon from '@/public/images/common/stake.svg'
import assetActionCss from '@/components/common/AssetActionButton/styles.module.css'

const LABEL = 'Go to Safenet staking'

const SafenetStakeButton = (): ReactElement => {
  const { openSafenetStakingApp, isNavigating } = useOpenSafenetStakingApp()

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>
        <Button
          variant="ghost"
          size="icon-sm"
          data-testid="safenet-stake-btn"
          aria-label={LABEL}
          onClick={openSafenetStakingApp}
          disabled={isNavigating}
          className={assetActionCss.assetActionIconButton}
        >
          {isNavigating ? <Spinner className="size-4" /> : <StakeIcon className="size-4" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{LABEL}</TooltipContent>
    </Tooltip>
  )
}

export default SafenetStakeButton
