import { useContext, useId } from 'react'
import { Link2, Lock, ShieldCheck } from 'lucide-react'
import type { ReactElement } from 'react'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldLabel } from '@/components/ui/field'
import { Link } from '@/components/ui/link'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { Typography } from '@/components/ui/typography'
import SafeAppIconCard from '@/components/safe-apps/SafeAppIconCard'
import { BRAND_NAME } from '@/config/constants'
import { WalletConnectContext } from '../WalletConnectContext'
import { WCLoadingState } from '../../types'

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
  const { loading, dontShowAgain, setDontShowAgain } = useContext(WalletConnectContext)
  const checkboxId = useId()
  const isBusy = !!loading

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
            checked={dontShowAgain}
            disabled={isBusy}
            onCheckedChange={(checked) => setDontShowAgain(!!checked)}
          />
          <FieldLabel htmlFor={checkboxId} className="text-muted-foreground">
            Remember my choice
          </FieldLabel>
        </Field>

        <Button variant="default" disabled={isBusy} onClick={() => onOpenSafeApp(safeApp)}>
          {loading === WCLoadingState.REJECT ? <Spinner /> : 'Open in Safe App Store'}
        </Button>

        <Button variant="ghost" disabled={isBusy} onClick={onContinueWithWalletConnect}>
          {loading === WCLoadingState.APPROVE ? <Spinner /> : 'Continue with WalletConnect'}
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        <Separator bleed="4" />

        <Typography variant="paragraph-small" color="muted">
          Browse{' '}
          <Link
            render={<button type="button" disabled={isBusy} />}
            className="cursor-pointer"
            onClick={onBrowseSafeApps}
          >
            <b>60+ reviewed apps</b>
          </Link>{' '}
          in the Safe App Store
        </Typography>
      </div>
    </div>
  )
}

export default WcSafeAppSuggestion
