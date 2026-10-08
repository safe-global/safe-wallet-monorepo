import meta, { withAccess, NewTokenTransferReview as NewTokenTransferReviewStory } from './safenetTxFlowStories'

/** Compatibility coverage for chains/environments where the Pro rollout flag is off. */
export default {
  ...meta,
  title: 'Pages/Safenet/Transaction flow - Pro rollout off',
  args: { ...meta.args, access: 'pro-disabled' as const },
}

export const NewTokenTransferReview = withAccess(NewTokenTransferReviewStory, 'pro-disabled')
