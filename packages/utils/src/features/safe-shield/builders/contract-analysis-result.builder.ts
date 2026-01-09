import { faker } from '@faker-js/faker'
import {
  Severity,
  ContractStatus,
  type AnalysisResult,
  CommonSharedStatus,
  type FallbackHandlerDetails,
  type FallbackHandlerAnalysisResult,
} from '../types'

export class ContractAnalysisResultBuilder<T extends CommonSharedStatus | ContractStatus = ContractStatus> {
  private result: AnalysisResult<T> & { fallbackHandler?: FallbackHandlerDetails }

  constructor() {
    this.result = {
      severity: Severity.OK,
      type: ContractStatus.VERIFIED as T,
      title: 'Verified contract',
      description: 'This contract is verified as "Lido staking v2".',
      fallbackHandler: undefined,
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

  fallbackHandler(details: FallbackHandlerDetails | undefined): this {
    if ('fallbackHandler' in this.result) {
      this.result.fallbackHandler = details
    }
    return this
  }

  build(): T extends ContractStatus.UNOFFICIAL_FALLBACK_HANDLER ? FallbackHandlerAnalysisResult : AnalysisResult<T> {
    return { ...this.result } as any
  }

  // Preset methods for common scenarios
  static verified(): ContractAnalysisResultBuilder<ContractStatus.VERIFIED> {
    return new ContractAnalysisResultBuilder<ContractStatus.VERIFIED>()
  }

  static verificationUnavailable(): ContractAnalysisResultBuilder<ContractStatus.VERIFICATION_UNAVAILABLE> {
    return new ContractAnalysisResultBuilder<ContractStatus.VERIFICATION_UNAVAILABLE>()
      .severity(Severity.WARN)
      .type(ContractStatus.VERIFICATION_UNAVAILABLE)
      .title('Unable to verify contract')
      .description('Contract verification is currently unavailable.')
  }

  static unverified(): ContractAnalysisResultBuilder<ContractStatus.NOT_VERIFIED> {
    return new ContractAnalysisResultBuilder<ContractStatus.NOT_VERIFIED>()
      .severity(Severity.INFO)
      .type(ContractStatus.NOT_VERIFIED)
      .title('Unverified contract')
      .description('This contract is not verified.')
  }

  static knownContract(): ContractAnalysisResultBuilder<ContractStatus.KNOWN_CONTRACT> {
    return new ContractAnalysisResultBuilder<ContractStatus.KNOWN_CONTRACT>()
      .severity(Severity.OK)
      .type(ContractStatus.KNOWN_CONTRACT)
      .title('Known contract')
      .description(`You have interacted with this contract ${faker.number.int({ min: 2, max: 100 })} times.`)
  }

  static newContract(): ContractAnalysisResultBuilder<ContractStatus.NEW_CONTRACT> {
    return new ContractAnalysisResultBuilder<ContractStatus.NEW_CONTRACT>()
      .severity(Severity.INFO)
      .type(ContractStatus.NEW_CONTRACT)
      .title('First contract interaction')
      .description('You are interacting with this contract for the first time.')
  }

  static unexpectedDelegatecall(): ContractAnalysisResultBuilder<ContractStatus.UNEXPECTED_DELEGATECALL> {
    return new ContractAnalysisResultBuilder<ContractStatus.UNEXPECTED_DELEGATECALL>()
      .severity(Severity.WARN)
      .type(ContractStatus.UNEXPECTED_DELEGATECALL)
      .title('Unexpected delegateCall')
      .description('Unexpected delegateCall.')
  }

  static notVerifiedBySafe(): ContractAnalysisResultBuilder<ContractStatus.NOT_VERIFIED_BY_SAFE> {
    return new ContractAnalysisResultBuilder<ContractStatus.NOT_VERIFIED_BY_SAFE>()
      .severity(Severity.INFO)
      .type(ContractStatus.NOT_VERIFIED_BY_SAFE)
      .title('New contract')
      .description(
        'This contract has not been interacted with on Safe{Wallet}. If verified, it will be marked as such after the first transaction.',
      )
  }

  static failed(): ContractAnalysisResultBuilder<CommonSharedStatus.FAILED> {
    return new ContractAnalysisResultBuilder<CommonSharedStatus.FAILED>()
      .severity(Severity.WARN)
      .type(CommonSharedStatus.FAILED)
      .title('Contract analysis failed')
      .description('Contract analysis failed. Review before processing.')
  }

  static unofficialFallbackHandler(
    fallbackHandlerDetails?: FallbackHandlerDetails,
  ): ContractAnalysisResultBuilder<ContractStatus.UNOFFICIAL_FALLBACK_HANDLER> {
    const defaultFallbackHandler: FallbackHandlerDetails = {
      address: faker.finance.ethereumAddress(),
    }

    return new ContractAnalysisResultBuilder<ContractStatus.UNOFFICIAL_FALLBACK_HANDLER>()
      .severity(Severity.WARN)
      .type(ContractStatus.UNOFFICIAL_FALLBACK_HANDLER)
      .title('Unofficial fallback handler')
      .description('This contract is not an official fallback handler.')
      .fallbackHandler(fallbackHandlerDetails ?? defaultFallbackHandler)
  }
}
