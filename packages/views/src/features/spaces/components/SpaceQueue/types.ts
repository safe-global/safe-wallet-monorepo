export type QueueStatus = 'execute' | 'sign' | 'waiting' | 'blocked'

/** A transaction's place among those sharing its nonce, `option` counting from 1. */
export type ConflictOption = { option: number; size: number }

/** An option of the Status filter: a status, or a flag that narrows the chosen statuses */
export type QueueStatusOption = QueueStatus | 'conflicting' | 'stale'

/** The filters a chip removes, named like the queue filters */
export type QueueFilterKey = 'statuses' | 'safes' | 'chainIds' | 'signers'

/** How the Space queue arranges its transactions: one list by urgency, or grouped */
export type QueueGroupBy = 'status' | 'next' | 'safe' | 'network'
