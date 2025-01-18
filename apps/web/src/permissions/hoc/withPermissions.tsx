import { Permission, PermissionProps } from '../types'
import { useHasPermission } from '../hooks/useHasPermission'

type WrappingComponentProps<
  C extends React.ComponentType<any>,
  P extends Permission,
  PProps = PermissionProps<P> extends undefined ? { permissionProps?: never } : { permissionProps: PermissionProps<P> },
> = React.ComponentProps<C> & PProps & { forceRender?: boolean }

/**
 * HOC that renders WrappedComponent only if user has a specific permission
 * @param WrappedComponent component to wrap with permission check
 * @param permission permission to check
 * @returns component that renders WrappedComponent if user has permission
 * @example
 * const RandomComponent = (props: { foo: string }) => <div>{props.foo}</div>
 *
 * const WithProposeTxPermission = withPermission(RandomComponent, Permission.ProposeTransaction)
 * const OuterComponent = () => <WithProposeTxPermission foo="Hello" />
 * @example
 * const RandomComponent = (props: { foo: string }) => <div>{props.foo}</div>
 *
 * const WithExecuteTxPermission = withPermission(RandomComponent, Permission.ExecuteTransaction)
 * const OuterComponent = () => <WithExecuteTxPermission foo="Hello" permissionProps={{safeTx: {} as any}} />
 */
export function withPermission<C extends React.ComponentType<any>, P extends Permission>(
  WrappedComponent: C,
  permission: P,
) {
  return ({ forceRender, permissionProps, ...props }: WrappingComponentProps<C, P>) => {
    const hasPermission = useHasPermission(permission, ...(permissionProps ? [permissionProps] : []))

    if (!forceRender && !hasPermission) {
      return null
    }

    return <WrappedComponent {...(props as React.ComponentProps<C>)} />
  }
}
