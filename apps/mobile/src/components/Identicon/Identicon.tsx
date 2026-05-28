import { memo, useMemo } from 'react'
import { bloSvg } from 'blo'
import { View } from 'tamagui'
import { SvgXml } from 'react-native-svg'
import { type Address } from '@/src/types/address'

// Accept full Ethereum addresses (40 hex) and longer hex values (e.g. 64-char
// transaction hashes used by AdvancedDetails). Rejects partial / non-hex input
// so RecipientInput typing doesn't generate a blockie per keystroke.
const HEX_INPUT_RE = /^0x[0-9a-fA-F]{40,}$/

type Props = {
  address: Address
  rounded?: boolean
  size?: number
}

const DEFAULT_SIZE = 56
const MAX_CACHE = 256
const svgCache = new Map<string, string>()

function getIdenticonSvg(address: Address): string {
  // `blo` lowercases the address internally before hashing, so the SVG output
  // is identical regardless of input case. We lowercase only the cache key to
  // dedupe entries when callers pass mixed cases.
  const key = address.toLowerCase()
  const cached = svgCache.get(key)
  if (cached) {
    svgCache.delete(key)
    svgCache.set(key, cached)
    return cached
  }
  const svg = bloSvg(address)
  svgCache.set(key, svg)
  if (svgCache.size > MAX_CACHE) {
    const oldest = svgCache.keys().next().value
    if (oldest !== undefined) {
      svgCache.delete(oldest)
    }
  }
  return svg
}

export const Identicon = memo(function Identicon({ address, rounded = true, size = DEFAULT_SIZE }: Props) {
  const valid = HEX_INPUT_RE.test(address)
  const blockieSvg = useMemo(() => (valid ? getIdenticonSvg(address) : null), [valid, address])

  if (!blockieSvg) {
    return (
      <View
        style={{ width: size, height: size, borderRadius: rounded ? '50%' : 0 }}
        backgroundColor="$backgroundSkeleton"
        testID="identicon-image-placeholder"
      />
    )
  }

  return (
    <View style={{ borderRadius: rounded ? '50%' : 0, overflow: 'hidden' }} testID={'identicon-image-container'}>
      <SvgXml testID={'identicon-image'} xml={blockieSvg} width={size} height={size} />
    </View>
  )
})
