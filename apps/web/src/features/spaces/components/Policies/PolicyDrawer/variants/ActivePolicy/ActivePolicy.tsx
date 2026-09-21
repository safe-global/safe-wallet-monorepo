import type { ReactElement } from 'react'
import { PolicyOverview, type PolicyOverviewProps } from '../../components/PolicyOverview'

export type ActivePolicyProps = {
  overview: PolicyOverviewProps
}

/** A live policy: its facts, and nothing it still needs from the user. */
export const ActivePolicy = ({ overview }: ActivePolicyProps): ReactElement => <PolicyOverview {...overview} />
