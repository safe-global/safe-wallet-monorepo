import { useContext, useId } from 'react'
import { Link2, Lock, ShieldCheck } from 'lucide-react'
import type { ReactElement } from 'react'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'

import { Button } from '@safe-global/views/components/ui/button'
import { Checkbox } from '@safe-global/views/components/ui/checkbox'
import { Field, FieldLabel } from '@safe-global/views/components/ui/field'
import { Link } from '@safe-global/views/components/ui/link'
import { Separator } from '@safe-global/views/components/ui/separator'
import { Spinner } from '@safe-global/views/components/ui/spinner'
import { Typography } from '@safe-global/views/components/ui/typography'
import SafeAppIconCard from '@safe-global/views/components/safe-apps/SafeAppIconCard'
import Track from '@/components/common/Track'
import { BRAND_NAME } from '@/config/constants'
import { useTrackOnce } from '@/services/analytics/useTrackOnce'
import { WALLETCONNECT_EVENTS, WcSafeAppSuggestionResult } from '@/services/analytics/events/walletconnect'
import { WalletConnectContext } from '../WalletConnectContext'
import { WCLoadingState } from '../../types'
import { getSuggestionParams, getSuggestionResultParams } from '../../services/tracking'

const BENEFITS = [
  { Icon: Link2, text: 'Stay connected without pairing or reconnecting' },
  { Icon: ShieldCheck, text: 'Protect your Safe Account from malicious dApps' },
  { Icon: Lock, text: 'Keep your address off third-party servers' },
]

export type WcSafeAppSuggestionProps = {
  safeApp: SafeAppData
  /** The origin WalletConnect verified, shown so the user knows who they would connect to */
  origin: string
  onOpenSafeApp: (safeApp: SafeAppData) => void
  onContinueWithWalletConnect: () => void
  onBrowseSafeApps: () => void
}

const WcSafeAppSuggestion = ({
  safeApp,
  origin,
  onOpenSafeApp,
  onContinueWithWalletConnect,
  onBrowseSafeApps,
}: WcSafeAppSuggestionProps): ReactElement => {
  const { loading, safeAppSuggestion } = useContext(WalletConnectContext)
  const { optOut, setOptOut } = safeAppSuggestion
  const checkboxId = useId()
  const isBusy = !!loading

  useTrackOnce({ ...WALLETCONNECT_EVENTS.SAFE_APP_SUGGESTED, label: origin }, getSuggestionParams(origin, safeApp))

  const trackResult = (result: WcSafeAppSuggestionResult) => ({
    ...WALLETCONNECT_EVENTS.SAFE_APP_SUGGESTION_RESULT,
    label: origin,
    mixpanelParams: getSuggestionResultParams(origin, safeApp, result, optOut),
  })

  return (
    <div className="flex flex-col gap-6 text-center">
      <div className="flex flex-col items-center gap-1">
        <SafeAppIconCard src={safeApp.iconUrl} width={56} height={56} alt={`${safeApp.name} logo`} />

        <Typography variant="h4" className="mt-3">
          {safeApp.name} runs inside {BRAND_NAME}
        </Typography>

        <Typography variant="paragraph-small" color="muted">
          {origin}
        </Typography>
      </div>

      <div>
        {BENEFITS.map(({ Icon, text }, index) => (
          <div key={text}>
            {index > 0 && <Separator />}
            <div className="flex items-center gap-3 py-3">
              <div className="bg-success-subtle text-success-strong flex size-9 shrink-0 items-center justify-center rounded-lg">
                <Icon className="size-4" />
              </div>
              <Typography variant="paragraph-small" className="text-left">
                {text}
              </Typography>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {/* w-auto overrides the primitive's w-full so the row can shrink-wrap and centre */}
        <Field orientation="horizontal" className="w-auto self-center">
          <Checkbox
            id={checkboxId}
            checked={optOut}
            disabled={isBusy}
            onCheckedChange={(checked) => setOptOut(!!checked)}
          />
          <FieldLabel htmlFor={checkboxId} className="text-muted-foreground">
            Don&apos;t suggest this again for this dApp
          </FieldLabel>
        </Field>

        <Track {...trackResult(WcSafeAppSuggestionResult.OPENED_SAFE_APP)} as="div" className="flex flex-col">
          <Button variant="default" disabled={isBusy} onClick={() => onOpenSafeApp(safeApp)}>
            {loading === WCLoadingState.REJECT ? <Spinner /> : 'Open in Safe App Store'}
          </Button>
        </Track>

        <Track
          {...trackResult(WcSafeAppSuggestionResult.CONTINUED_WITH_WALLETCONNECT)}
          as="div"
          className="flex flex-col"
        >
          <Button variant="ghost" disabled={isBusy} onClick={onContinueWithWalletConnect}>
            {loading === WCLoadingState.APPROVE ? <Spinner /> : 'Continue with WalletConnect'}
          </Button>
        </Track>
      </div>

      <div className="flex flex-col gap-4">
        <Separator bleed="4" />

        <Typography variant="paragraph-small" color="muted">
          Browse{' '}
          <Track {...trackResult(WcSafeAppSuggestionResult.BROWSED_STORE)}>
            <Link
              render={<button type="button" disabled={isBusy} />}
              className="cursor-pointer"
              onClick={onBrowseSafeApps}
            >
              <b>all reviewed apps</b>
            </Link>
          </Track>{' '}
          in the Safe App Store
        </Typography>
      </div>
    </div>
  )
}

export default WcSafeAppSuggestion
