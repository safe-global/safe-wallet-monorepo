import type { ComponentType, PropsWithChildren, ReactNode } from 'react'
import type { SubmitCallback } from './TxFlow'

export type ActionComponent = ComponentType<
  PropsWithChildren<{
    onSubmit: SubmitCallback
  }>
>

const Action = ({ onSubmit, children }: { onSubmit: SubmitCallback; children: ActionComponent[] }) => {
  const childrenArray = Array.isArray(children) ? children : [children]
  const [FirstAction, ...rest] = childrenArray

  if (!FirstAction) {
    return false
  }

  return (
    <FirstAction onSubmit={onSubmit}>
      <Action onSubmit={onSubmit}>{rest}</Action>
    </FirstAction>
  )
}

export const withActions = <
  WrappedComponentProps extends { action: ReactNode; onSubmit: SubmitCallback } = {
    action: ReactNode
    onSubmit: SubmitCallback
  },
>(
  WrappedComponent: ComponentType<WrappedComponentProps>,
  actionComponents: ActionComponent[],
) => {
  return function WithActions(props: Omit<WrappedComponentProps, 'action'>) {
    const { onSubmit } = props

    const wrappedProps = {
      ...props,
      action: <Action onSubmit={onSubmit}>{actionComponents}</Action>,
    } as WrappedComponentProps

    return <WrappedComponent {...wrappedProps} />
  }
}
