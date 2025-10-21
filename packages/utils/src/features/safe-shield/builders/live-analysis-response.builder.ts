import merge from 'lodash/merge'
import type { LiveAnalysisResponse, LiveThreatAnalysisResult, ThreatStatus } from '../types'
import { ContractAnalysisBuilder } from './contract-analysis.builder'
import { RecipientAnalysisBuilder } from './recipient-analysis.builder'
import { ThreatAnalysisResultBuilder } from './threat-analysis-result.builder'
import { ThreatAnalysisBuilder } from './threat-analysis.builder'

export class LiveAnalysisResponseBuilder {
  private response: LiveAnalysisResponse = {}

  recipient(recipientAnalysis: LiveAnalysisResponse['recipient']): this {
    const [recipientResult = {}, error, loading = false] = recipientAnalysis || []
    const [currentRecipientResult = {}, currentError, currentLoading = false] = this.response.recipient || []
    this.response.recipient = [
      merge(currentRecipientResult, recipientResult),
      currentError || error,
      currentLoading || loading,
    ]
    return this
  }

  contract(contractAnalysis: LiveAnalysisResponse['contract']): this {
    const [contractResult = {}, error, loading = false] = contractAnalysis || []
    const [currentContractResult = {}, currentError, currentLoading = false] = this.response.contract || []
    this.response.contract = [
      merge(currentContractResult, contractResult),
      currentError || error,
      currentLoading || loading,
    ]
    return this
  }

  threat(threatAnalysis: LiveAnalysisResponse['threat']): this {
    const [threatResult, error, loading = false] = threatAnalysis || []

    this.response.threat = [threatResult, error, loading]
    return this
  }

  build(): LiveAnalysisResponse {
    return { ...this.response }
  }

  // Preset methods for common scenarios
  static empty(): LiveAnalysisResponseBuilder {
    return new LiveAnalysisResponseBuilder()
  }

  static noThreat(): LiveAnalysisResponseBuilder {
    return new LiveAnalysisResponseBuilder().threat(ThreatAnalysisBuilder.noThreat())
  }

  static maliciousThreat(): LiveAnalysisResponseBuilder {
    return new LiveAnalysisResponseBuilder().threat(ThreatAnalysisBuilder.maliciousThreat())
  }

  static moderateThreat(): LiveAnalysisResponseBuilder {
    return new LiveAnalysisResponseBuilder().threat(ThreatAnalysisBuilder.moderateThreat())
  }

  static failedThreat(): LiveAnalysisResponseBuilder {
    return new LiveAnalysisResponseBuilder().threat(ThreatAnalysisBuilder.failedThreat())
  }

  static ownershipChange(): LiveAnalysisResponseBuilder {
    return new LiveAnalysisResponseBuilder().threat(ThreatAnalysisBuilder.ownershipChange())
  }

  static moduleChange(): LiveAnalysisResponseBuilder {
    return new LiveAnalysisResponseBuilder().threat(ThreatAnalysisBuilder.moduleChange())
  }

  static masterCopyChange(): LiveAnalysisResponseBuilder {
    return new LiveAnalysisResponseBuilder().threat(ThreatAnalysisBuilder.masterCopyChange())
  }

  static verifiedContract(address?: string): LiveAnalysisResponseBuilder {
    return new LiveAnalysisResponseBuilder().contract(ContractAnalysisBuilder.verifiedContract(address).build())
  }

  static unverifiedContract(address?: string): LiveAnalysisResponseBuilder {
    return new LiveAnalysisResponseBuilder().contract(ContractAnalysisBuilder.unverifiedContract(address).build())
  }

  static delegatecallContract(address?: string): LiveAnalysisResponseBuilder {
    return new LiveAnalysisResponseBuilder().contract(ContractAnalysisBuilder.delegatecallContract(address).build())
  }

  static verificationUnavailableContract(address?: string): LiveAnalysisResponseBuilder {
    return new LiveAnalysisResponseBuilder().contract(
      ContractAnalysisBuilder.verificationUnavailableContract(address).build(),
    )
  }

  static knownRecipient(address?: string): LiveAnalysisResponseBuilder {
    return new LiveAnalysisResponseBuilder().recipient(RecipientAnalysisBuilder.knownRecipient(address).build())
  }
}
