import { useMemo } from 'react'
import { Interface } from 'ethers'
import { useAppSelector } from '@/store'
import { selectCustomAbisByChain } from '@/store/customAbiSlice'
import useChainId from '@/hooks/useChainId'
import type { DataDecoded } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

const formatParamValue = (value: unknown): string | string[] => {
  if (Array.isArray(value)) {
    return value.map((v) => String(v))
  }
  return String(value)
}

const useCustomAbiDecoding = (
  hexData: string | null | undefined,
  toAddress: string | undefined,
): DataDecoded | null => {
  const chainId = useChainId()
  const customAbis = useAppSelector((state) => selectCustomAbisByChain(state, chainId))

  return useMemo(() => {
    if (!hexData || !toAddress) return null

    const entry = customAbis[toAddress]
    if (!entry) return null

    try {
      const iface = new Interface(entry.abi)
      const parsed = iface.parseTransaction({ data: hexData })
      if (!parsed) return null

      const parameters = parsed.fragment.inputs.map((input, index) => ({
        name: input.name,
        type: input.type,
        value: formatParamValue(parsed.args[index]),
      }))

      return {
        method: parsed.name,
        parameters,
      }
    } catch {
      return null
    }
  }, [hexData, toAddress, customAbis])
}

export default useCustomAbiDecoding
