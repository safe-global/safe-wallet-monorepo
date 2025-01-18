import { Permission } from './Permission'
import { PermissionProps } from './PermissionProps'

// Define the type for a permission function that evaluates to a boolean
type PermissionFn<P extends Permission, Arg extends PermissionProps<P> = PermissionProps<P>> = Arg extends undefined
  ? undefined
  : (args: Arg) => boolean

// Define the type for a permission set that maps permissions to their values
export type PermissionSet = {
  [P in Permission]?: PermissionFn<P> extends undefined ? boolean : PermissionFn<P>
}
