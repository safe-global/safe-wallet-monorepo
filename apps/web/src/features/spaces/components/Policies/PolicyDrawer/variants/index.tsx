import type { ReactElement } from 'react'
import { ActivePolicy } from './ActivePolicy'
import { NotActivatedPolicy } from './NotActivatedPolicy'
import { PendingPolicy } from './PendingPolicy'
import { PolicyStatus, type PolicyVariantContentProps } from './types'

/** The drawer body for one policy status. */
export const PolicyVariantContent = (props: PolicyVariantContentProps): ReactElement => {
  switch (props.status) {
    case PolicyStatus.ACTIVE:
      return <ActivePolicy />

    case PolicyStatus.PENDING: {
      const { status, ...pendingProps } = props
      return <PendingPolicy {...pendingProps} />
    }

    case PolicyStatus.NOT_ACTIVATED:
      return <NotActivatedPolicy />

    // A new status must pick a branch above rather than rendering an empty drawer.
    default: {
      const _exhaustive: never = props
      return _exhaustive
    }
  }
}

export { ActivePolicy, NotActivatedPolicy, PendingPolicy, PolicyStatus }
export type { PolicyVariantContentProps }
