import type { ReactElement } from 'react'
import { Check } from 'lucide-react'
import OwnersIcon from '@/public/images/common/owners.svg'
import TxStatusChip from '../TxStatusChip'

const TxConfirmations = ({
  requiredConfirmations,
  submittedConfirmations,
}: {
  requiredConfirmations: number
  submittedConfirmations: number
}): ReactElement => {
  const isConfirmed = submittedConfirmations >= requiredConfirmations

  return (
    <TxStatusChip color="secondary">
      {isConfirmed ? <Check className="size-5" /> : <OwnersIcon className="size-5" />}

      <span className="text-xs font-bold tracking-[1px]">
        {submittedConfirmations}/{requiredConfirmations}
      </span>
    </TxStatusChip>
  )
}

export default TxConfirmations
