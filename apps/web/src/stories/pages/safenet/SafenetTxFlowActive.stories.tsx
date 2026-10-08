import meta, {
  withAccess,
  ConfirmSimulating as ConfirmSimulatingStory,
  ConfirmNoIssuesFound as ConfirmNoIssuesFoundStory,
  ConfirmRiskDetected as ConfirmRiskDetectedStory,
  ConfirmCheckFailed as ConfirmCheckFailedStory,
  NewTokenTransferReview as NewTokenTransferReviewStory,
  NewNativeTransferReview as NewNativeTransferReviewStory,
} from './safenetTxFlowStories'

export default {
  ...meta,
  title: 'Pages/Safenet/Transaction flow - Active Pro plan',
  args: { ...meta.args, access: 'active' as const },
}

export const ConfirmSimulating = withAccess(ConfirmSimulatingStory, 'active')
export const ConfirmNoIssuesFound = withAccess(ConfirmNoIssuesFoundStory, 'active')
export const ConfirmRiskDetected = withAccess(ConfirmRiskDetectedStory, 'active')
export const ConfirmCheckFailed = withAccess(ConfirmCheckFailedStory, 'active')
export const NewTokenTransferReview = withAccess(NewTokenTransferReviewStory, 'active')

export const NewNativeTransferReview = withAccess(NewNativeTransferReviewStory, 'active')
