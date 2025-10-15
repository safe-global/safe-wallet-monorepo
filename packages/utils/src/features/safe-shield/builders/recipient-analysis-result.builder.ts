import { Severity, RecipientStatus, type AnalysisResult } from '../types'

export class RecipientAnalysisResultBuilder<T extends RecipientStatus> {
  private result: AnalysisResult<T>

  constructor() {
    this.result = {
      severity: Severity.INFO,
      type: RecipientStatus.NEW_RECIPIENT as T,
      title: 'New Recipient',
      description: 'First interaction with this recipient.',
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

  // Preset methods for common scenarios
  static knownRecipient(): RecipientAnalysisResultBuilder<RecipientStatus.KNOWN_RECIPIENT> {
    return new RecipientAnalysisResultBuilder<RecipientStatus.KNOWN_RECIPIENT>()
      .severity(Severity.OK)
      .type(RecipientStatus.KNOWN_RECIPIENT)
      .title('Known Recipient')
      .description('This recipient is in your address book or is an owned Safe.')
  }

  static unknownRecipient(): RecipientAnalysisResultBuilder<RecipientStatus.UNKNOWN_RECIPIENT> {
    return new RecipientAnalysisResultBuilder<RecipientStatus.UNKNOWN_RECIPIENT>()
      .severity(Severity.INFO)
      .type(RecipientStatus.UNKNOWN_RECIPIENT)
      .title('Unknown Recipient')
      .description('This recipient is not in your address book and is not an owned Safe.')
  }

  static highActivity(): RecipientAnalysisResultBuilder<RecipientStatus.HIGH_ACTIVITY> {
    return new RecipientAnalysisResultBuilder<RecipientStatus.HIGH_ACTIVITY>()
      .severity(Severity.OK)
      .type(RecipientStatus.HIGH_ACTIVITY)
      .title('High Activity')
      .description('This address has many transactions.')
  }

  static lowActivity(): RecipientAnalysisResultBuilder<RecipientStatus.LOW_ACTIVITY> {
    return new RecipientAnalysisResultBuilder<RecipientStatus.LOW_ACTIVITY>()
      .severity(Severity.WARN)
      .type(RecipientStatus.LOW_ACTIVITY)
      .title('Low Activity')
      .description('This address has few or no transactions.')
  }

  static newRecipient(): RecipientAnalysisResultBuilder<RecipientStatus.NEW_RECIPIENT> {
    return new RecipientAnalysisResultBuilder<RecipientStatus.NEW_RECIPIENT>()
      .severity(Severity.INFO)
      .type(RecipientStatus.NEW_RECIPIENT)
      .title('New Recipient')
      .description('You are interacting with this recipient for the first time.')
  }

  static recurringRecipient(): RecipientAnalysisResultBuilder<RecipientStatus.RECURRING_RECIPIENT> {
    return new RecipientAnalysisResultBuilder<RecipientStatus.RECURRING_RECIPIENT>()
      .severity(Severity.OK)
      .type(RecipientStatus.RECURRING_RECIPIENT)
      .title('Recurring Recipient')
      .description('You have interacted with this recipient before.')
  }
}
