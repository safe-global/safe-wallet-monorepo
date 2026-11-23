export const QUEUE_COLUMNS = ['Nonce', 'Safe', 'Transaction', 'Details', 'Note', 'Status', 'Action'] as const

export type QueueColumn = (typeof QUEUE_COLUMNS)[number]
