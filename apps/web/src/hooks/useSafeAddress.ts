import useSafeInfo from '@/hooks/useSafeInfo'

const useSafeAddress = (): string => {
  const { safeAddress } = useSafeInfo()
  return safeAddress
}

export default useSafeAddress
