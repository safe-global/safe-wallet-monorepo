import { useCallback, type ReactElement } from 'react'
import { Typography } from '@/components/ui/typography'
import ExternalLink from '@/components/common/ExternalLink'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import PolicyCatalogue from './PolicyCatalogue'
import { type PolicyCatalogueId } from './PolicyCatalogue/catalogue'
import usePolicyFlowGate from './hooks/usePolicyFlowGate'

interface PoliciesProps {
  /**
   * Opens the flow for the selected policy type. The flow requires a connected wallet; the page
   * does not, so reading the page is possible without one.
   */
  onOpenFlow?: (id: PolicyCatalogueId) => void
}

const Policies = ({ onOpenFlow }: PoliciesProps): ReactElement => {
  const gateFlow = usePolicyFlowGate()

  const handleSelect = useCallback(
    (id: PolicyCatalogueId) => {
      if (!onOpenFlow) return
      gateFlow(() => onOpenFlow(id))
    },
    [gateFlow, onOpenFlow],
  )

  return (
    <div data-testid="policies">
      <div className="mb-6 flex flex-col gap-6">
        <Typography variant="h2" className="font-bold leading-[1] tracking-tight">
          Policies
        </Typography>

        <Typography variant="paragraph-medium">
          Policies are rules that help you manage your Safe accounts. Set them up once and they will run onchain,
          automatically.{' '}
          <ExternalLink className="font-bold hover:text-muted-foreground" href={HelpCenterArticle.POLICIES}>
            Learn more
          </ExternalLink>
        </Typography>
      </div>

      {/* TODO(WA-3138, WA-3160): supply onOpenFlow from the proposer form and the Suggest a policy dialog */}
      <PolicyCatalogue onSelect={handleSelect} />
    </div>
  )
}

export default Policies
