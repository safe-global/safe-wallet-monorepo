import { type ReactElement } from 'react'
import WalletConnectIcon from '@/public/images/common/walletconnect.svg'
import { Button } from '@/components/ui/button'
import { WALLETCONNECT_EVENTS } from '@/services/analytics/events/walletconnect'
import Track from '@/components/common/Track'

type WcIconProps = {
  onClick: () => void
  sessionCount: number
  isError: boolean
  sessionIcon?: string
}

const WcIcon = ({ sessionCount, isError, onClick }: WcIconProps): ReactElement => {
  return (
    <Track {...WALLETCONNECT_EVENTS.POPUP_OPENED}>
      <div className="relative">
        <Button
          variant="ghost"
          size="icon-lg"
          onClick={onClick}
          className="cursor-pointer shrink-0 rounded-lg bg-card hover:bg-muted/30 transition-colors"
          aria-label="WalletConnect"
        >
          <WalletConnectIcon className="size-5 fill-current text-muted-foreground" />
        </Button>

        {(sessionCount > 0 || isError) && (
          <span
            className={`absolute z-10 flex items-center justify-center rounded-full border-[3px] border-card w-[10px] h-[10px] top-[9px] right-[10px] ${
              isError ? 'bg-[var(--color-error-main)]' : 'bg-[var(--color-success-main)]'
            }`}
            aria-label={isError ? 'WalletConnect error' : `${sessionCount} WalletConnect sessions`}
          />
        )}
      </div>
    </Track>
  )
}

export default WcIcon
