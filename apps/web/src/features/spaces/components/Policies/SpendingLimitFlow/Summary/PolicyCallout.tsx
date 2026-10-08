import type { ReactElement } from 'react'
import { describeEdit, describePolicy, isEditSummary } from './describePolicy'
import type { SpendingLimitSummaryModel } from '@views/features/spaces/components/Policies/SpendingLimitFlow/Summary/types'
import { PolicyCalloutView } from '@views/features/spaces/components/Policies/SpendingLimitFlow/Summary/PolicyCalloutView'

const PolicyCallout = ({ policy }: { policy: SpendingLimitSummaryModel }): ReactElement => {
  const { title, description } = isEditSummary(policy) ? describeEdit(policy) : describePolicy(policy)

  return <PolicyCalloutView title={title} description={description} />
}

export default PolicyCallout
