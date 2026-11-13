import type { Proposal, QueueState } from '../types'
import { getConflicts, getState } from './model'

// Production's pending states after Execute: Processing until mined, then Indexing until the queue updates.
export type ExecutionPhase = 'processing' | 'indexing'
export type Execution = {
  phase: ExecutionPhase
  startedAt: number
  phaseAt: number
  spedUp: boolean
  // Stays in Processing until someone speeds it up, as a low-gas transaction would.
  stuck: boolean
  hash: string
}
export type Executions = Record<string, Execution>

// Compressed for the preview. Mainnet can take minutes.
export const EXECUTION_TIMING = { processing: 10_000, spedUp: 4_000, indexing: 4_000, speedUpAfter: 5_000 }

const fakeHash = (seed: string) =>
  `0x${Array.from({ length: 64 }, (_, index) => ((seed.charCodeAt(index % seed.length) * (index + 3)) % 16).toString(16)).join('')}`

export const startExecution = (id: string, now: number, stuck = false): Execution => ({
  phase: 'processing',
  startedAt: now,
  phaseAt: now,
  spedUp: false,
  stuck,
  hash: fakeHash(id),
})

export const advanceExecution = (execution: Execution, now: number): Execution | 'done' => {
  const elapsed = now - execution.phaseAt
  if (execution.phase === 'processing') {
    if (execution.stuck) return execution
    const limit = execution.spedUp ? EXECUTION_TIMING.spedUp : EXECUTION_TIMING.processing
    return elapsed >= limit ? { ...execution, phase: 'indexing', phaseAt: now } : execution
  }
  return elapsed >= EXECUTION_TIMING.indexing ? 'done' : execution
}

export const speedUpExecution = (execution: Execution, now: number): Execution => ({
  ...execution,
  spedUp: true,
  stuck: false,
  phaseAt: now,
})

export const canSpeedUp = (execution: Execution, now: number) =>
  execution.phase === 'processing' &&
  !execution.spedUp &&
  (execution.stuck || now - execution.startedAt >= EXECUTION_TIMING.speedUpAfter)

// A transaction at the same nonce as one that is executing can't run. If that one succeeds, this one becomes invalid.
export const getLockingTx = (tx: Proposal, items: Proposal[], executions: Executions) =>
  getConflicts(tx, items).find((other) => executions[other.id])

export const formatElapsed = (ms: number) => {
  const seconds = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

// The Executing state opens with the first fully signed transaction stuck in Processing for over a minute.
export const getInitialExecutions = (items: Proposal[], state: QueueState, now: number): Executions => {
  const running = state === 'executing' ? items.find((tx) => getState(tx).ready) : undefined
  return running ? { [running.id]: startExecution(running.id, now - 75_000, true) } : {}
}
