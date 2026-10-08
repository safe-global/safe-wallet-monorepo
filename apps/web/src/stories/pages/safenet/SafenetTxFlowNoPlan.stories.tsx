import meta, {
  withAccess,
  ConfirmSimulating as ConfirmSimulatingStory,
  NewTokenTransferReview as NewTokenTransferReviewStory,
  NewNativeTransferReview as NewNativeTransferReviewStory,
} from './safenetTxFlowStories'

export default {
  ...meta,
  title: 'Pages/Safenet/Transaction flow - No Plan',
  args: { ...meta.args, access: 'no-plan' as const },
}

export const ConfirmTransaction = withAccess(ConfirmSimulatingStory, 'no-plan')
export const NewTokenTransferReview = withAccess(NewTokenTransferReviewStory, 'no-plan')

export const NewNativeTransferReview = withAccess(NewNativeTransferReviewStory, 'no-plan')
