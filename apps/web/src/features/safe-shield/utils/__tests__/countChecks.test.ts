import { faker } from '@faker-js/faker'
import { ContractAnalysisBuilder, RecipientAnalysisBuilder } from '@safe-global/utils/features/safe-shield/builders'
import { ThreatAnalysisBuilder } from '@safe-global/utils/features/safe-shield/builders/threat-analysis.builder'
import { countChecks } from '../countChecks'

const [threat] = ThreatAnalysisBuilder.noThreat()
const [recipient] = RecipientAnalysisBuilder.knownRecipient(faker.finance.ethereumAddress()).build()
const [contract] = ContractAnalysisBuilder.verifiedContract(faker.finance.ethereumAddress()).build()

describe('countChecks', () => {
  it('reads 3 of 3 for a Safe Pro Workspace whose threat, recipient and simulation checks all passed', () => {
    expect(
      countChecks({ threat, recipient, hasProFeatures: true, hasSimulation: true, isSimulationSuccess: true }),
    ).toEqual({ passed: 3, total: 3 })
  })

  it('reads 1 of 3 without Safe Pro: the locked recipient and simulation rows count, but never pass', () => {
    expect(countChecks({ threat, hasProFeatures: false, hasSimulation: true, isSimulationSuccess: false })).toEqual({
      passed: 1,
      total: 3,
    })
  })

  it('adds the contract and deadlock rows only when they have results, and a simulation not yet run', () => {
    expect(
      countChecks({
        threat,
        recipient,
        contract,
        hasProFeatures: true,
        hasSimulation: true,
        isSimulationSuccess: false,
      }),
    ).toEqual({ passed: 3, total: 4 })
    expect(countChecks({ hasProFeatures: true, hasSimulation: false, isSimulationSuccess: false })).toEqual({
      passed: 0,
      total: 0,
    })
  })
})
