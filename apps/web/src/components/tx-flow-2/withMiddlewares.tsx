import React, { type ComponentType, type PropsWithChildren, type ReactNode } from 'react'
import type { NextStepCallback, SubmitCallback } from './createTxFlow'

const AppendElements = <T extends object = {}>({
  children,
  append = [],
  props,
}: {
  children?: ReactNode
  append?: Array<ComponentType<T>>
  props: T
}) => {
  const [First, ...rest] = append

  if (!!First) {
    return (
      <AppendElements append={rest} props={props}>
        {children}
        <First {...props} />
      </AppendElements>
    )
  }

  return children
}

const withActions = <
  T extends unknown,
  P extends object,
  Callback extends NextStepCallback<T> | SubmitCallback = NextStepCallback<T>,
  ActionProps extends { onSubmit: SubmitCallback } = { onSubmit: SubmitCallback },
>(
  WrappedComponent: ComponentType<P & { actions: ReactNode }>,
  applyActions?: ComponentType<ActionProps>[],
) => {
  return function WithActionsComponent(props: P & { onSubmit?: Callback }) {
    const { onSubmit } = props
    const actions = <AppendElements append={applyActions} props={{ onSubmit } as ActionProps} />

    return <WrappedComponent {...props} actions={actions} />
  }
}

const withFeatures = <P extends PropsWithChildren>(
  WrappedComponent: ComponentType<P>,
  applyFeatures?: ComponentType[],
) => {
  return function WithFeaturesComponent(props: P) {
    const content = (
      <AppendElements append={applyFeatures} props={{}}>
        {props.children}
      </AppendElements>
    )

    return <WrappedComponent {...props}>{content}</WrappedComponent>
  }
}

export const withMiddlewares = <
  T extends unknown,
  Callback extends NextStepCallback<T> | SubmitCallback = NextStepCallback<T>,
  P extends PropsWithChildren<{ onSubmit?: Callback; actions?: ReactNode }> = PropsWithChildren<{
    onSubmit?: Callback
    actions?: ReactNode
  }>,
  ActionProps extends { onSubmit: SubmitCallback } = { onSubmit: SubmitCallback },
>(
  WrappedComponent: ComponentType<P>,
  applyFeatures?: ComponentType[],
  applyActions?: ComponentType<ActionProps>[],
) => {
  const WithFeatures = withFeatures(WrappedComponent, applyFeatures)
  const WithMiddlewares = withActions<T, P, Callback, ActionProps>(WithFeatures, applyActions)

  return function WithMiddlewaresComponent({ onSubmit, ...props }: P & { onSubmit?: Callback }) {
    return <WithMiddlewares {...(props as P)} onSubmit={onSubmit} />
  }
}
