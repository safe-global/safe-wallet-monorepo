import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'
import { Spinner } from '@/components/ui/spinner'
import { ThirdPartyCookiesWarning } from '@views/components/safe-apps/AppFrame/ThirdPartyCookiesWarning'
import { TRANSACTION_BAR_HEIGHT } from '@views/components/safe-apps/AppFrame/TransactionQueueBar/TransactionQueueBarView'
import css from './styles.module.css'

export function AppFrameEmptyView(): ReactElement {
  return <div />
}

export type AppFrameBlockedViewProps = {
  renderBlockedAddress: (props: { featureTitle: string }) => ReactNode
}

export function AppFrameBlockedView({ renderBlockedAddress }: AppFrameBlockedViewProps): ReactElement {
  return <div className="p-4">{renderBlockedAddress({ featureTitle: 'Safe{Pass} Safe app' })}</div>
}

export type AppFrameViewProps = {
  showCookiesWarning: boolean
  onCloseCookiesWarning: () => void
  appIsLoading: boolean
  isLoadingSlow: boolean
  queueBarVisible: boolean
  iframe: ReactNode
  queueBar: ReactNode
  permissionsPrompt: ReactNode
}

export function AppFrameView({
  showCookiesWarning,
  onCloseCookiesWarning,
  appIsLoading,
  isLoadingSlow,
  queueBarVisible,
  iframe,
  queueBar,
  permissionsPrompt,
}: AppFrameViewProps): ReactElement {
  return (
    <div className={css.wrapper}>
      {showCookiesWarning && <ThirdPartyCookiesWarning onClose={onCloseCookiesWarning} />}

      {appIsLoading && (
        <div className={css.loadingContainer}>
          {isLoadingSlow && (
            <Typography variant="h4" className="mb-2">
              The Safe App is taking too long to load, consider refreshing.
            </Typography>
          )}
          <Spinner className="size-12 text-[var(--color-primary-main)]" />
        </div>
      )}

      <div
        style={{
          height: '100%',
          display: appIsLoading ? 'none' : 'block',
          paddingBottom: queueBarVisible ? TRANSACTION_BAR_HEIGHT : 0,
        }}
      >
        {iframe}
      </div>

      {queueBar}

      {permissionsPrompt}
    </div>
  )
}
