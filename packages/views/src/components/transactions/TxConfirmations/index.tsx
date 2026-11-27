import type { ReactElement } from 'react'
import { Check } from 'lucide-react'
import OwnersIcon from '@safe-global/views/assets/images/common/owners.svg'
import { Badge } from '@safe-global/views/components/ui/badge'

const TxConfirmations = ({
  requiredConfirmations,
  submittedConfirmations,
}: {
  requiredConfirmations: number
  submittedConfirmations: number
}): ReactElement => {
  const isConfirmed = submittedConfirmations >= requiredConfirmations

  return (
    <Badge variant="subtle">
      {isConfirmed ? <Check /> : <OwnersIcon />}
      {submittedConfirmations}/{requiredConfirmations}
    </Badge>
  )
}

export default TxConfirmations
