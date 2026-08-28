import { useState, type ReactElement } from 'react'
import { Typography } from '@/components/ui/typography'
import ExternalLink from '@/components/common/ExternalLink'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import PolicyCatalogue from './PolicyCatalogue'
import PoliciesList from './PoliciesList'
import PolicyDetailPanel from './PolicyDetailPanel'
import { type PolicyCatalogueId } from './PolicyCatalogue/catalogue'
import type { Policy } from './types'

interface PoliciesProps {
  /** Fixtures until WA-3451 connects CGW. */
  policies?: Policy[]
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  /** Opens the catalogue picker from the populated mode's `Add policy` button. */
  onAddPolicy?: () => void
  /** Owners of the Safes in this Space, keyed by `${chainId}:${address}`. Wired by WA-3451. */
  signersBySafe?: Record<string, string[]>
  onEditPolicy?: (policy: Policy) => void
  onDeletePolicy?: (policy: Policy) => void
  onSelectPolicyType?: (id: PolicyCatalogueId) => void
}

/**
 * The page has two modes. With no policies it shows the catalogue of policies that can be set up.
 * With policies it shows the list of policies already set up. Revoking the last policy removes it
 * from the CGW response, so the page returns to the catalogue.
 */
const Policies = ({
  policies = [],
  isLoading = false,
  isError = false,
  onRetry,
  onAddPolicy,
  signersBySafe = {},
  onEditPolicy,
  onDeletePolicy,
  onSelectPolicyType,
}: PoliciesProps): ReactElement => {
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)
  const isPopulated = isLoading || isError || policies.length > 0

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

      {isPopulated ? (
        <PoliciesList
          policies={policies}
          isLoading={isLoading}
          isError={isError}
          onRetry={onRetry}
          onAddPolicy={onAddPolicy}
          onSelectPolicy={setSelectedPolicy}
        />
      ) : (
        <PolicyCatalogue onSelect={onSelectPolicyType} />
      )}

      <PolicyDetailPanel
        policy={selectedPolicy}
        onClose={() => setSelectedPolicy(null)}
        signers={
          selectedPolicy ? signersBySafe[`${selectedPolicy.safe.chainId}:${selectedPolicy.safe.address}`] : undefined
        }
        onEdit={onEditPolicy}
        onDelete={onDeletePolicy}
      />
    </div>
  )
}

export default Policies
