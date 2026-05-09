import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import type { DeadlockAnalysisResults, AnalysisResult, StatusGroupType } from '../types'
import { DeadlockStatus, StatusGroup } from '../types'
import { DeadlockAnalysisResultBuilder } from './deadlock-analysis-result.builder'

export class DeadlockAnalysisBuilder {
  private deadlockAnalysis: {
    [address: string]: {
      [StatusGroup.DEADLOCK]?: AnalysisResult<StatusGroupType<StatusGroup.DEADLOCK>>[]
      [StatusGroup.COMMON]?: AnalysisResult<StatusGroupType<StatusGroup.COMMON>>[]
    }
  }

  constructor() {
    this.deadlockAnalysis = {}
  }

  addAddress(address: string, result: AnalysisResult<DeadlockStatus>): this {
    if (!this.deadlockAnalysis[address]) {
      this.deadlockAnalysis[address] = {}
    }
    if (!this.deadlockAnalysis[address].DEADLOCK) {
      this.deadlockAnalysis[address].DEADLOCK = []
    }
    this.deadlockAnalysis[address].DEADLOCK!.push(result)
    return this
  }

  build(): AsyncResult<DeadlockAnalysisResults> {
    return [this.deadlockAnalysis, undefined, false]
  }

  static deadlockDetected(address = '0x0000000000000000000000000000000000000001') {
    return new DeadlockAnalysisBuilder()
      .addAddress(address, DeadlockAnalysisResultBuilder.deadlockDetected().build())
      .build()
  }

  static nestedSafeWarning(address = '0x0000000000000000000000000000000000000001') {
    return new DeadlockAnalysisBuilder()
      .addAddress(address, DeadlockAnalysisResultBuilder.nestedSafeWarning().build())
      .build()
  }
}
