import type { ReactElement, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import Track from '@/components/common/Track'
import { SETTINGS_EVENTS } from '@/services/analytics/events/settings'
import { maybePlural } from '@safe-global/utils/utils/formatters'

export type RequiredConfirmationViewProps = {
  threshold: number
  owners: number
  renderCheckWallet: (render: (isOk: boolean) => ReactElement) => ReactNode
  onChange: () => void
}

export const RequiredConfirmationView = ({
  threshold,
  owners,
  renderCheckWallet,
  onChange,
}: RequiredConfirmationViewProps) => {
  return (
    <div className="mt-12">
      <div className="flex flex-col justify-between gap-6 lg:flex-row">
        <div className="lg:w-1/5 lg:shrink-0">
          <Typography variant="h4" className="font-bold">
            Required confirmations
          </Typography>
        </div>

        <div className="lg:min-w-0 lg:flex-1">
          <Typography className="pb-4">Any transaction requires the confirmation of:</Typography>

          <Typography className="inline pr-4">
            <b>{threshold}</b> out of <b>{owners}</b> signer{maybePlural(owners)}.
          </Typography>

          {owners > 1 &&
            renderCheckWallet((isOk) => (
              <Track {...SETTINGS_EVENTS.SETUP.CHANGE_THRESHOLD} as="span">
                <Button onClick={onChange} disabled={!isOk} size="sm">
                  Change
                </Button>
              </Track>
            ))}
        </div>
      </div>
    </div>
  )
}
