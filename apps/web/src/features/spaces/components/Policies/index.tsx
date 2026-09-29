import { useCallback, useContext, useState, type ReactElement } from 'react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { TxModalContext } from '@/components/tx-flow'
import ExternalLink from '@/components/common/ExternalLink'
import { Typography } from '@/components/ui/typography'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import AddPolicyDialog from './AddPolicyDialog'
import type { AddPolicyId } from './AddPolicyDialog/options'
import PoliciesList from './PoliciesList'
import { PoliciesLoadError, PoliciesLoading } from './PoliciesLoadState'
import PolicyCatalogue from './PolicyCatalogue'
import ProposerIntroDialog from './ProposerIntroDialog'
import { PROPOSER_INTRO_SEEN_KEY } from './ProposerIntroDialog/constants'
import ProposerDetails from './ProposerDetails'
import ProposerRoleFlow from './ProposerRoleFlow'
import SpendingLimitFlow from './SpendingLimitFlow'
import SpendingLimitIntroDialog from './SpendingLimitIntroDialog'
import { SPENDING_LIMIT_INTRO_SEEN_KEY } from './SpendingLimitIntroDialog/constants'
import { REQUEST_POLICY_FORM_HEIGHT, REQUEST_POLICY_FORM_URL, REQUEST_POLICY_FORM_WIDTH } from './constants'
import { isProposerPolicy, type Policy, type Proposer, type ProposerPolicy } from './types'

interface PoliciesProps {
  /** Supplied by the caller. The page does not fetch. */
  policies?: Policy[]
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  /** The populated mode's `Add policy` button. Without it the button opens the add policy dialog. */
  onAddPolicy?: () => void
  onSelectPolicy?: (policy: Policy) => void
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
  const { setTxFlow } = useContext(TxModalContext)

  const [hasSeenProposerIntro = false, setHasSeenProposerIntro] = useLocalStorage<boolean>(PROPOSER_INTRO_SEEN_KEY)
  const [isProposerIntroOpen, setIsProposerIntroOpen] = useState(false)
  const [isAddPolicyOpen, setIsAddPolicyOpen] = useState(false)
  const [openProposer, setOpenProposer] = useState<{ policy: ProposerPolicy; proposer: Proposer } | null>(null)

  const openPolicy = useCallback((policy: Policy) => {
    if (!isProposerPolicy(policy)) return

    const [proposer] = policy.data.proposers
    if (proposer) setOpenProposer({ policy, proposer })
  }, [])

  const startSpendingLimitFlow = useCallback(() => setTxFlow(<SpendingLimitFlow />), [setTxFlow])

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
        <PoliciesList
          policies={policies}
          onAddPolicy={onAddPolicy ?? (() => setIsAddPolicyOpen(true))}
          onSelectPolicy={onSelectPolicy ?? openPolicy}
        />
      ) : (
        <PolicyCatalogue onSelect={handleSelect} />
      )}

      <AddPolicyDialog open={isAddPolicyOpen} onOpenChange={setIsAddPolicyOpen} onSelect={selectFromAddPolicyDialog} />

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

      {openProposer && <ProposerDetails {...openProposer} onClose={() => setOpenProposer(null)} />}
    </div>
  )
}

export default Policies
