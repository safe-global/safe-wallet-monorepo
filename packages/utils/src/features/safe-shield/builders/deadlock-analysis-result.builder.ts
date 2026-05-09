import { Severity, DeadlockStatus, CommonSharedStatus, type AnalysisResult } from '../types'

export class DeadlockAnalysisResultBuilder<T extends DeadlockStatus | CommonSharedStatus> {
  private result: AnalysisResult<T>

  constructor() {
    this.result = {
      severity: Severity.CRITICAL,
      type: DeadlockStatus.DEADLOCK_DETECTED as T,
      title: 'Signing deadlock detected',
      description:
        'This transaction would create a signing deadlock in the nested Safe configuration, making future transactions impossible.',
    }
  }

  severity(severity: Severity): this {
    this.result.severity = severity
    return this
  }

  type(type: T): this {
    this.result.type = type
    return this
  }

  title(title: string): this {
    this.result.title = title
    return this
  }

  description(description: string): this {
    this.result.description = description
    return this
  }

  build(): AnalysisResult<T> {
    return { ...this.result }
  }

  static deadlockDetected(): DeadlockAnalysisResultBuilder<DeadlockStatus.DEADLOCK_DETECTED> {
    return new DeadlockAnalysisResultBuilder<DeadlockStatus.DEADLOCK_DETECTED>()
  }

  static nestedSafeWarning(): DeadlockAnalysisResultBuilder<DeadlockStatus.NESTED_SAFE_WARNING> {
    return new DeadlockAnalysisResultBuilder<DeadlockStatus.NESTED_SAFE_WARNING>()
      .severity(Severity.WARN)
      .type(DeadlockStatus.NESTED_SAFE_WARNING)
      .title('Nested Safe configuration warning')
      .description('This transaction modifies a nested Safe configuration. Review the changes carefully.')
  }
}
