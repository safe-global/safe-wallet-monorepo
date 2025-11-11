import { StatusGroup, type AnalysisResult, type StatusGroupType, CommonSharedStatus } from '../types'
import type { ContractAnalysisBuilder } from './contract-analysis.builder'

export class ContractAddressBuilder {
  constructor(
    private parent: ContractAnalysisBuilder,
    private address: string,
  ) {}

  contractVerification(results: AnalysisResult<StatusGroupType<StatusGroup.CONTRACT_VERIFICATION>>[]): this {
    if (!this.parent['contract'][this.address]) {
      this.parent['contract'][this.address] = {}
    }
    this.parent['contract'][this.address][StatusGroup.CONTRACT_VERIFICATION] = results
    return this
  }

  contractInteraction(results: AnalysisResult<StatusGroupType<StatusGroup.CONTRACT_INTERACTION>>[]): this {
    if (!this.parent['contract'][this.address]) {
      this.parent['contract'][this.address] = {}
    }
    this.parent['contract'][this.address][StatusGroup.CONTRACT_INTERACTION] = results
    return this
  }

  delegatecall(results: AnalysisResult<StatusGroupType<StatusGroup.DELEGATECALL>>[]): this {
    if (!this.parent['contract'][this.address]) {
      this.parent['contract'][this.address] = {}
    }
    this.parent['contract'][this.address][StatusGroup.DELEGATECALL] = results
    return this
  }

  failed(result: AnalysisResult<CommonSharedStatus.FAILED>): this {
    if (!this.parent['contract'][this.address]) {
      this.parent['contract'][this.address] = {}
    }
    this.parent['contract'][this.address][StatusGroup.CONTRACT_VERIFICATION] = [result as any]
    return this
  }

  done(): ContractAnalysisBuilder {
    return this.parent
  }
}
