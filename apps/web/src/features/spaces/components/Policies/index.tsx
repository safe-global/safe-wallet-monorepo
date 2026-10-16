import { useCallback, useContext, useMemo, useState, type ComponentType, type ReactElement } from 'react'
import { useRouter } from 'next/router'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { TxModalContext } from '@/components/tx-flow'
import ExternalLink from '@safe-global/views/components/common/ExternalLink'
import { Typography } from '@safe-global/views/components/ui/typography'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import AddPolicyDialog from './AddPolicyDialog'
import {
  ADD_POLICY_OPTIONS,
  type AddPolicyId,
} from '@safe-global/views/features/spaces/components/Policies/AddPolicyDialog/options'
import GuardPolicyDrawer from './GuardPolicyDrawer'
import EditTokenAllowlistFlow from './ERC20TransferPolicy/EditFlow'
import PoliciesList from './PoliciesList'
import { SpaceLoadError, SpaceLoading } from '@safe-global/views/features/spaces/components/LoadState'
import PolicyCatalogue from './PolicyCatalogue'
import {
  POLICY_CATALOGUE,
  type PolicyCatalogueId,
  type PolicyWizardId,
} from '@safe-global/views/features/spaces/components/Policies/PolicyCatalogue/catalogue'
import CosignerPolicyFlow from './CosignerPolicy'
import ERC20TransferPolicyFlow from './ERC20TransferPolicy'
import FallbackPolicyFlow from './FallbackPolicy'
import MultiSendPolicyFlow from './MultiSendPolicy'
import RecoveryFlow from './RecoveryFlow'
import SafeManagementPolicyFlow from './SafeManagementPolicy'
import type { PolicyLock } from '@safe-global/views/features/spaces/components/Policies/policyLock'
import PolicyUpsellBanner from './PolicyUpsellBanner'
import ProposerIntroDialog from './ProposerIntroDialog'
import { PROPOSER_INTRO_SEEN_KEY } from '@safe-global/views/features/spaces/components/Policies/ProposerIntroDialog/constants'
import ProposerDetails from './ProposerDetails'
import ProposerRoleFlow from './ProposerRoleFlow'
import SpendingLimitDetails from './SpendingLimitDetails'
import SpendingLimitFlow from './SpendingLimitFlow'
import EditSpendingLimitFlow from './SpendingLimitFlow/EditFlow'
import EnableSpendingLimitModuleFlow from './SpendingLimitFlow/EnableModuleFlow'
import SpendingLimitIntroDialog from './SpendingLimitIntroDialog'
import { SPENDING_LIMIT_INTRO_SEEN_KEY } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitIntroDialog/constants'
import {
  REQUEST_POLICY_FORM_HEIGHT,
  REQUEST_POLICY_FORM_URL,
  REQUEST_POLICY_FORM_WIDTH,
} from '@safe-global/views/features/spaces/components/Policies/constants'
import {
  isGuardPolicy,
  isPendingPolicy,
  isProposerPolicy,
  isSpendingLimitPolicy,
  type Policy,
  type PolicySafe,
  type SpendingLimitPolicy,
  type TokenAllowlistPolicy,
} from '@safe-global/views/features/spaces/components/Policies/types'

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

const WIZARDS: Record<PolicyWizardId, ComponentType<{ safe?: PolicySafe }>> = {
  accountRecovery: RecoveryFlow,
  tokenWithdraw: ERC20TransferPolicyFlow,
  cosigner: CosignerPolicyFlow,
  fallback: FallbackPolicyFlow,
  multisend: MultiSendPolicyFlow,
  safeManagement: SafeManagementPolicyFlow,
}

const isWizardId = (value: unknown): value is PolicyWizardId => typeof value === 'string' && value in WIZARDS

const parsePolicySafe = (value: unknown): PolicySafe | undefined => {
  if (typeof value !== 'string') return undefined
  const [chainId, address] = value.split(':')
  return chainId && address ? { chainId, address } : undefined
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
const PoliciesOverview = ({
  policies = [],
  isLoading = false,
  isError = false,
  onRetry,
  onAddPolicy,
  onSelectPolicy,
  locked,
}: PoliciesProps): ReactElement => {
  const router = useRouter()
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
    if (isProposerPolicy(policy) || isSpendingLimitPolicy(policy) || isGuardPolicy(policy)) setOpenPolicy(policy)
  }, [])

  const closeDetails = useCallback(() => setOpenPolicy(null), [])

  // Read back from the list rather than freezing the row: a refetch reaches the open panel, and a
  // policy that leaves the response takes its panel with it. A pending one stays to report why it left.
  const listedPolicy = useMemo(
    () => (openPolicy ? policies.find((policy) => policy.id === openPolicy.id) : undefined),
    [policies, openPolicy],
  )
  const openedPolicy = listedPolicy ?? (openPolicy && isPendingPolicy(openPolicy) ? openPolicy : null)
  const isSpendingLimitLocked = locked?.lockedPolicies.includes('spending-limit')

  const startSpendingLimitFlow = useCallback(() => setTxFlow(<SpendingLimitFlow />), [setTxFlow])

  // The panel is left open: it hides itself while the flow runs, so cancelling lands back on it.
  const editSpendingLimit = useCallback(
    (safe: PolicySafe) => setTxFlow(<EditSpendingLimitFlow safe={safe} />),
    [setTxFlow],
  )

  const enableSpendingLimitModule = useCallback(
    ({ safe, enforcement, data }: Pick<SpendingLimitPolicy, 'safe' | 'enforcement' | 'data'>) => {
      if (enforcement.via !== 'module') return
      setTxFlow(
        <EnableSpendingLimitModuleFlow
          safe={safe}
          moduleAddress={enforcement.moduleAddress}
          spenders={data.spenders}
        />,
      )
    },
    [setTxFlow],
  )

  // The panel stays open behind the flow, as the spending limit's edit does, so cancelling lands back on it.
  const editTokenAllowlist = useCallback(
    (policy: TokenAllowlistPolicy) => setTxFlow(<EditTokenAllowlistFlow policy={policy} />),
    [setTxFlow],
  )

  const startProposerFlow = useCallback(() => {
    setTxFlow(<ProposerRoleFlow />)
  }, [setTxFlow])

  const openWizard = useCallback(
    (wizard: PolicyWizardId) => {
      void router.push({ pathname: router.pathname, query: { ...router.query, policy: wizard } })
    },
    [router],
  )

  const handleSelect = useCallback(
    (id: AddPolicyId | PolicyCatalogueId) => {
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

        case 'token-allowlist':
        case 'multisend':
        case 'safe-management': {
          const wizard = POLICY_CATALOGUE.find((entry) => entry.id === id)?.wizard
          if (wizard) openWizard(wizard)
          return
        }

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
    [hasSeenSpendingLimitIntro, startSpendingLimitFlow, hasSeenProposerIntro, startProposerFlow, openWizard],
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
        <SpaceLoading subject="policies" testId="policies-loading" />
      ) : isError ? (
        <SpaceLoadError onReload={onRetry} testId="policies-error" />
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

      {openedPolicy && isGuardPolicy(openedPolicy) && (
        <GuardPolicyDrawer
          policy={openedPolicy}
          onClose={closeDetails}
          onEdit={openedPolicy.type === 'token-allowlist' ? () => editTokenAllowlist(openedPolicy) : undefined}
        />
      )}

      {openedPolicy && isProposerPolicy(openedPolicy) && openedPolicy.data.proposers[0] && (
        <ProposerDetails policy={openedPolicy} proposer={openedPolicy.data.proposers[0]} onClose={closeDetails} />
      )}

      {openedPolicy && isSpendingLimitPolicy(openedPolicy) && (
        <SpendingLimitDetails
          policy={openedPolicy}
          isUnlisted={!listedPolicy}
          onClose={closeDetails}
          onEdit={isSpendingLimitLocked ? undefined : () => editSpendingLimit(openedPolicy.safe)}
          onEnableModule={isSpendingLimitLocked ? undefined : () => enableSpendingLimitModule(openedPolicy)}
        />
      )}
    </div>
  )
}

/**
 * `?policy=` swaps the overview for that policy's builder. The builder picks its own Safe, so it
 * replaces the page rather than opening over it.
 */
const Policies = (props: PoliciesProps): ReactElement => {
  const router = useRouter()
  const wizard = router.query.policy

  if (isWizardId(wizard)) {
    const Wizard = WIZARDS[wizard]
    return <Wizard safe={parsePolicySafe(router.query.policySafe)} />
  }

  return <PoliciesOverview {...props} />
}

export default Policies
