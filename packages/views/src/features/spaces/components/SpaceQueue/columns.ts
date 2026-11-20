export const QUEUE_COLUMNS = ['Nonce', 'Transaction', 'To', 'Proposed', 'Signatures', 'Urgency', 'Action'] as const

export type QueueColumn = (typeof QUEUE_COLUMNS)[number]
