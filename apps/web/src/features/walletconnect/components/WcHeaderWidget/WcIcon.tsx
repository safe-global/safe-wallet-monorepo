import { type ReactElement } from 'react'
import WalletConnectIcon from '@/public/images/common/walletconnect.svg'
import SafeAppIconCard from '@/components/safe-apps/SafeAppIconCard'
import { Button } from '@/components/ui/button'
import { WALLETCONNECT_EVENTS } from '@/services/analytics/events/walletconnect'
import Track from '@/components/common/Track'

type WcIconProps = {
  onClick: () => void
  sessionCount: number
  isError: boolean
  sessionIcon?: string
}

const WcIcon = ({ sessionCount, sessionIcon, isError, onClick }: WcIconProps): ReactElement => {
  const showIcon = sessionCount === 1 && !!sessionIcon

  return (
    <Track {...WALLETCONNECT_EVENTS.POPUP_OPENED}>
      <div className="relative flex items-center rounded-lg bg-muted">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClick}
          className="size-10 cursor-pointer rounded-lg bg-transparent hover:bg-muted-foreground/10 transition-colors"
          aria-label="WalletConnect"
        >
          <WalletConnectIcon className="size-5 fill-current text-muted-foreground" />
        </Button>

        {isError && (
          <span
            className="absolute z-10 flex items-center justify-center rounded-full border-[3px] border-card bg-[var(--color-error-main)] w-[10px] h-[10px] top-[9px] right-[10px]"
            aria-label="WalletConnect error"
          />
        )}

        {!isError && showIcon && (
          <span
            className="absolute z-10 -bottom-[2px] -right-[2px] rounded-full overflow-hidden border-2 border-card"
            aria-label="Connected dApp"
          >
            <SafeAppIconCard alt="Connected dApp icon" src={sessionIcon} width={18} height={18} />
          </span>
        )}

        {!isError && sessionCount > 1 && (
          <span
            className="absolute z-10 flex items-center justify-center rounded-full bg-[rgba(18,255,128,0.1)] text-[10px] font-medium leading-none text-secondary-foreground min-w-[18px] h-[18px] px-1 -top-[2px] -right-[4px]"
            aria-label={`${sessionCount} WalletConnect sessions`}
          >
            {sessionCount}
          </span>
        )}
      </div>
    </Track>
  )
}

export default WcIcon
