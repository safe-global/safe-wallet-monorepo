import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import type { ThreatAnalysisResults, ThreatAnalysisResult } from '../types'
import { ThreatAnalysisResultBuilder } from './threat-analysis-result.builder'

export class ThreatAnalysisBuilder {
  private threatAnalysis: ThreatAnalysisResults

  constructor() {
    this.threatAnalysis = {
      THREAT: [new ThreatAnalysisResultBuilder().build()],
      BALANCE_CHANGE: [
        {
          asset: {
            type: 'NATIVE',
            symbol: 'ETH',
            logo_url: 'https://example.com/eth-logo.png',
          },
          in: [
            { value: '1000000000000000000', token_id: 0 }, // 1 ETH in
          ],
          out: [
            { value: '500000000000000000', token_id: 0 }, // 0.5 ETH out
          ],
        },
      ],
    }
  }

  createThreat(threat: ThreatAnalysisResult) {
    this.threatAnalysis.THREAT = [threat]
    return this
  }

  createCustomCheck(customCheck: ThreatAnalysisResult) {
    this.threatAnalysis.CUSTOM_CHECKS = [customCheck]
    return this
  }

  addThreat(threat: ThreatAnalysisResult) {
    if (!this.threatAnalysis.THREAT) {
      this.threatAnalysis.THREAT = []
    }
    this.threatAnalysis.THREAT.push(threat)
    return this
  }

  build(): AsyncResult<ThreatAnalysisResults> {
    return [this.threatAnalysis, undefined, false]
  }

  static noThreat() {
    const threat = ThreatAnalysisResultBuilder.noThreat().build()
    return new ThreatAnalysisBuilder().addThreat(threat).build()
  }

  static maliciousThreat() {
    return new ThreatAnalysisBuilder().createThreat(ThreatAnalysisResultBuilder.malicious().build()).build()
  }

  static moderateThreat() {
    return new ThreatAnalysisBuilder().createThreat(ThreatAnalysisResultBuilder.moderate().build()).build()
  }

  static failedThreat() {
    return new ThreatAnalysisBuilder().createThreat(ThreatAnalysisResultBuilder.failed().build()).build()
  }

  static failedThreatWithError() {
    return new ThreatAnalysisBuilder().createThreat(ThreatAnalysisResultBuilder.failedWithError().build()).build()
  }

  static ownershipChange() {
    return new ThreatAnalysisBuilder().createThreat(ThreatAnalysisResultBuilder.ownershipChange().build()).build()
  }

  static moduleChange() {
    return new ThreatAnalysisBuilder().createThreat(ThreatAnalysisResultBuilder.moduleChange().build()).build()
  }

  static masterCopyChange() {
    return new ThreatAnalysisBuilder().createThreat(ThreatAnalysisResultBuilder.masterCopyChange().build()).build()
  }

  static customChecksPassed() {
    return new ThreatAnalysisBuilder()
      .createCustomCheck(ThreatAnalysisResultBuilder.customChecksPassed().build())
      .build()
  }

  static customCheckFailed() {
    return new ThreatAnalysisBuilder()
      .createCustomCheck(ThreatAnalysisResultBuilder.customCheckFailed().build())
      .build()
  }
}
