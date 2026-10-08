import type { ReactElement } from 'react'
import { ProposerOverview, type ProposerOverviewProps } from '../../components/ProposerOverview'

export type ActiveProposerProps = {
  overview: ProposerOverviewProps
}

export const ActiveProposer = ({ overview }: ActiveProposerProps): ReactElement => <ProposerOverview {...overview} />
