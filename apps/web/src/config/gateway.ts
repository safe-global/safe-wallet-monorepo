import { GATEWAY_URL_PRODUCTION, GATEWAY_URL_STAGING, IS_PRODUCTION } from '@/config/constants'
import { localItem } from '@/services/local-storage/local'

export const LS_KEY = 'debugProdCgw'
export const cgwDebugStorage = localItem<boolean>(LS_KEY)
export const GATEWAY_URL = IS_PRODUCTION || cgwDebugStorage.get() ? GATEWAY_URL_PRODUCTION : GATEWAY_URL_STAGING
