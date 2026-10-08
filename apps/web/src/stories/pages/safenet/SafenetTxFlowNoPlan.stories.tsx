import meta, {
  withAccess,
  ConfirmSimulating as ConfirmSimulatingStory,
  NewTransactionReview as NewTransactionReviewStory,
} from './safenetTxFlowStories'

export default {
  ...meta,
  title: 'Pages/Safenet/Transaction flow - No Plan',
  args: { ...meta.args, access: 'no-plan' as const },
}

export const ConfirmTransaction = withAccess(ConfirmSimulatingStory, 'no-plan')
export const NewTransactionReview = {
  ...withAccess(NewTransactionReviewStory, 'no-plan'),
  name: 'New transaction review',
}
