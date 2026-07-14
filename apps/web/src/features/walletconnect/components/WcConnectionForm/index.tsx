import { useCallback, useEffect } from 'react'
import type { ReactElement } from 'react'
import type { SessionTypes } from '@walletconnect/types'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import InfoIcon from '@/public/images/notifications/info.svg'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import WcHints from '../WcHints'
import WcSessionList from '../WcSessionList'
import WcInput from '../WcInput'
import WcLogoHeader from '../WcLogoHeader'
import css from './styles.module.css'
import useSafeInfo from '@/hooks/useSafeInfo'
import Track from '@/components/common/Track'
import { WALLETCONNECT_EVENTS } from '@/services/analytics/events/walletconnect'
import { BRAND_NAME } from '@/config/constants'

const WC_HINTS_KEY = 'wcHints'

const WcConnectionForm = ({ sessions, uri }: { sessions: SessionTypes.Struct[]; uri: string }): ReactElement => {
  const [showHints = true, setShowHints] = useLocalStorage<boolean>(WC_HINTS_KEY)
  const { safeLoaded } = useSafeInfo()

  const onToggle = useCallback(() => {
    setShowHints((prev) => !prev)
  }, [setShowHints])

  // Show the hints only once
  useEffect(() => {
    return () => setShowHints(false)
  }, [setShowHints])

  return (
    <div className="relative flex flex-col">
      <div className="pb-6 text-center">
        <Tooltip>
          <TooltipTrigger
            render={
              <span className="inline-flex">
                <Track {...(showHints ? WALLETCONNECT_EVENTS.HINTS_HIDE : WALLETCONNECT_EVENTS.HINTS_SHOW)}>
                  <Button variant="ghost" size="icon" onClick={onToggle} className={css.infoIcon}>
                    <InfoIcon className="size-6 text-border" />
                  </Button>
                </Track>
              </span>
            }
          />
          <TooltipContent>{showHints ? 'Hide how WalletConnect works' : 'How does WalletConnect work?'}</TooltipContent>
        </Tooltip>

        <WcLogoHeader />

        <Typography variant="paragraph-small" className="text-muted-foreground">
          {safeLoaded
            ? `Paste the pairing code below to connect to your ${BRAND_NAME} via WalletConnect`
            : `Please open one of your Safe accounts to connect to via WalletConnect`}
        </Typography>

        {safeLoaded ? (
          <div className="mt-6">
            <WcInput uri={uri} />
          </div>
        ) : null}
      </div>
      <Separator />
      <div className="py-6">
        <WcSessionList sessions={sessions} />
      </div>
      {showHints && (
        <>
          <Separator />

          <div className="pt-6">
            <WcHints />
          </div>
        </>
      )}
    </div>
  )
}

export default WcConnectionForm
