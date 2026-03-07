import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import type { DeadlockAnalysisResults, AnalysisResult } from '../types'
import { DeadlockStatus, Severity } from '../types'

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
      .createDeadlock({
        severity: Severity.CRITICAL,
        type: DeadlockStatus.DEADLOCK_DETECTED,
        title: 'Signing deadlock detected',
        description:
          'This transaction would create a signing deadlock in the nested Safe configuration, making future transactions impossible.',
      })
      .build()
  }

  static nestedSafeWarning() {
    return new DeadlockAnalysisBuilder()
      .createDeadlock({
        severity: Severity.WARN,
        type: DeadlockStatus.NESTED_SAFE_WARNING,
        title: 'Nested Safe configuration warning',
        description: 'This transaction modifies a nested Safe configuration. Review the changes carefully.',
      })
      .build()
  }
}
