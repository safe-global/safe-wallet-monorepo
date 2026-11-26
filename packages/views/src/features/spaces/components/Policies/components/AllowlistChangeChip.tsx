import { Badge, BadgeDot } from '@safe-global/views/components/ui/badge'
import {
  ALLOWLIST_CHANGE_LABEL,
  type AllowlistChange,
} from '@safe-global/views/features/spaces/components/Policies/allowlistStatus'
import type { PolicyStatusVariant } from '@safe-global/views/features/spaces/components/Policies/components/PolicyStatusChip'

export type AllowlistChangeChipProps = {
  change: AllowlistChange
  /** The colour of the status beside it. */
  variant: PolicyStatusVariant
}

const AllowlistChangeChip = ({ change, variant }: AllowlistChangeChipProps) => (
  <Badge variant={variant} size="status" shape="status" data-testid={`policy-change-${change}`}>
    <BadgeDot />
    {ALLOWLIST_CHANGE_LABEL[change]}
  </Badge>
)

export default AllowlistChangeChip
