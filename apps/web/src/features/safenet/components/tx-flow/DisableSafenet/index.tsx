import TxLayout from '@/components/tx-flow/common/TxLayout'
import SafenetIcon from '@/public/images/safenet/safenet-icon.svg'
import { Stack, SvgIcon } from '@mui/material'
import ReviewDisableSafenet from './ReviewDisableSafenet'

export type DisableSafenetFlowProps = {
  moduleAddress: string
}

const DisableSafenetFlow = ({ moduleAddress }: DisableSafenetFlowProps) => {
  return (
    <TxLayout
      title="Confirm transaction"
      subtitle={
        <Stack flexDirection="row" gap={2}>
          <SvgIcon component={SafenetIcon} inheritViewBox />
          Disable Safenet
        </Stack>
      }
    >
      <ReviewDisableSafenet params={{ moduleAddress }} />
    </TxLayout>
  )
}

export default DisableSafenetFlow
