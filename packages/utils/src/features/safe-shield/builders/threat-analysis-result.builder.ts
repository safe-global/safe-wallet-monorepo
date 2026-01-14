import {
  CommonSharedStatus,
  type MaliciousOrModerateThreatAnalysisResult,
  Severity,
  ThreatStatus,
  type ThreatAnalysisResult,
} from '../types'

export class ThreatAnalysisResultBuilder<
  T extends ThreatStatus | CommonSharedStatus = ThreatStatus | CommonSharedStatus,
> {
  private result: ThreatAnalysisResult

  constructor() {
    this.result = {
      severity: Severity.OK,
      type: ThreatStatus.NO_THREAT,
      title: 'No threat detected',
      description: 'Threat analysis found no issues',
      before: undefined,
      after: undefined,
      issues: undefined,
    } as ThreatAnalysisResult
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

  error(error: string): this {
    this.result.error = error
    return this
  }

  issues(issues: MaliciousOrModerateThreatAnalysisResult['issues'] | undefined): this {
    if ('issues' in this.result) {
      this.result.issues = issues
    }
    return this
  }

  changes(before: string, after: string): this {
    if ('before' in this.result && 'after' in this.result) {
      this.result.before = before
      this.result.after = after
    }
    return this
  }

  build(): ThreatAnalysisResult {
    return { ...this.result }
  }

  // Preset methods for common scenarios
  static noThreat() {
    return new ThreatAnalysisResultBuilder<ThreatStatus.NO_THREAT>()
  }

  static malicious() {
    return new ThreatAnalysisResultBuilder<ThreatStatus.MALICIOUS>()
      .title('Malicious threat detected')
      .type(ThreatStatus.MALICIOUS)
      .severity(Severity.CRITICAL)
      .description('The transaction {reason_phrase} {classification_phrase}')
      .issues({
        [Severity.CRITICAL]: [
          {
            address: '0x1234567890123456789012345678901234567890',
            description: 'Bulleted list from validation.features, grouped by Malicious first, then Warnings.',
          },
          {
            address: '0x1234567890123456789012345678901234567890',
            description: 'Issue 2',
          },
        ],
        [Severity.WARN]: [
          { description: 'Issue 4', address: '0x1234567890123456789012345678901234567890' },
          { description: 'Issue without address' },
        ],
        [Severity.INFO]: [{ description: 'Issue 6' }, { description: 'Issue 7' }],
      })
  }

  static moderate() {
    return new ThreatAnalysisResultBuilder<ThreatStatus.MODERATE>()
      .title('Moderate threat detected')
      .type(ThreatStatus.MODERATE)
      .severity(Severity.WARN)
      .description('The transaction {reason_phrase} {classification_phrase}. Cancel this transaction.')
      .issues({
        [Severity.CRITICAL]: [
          {
            description: 'Bulleted list from validation.features, grouped by Malicious first, then Warnings.',
          },
        ],
      })
  }

  static failedWithError() {
    return new ThreatAnalysisResultBuilder<CommonSharedStatus.FAILED>()
      .title('Threat analysis failed')
      .type(CommonSharedStatus.FAILED)
      .severity(Severity.WARN)
      .description('Threat analysis failed. Review before processing.')
      .error('Simulation Error: Reverted')
  }

  static failedWithoutError() {
    return new ThreatAnalysisResultBuilder<CommonSharedStatus.FAILED>()
      .title('Threat analysis failed')
      .type(CommonSharedStatus.FAILED)
      .severity(Severity.WARN)
      .description('Threat analysis failed. Review before processing.')
  }

  // for backwards compatibility:
  static failed() {
    return this.failedWithoutError()
  }

  static ownershipChange() {
    return new ThreatAnalysisResultBuilder<ThreatStatus.OWNERSHIP_CHANGE>()
      .title('Ownership change')
      .type(ThreatStatus.OWNERSHIP_CHANGE)
      .severity(Severity.WARN)
      .description("Verify this change before proceeding as it will change the Safe's ownership")
  }

  static moduleChange() {
    return new ThreatAnalysisResultBuilder<ThreatStatus.MODULE_CHANGE>()
      .title('Modules change')
      .type(ThreatStatus.MODULE_CHANGE)
      .severity(Severity.WARN)
      .description('Verify this change before proceeding as it will change Safe modules.')
  }

  static masterCopyChange() {
    return new ThreatAnalysisResultBuilder<ThreatStatus.MASTERCOPY_CHANGE>()
      .title('Mastercopy change')
      .type(ThreatStatus.MASTERCOPY_CHANGE)
      .severity(Severity.WARN)
      .description('Verify this change as it may overwrite account ownership.')
      .changes('0x1234567890123456789012345678901234567890', '0x1234567890123456789012345678901234567891')
  }

  static customChecksPassed() {
    return new ThreatAnalysisResultBuilder<ThreatStatus.NO_THREAT>()
      .title('Custom checks')
      .type(ThreatStatus.NO_THREAT)
      .severity(Severity.OK)
      .description('Custom checks found no issues.')
  }

  static customCheckFailed() {
    return new ThreatAnalysisResultBuilder<ThreatStatus.HYPERNATIVE_GUARD>()
      .title('Custom check failed')
      .type(ThreatStatus.HYPERNATIVE_GUARD)
      .severity(Severity.WARN)
      .description('Custom check failed. Review before processing.')
  }
}
