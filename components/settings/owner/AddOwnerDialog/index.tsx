import { Button } from '@mui/material'
import { useState } from 'react'
import { ChooseOwnerStep } from '../DialogSteps/ChooseOwnerStep'

import TxModal from '@/components/tx/TxModal'
import useSafeInfo from '@/services/useSafeInfo'
import { ReviewOwnerTxStep } from '@/components/settings/owner/DialogSteps/ReviewOwnerTxStep'
import { ChangeOwnerData } from '@/components/settings/owner/DialogSteps/data'
import { SetThresholdStep } from '@/components/settings/owner/DialogSteps/SetThresholdStep'
import { TxStepperProps } from '@/components/tx/TxStepper/useTxStepper'

const AddOwnerSteps: TxStepperProps['steps'] = [
  {
    label: 'Choose new owner',
    render: (data, onSubmit) => <ChooseOwnerStep data={data as ChangeOwnerData} onSubmit={onSubmit} />,
  },
  {
    label: 'Set threshold',
    render: (data, onSubmit) => <SetThresholdStep data={data as ChangeOwnerData} onSubmit={onSubmit} />,
  },
  {
    label: 'Review',
    render: (data, onSubmit) => <ReviewOwnerTxStep data={data as ChangeOwnerData} onSubmit={onSubmit} />,
  },
]

export const AddOwnerDialog = () => {
  const [open, setOpen] = useState(false)

  const { safe } = useSafeInfo()

  const handleClose = () => setOpen(false)

  const initialModalData: ChangeOwnerData = { newOwner: { address: '', name: '' }, threshold: safe?.threshold || 1 }

  return (
    <div>
      <div>
        <Button onClick={() => setOpen(true)} variant="contained">
          Add New Owner
        </Button>
      </div>
      {open && <TxModal wide onClose={handleClose} steps={AddOwnerSteps} initialData={[initialModalData]} />}
    </div>
  )
}
