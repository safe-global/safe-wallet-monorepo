import { useMemo } from 'react'
import { useRouter } from 'next/router'
import { parsePrefixedAddress } from '@/utils/addresses'

const useSafeAddress = (): string => {
  const router = useRouter()
  const { safe = '' } = router.query
  const fullAddress = Array.isArray(safe) ? safe[0] : safe

  const checksummedAddress = useMemo(() => {
    if (!fullAddress) return ''
    const { address } = parsePrefixedAddress(fullAddress)
    return address
  }, [fullAddress])

  return checksummedAddress
}

export default useSafeAddress
