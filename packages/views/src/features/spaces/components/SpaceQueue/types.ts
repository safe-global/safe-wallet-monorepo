export type QueueStatus = 'execute' | 'sign' | 'waiting' | 'blocked'

/** A transaction's place among those sharing its nonce, `option` counting from 1. */
export type ConflictOption = { option: number; size: number }
