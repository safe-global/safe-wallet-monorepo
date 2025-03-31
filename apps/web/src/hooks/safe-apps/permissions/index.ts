import { RestrictedMethods } from '@safe-global/safe-apps-sdk'
import type { AllowedFeatures } from '@/components/safe-apps/types'
import { capitalize } from '@safe-global/utils/utils/formatters'

type PermissionsDisplayType = {
  displayName: string
  description: string
}

export * from './useBrowserPermissions'
export * from './useSafePermissions'

const SAFE_PERMISSIONS_TEXTS: Record<string, PermissionsDisplayType> = {
  [RestrictedMethods.requestAddressBook]: {
    displayName: 'Address Book',
    description: 'Access to your address book',
  },
}

export const getSafePermissionDisplayValues = (method: string) => {
  return SAFE_PERMISSIONS_TEXTS[method]
}

export const getBrowserPermissionDisplayValues = (feature: AllowedFeatures) => {
  return {
    displayName: capitalize(feature).replace(/-/g, ' '),
    description: `Allow to use - ${feature}`,
  }
}
