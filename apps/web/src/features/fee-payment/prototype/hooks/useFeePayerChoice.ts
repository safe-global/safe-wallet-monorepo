import { useState } from 'react'
import type { GasPayerChoice } from '@safe-global/views/features/fee-payment/types'
import type { Scenario } from '../sampleData'

export const useFeePayerChoice = (scenario: Scenario) => {
  const [choice, setChoice] = useState<GasPayerChoice>(scenario.payer.value)
  return { choice, onChoiceChange: setChoice }
}
