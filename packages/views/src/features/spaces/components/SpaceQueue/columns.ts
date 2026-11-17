export const QUEUE_COLUMNS = ['Nonce', 'Transaction', 'To', 'Proposed', 'Signatures', 'Status', 'Action'] as const

export type QueueColumn = (typeof QUEUE_COLUMNS)[number]
