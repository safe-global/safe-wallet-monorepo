import type { PermissionSet } from './PermissionSet'
import type { Role } from './Role'
import type { RoleProps } from './RoleProps'

export * from './Role'
export * from './Permission'
export * from './PermissionProps'
export * from './PermissionSet'
export * from './RoleProps'

export type RolePermissionsFn<R extends Role> =
  RoleProps<R> extends undefined ? () => PermissionSet : (props: RoleProps<R>) => PermissionSet

export type RolePermissionsConfig = {
  [R in Role]?: RolePermissionsFn<R>
}
