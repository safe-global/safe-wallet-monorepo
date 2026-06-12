import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import ChainIndicator from '@/components/common/ChainIndicator'
import WarningIcon from '@/public/images/notifications/warning.svg'
import { Typography } from '@/components/ui/typography'
import { Separator } from '@/components/ui/separator'
import SafeAppIconCard from '@/components/safe-apps/SafeAppIconCard'

type DetailsProps = {
  app: SafeAppData
  showDefaultListWarning: boolean
}

const SafeAppDetails = ({ app, showDefaultListWarning }: DetailsProps) => (
  <div className="flex flex-col">
    <div className="mb-8 flex">
      <SafeAppIconCard src={app.iconUrl} alt={app.name} width={90} height={90} />

      <div className="ml-16">
        <Typography variant="h3">{app.name}</Typography>
        <Typography variant="paragraph-small" className="mt-2">
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
      <div className="mt-2 flex flex-wrap gap-4">
        {app.chainIds.map((chainId) => (
          <ChainIndicator key={chainId} chainId={chainId} inline showUnknown={false} />
        ))}
      </div>
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
          <Typography variant="paragraph-small" className="mt-4">
            Check the app link and ensure it comes from a trusted source
          </Typography>
        </div>
        <Separator />
      </div>
    )}
  </div>
)

export { SafeAppDetails }
