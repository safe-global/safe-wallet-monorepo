import { Typography } from '@safe-global/views/components/ui/typography'
import { TOUR_TARGETS } from '@safe-global/views/features/spaces/components/WorkspaceTour/tourTargets'
import SafeAccountsIcon from '@safe-global/views/assets/images/spaces/safe-accounts.svg'

const EmptySafeAccounts = () => {
  return (
    <div className="rounded-xl bg-card p-10 text-center" data-tour={TOUR_TARGETS.safeAccountsEmpty}>
      <div className="flex justify-center">
        <SafeAccountsIcon />
      </div>

      <Typography variant="paragraph" color="muted" className="mt-4">
        Add existing Safe accounts in your space to see them here.
      </Typography>
    </div>
  )
}

export default EmptySafeAccounts
