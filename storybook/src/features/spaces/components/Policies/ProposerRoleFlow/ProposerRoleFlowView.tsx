import type { ReactElement, ReactNode } from 'react'
import TxLayoutBase from '@/components/tx-flow/common/TxLayoutBase'
import { CREATE_POLICY_TITLE } from './constants'
import ProposerRoleHeader from './ProposerRoleHeader'

export type ProposerRoleFlowViewProps = {
  children: ReactNode
}

export const ProposerRoleFlowView = ({ children }: ProposerRoleFlowViewProps): ReactElement => (
  <div className="min-[900px]:-mt-9">
    <TxLayoutBase
      title={<span className="block max-[899.95px]:px-4">{CREATE_POLICY_TITLE}</span>}
      subtitle={<ProposerRoleHeader />}
      step={0}
      stepCount={1}
      progress={100}
      hideStatusRail
      hideSafeShield
      hideProgress
      hideNonce
    >
      {children}
    </TxLayoutBase>
  </div>
)
