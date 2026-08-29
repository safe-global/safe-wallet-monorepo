import { type ReactElement } from 'react'
import { Typography } from '@/components/ui/typography'
import ExternalLink from '@/components/common/ExternalLink'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import PolicyCatalogue from './PolicyCatalogue'
import PoliciesList from './PoliciesList'
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
  onSelectPolicyType?: (id: PolicyCatalogueId) => void
  onSelectPolicy?: (policy: Policy) => void
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
  onSelectPolicyType,
  onSelectPolicy,
}: PoliciesProps): ReactElement => {
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
          onSelectPolicy={onSelectPolicy}
        />
      ) : (
        <PolicyCatalogue onSelect={onSelectPolicyType} />
      )}
    </div>
  )
}

export default Policies
