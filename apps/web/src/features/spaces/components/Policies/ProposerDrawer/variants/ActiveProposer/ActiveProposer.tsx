import type { ReactElement } from 'react'
import { ProposerOverview, type ProposerOverviewProps } from '../../components/ProposerOverview'

export type ActiveProposerProps = {
  overview: ProposerOverviewProps
}

/** A live proposer role: its facts, and nothing it still needs from the user. */
export const ActiveProposer = ({ overview }: ActiveProposerProps): ReactElement => <ProposerOverview {...overview} />
