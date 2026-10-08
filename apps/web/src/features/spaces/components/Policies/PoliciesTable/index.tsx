import { useSafeNameResolver } from '@/hooks/useAllAddressBooks'
import useChains from '@/hooks/useChains'
import { AppRoutes } from '@/config/routes'
import { buildSafeHref } from '@/features/spaces/utils/safeHref'
import { useUrlSpaceId } from '@/hooks/useUrlSpaceId'
import type { Policy } from '@views/features/spaces/components/Policies/types'
import { PoliciesTableView } from '@views/features/spaces/components/Policies/PoliciesTable/PoliciesTableView'

export type PoliciesTableProps = {
  policies: Policy[]
  /** Shown in the row because spenders are otherwise only in the detail panel. */
  matchedSpenderNames?: Map<string, string>
  onSelect?: (policy: Policy) => void
}

/**
 * One row per Safe, chain and policy. A spending-limit policy holds every spender for its Safe, so
 * a Safe with five spenders is a single row and the spenders are listed in the detail panel.
 *
 * Revoked policies are not in the CGW response, so nothing here has to filter them out.
 */
const PoliciesTable = ({ policies, matchedSpenderNames, onSelect }: PoliciesTableProps) => {
  const resolveSafeName = useSafeNameResolver()
  const { configs } = useChains()
  const spaceId = useUrlSpaceId()
  const getShortName = (chainId: string) => configs.find((chain) => chain.chainId === chainId)?.shortName

  return (
    <PoliciesTableView
      policies={policies}
      matchedSpenderNames={matchedSpenderNames}
      onSelect={onSelect}
      getSafeName={(policy) => resolveSafeName(policy.safe.address, policy.safe.chainId) || undefined}
      getSafeHref={(policy) =>
        buildSafeHref(AppRoutes.settings.setup, getShortName(policy.safe.chainId), policy.safe.address, spaceId)
      }
    />
  )
}

export default PoliciesTable
