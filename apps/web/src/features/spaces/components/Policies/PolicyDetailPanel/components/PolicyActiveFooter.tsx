import { Button } from '@/components/ui/button'
import { SheetFooter } from '@/components/ui/sheet'
import { Typography } from '@/components/ui/typography'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import useWallet from '@/hooks/wallets/useWallet'
import {
  ORPHANED_GRANT_HELPER_TEXT,
  getActiveStateHelperText,
  getPolicyActiveState,
  isOrphanedProposerGrant,
} from '../../utils/policyActiveState'
import type { Policy } from '../../types'

export type PolicyActiveFooterProps = {
  policy: Policy
  /** The owners of the Safe the policy applies to. WA-3451 connects this to CGW. */
  signers: string[]
  onEdit?: () => void
  onDelete?: () => void
}

/**
 * The footer of an active policy.
 *
 * The helper text is always rendered rather than shown on hover, so a user who cannot edit the
 * policy learns why before pressing a button that does nothing.
 */
const PolicyActiveFooter = ({ policy, signers, onEdit, onDelete }: PolicyActiveFooterProps) => {
  const wallet = useWallet()
  const connectWallet = useConnectWallet()

  const state = getPolicyActiveState(wallet?.address, signers)

  if (state === 'no-wallet') {
    return (
      <SheetFooter divided data-testid="policy-active-footer">
        <div className="flex w-full flex-col gap-2">
          <Typography variant="paragraph-small" className="text-center text-muted-foreground">
            {getActiveStateHelperText(state, policy)}
          </Typography>

          <Button onClick={connectWallet} className="w-full">
            Connect wallet
          </Button>
        </div>
      </SheetFooter>
    )
  }

  const isOrphaned = isOrphanedProposerGrant(policy, signers)
  const isSigner = state === 'signer'
  const helperText = isOrphaned ? ORPHANED_GRANT_HELPER_TEXT : getActiveStateHelperText(state, policy)

  return (
    <SheetFooter divided data-testid="policy-active-footer">
      <div className="flex w-full flex-col gap-2">
        {helperText && (
          <Typography variant="paragraph-small" className="text-center text-muted-foreground">
            {helperText}
          </Typography>
        )}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" disabled={!isSigner || isOrphaned} onClick={onDelete}>
            Delete
          </Button>
          <Button className="flex-1" disabled={!isSigner} onClick={onEdit}>
            Edit
          </Button>
        </div>
      </div>
    </SheetFooter>
  )
}

export default PolicyActiveFooter
