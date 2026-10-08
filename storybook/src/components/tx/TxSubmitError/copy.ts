export const COULD_NOT_SUBMIT_MESSAGE = 'Could not submit the transaction.'
export const COULD_NOT_SUBMIT_RETRY_MESSAGE = 'Could not submit the transaction. Try again.'

export const getRevertedMessage = (network?: string): string =>
  `Transaction reverted on ${network ?? 'the network'}. Gas was spent.`
