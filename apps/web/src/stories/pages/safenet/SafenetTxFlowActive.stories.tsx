import meta, {
  withAccess,
  ConfirmSimulating as ConfirmSimulatingStory,
  ConfirmNoIssuesFound as ConfirmNoIssuesFoundStory,
  ConfirmRiskDetected as ConfirmRiskDetectedStory,
  ConfirmCheckFailed as ConfirmCheckFailedStory,
  NewTransactionReview as NewTransactionReviewStory,
} from './safenetTxFlowStories'

const activePlanMeta = {
  ...meta,
  title: 'Pages/Safenet/Transaction flow - Active Pro plan',
  args: { ...meta.args, access: 'active' as const },
}

export default activePlanMeta

export const ConfirmSimulating = withAccess(ConfirmSimulatingStory, 'active')
export const ConfirmNoIssuesFound = withAccess(ConfirmNoIssuesFoundStory, 'active')
export const ConfirmRiskDetected = withAccess(ConfirmRiskDetectedStory, 'active')
export const ConfirmCheckFailed = withAccess(ConfirmCheckFailedStory, 'active')
export const NewTransactionReview = {
  ...withAccess(NewTransactionReviewStory, 'active'),
  name: 'New transaction review',
}
