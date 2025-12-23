import {
  StatusGroup,
  type AnalysisResult,
  type StatusGroupType,
  CommonSharedStatus,
  type FallbackHandlerAnalysisResult,
} from '../types'
import type { ContractAnalysisBuilder } from './contract-analysis.builder'

export const DEFAULT_INFO = {
  name: 'BAL BAL EXAMPLE CONTRACT',
  logoUrl: 'https://placehold.co/160',
}
export class ContractAddressBuilder {
  constructor(
    private parent: ContractAnalysisBuilder,
    private address: string,
  ) {}

  addName(name: string): this {
    this.parent['contract'][this.address].name = name
    return this
  }

  addLogoUrl(logoUrl: string): this {
    this.parent['contract'][this.address].logoUrl = logoUrl
    return this
  }
  contractVerification(results: AnalysisResult<StatusGroupType<StatusGroup.CONTRACT_VERIFICATION>>[]): this {
    if (!this.parent['contract'][this.address]) {
      this.parent['contract'][this.address] = DEFAULT_INFO
    }
    this.parent['contract'][this.address][StatusGroup.CONTRACT_VERIFICATION] = results
    return this
  }

  contractInteraction(results: AnalysisResult<StatusGroupType<StatusGroup.CONTRACT_INTERACTION>>[]): this {
    if (!this.parent['contract'][this.address]) {
      this.parent['contract'][this.address] = DEFAULT_INFO
    }
    this.parent['contract'][this.address][StatusGroup.CONTRACT_INTERACTION] = results
    return this
  }

  delegatecall(results: AnalysisResult<StatusGroupType<StatusGroup.DELEGATECALL>>[]): this {
    if (!this.parent['contract'][this.address]) {
      this.parent['contract'][this.address] = DEFAULT_INFO
    }
    this.parent['contract'][this.address][StatusGroup.DELEGATECALL] = results
    return this
  }

  fallbackHandler(results: FallbackHandlerAnalysisResult[]): this {
    if (!this.parent['contract'][this.address]) {
      this.parent['contract'][this.address] = DEFAULT_INFO
    }
    this.parent['contract'][this.address][StatusGroup.FALLBACK_HANDLER] = results
    return this
  }

  failed(result: AnalysisResult<CommonSharedStatus.FAILED>): this {
    if (!this.parent['contract'][this.address]) {
      this.parent['contract'][this.address] = DEFAULT_INFO
    }
    this.parent['contract'][this.address][StatusGroup.CONTRACT_VERIFICATION] = [result as any]
    return this
  }

  done(): ContractAnalysisBuilder {
    return this.parent
  }
}
