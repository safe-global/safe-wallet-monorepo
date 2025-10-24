import {
  AnalysisResult,
  LiveAnalysisResponse,
  LiveThreatAnalysisResult,
  MaliciousOrModerateThreatAnalysisResult,
  MasterCopyChangeThreatAnalysisResult,
  ThreatAnalysisResult,
  ThreatStatus,
  CommonSharedStatus,
} from '../types'
import { ThreatAnalysisResultBuilder } from './threat-analysis-result.builder'

export class ThreatAnalysisBuilder {
  private threatAnalysis: LiveThreatAnalysisResult

  constructor() {
    this.threatAnalysis = {
      THREAT: [new ThreatAnalysisResultBuilder().build()],
      BALANCE_CHANGE: [
        {
          asset: {
            type: 'NATIVE',
            address: '0x000000000000000000000000000000000000dead', // mock address
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

  createThreat(
    threat:
      | MaliciousOrModerateThreatAnalysisResult
      | MasterCopyChangeThreatAnalysisResult
      | AnalysisResult<ThreatStatus.NO_THREAT>
      | AnalysisResult<CommonSharedStatus.FAILED>
      | AnalysisResult<ThreatStatus.OWNERSHIP_CHANGE>
      | AnalysisResult<ThreatStatus.MODULE_CHANGE>
      | AnalysisResult<ThreatStatus.MASTER_COPY_CHANGE>,
  ) {
    this.threatAnalysis.THREAT = [threat]
    return this
  }

  addThreat(
    threat:
      | AnalysisResult<ThreatStatus.NO_THREAT>
      | AnalysisResult<CommonSharedStatus.FAILED>
      | AnalysisResult<ThreatStatus.OWNERSHIP_CHANGE>
      | AnalysisResult<ThreatStatus.MODULE_CHANGE>
      | ThreatAnalysisResult,
  ) {
    this.threatAnalysis.THREAT.push(threat)
    return this
  }

  build(): LiveAnalysisResponse['threat'] {
    return [this.threatAnalysis, undefined, false]
  }

  static noThreat(): LiveAnalysisResponse['threat'] {
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

  static ownershipChange() {
    return new ThreatAnalysisBuilder().createThreat(ThreatAnalysisResultBuilder.ownershipChange().build()).build()
  }

  static moduleChange() {
    return new ThreatAnalysisBuilder().createThreat(ThreatAnalysisResultBuilder.moduleChange().build()).build()
  }

  static masterCopyChange() {
    return new ThreatAnalysisBuilder().createThreat(ThreatAnalysisResultBuilder.masterCopyChange().build()).build()
  }
}
