import type { ReactElement } from 'react'
import { Check } from 'lucide-react'
import OwnersIcon from '@safe-global/design/assets/images/common/owners.svg'
import { Badge } from '@safe-global/design/components/ui/badge'

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
