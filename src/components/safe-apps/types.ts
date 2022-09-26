import { SafeAppData } from '@gnosis.pm/safe-react-gateway-sdk'

export enum PermissionStatus {
  GRANTED = 'granted',
  PROMPT = 'prompt',
  DENIED = 'denied',
}

export type AllowedFeatures =
  | 'accelerometer'
  | 'ambient-light-sensor'
  | 'autoplay'
  | 'battery'
  | 'camera'
  | 'cross-origin-isolated'
  | 'display-capture'
  | 'document-domain'
  | 'encrypted-media'
  | 'execution-while-not-rendered'
  | 'execution-while-out-of-viewport'
  | 'fullscreen'
  | 'geolocation'
  | 'gyroscope'
  | 'keyboard-map'
  | 'magnetometer'
  | 'microphone'
  | 'midi'
  | 'navigation-override'
  | 'payment'
  | 'picture-in-picture'
  | 'publickey-credentials-get'
  | 'screen-wake-lock'
  | 'sync-xhr'
  | 'usb'
  | 'web-share'
  | 'xr-spatial-tracking'
  | 'clipboard-read'
  | 'clipboard-write'
  | 'gamepad'
  | 'speaker-selection'

export type AllowedFeatureSelection = { feature: AllowedFeatures; checked: boolean }

export type SafeAppDataWithPermissions = SafeAppData & { safeAppsPermissions: AllowedFeatures[] }
