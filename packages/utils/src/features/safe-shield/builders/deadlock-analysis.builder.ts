import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import type { DeadlockAnalysisResults, AnalysisResult } from '../types'
import { DeadlockStatus } from '../types'
import { DeadlockAnalysisResultBuilder } from './deadlock-analysis-result.builder'

export class DeadlockAnalysisBuilder {
  private deadlockAnalysis: DeadlockAnalysisResults

  constructor() {
    this.deadlockAnalysis = {}
  }

  createDeadlock(result: AnalysisResult<DeadlockStatus>) {
    this.deadlockAnalysis.DEADLOCK = [result]
    return this
  }

  addDeadlock(result: AnalysisResult<DeadlockStatus>) {
    if (!this.deadlockAnalysis.DEADLOCK) {
      this.deadlockAnalysis.DEADLOCK = []
    }
    this.deadlockAnalysis.DEADLOCK.push(result)
    return this
  }

  build(): AsyncResult<DeadlockAnalysisResults> {
    return [this.deadlockAnalysis, undefined, false]
  }

  static deadlockDetected() {
    return new DeadlockAnalysisBuilder()
      .createDeadlock(DeadlockAnalysisResultBuilder.deadlockDetected().build())
      .build()
  }

  static nestedSafeWarning() {
    return new DeadlockAnalysisBuilder()
      .createDeadlock(DeadlockAnalysisResultBuilder.nestedSafeWarning().build())
      .build()
  }
}
