import { useCurrentChain } from '@/hooks/useChains'
import {
  getNativeTokenDisplay,
  NATIVE_TOKEN_DISPLAY_DEFAULT,
  type NativeTokenDisplay,
} from '@safe-global/utils/utils/chains'

export const useNativeTokenDisplay = (): NativeTokenDisplay => {
  const chain = useCurrentChain()
  return chain ? getNativeTokenDisplay(chain) : NATIVE_TOKEN_DISPLAY_DEFAULT
}
