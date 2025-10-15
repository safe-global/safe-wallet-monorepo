import { StatusGroup, type ContractStatus, type AnalysisResult } from '../types'
import type { ContractAnalysisBuilder } from './contract-analysis.builder'

export class ContractAddressBuilder {
  constructor(
    private parent: ContractAnalysisBuilder,
    private address: string,
  ) {}

  contractVerification(results: AnalysisResult<ContractStatus>[]): this {
    if (!this.parent['contract'][this.address]) {
      this.parent['contract'][this.address] = {}
    }
    this.parent['contract'][this.address][StatusGroup.CONTRACT_VERIFICATION] = results
    return this
  }

  contractInteraction(results: AnalysisResult<ContractStatus>[]): this {
    if (!this.parent['contract'][this.address]) {
      this.parent['contract'][this.address] = {}
    }
    this.parent['contract'][this.address][StatusGroup.CONTRACT_INTERACTION] = results
    return this
  }

  delegatecall(results: AnalysisResult<ContractStatus>[]): this {
    if (!this.parent['contract'][this.address]) {
      this.parent['contract'][this.address] = {}
    }
    this.parent['contract'][this.address][StatusGroup.DELEGATECALL] = results
    return this
  }

  done(): ContractAnalysisBuilder {
    return this.parent
  }
}
