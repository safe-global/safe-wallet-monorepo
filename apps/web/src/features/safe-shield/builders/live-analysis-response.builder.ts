import { merge } from 'lodash'
import type { LiveAnalysisResponse } from '../types'
import { ContractAnalysisBuilder } from './contract-analysis.builder'

export class LiveAnalysisResponseBuilder {
  private response: LiveAnalysisResponse = {}

  contract(contractAnalysis: LiveAnalysisResponse['contract']): this {
    this.response.contract = merge(this.response.contract, contractAnalysis)
    return this
  }

  build(): LiveAnalysisResponse {
    return { ...this.response }
  }

  // Preset methods for common scenarios
  static empty(): LiveAnalysisResponseBuilder {
    return new LiveAnalysisResponseBuilder()
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
}
