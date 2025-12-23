import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import {
  StatusGroup,
  type AnalysisResult,
  StatusGroupType,
  type ContractAnalysisResults,
  ContractDetails,
  type FallbackHandlerAnalysisResult,
} from '../types'
import { ContractAddressBuilder, DEFAULT_INFO } from './contract-address.builder'
import { ContractAnalysisResultBuilder } from './contract-analysis-result.builder'

export class ContractAnalysisBuilder {
  private contract: {
    [address: string]: {
      [StatusGroup.CONTRACT_VERIFICATION]?: AnalysisResult<StatusGroupType<StatusGroup.CONTRACT_VERIFICATION>>[]
      [StatusGroup.CONTRACT_INTERACTION]?: AnalysisResult<StatusGroupType<StatusGroup.CONTRACT_INTERACTION>>[]
      [StatusGroup.DELEGATECALL]?: AnalysisResult<StatusGroupType<StatusGroup.DELEGATECALL>>[]
      [StatusGroup.FALLBACK_HANDLER]?: FallbackHandlerAnalysisResult[]
    } & ContractDetails
  } = {}

  addAddress(address: string): ContractAddressBuilder {
    if (!this.contract[address]) {
      this.contract[address] = DEFAULT_INFO
    }
    return new ContractAddressBuilder(this, address)
  }

  build(): AsyncResult<ContractAnalysisResults> {
    return [{ ...this.contract }, undefined, false]
  }

  // Preset methods for common scenarios
  static verifiedContract(address: string = '0x0000000000000000000000000000000000000001'): ContractAnalysisBuilder {
    return new ContractAnalysisBuilder()
      .addAddress(address)
      .addName('Balancer')
      .addLogoUrl('https://placehold.co/160')
      .contractVerification([ContractAnalysisResultBuilder.verified().build()])
      .done()
  }

  static unverifiedContract(address: string = '0x0000000000000000000000000000000000000bad'): ContractAnalysisBuilder {
    return new ContractAnalysisBuilder()
      .addAddress(address)
      .contractVerification([ContractAnalysisResultBuilder.unverified().build()])
      .done()
  }

  static knownContract(address: string = '0x0000000000000000000000000000000000000002'): ContractAnalysisBuilder {
    return new ContractAnalysisBuilder()
      .addAddress(address)
      .contractInteraction([ContractAnalysisResultBuilder.knownContract().build()])
      .done()
  }

  static delegatecallContract(address: string = '0x0000000000000000000000000000000000000004'): ContractAnalysisBuilder {
    return new ContractAnalysisBuilder()
      .addAddress(address)
      .delegatecall([ContractAnalysisResultBuilder.unexpectedDelegatecall().build()])
      .done()
  }

  static verificationUnavailableContract(
    address: string = '0x0000000000000000000000000000000000000005',
  ): ContractAnalysisBuilder {
    return new ContractAnalysisBuilder()
      .addAddress(address)
      .contractVerification([ContractAnalysisResultBuilder.verificationUnavailable().build()])
      .done()
  }

  static failedContract(address: string = '0x0000000000000000000000000000000000000005'): ContractAnalysisBuilder {
    return new ContractAnalysisBuilder()
      .addAddress(address)
      .failed(ContractAnalysisResultBuilder.failed().build())
      .done()
  }

  static unofficialFallbackHandlerContract(
    address: string = '0x0000000000000000000000000000000000000006',
  ): ContractAnalysisBuilder {
    return new ContractAnalysisBuilder()
      .addAddress(address)
      .fallbackHandler([ContractAnalysisResultBuilder.unofficialFallbackHandler().build()])
      .done()
  }
}
