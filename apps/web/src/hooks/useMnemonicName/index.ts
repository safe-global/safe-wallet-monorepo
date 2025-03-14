import { useMemo } from 'react'
import { useCurrentChain } from '@/hooks/useChains'
import { adjectivesDict } from './dict'

const adjectives: string[] = adjectivesDict.trim().split(/\s+/)

export const capitalize = (word: string) => (word.length > 0 ? `${word.charAt(0).toUpperCase()}${word.slice(1)}` : word)

const getRandomItem = <T>(arr: T[]): T => {
  return arr[Math.floor(arr.length * Math.random())]
}

export const getRandomAdjective = (): string => {
  return capitalize(getRandomItem<string>(adjectives))
}

export function useMnemonicPrefixedSafeName(prefix?: string): string {
  const currentNetwork = useCurrentChain()?.chainName
  const adjective = useMemo(() => getRandomAdjective(), [])
  return `${adjective} ${prefix ?? currentNetwork} Safe`
}

export const useMnemonicSafeName = (multiChain?: boolean): string => {
  return useMnemonicPrefixedSafeName(multiChain ? 'Multi-Chain' : undefined)
}
