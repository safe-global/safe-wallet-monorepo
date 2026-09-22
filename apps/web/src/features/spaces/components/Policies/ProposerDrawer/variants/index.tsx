import type { ReactElement } from 'react'
import { ActiveProposer } from './ActiveProposer'
import { NotActivatedProposer } from './NotActivatedProposer'
import { PendingProposer } from './PendingProposer'
import { ProposerStatus, type ProposerVariantContentProps } from './types'

export const ProposerVariantContent = (props: ProposerVariantContentProps): ReactElement => {
  switch (props.status) {
    case ProposerStatus.ACTIVE: {
      const { status, ...activeProps } = props
      return <ActiveProposer {...activeProps} />
    }

    case ProposerStatus.PENDING: {
      const { status, ...pendingProps } = props
      return <PendingProposer {...pendingProps} />
    }

    case ProposerStatus.NOT_ACTIVATED: {
      const { status, ...notActivatedProps } = props
      return <NotActivatedProposer {...notActivatedProps} />
    }

    // A new status must pick a branch above rather than rendering an empty drawer.
    default: {
      const _exhaustive: never = props
      return _exhaustive
    }
  }
}

export { ActiveProposer, NotActivatedProposer, PendingProposer, ProposerStatus }
export type { ProposerVariantContentProps }
