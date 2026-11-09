import { FeesPage } from '@safe-global/views/features/fee-payment/components/FeesPage'
import type { TokenIconRenderer } from '@safe-global/views/features/fee-payment/components/GasPayerSelector'
import TokenIcon from '@/components/common/TokenIcon'
import { SCENARIOS, type ScenarioId } from './sampleData'
import { useFeePayerChoice } from './hooks/useFeePayerChoice'
import { useGasParams } from './hooks/useGasParams'
import { useFeesView } from './hooks/useFeesView'
import { FeesFooter } from './FeesFooter'

const renderTokenIcon: TokenIconRenderer = ({ logoUri, symbol }) => (
  <TokenIcon logoUri={logoUri} tokenSymbol={symbol} size={24} />
)

export const FeesPrototype = ({ scenario: id }: { scenario: ScenarioId }) => {
  const scenario = SCENARIOS[id]
  const { choice, onChoiceChange } = useFeePayerChoice(scenario)
  const gas = useGasParams(scenario)
  const { view, gasFeeDetails } = useFeesView(scenario, choice, gas)

  return (
    <FeesPage
      view={view}
      gasFeeDetails={gasFeeDetails}
      onChoiceChange={onChoiceChange}
      currency="usd"
      renderTokenIcon={renderTokenIcon}
      footer={<FeesFooter footer={view.footer} />}
    />
  )
}
