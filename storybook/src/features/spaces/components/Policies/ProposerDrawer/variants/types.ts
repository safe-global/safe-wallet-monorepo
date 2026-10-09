import type { ActiveProposerProps } from '@/features/spaces/components/Policies/ProposerDrawer/variants/ActiveProposer'
import type { NotActivatedProposerProps } from '@/features/spaces/components/Policies/ProposerDrawer/variants/NotActivatedProposer'
import type { PendingProposerProps } from '@/features/spaces/components/Policies/ProposerDrawer/variants/PendingProposer'

export enum ProposerStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  NOT_ACTIVATED = 'NOT_ACTIVATED',
}

export type ProposerVariantContentProps =
  | ({ status: ProposerStatus.ACTIVE } & ActiveProposerProps)
  | ({ status: ProposerStatus.PENDING } & PendingProposerProps)
  | ({ status: ProposerStatus.NOT_ACTIVATED } & NotActivatedProposerProps)
