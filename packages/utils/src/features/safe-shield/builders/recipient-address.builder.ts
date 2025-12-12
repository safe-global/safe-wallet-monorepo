import { StatusGroup, type AnalysisResult, type StatusGroupType } from '../types'
import type { RecipientAnalysisBuilder } from './recipient-analysis.builder'

export class RecipientAddressBuilder {
  constructor(private parent: RecipientAnalysisBuilder, private address: string) {}

  addressBookState(results: AnalysisResult<StatusGroupType<StatusGroup.ADDRESS_BOOK>>[]): this {
    if (!this.parent['recipient'][this.address]) {
      this.parent['recipient'][this.address] = {}
    }
    this.parent['recipient'][this.address][StatusGroup.ADDRESS_BOOK] = results
    return this
  }

  interactionState(results: AnalysisResult<StatusGroupType<StatusGroup.RECIPIENT_INTERACTION>>[]): this {
    if (!this.parent['recipient'][this.address]) {
      this.parent['recipient'][this.address] = {}
    }
    this.parent['recipient'][this.address][StatusGroup.RECIPIENT_INTERACTION] = results
    return this
  }

  activityState(results: AnalysisResult<StatusGroupType<StatusGroup.RECIPIENT_ACTIVITY>>[]): this {
    if (!this.parent['recipient'][this.address]) {
      this.parent['recipient'][this.address] = {}
    }
    this.parent['recipient'][this.address][StatusGroup.RECIPIENT_ACTIVITY] = results
    return this
  }

  bridgeState(results: AnalysisResult<StatusGroupType<StatusGroup.BRIDGE>>[]): this {
    if (!this.parent['recipient'][this.address]) {
      this.parent['recipient'][this.address] = {}
    }
    this.parent['recipient'][this.address][StatusGroup.BRIDGE] = results
    return this
  }

  done(): RecipientAnalysisBuilder {
    return this.parent
  }
}
