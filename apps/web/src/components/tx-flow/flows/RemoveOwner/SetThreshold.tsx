import { useState } from 'react'
import type { ReactElement, SyntheticEvent } from 'react'

import EthHashInfo from '@/components/common/EthHashInfo'
import useSafeInfo from '@/hooks/useSafeInfo'
import type { RemoveOwnerFlowProps } from '.'

import { validateThreshold } from '@safe-global/utils/utils/validation'
import { SetThresholdView } from '@views/components/tx-flow/flows/RemoveOwner/SetThresholdView'

export const SetThreshold = ({
  params,
  onSubmit,
}: {
  params: RemoveOwnerFlowProps
  onSubmit: (data: RemoveOwnerFlowProps) => void
}): ReactElement => {
  const { safe } = useSafeInfo()
  const [selectedThreshold, setSelectedThreshold] = useState<number>(params.threshold ?? 1)

  const handleChange = (value: number | null) => {
    if (value != null) setSelectedThreshold(value)
  }

  const newNumberOfOwners = safe ? safe.owners.length - 1 : 1

  // The threshold lives outside a form, so guard it at submit: blocks the
  // GS202/GS201 on-chain reverts if the owner set changed while the flow was
  // open (WA-3005 Bucket A).
  const thresholdError = validateThreshold(selectedThreshold, newNumberOfOwners)

  const onSubmitHandler = (e: SyntheticEvent) => {
    e.preventDefault()
    if (thresholdError) return
    onSubmit({ ...params, threshold: selectedThreshold })
  }

  return (
    <SetThresholdView
      onSubmit={onSubmitHandler}
      removedOwnerAddress={params.removedOwner.address}
      renderAddress={(props) => <EthHashInfo {...props} />}
      selectedThreshold={selectedThreshold}
      onThresholdChange={handleChange}
      optionCount={safe.owners.slice(1).length}
      newNumberOfOwners={newNumberOfOwners}
      thresholdError={thresholdError}
    />
  )
}
