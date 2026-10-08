import type { ReactElement, ReactNode } from 'react'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import WarningIcon from '@/public/images/notifications/warning.svg'
import { Typography } from '@/components/ui/typography'
import { Separator } from '@/components/ui/separator'
import SafeAppIconCard from '@/components/safe-apps/SafeAppIconCard'

export type SafeAppDetailsViewProps = {
  app: SafeAppData
  showDefaultListWarning: boolean
  renderChainIndicator: (chainId: string) => ReactNode
}

export function SafeAppDetailsView({
  app,
  showDefaultListWarning,
  renderChainIndicator,
}: SafeAppDetailsViewProps): ReactElement {
  return (
    <div className="flex flex-col">
      <div className="mb-8 flex">
        <SafeAppIconCard src={app.iconUrl} alt={app.name} width={90} height={90} />

        <div className="ml-16">
          <Typography variant="h3">{app.name}</Typography>
          <Typography variant="paragraph-small" className="block mt-2">
            {app.description}
          </Typography>
        </div>
      </div>
      <Separator />
      <div className="mt-8">
        <Typography>Safe App URL</Typography>
        <Typography
          variant="paragraph-small"
          className="mt-2 inline-block rounded-md bg-[var(--color-background-light)] p-2 font-bold"
        >
          {app.url}
        </Typography>
      </div>
      <div className="mt-4">
        <Typography>Available networks</Typography>
        <div className="mt-2 flex flex-wrap gap-4">{app.chainIds.map((chainId) => renderChainIndicator(chainId))}</div>
      </div>
      <Separator className="mt-8" />
      {showDefaultListWarning && (
        <div className="mt-8 flex flex-col">
          <div className="mb-8">
            <div className="flex">
              <WarningIcon className="size-6 text-[var(--color-warning-dark)]" />
              <Typography variant="h4" className="text-[var(--color-warning-dark)]">
                Warning
              </Typography>
            </div>
            <Typography className="mt-2 text-[var(--color-warning-dark)]">
              The application is not in the default Safe App list
            </Typography>
            <Typography variant="paragraph-small" className="block mt-4">
              Check the app link and ensure it comes from a trusted source
            </Typography>
          </div>
          <Separator />
        </div>
      )}
    </div>
  )
}
