import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { getEligibilityCopy, NO_WALLET_TEXT } from '../constants'
import PopupMessage from '../../components/PopupMessage'

/**
 * The Space has Safes, but none this wallet may set a policy on. Says why in the same words as the
 * helper text, and offers the one action that changes the answer.
 */
const NoEligibleAccounts = ({
  onSwitchWallet,
  hasWallet = true,
  signersOnly = false,
}: {
  onSwitchWallet: () => void
  hasWallet?: boolean
  signersOnly?: boolean
}) => (
  <PopupMessage
    data-testid="no-eligible-accounts"
    action={
      <Button variant="secondary" size="sm" onClick={onSwitchWallet}>
        {hasWallet ? 'Switch wallet' : 'Connect wallet'}
      </Button>
    }
  >
    <Typography variant="paragraph-small" color="muted" className="w-full">
      {hasWallet ? getEligibilityCopy(signersOnly).noEligibleAccountsText : NO_WALLET_TEXT}
    </Typography>
  </PopupMessage>
)

export default NoEligibleAccounts
