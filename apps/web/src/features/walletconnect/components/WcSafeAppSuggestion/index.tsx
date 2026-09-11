import { useId, useState } from 'react'
import { Link2, Lock, ShieldCheck } from 'lucide-react'
import type { ReactElement } from 'react'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldLabel } from '@/components/ui/field'
import { Link } from '@/components/ui/link'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import SafeAppIconCard from '@/components/safe-apps/SafeAppIconCard'
import { BRAND_NAME } from '@/config/constants'

const BENEFITS = [
  { Icon: Link2, text: 'Stay connected without pairing or reconnecting' },
  { Icon: ShieldCheck, text: 'Protect your Safe Account from malicious dApps' },
  { Icon: Lock, text: 'Keep your address off third-party servers' },
]

export type WcSafeAppSuggestionProps = {
  safeApp: SafeAppData
  /** The origin WalletConnect verified, shown so the user knows who they would connect to */
  origin: string
  onOpenSafeApp: (safeApp: SafeAppData, dontShowAgain: boolean) => void
  onContinueWithWalletConnect: (dontShowAgain: boolean) => void
  onBrowseSafeApps: () => void
}

const WcSafeAppSuggestion = ({
  safeApp,
  origin,
  onOpenSafeApp,
  onContinueWithWalletConnect,
  onBrowseSafeApps,
}: WcSafeAppSuggestionProps): ReactElement => {
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const checkboxId = useId()

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

      {/* Bled to the popup edge so the rows inside share a left edge with the controls below */}
      <div className="bg-background-main -mx-4 rounded-lg px-4">
        {BENEFITS.map(({ Icon, text }, index) => (
          <div key={text}>
            {index > 0 && <Separator />}
            <div className="flex items-center gap-3 py-3">
              <div className="bg-success-background text-success flex size-9 shrink-0 items-center justify-center rounded-lg">
                <Icon className="size-4" />
              </div>
              <Typography variant="paragraph-small" align="left">
                {text}
              </Typography>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <Field orientation="horizontal" className="self-center">
          <Checkbox
            id={checkboxId}
            checked={dontShowAgain}
            onCheckedChange={(checked) => setDontShowAgain(!!checked)}
          />
          <FieldLabel htmlFor={checkboxId} className="text-muted-foreground">
            Don&apos;t show again
          </FieldLabel>
        </Field>

        <Button variant="default" onClick={() => onOpenSafeApp(safeApp, dontShowAgain)}>
          Open {safeApp.name} in Safe App Store
        </Button>

        <Button variant="ghost" onClick={() => onContinueWithWalletConnect(dontShowAgain)}>
          Continue with WalletConnect
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        <Separator bleed="4" />

        <Typography variant="paragraph-small" color="muted">
          Browse{' '}
          <Link render={<button type="button" />} onClick={onBrowseSafeApps}>
            <b>60+ reviewed apps</b>
          </Link>{' '}
          in the Safe App Store
        </Typography>
      </div>
    </div>
  )
}

export default WcSafeAppSuggestion
