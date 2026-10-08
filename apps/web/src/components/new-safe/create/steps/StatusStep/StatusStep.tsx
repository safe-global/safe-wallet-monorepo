import type { ReactNode } from 'react'
import Identicon from '@/components/common/Identicon'
import { StatusStepView } from '@views/components/new-safe/create/steps/StatusStep/StatusStepView'

const StatusStep = ({
  isLoading,
  safeAddress,
  children,
  isFirst,
}: {
  isLoading: boolean
  safeAddress?: string
  children: ReactNode
  /** Hides the connector segment above the dot on the first step */
  isFirst?: boolean
}) => {
  return (
    <StatusStepView
      isLoading={isLoading}
      safeAddress={safeAddress}
      identicon={safeAddress && <Identicon address={safeAddress} size={32} />}
      isFirst={isFirst}
    >
      {children}
    </StatusStepView>
  )
}

export default StatusStep
