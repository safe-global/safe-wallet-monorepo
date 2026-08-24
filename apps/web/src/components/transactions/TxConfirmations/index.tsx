import type { ReactElement } from 'react'
import { Check } from 'lucide-react'
import OwnersIcon from '@/public/images/common/owners.svg'
import { Badge } from '@/components/ui/badge'

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
