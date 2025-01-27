import TxLayout from '@/components/tx-flow/common/TxLayout'
import ReviewEnableSafenet from './ReviewEnableSafenet'

export type EnableSafenetFlowProps = {
  guardAddress: string
  moduleAddress: string
}

const EnableSafenetFlow = ({ guardAddress, moduleAddress }: EnableSafenetFlowProps) => {
  return (
    <TxLayout title="Confirm transaction" subtitle="Enable Safenet">
      <ReviewEnableSafenet params={{ guardAddress, moduleAddress }} />
    </TxLayout>
  )
}

export default EnableSafenetFlow
