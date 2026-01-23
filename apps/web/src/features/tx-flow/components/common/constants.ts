export const TOOLTIP_TITLES = {
  THRESHOLD:
    'The threshold of a Safe Account specifies how many signers need to confirm a Safe Account transaction before it can be executed.',
  REVIEW_WINDOW:
    'A period that begins after a recovery is submitted on-chain, during which the Safe Account signers can review the proposal and cancel it before it is executable.',
  PROPOSAL_EXPIRY: 'A period after which the recovery proposal will expire and can no longer be executed.',
} as const
