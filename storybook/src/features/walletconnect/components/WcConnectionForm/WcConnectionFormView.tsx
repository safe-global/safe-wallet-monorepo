import type { ReactElement, ReactNode } from 'react'
import InfoIcon from '@/public/images/notifications/info.svg'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import css from './styles.module.css'
import Track from '@/components/common/Track'
import { WALLETCONNECT_EVENTS } from '@/services/analytics/events/walletconnect'

export type WcConnectionFormViewProps = {
  showHints: boolean
  onToggleHints: () => void
  safeLoaded: boolean
  brandName: string
  logoHeader: ReactNode
  input: ReactNode
  sessionList: ReactNode
  hints: ReactNode
}

export const WcConnectionFormView = ({
  showHints,
  onToggleHints,
  safeLoaded,
  brandName,
  logoHeader,
  input,
  sessionList,
  hints,
}: WcConnectionFormViewProps): ReactElement => {
  return (
    <div className="relative flex flex-col">
      <div className="pb-6 text-center">
        <Tooltip>
          <TooltipTrigger
            render={
              <span className={`inline-flex ${css.infoIcon}`}>
                <Track {...(showHints ? WALLETCONNECT_EVENTS.HINTS_HIDE : WALLETCONNECT_EVENTS.HINTS_SHOW)}>
                  <Button variant="ghost" size="icon" onClick={onToggleHints}>
                    <InfoIcon className="size-6 text-[var(--color-border-main)]" />
                  </Button>
                </Track>
              </span>
            }
          />
          <TooltipContent>{showHints ? 'Hide how WalletConnect works' : 'How does WalletConnect work?'}</TooltipContent>
        </Tooltip>

        {logoHeader}

        <Typography variant="paragraph-small" className="text-muted-foreground">
          {safeLoaded
            ? `Paste the pairing code below to connect to your ${brandName} via WalletConnect`
            : `Please open one of your Safe accounts to connect to via WalletConnect`}
        </Typography>

        {safeLoaded ? <div className="mt-6">{input}</div> : null}
      </div>
      <Separator />
      <div className="py-6">{sessionList}</div>
      {showHints && (
        <>
          <Separator />

          <div className="pt-6">{hints}</div>
        </>
      )}
    </div>
  )
}
