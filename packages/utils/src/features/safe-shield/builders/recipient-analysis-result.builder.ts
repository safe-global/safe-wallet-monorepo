import { faker } from '@faker-js/faker'
import { Severity, RecipientStatus, BridgeStatus, type AnalysisResult } from '../types'

export class RecipientAnalysisResultBuilder<T extends RecipientStatus | BridgeStatus> {
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
      .title('Known recipient')
      .description('This address is in your address book. ')
  }

  static unknownRecipient(): RecipientAnalysisResultBuilder<RecipientStatus.UNKNOWN_RECIPIENT> {
    return new RecipientAnalysisResultBuilder<RecipientStatus.UNKNOWN_RECIPIENT>()
      .severity(Severity.INFO)
      .type(RecipientStatus.UNKNOWN_RECIPIENT)
      .title('Unknown recipient')
      .description('This recipient is not in your address book and is not an owned Safe.')
  }

  static lowActivity(): RecipientAnalysisResultBuilder<RecipientStatus.LOW_ACTIVITY> {
    return new RecipientAnalysisResultBuilder<RecipientStatus.LOW_ACTIVITY>()
      .severity(Severity.WARN)
      .type(RecipientStatus.LOW_ACTIVITY)
      .title('Low activity')
      .description('This address has few transactions.')
  }

  static newRecipient(): RecipientAnalysisResultBuilder<RecipientStatus.NEW_RECIPIENT> {
    return new RecipientAnalysisResultBuilder<RecipientStatus.NEW_RECIPIENT>()
      .severity(Severity.INFO)
      .type(RecipientStatus.NEW_RECIPIENT)
      .title('New recipient')
      .description('You are interacting with this address for the first time.')
  }

  static recurringRecipient(): RecipientAnalysisResultBuilder<RecipientStatus.RECURRING_RECIPIENT> {
    return new RecipientAnalysisResultBuilder<RecipientStatus.RECURRING_RECIPIENT>()
      .severity(Severity.OK)
      .type(RecipientStatus.RECURRING_RECIPIENT)
      .title('Recurring recipient')
      .description(`You have interacted with this address ${faker.number.int({ min: 2, max: 100 })} times.`)
  }

  static incompatibleSafe(): RecipientAnalysisResultBuilder<BridgeStatus.INCOMPATIBLE_SAFE> {
    return new RecipientAnalysisResultBuilder<BridgeStatus.INCOMPATIBLE_SAFE>()
      .severity(Severity.CRITICAL)
      .type(BridgeStatus.INCOMPATIBLE_SAFE)
      .title('Incompatible Safe version')
      .description(
        'This Safe account cannot be created on the destination chain. You will not be able to claim ownership of the same address. Funds sent may be inaccessible.',
      )
  }
}
