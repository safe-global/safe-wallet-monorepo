import type { ReactElement, ReactNode } from 'react'
import type { FeePayerView, GasPayerChoice } from '@safe-global/views/features/fee-payment/types'
import GasPayerSelector, {
  type TokenIconRenderer,
} from '@safe-global/views/features/fee-payment/components/GasPayerSelector'
import { GasFeeDetails, type GasFeeDetailsProps } from '../GasFeeDetails'

export type FeesPageProps = {
  view: FeePayerView
  gasFeeDetails: GasFeeDetailsProps
  onChoiceChange: (choice: GasPayerChoice) => void
  currency: string
  renderTokenIcon: TokenIconRenderer
  footer: ReactNode
}

export const FeesPage = ({ gasFeeDetails, ...props }: FeesPageProps): ReactElement => (
  <div className="w-full max-w-[600px]">
    <GasPayerSelector {...props} gasFeeDetails={<GasFeeDetails {...gasFeeDetails} />} />
  </div>
)
