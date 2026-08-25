import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { NO_ELIGIBLE_ACCOUNTS_TEXT, NO_WALLET_TEXT } from '../constants'

/**
 * The Space has Safes, but none this wallet may set a policy on. Says why in the same words as the
 * helper text, and offers the one action that changes the answer.
 */
const NoEligibleAccounts = ({
  onSwitchWallet,
  hasWallet = true,
}: {
  onSwitchWallet: () => void
  hasWallet?: boolean
}) => (
  <div data-testid="no-eligible-accounts" className="flex flex-col items-end gap-2.5 p-4">
    <Typography variant="paragraph-small" color="muted" className="w-full">
      {hasWallet ? NO_ELIGIBLE_ACCOUNTS_TEXT : NO_WALLET_TEXT}
    </Typography>
    <Button variant="secondary" size="sm" onClick={onSwitchWallet}>
      {hasWallet ? 'Switch wallet' : 'Connect wallet'}
    </Button>
  </div>
)

export default NoEligibleAccounts
