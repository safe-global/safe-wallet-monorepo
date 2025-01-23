import TxLayout from '@/components/tx-flow/common/TxLayout'
import { ReviewEnableSafenet } from './ReviewEnableSafenet'

export type EnableSafenetFlowProps = {
  guardAddress: string
  tokensForPresetAllowances: string[]
  allowanceSpender: string
}

const EnableSafenetFlow = ({ guardAddress, tokensForPresetAllowances, allowanceSpender }: EnableSafenetFlowProps) => {
  return (
    <TxLayout title="Confirm transaction" subtitle="Enable Safenet">
      <ReviewEnableSafenet params={{ guardAddress, tokensForPresetAllowances, allowanceSpender }} />
    </TxLayout>
  )
}

export default EnableSafenetFlow
