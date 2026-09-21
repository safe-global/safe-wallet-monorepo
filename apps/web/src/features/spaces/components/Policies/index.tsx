import { useCallback, useState, type ReactElement } from 'react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import ExternalLink from '@/components/common/ExternalLink'
import { Typography } from '@/components/ui/typography'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import PoliciesList from './PoliciesList'
import { PoliciesLoadError, PoliciesLoading } from './PoliciesLoadState'
import PolicyCatalogue from './PolicyCatalogue'
import type { PolicyCatalogueId } from './PolicyCatalogue/catalogue'
import ProposerIntroDialog from './ProposerIntroDialog'
import { PROPOSER_INTRO_SEEN_KEY } from './ProposerIntroDialog/constants'
import SpendingLimitIntroDialog from './SpendingLimitIntroDialog'
import { SPENDING_LIMIT_INTRO_SEEN_KEY } from './SpendingLimitIntroDialog/constants'
import type { Policy } from './types'

interface PoliciesProps {
  /** Supplied by the caller. The page does not fetch. */
  policies?: Policy[]
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  /** Opens the catalogue picker from the populated mode's `Add policy` button. */
  onAddPolicy?: () => void
  onSelectPolicy?: (policy: Policy) => void
}

/**
 * The page has two modes. With no policies it shows the catalogue of policies that can be set up.
 * With policies it shows the list of policies already set up. Revoking the last policy removes it
 * from the CGW response, so the page returns to the catalogue. While the response is pending or
 * failed, only the heading stays and the body is the load state.
 */
const Policies = ({
  policies = [],
  isLoading = false,
  isError = false,
  onRetry,
  onAddPolicy,
  onSelectPolicy,
}: PoliciesProps): ReactElement => {
  const isSettled = !isLoading && !isError

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

        {isSettled && (
          <Typography variant="paragraph-medium">
            Policies are rules that help you manage your Safe accounts. Set them up once and they will run onchain,
            automatically.{' '}
            <ExternalLink className="font-bold hover:text-muted-foreground" href={HelpCenterArticle.POLICIES}>
              Learn more
            </ExternalLink>
          </Typography>
        )}
      </div>

      {isLoading ? (
        <PoliciesLoading />
      ) : isError ? (
        <PoliciesLoadError onReload={onRetry} />
      ) : policies.length > 0 ? (
        <PoliciesList policies={policies} onAddPolicy={onAddPolicy} onSelectPolicy={onSelectPolicy} />
      ) : (
        <PolicyCatalogue onSelect={handleSelect} />
      )}

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
