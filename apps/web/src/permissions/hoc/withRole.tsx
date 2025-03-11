import type { Role } from '../config'
import { useHasRoles } from '../hooks/useHasRoles'

type WrappingComponentProps<C extends React.ComponentType<any>> = React.ComponentProps<C> & {
  // whether the user must have only the roles to check
  exclusive?: boolean
  // if true, the component will be rendered even if the user does not have the role
  forceRender?: boolean
}

/**
 * HOC that renders WrappedComponent only if user has a specific role
 * @param WrappedComponent component to wrap with role check
 * @param role role to check
 * @returns component that renders WrappedComponent if user has role
 * @example
 * const RandomComponent = (props: { hasRole?: boolean }) => <div>hasRole: {props.hasRole}</div>
 * const WithOwnerRole = withRole(RandomComponent, Role.Owner)
 * const RenderOnlyForOwner = () => <WithOwnerRole />
 * const RenderOnlyForOwnerExclusively = () => <WithOwnerRole exclusive />
 * const RenderForAllWithIsOwnerInfo = () => <WithOwnerRole forceRender />
 */
export function withRole<C extends React.ComponentType<any & { hasRole?: boolean }>, R extends Role>(
  WrappedComponent: C,
  role: R,
) {
  const WithRole = ({ forceRender, exclusive, ...props }: WrappingComponentProps<C>) => {
    const hasRole = useHasRoles([role], exclusive)

    if (!forceRender && !hasRole) {
      return null
    }

    const wrappedProps = { ...props, hasRole } as React.ComponentProps<C>

    return <WrappedComponent {...wrappedProps} />
  }

  WithRole.displayName = WrappedComponent.displayName || WrappedComponent.name

  return WithRole
}
