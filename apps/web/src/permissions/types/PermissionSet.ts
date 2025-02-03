import type { Permission } from './Permission'
import type { PermissionProps } from './PermissionProps'

// Define the type for a permission function that evaluates to a boolean
type PermissionFn<P extends Permission> =
  PermissionProps<P> extends undefined ? undefined : (args: PermissionProps<P>) => boolean

// Define the type for a permission set that maps permissions to their values
export type PermissionSet = {
  [P in Permission]?: PermissionFn<P> extends undefined ? boolean : PermissionFn<P>
}
