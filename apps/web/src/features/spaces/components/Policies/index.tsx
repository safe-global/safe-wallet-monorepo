import { useCallback, useContext, useMemo, useState, type ReactElement } from 'react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { TxModalContext } from '@/components/tx-flow'
import ExternalLink from '@/components/common/ExternalLink'
import { Typography } from '@/components/ui/typography'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import AddPolicyDialog from './AddPolicyDialog'
import { ADD_POLICY_OPTIONS, type AddPolicyId } from './AddPolicyDialog/options'
import PoliciesList from './PoliciesList'
import { PoliciesLoadError, PoliciesLoading } from './PoliciesLoadState'
import PolicyCatalogue from './PolicyCatalogue'
import type { PolicyLock } from './policyLock'
import PolicyUpsellBanner from './PolicyUpsellBanner'
import ProposerIntroDialog from './ProposerIntroDialog'
import { PROPOSER_INTRO_SEEN_KEY } from './ProposerIntroDialog/constants'
import ProposerDetails from './ProposerDetails'
import ProposerRoleFlow from './ProposerRoleFlow'
import SpendingLimitDetails from './SpendingLimitDetails'
import SpendingLimitFlow from './SpendingLimitFlow'
import EditSpendingLimitFlow from './SpendingLimitFlow/EditFlow'
import SpendingLimitIntroDialog from './SpendingLimitIntroDialog'
import { SPENDING_LIMIT_INTRO_SEEN_KEY } from './SpendingLimitIntroDialog/constants'
import { REQUEST_POLICY_FORM_HEIGHT, REQUEST_POLICY_FORM_URL, REQUEST_POLICY_FORM_WIDTH } from './constants'
import { isPendingPolicy, isProposerPolicy, isSpendingLimitPolicy, type Policy, type PolicySafe } from './types'

interface PoliciesProps {
  /** Supplied by the caller. The page does not fetch. */
  policies?: Policy[]
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  /** The populated mode's `Add policy` button. Without it the button opens the add policy dialog. */
  onAddPolicy?: () => void
  onSelectPolicy?: (policy: Policy) => void
  /**
   * Set when the plan does not include some policies: the banner shows, their tiles lead to the upgrade and the add
   * policy dialog disables them.
   */
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
 * failed, only the heading stays and the body is the load state. A plan without some policies shows the
 * upgrade banner above either mode, and the catalogue loses its suggestion tile.
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
  const [hasSeenSpendingLimitIntro = false, setHasSeenSpendingLimitIntro] =
    useLocalStorage<boolean>(SPENDING_LIMIT_INTRO_SEEN_KEY)
  const [isSpendingLimitIntroOpen, setIsSpendingLimitIntroOpen] = useState(false)
  const { setTxFlow } = useContext(TxModalContext)

  const [hasSeenProposerIntro = false, setHasSeenProposerIntro] = useLocalStorage<boolean>(PROPOSER_INTRO_SEEN_KEY)
  const [isProposerIntroOpen, setIsProposerIntroOpen] = useState(false)
  const [isAddPolicyOpen, setIsAddPolicyOpen] = useState(false)
  const [openPolicy, setOpenPolicy] = useState<Policy | null>(null)

  const isSettled = !isLoading && !isError

  const selectPolicy = useCallback((policy: Policy) => {
    if (isProposerPolicy(policy) || isSpendingLimitPolicy(policy)) setOpenPolicy(policy)
  }, [])

  const closeDetails = useCallback(() => setOpenPolicy(null), [])

  // Read back from the list rather than freezing the row: a refetch reaches the open panel, and a
  // policy that leaves the response takes its panel with it. A pending one stays to report why it left.
  const listedPolicy = useMemo(
    () => (openPolicy ? policies.find((policy) => policy.id === openPolicy.id) : undefined),
    [policies, openPolicy],
  )
  const openedPolicy = listedPolicy ?? (openPolicy && isPendingPolicy(openPolicy) ? openPolicy : null)

  const startSpendingLimitFlow = useCallback(() => setTxFlow(<SpendingLimitFlow />), [setTxFlow])

  // The panel is left open: it hides itself while the flow runs, so cancelling lands back on it.
  const editSpendingLimit = useCallback(
    (safe: PolicySafe) => setTxFlow(<EditSpendingLimitFlow safe={safe} />),
    [setTxFlow],
  )

  const startProposerFlow = useCallback(() => {
    setTxFlow(<ProposerRoleFlow />)
  }, [setTxFlow])

  const handleSelect = useCallback(
    (id: AddPolicyId) => {
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

        // Not offered yet: ADD_POLICY_OPTIONS leaves it out.
        case 'recovery':
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

  const selectFromAddPolicyDialog = useCallback(
    (id: AddPolicyId) => {
      setIsAddPolicyOpen(false)
      handleSelect(id)
    },
    [handleSelect],
  )

  const addPolicyOptions = useMemo(
    () =>
      ADD_POLICY_OPTIONS.map((option) =>
        locked?.lockedPolicies.some((lockedId) => lockedId === option.id)
          ? { ...option, disabled: true, disabledTooltip: 'Upgrade to Business to set up policies.' }
          : option,
      ),
    [locked],
  )

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
      ) : (
        <>
          {locked && (
            <div className="mb-4">
              <PolicyUpsellBanner {...locked} />
            </div>
          )}

          {policies.length > 0 ? (
            <PoliciesList
              policies={policies}
              onAddPolicy={onAddPolicy ?? (() => setIsAddPolicyOpen(true))}
              onSelectPolicy={onSelectPolicy ?? selectPolicy}
            />
          ) : (
            <PolicyCatalogue onSelect={handleSelect} locked={locked} />
          )}
        </>
      )}

      <AddPolicyDialog
        open={isAddPolicyOpen}
        onOpenChange={setIsAddPolicyOpen}
        onSelect={selectFromAddPolicyDialog}
        options={addPolicyOptions}
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

      {openedPolicy && isProposerPolicy(openedPolicy) && openedPolicy.data.proposers[0] && (
        <ProposerDetails policy={openedPolicy} proposer={openedPolicy.data.proposers[0]} onClose={closeDetails} />
      )}

      {openedPolicy && isSpendingLimitPolicy(openedPolicy) && (
        <SpendingLimitDetails
          policy={openedPolicy}
          isUnlisted={!listedPolicy}
          onClose={closeDetails}
          onEdit={() => editSpendingLimit(openedPolicy.safe)}
        />
      )}
    </div>
  )
}

export default Policies
