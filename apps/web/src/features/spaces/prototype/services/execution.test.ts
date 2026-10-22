import {
  advanceExecution,
  canSpeedUp,
  EXECUTION_TIMING,
  formatElapsed,
  getInitialExecutions,
  getLockingTx,
  speedUpExecution,
  startExecution,
} from './execution'
import { createPreviewQueue } from './queue'

describe('execution states', () => {
  it('moves from Processing to Indexing to done', () => {
    const started = startExecution('tx', 0)
    expect(advanceExecution(started, EXECUTION_TIMING.processing - 1)).toBe(started)
    const indexing = advanceExecution(started, EXECUTION_TIMING.processing)
    expect(indexing).toMatchObject({ phase: 'indexing', phaseAt: EXECUTION_TIMING.processing })
    expect(advanceExecution(indexing as never, EXECUTION_TIMING.processing + EXECUTION_TIMING.indexing)).toBe('done')
  })

  it('stays in Processing when stuck, until it is sped up', () => {
    const stuck = startExecution('tx', 0, true)
    expect(advanceExecution(stuck, 600_000)).toBe(stuck)
    expect(canSpeedUp(stuck, 0)).toBe(true)
    const fast = speedUpExecution(stuck, 600_000)
    expect(canSpeedUp(fast, 600_000)).toBe(false)
    expect(advanceExecution(fast, 600_000 + EXECUTION_TIMING.spedUp)).toMatchObject({ phase: 'indexing' })
  })

  it('offers Speed up only after a while', () => {
    const started = startExecution('tx', 0)
    expect(canSpeedUp(started, EXECUTION_TIMING.speedUpAfter - 1)).toBe(false)
    expect(canSpeedUp(started, EXECUTION_TIMING.speedUpAfter)).toBe(true)
  })

  it('locks a transaction at the same nonce as one that is executing', () => {
    const { items } = createPreviewQueue('5-safes', 'executing')
    const executions = getInitialExecutions(items, 'executing', 0)
    const rejection = items.find((tx) => tx.id === 'payroll-17-reject')!
    expect(getLockingTx(rejection, items, executions)?.id).toBe('payroll-17')
    expect(
      getLockingTx(
        items.find((tx) => tx.id === 'payroll-18')!,
        items,
        executions,
      ),
    ).toBeUndefined()
  })

  it('formats elapsed time as minutes and seconds', () => {
    expect(formatElapsed(75_000)).toBe('1:15')
    expect(formatElapsed(-5)).toBe('0:00')
  })
})
