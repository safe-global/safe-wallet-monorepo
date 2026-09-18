import { useCallback, useState, type ReactElement } from 'react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import ExternalLink from '@/components/common/ExternalLink'
import { Typography } from '@/components/ui/typography'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import PolicyCatalogue, { type PolicyCatalogueLock } from './PolicyCatalogue'
import type { PolicyCatalogueId } from './PolicyCatalogue/catalogue'
import PolicyUpsellBanner, { type PolicyUpsellPlan } from './PolicyUpsellBanner'
import ProposerIntroDialog from './ProposerIntroDialog'
import { PROPOSER_INTRO_SEEN_KEY } from './ProposerIntroDialog/constants'
import SpendingLimitIntroDialog from './SpendingLimitIntroDialog'
import { SPENDING_LIMIT_INTRO_SEEN_KEY } from './SpendingLimitIntroDialog/constants'

interface PoliciesProps {
  /** Set when the workspace's plan does not include policies. WA-3560 supplies it from the plan hooks. */
  lockedPlan?: PolicyUpsellPlan & Pick<PolicyCatalogueLock, 'accountCounts'>
  onUpgrade?: () => void
}

const Policies = ({ lockedPlan, onUpgrade = () => {} }: PoliciesProps): ReactElement => {
  const [hasSeenSpendingLimitIntro = false, setHasSeenSpendingLimitIntro] =
    useLocalStorage<boolean>(SPENDING_LIMIT_INTRO_SEEN_KEY)
  const [isSpendingLimitIntroOpen, setIsSpendingLimitIntroOpen] = useState(false)

  const [hasSeenProposerIntro = false, setHasSeenProposerIntro] = useLocalStorage<boolean>(PROPOSER_INTRO_SEEN_KEY)
  const [isProposerIntroOpen, setIsProposerIntroOpen] = useState(false)

  const startSpendingLimitFlow = useCallback(() => {
    // TODO(WA-3150): open the spending limit create form.
  }, [])

  const startProposerFlow = useCallback(() => {
    // TODO(WA-3138): open the proposer form.
  }, [])

  const handleSelect = useCallback(
    (id: PolicyCatalogueId) => {
      switch (id) {
        case 'spending-limit':
          if (hasSeenSpendingLimitIntro) {
            startSpendingLimitFlow()
            return
          }

          setIsSpendingLimitIntroOpen(true)
          return

        case 'proposer':
          if (hasSeenProposerIntro) {
            startProposerFlow()
            return
          }

          setIsProposerIntroOpen(true)
          return

        case 'suggestion':
          // TODO(WA-3160): open the Suggest a policy dialog.
          return

        // Only unreachable while `isAvailable` is false in the catalogue; needs a flow before it flips.
        case 'account-recovery':
          return

        // A new policy id must pick a branch above rather than silently doing nothing.
        default: {
          const _exhaustive: never = id
          return _exhaustive
        }
      }
    },
    [hasSeenSpendingLimitIntro, startSpendingLimitFlow, hasSeenProposerIntro, startProposerFlow],
  )

  // Any dismissal counts as shown: an explainer that returns after you closed it reads as a bug.
  const closeSpendingLimitIntro = useCallback(() => {
    setIsSpendingLimitIntroOpen(false)
    setHasSeenSpendingLimitIntro(true)
  }, [setHasSeenSpendingLimitIntro])

  const proceedToSpendingLimitFlow = useCallback(() => {
    closeSpendingLimitIntro()
    startSpendingLimitFlow()
  }, [closeSpendingLimitIntro, startSpendingLimitFlow])

  const closeProposerIntro = useCallback(() => {
    setIsProposerIntroOpen(false)
    setHasSeenProposerIntro(true)
  }, [setHasSeenProposerIntro])

  const proceedToProposerFlow = useCallback(() => {
    closeProposerIntro()
    startProposerFlow()
  }, [closeProposerIntro, startProposerFlow])

  return (
    <div data-testid="policies">
      <div className="mb-6 flex flex-col gap-6">
        <Typography variant="h2" className="font-bold leading-[1] tracking-tight">
          Policies
        </Typography>

        <Typography variant="paragraph-medium">
          Policies are rules that help you manage your Safe accounts. Set them up once and they will run onchain,
          automatically.{' '}
          <ExternalLink noIcon href={HelpCenterArticle.POLICIES}>
            Learn more
          </ExternalLink>
        </Typography>
      </div>

      {lockedPlan && (
        <div className="mb-4">
          <PolicyUpsellBanner
            planName={lockedPlan.planName}
            workspaceName={lockedPlan.workspaceName}
            onUpgrade={onUpgrade}
          />
        </div>
      )}

      <PolicyCatalogue
        onSelect={handleSelect}
        locked={lockedPlan ? { accountCounts: lockedPlan.accountCounts, onUpgrade } : undefined}
      />

      <SpendingLimitIntroDialog
        open={isSpendingLimitIntroOpen}
        onOpenChange={(open) => {
          if (!open) closeSpendingLimitIntro()
        }}
        onProceed={proceedToSpendingLimitFlow}
      />

      <ProposerIntroDialog
        open={isProposerIntroOpen}
        onOpenChange={(open) => {
          if (!open) closeProposerIntro()
        }}
        onProceed={proceedToProposerFlow}
      />
    </div>
  )
}

export default Policies
