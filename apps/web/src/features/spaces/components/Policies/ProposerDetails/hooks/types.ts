import type { Proposer, ProposerPolicy } from '../../types'

export type ProposerRef = {
  policy: ProposerPolicy
  proposer: Proposer
}

export type ProposerDetailsArgs = ProposerRef & {
  /** Opens the remove confirmation. */
  onRemove: () => void
}
