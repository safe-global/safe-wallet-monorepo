import merge from 'lodash/merge'
import type { ContractAnalysisResults, RecipientAnalysisResults, ThreatAnalysisResults } from '../types'
import { ContractAnalysisBuilder } from './contract-analysis.builder'
import { RecipientAnalysisBuilder } from './recipient-analysis.builder'
import { ThreatAnalysisBuilder } from './threat-analysis.builder'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'

export class FullAnalysisBuilder {
  private response: {
    recipient: AsyncResult<RecipientAnalysisResults>
    contract: AsyncResult<ContractAnalysisResults>
    threat: AsyncResult<ThreatAnalysisResults>
  } = {
    recipient: [undefined, undefined, false],
    contract: [undefined, undefined, false],
    threat: [undefined, undefined, false],
  }

  recipient(recipientAnalysis: AsyncResult<RecipientAnalysisResults>): this {
    const [recipientResult = {}, error, loading = false] = recipientAnalysis || []
    const [currentRecipientResult = {}, currentError, currentLoading = false] = this.response.recipient || []
    this.response.recipient = [
      merge(currentRecipientResult, recipientResult),
      currentError || error,
      currentLoading || loading,
    ]
    return this
  }

  contract(contractAnalysis: AsyncResult<ContractAnalysisResults>): this {
    const [contractResult = {}, error, loading = false] = contractAnalysis || []
    const [currentContractResult = {}, currentError, currentLoading = false] = this.response.contract || []
    this.response.contract = [
      merge(currentContractResult, contractResult),
      currentError || error,
      currentLoading || loading,
    ]
    return this
  }

  threat(threatAnalysis: AsyncResult<ThreatAnalysisResults> | undefined): this {
    const [threatResult, error, loading = false] = threatAnalysis || []
    this.response.threat = [threatResult, error, loading]
    return this
  }

  customCheck(threatAnalysis: AsyncResult<ThreatAnalysisResults>): this {
    const [threatResult = {}, error, loading = false] = threatAnalysis
    const [currentThreatResult = {}, currentError, currentLoading = false] = this.response.threat || []
    this.response.threat = [
      merge(currentThreatResult, { CUSTOM_CHECKS: threatResult.CUSTOM_CHECKS }),
      currentError || error,
      currentLoading || loading,
    ]
    return this
  }

  build() {
    return { ...this.response }
  }

  // Preset methods for common scenarios
  static empty(): FullAnalysisBuilder {
    return new FullAnalysisBuilder()
  }

  static noThreat(): FullAnalysisBuilder {
    return new FullAnalysisBuilder().threat(ThreatAnalysisBuilder.noThreat())
  }

  static maliciousThreat(): FullAnalysisBuilder {
    return new FullAnalysisBuilder().threat(ThreatAnalysisBuilder.maliciousThreat())
  }

  static moderateThreat(): FullAnalysisBuilder {
    return new FullAnalysisBuilder().threat(ThreatAnalysisBuilder.moderateThreat())
  }

  static failedThreat(): FullAnalysisBuilder {
    return new FullAnalysisBuilder().threat(ThreatAnalysisBuilder.failedThreat())
  }

  static ownershipChange(): FullAnalysisBuilder {
    return new FullAnalysisBuilder().threat(ThreatAnalysisBuilder.ownershipChange())
  }

  static moduleChange(): FullAnalysisBuilder {
    return new FullAnalysisBuilder().threat(ThreatAnalysisBuilder.moduleChange())
  }

  static masterCopyChange(): FullAnalysisBuilder {
    return new FullAnalysisBuilder().threat(ThreatAnalysisBuilder.masterCopyChange())
  }

  static verifiedContract(address?: string): FullAnalysisBuilder {
    return new FullAnalysisBuilder().contract(ContractAnalysisBuilder.verifiedContract(address).build())
  }

  static unverifiedContract(address?: string): FullAnalysisBuilder {
    return new FullAnalysisBuilder().contract(ContractAnalysisBuilder.unverifiedContract(address).build())
  }

  static delegatecallContract(address?: string): FullAnalysisBuilder {
    return new FullAnalysisBuilder().contract(ContractAnalysisBuilder.delegatecallContract(address).build())
  }

  static verificationUnavailableContract(address?: string): FullAnalysisBuilder {
    return new FullAnalysisBuilder().contract(ContractAnalysisBuilder.verificationUnavailableContract(address).build())
  }

  static knownRecipient(address?: string): FullAnalysisBuilder {
    return new FullAnalysisBuilder().recipient(RecipientAnalysisBuilder.knownRecipient(address).build())
  }

  static failedContract(): FullAnalysisBuilder {
    return new FullAnalysisBuilder().contract(ContractAnalysisBuilder.failedContract().build())
  }

  static customChecksPassed(): FullAnalysisBuilder {
    return new FullAnalysisBuilder().threat(ThreatAnalysisBuilder.customChecksPassed())
  }

  static customCheckFailed(): FullAnalysisBuilder {
    return new FullAnalysisBuilder().threat(ThreatAnalysisBuilder.customCheckFailed())
  }

  static unofficialFallbackHandlerContract(address?: string): FullAnalysisBuilder {
    return new FullAnalysisBuilder().contract(
      ContractAnalysisBuilder.unofficialFallbackHandlerContract(address).build(),
    )
  }
}
