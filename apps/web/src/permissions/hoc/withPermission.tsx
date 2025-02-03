import type { Permission, PermissionProps } from '../types'
import { useHasPermission } from '../hooks/useHasPermission'

type WrappingComponentProps<
  C extends React.ComponentType<any>,
  P extends Permission,
  PProps = PermissionProps<P> extends undefined ? { permissionProps?: never } : { permissionProps: PermissionProps<P> },
> = React.ComponentProps<C> &
  PProps & {
    // if true, the component will be rendered even if the user does not have the permission
    forceRender?: boolean
  }

/**
 * HOC that renders WrappedComponent only if user has a specific permission
 * @param WrappedComponent component to wrap with permission check
 * @param permission permission to check
 * @returns component that renders WrappedComponent if user has permission
 * @example
 * const RandomComponent = () => <div>Hello world.</div>
 * const WithProposeTxPermission = withPermission(RandomComponent, Permission.ProposeTransaction)
 * const OuterComponent = () => <WithProposeTxPermission />
 * @example
 * const RandomComponent = (props: { hasPermission?: boolean }) => <div>hasPermission: {props.hasPermission}</div>
 * const WithProposeTxPermission = withPermission(RandomComponent, Permission.ProposeTransaction)
 * const OuterComponent = () => <WithProposeTxPermission forceRender />
 * @example
 * const RandomComponent = (props: { foo: string }) => <div>{props.foo}</div>
 * const WithExecuteTxPermission = withPermission(RandomComponent, Permission.ExecuteTransaction)
 * const OuterComponent = () => <WithExecuteTxPermission foo="Hello" permissionProps={{safeTx: {} as any}} />
 */
export function withPermission<C extends React.ComponentType<any & { hasPermission?: boolean }>, P extends Permission>(
  WrappedComponent: C,
  permission: P,
) {
  const WithPermissions = ({ forceRender, permissionProps, ...props }: WrappingComponentProps<C, P>) => {
    const hasPermission = useHasPermission(permission, ...(permissionProps ? [permissionProps] : []))

    if (!forceRender && !hasPermission) {
      return null
    }

    const wrappedProps = { ...props, hasPermission } as React.ComponentProps<C>

    return <WrappedComponent {...wrappedProps} />
  }

  WithPermissions.displayName = WrappedComponent.displayName || WrappedComponent.name

  return WithPermissions
}
