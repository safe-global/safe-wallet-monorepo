export const HOME_PATH = '/'

export const CREATE_BATCH_PATH = HOME_PATH
export const BATCH_PATH = '/batch'
export const SAVE_BATCH_PATH = BATCH_PATH
export const EDIT_BATCH_PATH = `${BATCH_PATH}/:batchId`

export const REVIEW_AND_CONFIRM_PATH = '/review-and-confirm'

export const TRANSACTION_LIBRARY_PATH = '/transaction-library'

export const getEditBatchUrl = (batchId: string | number) => {
  return `${BATCH_PATH}/${batchId}`
}
