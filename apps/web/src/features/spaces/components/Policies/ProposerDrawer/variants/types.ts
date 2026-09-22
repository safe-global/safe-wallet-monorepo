import type { ActiveProposerProps } from './ActiveProposer'
import type { NotActivatedProposerProps } from './NotActivatedProposer'
import type { PendingProposerProps } from './PendingProposer'

export enum ProposerStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  NOT_ACTIVATED = 'NOT_ACTIVATED',
}

export type ProposerVariantContentProps =
  | ({ status: ProposerStatus.ACTIVE } & ActiveProposerProps)
  | ({ status: ProposerStatus.PENDING } & PendingProposerProps)
  | ({ status: ProposerStatus.NOT_ACTIVATED } & NotActivatedProposerProps)
