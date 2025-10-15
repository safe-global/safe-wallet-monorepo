// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { StatusGroup, type ContractStatus, type LiveAnalysisResponse, type AnalysisResult } from '../types'
import { ContractAddressBuilder } from './contract-address.builder'
import { ContractAnalysisResultBuilder } from './contract-analysis-result.builder'

export class ContractAnalysisBuilder {
  private contract: {
    [address: string]: {
      [StatusGroup.CONTRACT_VERIFICATION]?: AnalysisResult<ContractStatus>[]
      [StatusGroup.CONTRACT_INTERACTION]?: AnalysisResult<ContractStatus>[]
      [StatusGroup.DELEGATECALL]?: AnalysisResult<ContractStatus>[]
    }
  } = {}

  addAddress(address: string): ContractAddressBuilder {
    if (!this.contract[address]) {
      this.contract[address] = {}
    }
    return new ContractAddressBuilder(this, address)
  }

  build(): LiveAnalysisResponse['contract'] {
    return { ...this.contract }
  }

  // Preset methods for common scenarios
  static verifiedContract(address: string = '0x0000000000000000000000000000000000000001'): ContractAnalysisBuilder {
    return new ContractAnalysisBuilder()
      .addAddress(address)
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
}
