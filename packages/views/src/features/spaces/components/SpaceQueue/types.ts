export type QueueStatus = 'execute' | 'sign' | 'waiting' | 'blocked'

/** An option of the Status filter: a status, or a flag that narrows the chosen statuses */
export type QueueStatusOption = QueueStatus | 'conflicting' | 'stale'

/** The filters a chip removes, named like the queue filters */
export type QueueFilterKey = 'statuses' | 'safes' | 'chainIds' | 'signers'
