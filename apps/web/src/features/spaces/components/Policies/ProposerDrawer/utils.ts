import { ProposerStatus } from './variants/types'

export type ProposerStatusColor = 'success' | 'warning' | 'destructive'

const STATUS_LABELS: Record<ProposerStatus, string> = {
  [ProposerStatus.ACTIVE]: 'Active',
  [ProposerStatus.PENDING]: 'Pending',
  [ProposerStatus.NOT_ACTIVATED]: 'Not activated',
}

const STATUS_COLORS: Record<ProposerStatus, ProposerStatusColor> = {
  [ProposerStatus.ACTIVE]: 'success',
  [ProposerStatus.PENDING]: 'warning',
  [ProposerStatus.NOT_ACTIVATED]: 'destructive',
}

export const getProposerStatusLabel = (status: ProposerStatus): string => STATUS_LABELS[status]

export const getProposerStatusColor = (status: ProposerStatus): ProposerStatusColor => STATUS_COLORS[status]
