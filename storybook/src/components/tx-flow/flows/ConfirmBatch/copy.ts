import { maybePlural } from '@safe-global/utils/utils/formatters'

export const CONFIRM_BATCH_FLOW_COPY = {
  reviewTitle: 'Confirm batch',
  subtitle: (length: number) => `This batch contains ${length} transaction${maybePlural(length)}`,
}
