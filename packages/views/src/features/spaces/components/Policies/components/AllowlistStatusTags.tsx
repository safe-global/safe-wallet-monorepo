import type { AllowlistStatusBadge } from '@safe-global/views/features/spaces/components/Policies/allowlistStatus'
import AllowlistChangeChip from '@safe-global/views/features/spaces/components/Policies/components/AllowlistChangeChip'
import PolicyStatusChip from '@safe-global/views/features/spaces/components/Policies/components/PolicyStatusChip'

/** The change and the status of the change side by side; they wrap when the panel header is too narrow. */
const AllowlistStatusTags = ({ badge }: { badge: AllowlistStatusBadge }) => (
  <div className="flex flex-wrap items-center justify-end gap-1.5" data-testid="allowlist-status-tags">
    {badge.change && <AllowlistChangeChip change={badge.change} variant={badge.variant} />}
    <PolicyStatusChip badge={badge} />
  </div>
)

export default AllowlistStatusTags
