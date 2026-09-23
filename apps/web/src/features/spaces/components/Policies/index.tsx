import { useCallback, useContext, useState, type ReactElement } from 'react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { TxModalContext } from '@/components/tx-flow'
import ExternalLink from '@/components/common/ExternalLink'
import { Typography } from '@/components/ui/typography'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import PoliciesList from './PoliciesList'
import { PoliciesLoadError, PoliciesLoading } from './PoliciesLoadState'
import PolicyCatalogue from './PolicyCatalogue'
import type { PolicyCatalogueId } from './PolicyCatalogue/catalogue'
import type { PolicyLock } from './policyLock'
import PolicyUpsellBanner from './PolicyUpsellBanner'
import ProposerIntroDialog from './ProposerIntroDialog'
import { PROPOSER_INTRO_SEEN_KEY } from './ProposerIntroDialog/constants'
import ProposerRoleFlow from './ProposerRoleFlow'
import SpendingLimitFlow from './SpendingLimitFlow'
import SpendingLimitIntroDialog from './SpendingLimitIntroDialog'
import { SPENDING_LIMIT_INTRO_SEEN_KEY } from './SpendingLimitIntroDialog/constants'
import { REQUEST_POLICY_FORM_HEIGHT, REQUEST_POLICY_FORM_URL, REQUEST_POLICY_FORM_WIDTH } from './constants'
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
  /** Set when the workspace's plan does not include policies: the banner shows and every tile leads to the upgrade. */
  locked?: PolicyLock
}

const openRequestPolicyForm = () => {
  const left = window.screenX + Math.max(0, (window.outerWidth - REQUEST_POLICY_FORM_WIDTH) / 2)
  const top = window.screenY + Math.max(0, (window.outerHeight - REQUEST_POLICY_FORM_HEIGHT) / 2)
  const features = `popup=yes,width=${REQUEST_POLICY_FORM_WIDTH},height=${REQUEST_POLICY_FORM_HEIGHT},left=${Math.round(left)},top=${Math.round(top)},noopener,noreferrer`

  window.open(REQUEST_POLICY_FORM_URL, '_blank', features)
}

/**
 * The page has two modes. With no policies it shows the catalogue of policies that can be set up.
 * With policies it shows the list of policies already set up. Revoking the last policy removes it
 * from the CGW response, so the page returns to the catalogue. While the response is pending or
 * failed, only the heading stays and the body is the load state. A plan without policies shows the
 * upgrade banner and the gated catalogue instead of either.
 */
const Policies = ({
  policies = [],
  isLoading = false,
  isError = false,
  onRetry,
  onAddPolicy,
  onSelectPolicy,
  locked,
}: PoliciesProps): ReactElement => {
  const isSettled = !isLoading && !isError

  const [hasSeenSpendingLimitIntro = false, setHasSeenSpendingLimitIntro] =
    useLocalStorage<boolean>(SPENDING_LIMIT_INTRO_SEEN_KEY)
  const [isSpendingLimitIntroOpen, setIsSpendingLimitIntroOpen] = useState(false)
  const { setTxFlow } = useContext(TxModalContext)

  const [hasSeenProposerIntro = false, setHasSeenProposerIntro] = useLocalStorage<boolean>(PROPOSER_INTRO_SEEN_KEY)
  const [isProposerIntroOpen, setIsProposerIntroOpen] = useState(false)

  const startSpendingLimitFlow = useCallback(() => setTxFlow(<SpendingLimitFlow />), [setTxFlow])

  const startProposerFlow = useCallback(() => {
    setTxFlow(<ProposerRoleFlow />)
  }, [setTxFlow])

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
          openRequestPolicyForm()
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
            <ExternalLink noIcon href={HelpCenterArticle.POLICIES}>
              Learn more
            </ExternalLink>
          </Typography>
        )}
      </div>

      {isLoading ? (
        <PoliciesLoading />
      ) : isError ? (
        <PoliciesLoadError onReload={onRetry} />
      ) : locked ? (
        <>
          <div className="mb-4">
            <PolicyUpsellBanner {...locked} />
          </div>
          <PolicyCatalogue onSelect={handleSelect} locked={locked} />
        </>
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
