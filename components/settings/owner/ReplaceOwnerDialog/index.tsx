import { IconButton, Tooltip } from '@mui/material'
import { useState } from 'react'
import { ChooseOwnerStep } from '../DialogSteps/ChooseOwnerStep'
import ChangeCircleOutlinedIcon from '@mui/icons-material/ChangeCircleOutlined'

import TxModal from '@/components/tx/TxModal'
import useSafeInfo from '@/hooks/useSafeInfo'
import { ReviewOwnerTxStep } from '@/components/settings/owner/DialogSteps/ReviewOwnerTxStep'
import { ChangeOwnerData } from '@/components/settings/owner/DialogSteps/data'
import { TxStepperProps } from '@/components/tx/TxStepper/useTxStepper'

const ReplaceOwnerSteps: TxStepperProps['steps'] = [
  {
    label: 'Choose new owner',
    render: (data, onSubmit) => <ChooseOwnerStep data={data as ChangeOwnerData} onSubmit={onSubmit} />,
  },
  {
    label: 'Review',
    render: (data, onSubmit) => <ReviewOwnerTxStep data={data as ChangeOwnerData} onSubmit={onSubmit} />,
  },
]

export const ReplaceOwnerDialog = ({ address }: { address: string }) => {
  const [open, setOpen] = useState(false)

  const handleClose = () => setOpen(false)

  const { safe } = useSafeInfo()

  const initialModalData: ChangeOwnerData = {
    removedOwner: { address },
    newOwner: { address: '', name: '' },
    threshold: safe?.threshold,
  }

  return (
    <div>
      <Tooltip title="Replace owner">
        <IconButton onClick={() => setOpen(true)}>
          <ChangeCircleOutlinedIcon />
        </IconButton>
      </Tooltip>
      {open && <TxModal wide onClose={handleClose} steps={ReplaceOwnerSteps} initialData={[initialModalData]} />}
    </div>
  )
}
