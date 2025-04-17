import { useMemo } from 'react'
import { useRouter } from 'next/router'
import { parsePrefixedAddress } from '@safe-global/utils/utils/addresses'

export const useSafeAddressFromUrl = (): string => {
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
