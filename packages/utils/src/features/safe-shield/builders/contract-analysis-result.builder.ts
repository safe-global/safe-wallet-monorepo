import { Severity, ContractStatus, type AnalysisResult } from '../types'

export class ContractAnalysisResultBuilder {
  private result: AnalysisResult<ContractStatus>

  constructor() {
    this.result = {
      severity: Severity.OK,
      type: ContractStatus.VERIFIED,
      title: 'Verified contract',
      description: 'This contract is verified as "Lido staking v2".',
    }
  }

  severity(severity: Severity): this {
    this.result.severity = severity
    return this
  }

  type(type: ContractStatus): this {
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

  build(): AnalysisResult<ContractStatus> {
    return { ...this.result }
  }

  // Preset methods for common scenarios
  static verified(): ContractAnalysisResultBuilder {
    return new ContractAnalysisResultBuilder()
  }

  static verificationUnavailable(): ContractAnalysisResultBuilder {
    return new ContractAnalysisResultBuilder()
      .severity(Severity.WARN)
      .type(ContractStatus.VERIFICATION_UNAVAILABLE)
      .title('Unable to verify contract')
      .description('Contract verification is currently unavailable.')
  }

  static unverified(): ContractAnalysisResultBuilder {
    return new ContractAnalysisResultBuilder()
      .severity(Severity.INFO)
      .type(ContractStatus.NOT_VERIFIED)
      .title('Unverified contract')
      .description('This contract is not verified.')
  }

  static knownContract(): ContractAnalysisResultBuilder {
    return new ContractAnalysisResultBuilder()
      .severity(Severity.OK)
      .type(ContractStatus.KNOWN_CONTRACT)
      .title('Known contract')
      .description('You have interacted with this contract 12 times.')
  }

  static newContract(): ContractAnalysisResultBuilder {
    return new ContractAnalysisResultBuilder()
      .severity(Severity.INFO)
      .type(ContractStatus.NEW_CONTRACT)
      .title('First contract interaction')
      .description('You are interacting with this contract for the first time.')
  }

  static unexpectedDelegatecall(): ContractAnalysisResultBuilder {
    return new ContractAnalysisResultBuilder()
      .severity(Severity.WARN)
      .type(ContractStatus.UNEXPECTED_DELEGATECALL)
      .title('Unexpected delegateCall')
      .description('Unexpected delegateCall.')
  }

  static notVerifiedBySafe(): ContractAnalysisResultBuilder {
    return new ContractAnalysisResultBuilder()
      .severity(Severity.INFO)
      .type(ContractStatus.NOT_VERIFIED_BY_SAFE)
      .title('New contract')
      .description(
        'This contract has not been interacted with on Safe{Wallet}. If verified, it will be marked as such after the first transaction.',
      )
  }
}
