import { Typography } from '@/components/ui/typography'
import SafeAccountsIcon from '@/public/images/spaces/safe-accounts.svg'

const EmptySafeAccounts = () => {
  return (
    <div className="rounded-xl bg-card p-10 text-center">
      <div className="flex justify-center">
        <SafeAccountsIcon />
      </div>

      <Typography variant="paragraph" color="muted" className="mt-4">
        Add existing Safe Accounts in your space to see them here.
      </Typography>
    </div>
  )
}

export default EmptySafeAccounts
