import type { ReactElement, ReactNode } from 'react'
import type { UrlObject } from 'url'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CTA_BUTTON_WIDTH, CTA_HEIGHT } from '@/components/safe-apps/SafeAppLandingPage/constants'
import CreateNewSafeSVG from '@/public/images/open/safe-creation.svg'

export type AppActionsSafeOption = { address: string; chainId: string; shortName?: string; name?: string }

export type AppActionsViewProps = {
  cta: 'use' | 'create' | 'connect'
  useAppHref?: UrlObject
  createSafeHref?: UrlObject
  isUseAppDisabled: boolean
  onConnectWallet: () => Promise<void>
  showSafeSelect: boolean
  selectedSafeAddress: string
  compatibleSafes: AppActionsSafeOption[]
  onSelectSafe: (address: string) => void
  renderSafeIcon: (address: string) => ReactNode
  renderAddress: (props: { address: string; prefix?: string }) => ReactNode
}

export function AppActionsView({
  cta,
  useAppHref,
  createSafeHref,
  isUseAppDisabled,
  onConnectWallet,
  showSafeSelect,
  selectedSafeAddress,
  compatibleSafes,
  onSelectSafe,
  renderSafeIcon,
  renderAddress,
}: AppActionsViewProps): ReactElement {
  let button: ReactNode
  switch (cta) {
    case 'use':
      button = (
        <Button
          style={{ width: CTA_BUTTON_WIDTH }}
          disabled={isUseAppDisabled}
          render={<Link href={useAppHref ?? ''} />}
        >
          Use app
        </Button>
      )
      break
    case 'create':
      button = (
        <Button style={{ width: CTA_BUTTON_WIDTH }} render={<Link href={createSafeHref ?? ''} />}>
          Create new Safe account
        </Button>
      )
      break
    default:
      button = (
        <Button onClick={onConnectWallet} style={{ width: CTA_BUTTON_WIDTH }}>
          Connect wallet
        </Button>
      )
  }

  let body: ReactNode
  if (showSafeSelect) {
    body = (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="safe-select-label">Select a Safe account</Label>
        <Select value={selectedSafeAddress} onValueChange={(value) => onSelectSafe(value as string)}>
          <SelectTrigger id="safe-select-label" className="min-h-[56px] w-[311px]">
            <SelectValue placeholder="Select a Safe account" />
          </SelectTrigger>
          <SelectContent>
            {compatibleSafes.map(({ address, chainId, shortName, name }) => (
              <SelectItem key={`${chainId}:${address}`} value={address}>
                <div className="flex items-center gap-2">
                  {renderSafeIcon(address)}

                  <div className="flex-1">
                    <Typography variant="paragraph-small">{name}</Typography>

                    {renderAddress({ address, prefix: shortName })}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  } else {
    body = <CreateNewSafeSVG alt="An icon of a physical safe with a plus sign" />
  }

  return (
    <div className="flex flex-col items-center justify-between font-bold" style={{ height: CTA_HEIGHT }}>
      <Typography variant="paragraph-bold">Use the App with your Safe account</Typography>
      {body}
      {button}
    </div>
  )
}
