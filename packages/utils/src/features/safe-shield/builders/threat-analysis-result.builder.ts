import {
  Severity,
  type AnalysisResult,
  ThreatStatus,
  CommonSharedStatus,
  MaliciousOrModerateThreatAnalysisResult,
  MasterCopyChangeThreatAnalysisResult,
} from '../types'

export class ThreatAnalysisResultBuilder<T extends ThreatStatus | CommonSharedStatus> {
  private result: AnalysisResult<T> | MaliciousOrModerateThreatAnalysisResult | MasterCopyChangeThreatAnalysisResult

  constructor() {
    this.result = {
      severity: Severity.OK,
      type: ThreatStatus.NO_THREAT as T,
      title: 'No threat detected',
      description: 'Threat analysis found no issues',
      issues: undefined,
      before: undefined,
      after: undefined,
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

  issues(issues: Map<keyof typeof Severity, Array<string>>): this {
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

  build(): AnalysisResult<T> | MaliciousOrModerateThreatAnalysisResult | MasterCopyChangeThreatAnalysisResult {
    return { ...this.result }
  }
  // Preset methods for common scenarios
  static noThreat(): ThreatAnalysisResultBuilder<ThreatStatus.NO_THREAT> {
    return new ThreatAnalysisResultBuilder<ThreatStatus.NO_THREAT>()
  }

  static malicious(): ThreatAnalysisResultBuilder<ThreatStatus.MALICIOUS> {
    return new ThreatAnalysisResultBuilder<ThreatStatus.MALICIOUS>()
      .title('Malicious threat detected')
      .type(ThreatStatus.MALICIOUS)
      .severity(Severity.CRITICAL)
      .description('The transaction {reason_phrase} {classification_phrase}')
      .issues(
        new Map<keyof typeof Severity, Array<string>>([
          [
            Severity.CRITICAL,
            [
              'Bulleted list from validation.features, grouped by Malicious first, then Warnings.',
              'Issue 2',
              'Issue 3',
            ],
          ],
          [Severity.WARN, ['Issue 4', 'Issue 5']],
          [Severity.INFO, ['Issue 6', 'Issue 7']],
        ]),
      )
  }

  static moderate(): ThreatAnalysisResultBuilder<ThreatStatus.MODERATE> {
    return new ThreatAnalysisResultBuilder<ThreatStatus.MODERATE>()
      .title('Moderate threat detected')
      .type(ThreatStatus.MODERATE)
      .severity(Severity.WARN)
      .description('The transaction {reason_phrase} {classification_phrase}. Cancel this transaction.')
      .issues(
        new Map<keyof typeof Severity, Array<string>>([
          [Severity.CRITICAL, ['Bulleted list from validation.features, grouped by Malicious first, then Warnings.']],
        ]),
      )
  }

  static failed(): ThreatAnalysisResultBuilder<CommonSharedStatus.FAILED> {
    return new ThreatAnalysisResultBuilder<CommonSharedStatus.FAILED>()
      .title('Threat analysis failed')
      .type(CommonSharedStatus.FAILED)
      .severity(Severity.WARN)
      .description('Threat analysis failed. Review before processing.')
  }

  static ownershipChange(): ThreatAnalysisResultBuilder<ThreatStatus.OWNERSHIP_CHANGE> {
    return new ThreatAnalysisResultBuilder<ThreatStatus.OWNERSHIP_CHANGE>()
      .title('Ownership change')
      .type(ThreatStatus.OWNERSHIP_CHANGE)
      .severity(Severity.WARN)
      .description("Verify this change before proceeding as it will change the Safe's ownership")
  }

  static moduleChange(): ThreatAnalysisResultBuilder<ThreatStatus.MODULE_CHANGE> {
    return new ThreatAnalysisResultBuilder<ThreatStatus.MODULE_CHANGE>()
      .title('Modules change')
      .type(ThreatStatus.MODULE_CHANGE)
      .severity(Severity.WARN)
      .description('Verify this change before proceeding as it will change Safe modules.')
  }

  static masterCopyChange(): ThreatAnalysisResultBuilder<ThreatStatus.MASTERCOPY_CHANGE> {
    return new ThreatAnalysisResultBuilder<ThreatStatus.MASTERCOPY_CHANGE>()
      .title('Mastercopy change')
      .type(ThreatStatus.MASTERCOPY_CHANGE)
      .severity(Severity.WARN)
      .description('Verify this change as it may overwrite account ownership.')
      .changes('0x1234567890123456789012345678901234567890', '0x1234567890123456789012345678901234567891')
  }
}
