import { useEffect, useState } from 'react'
import { useCurrentChain } from '../useChains'
import { animalsDict, adjectivesDict } from './dict'

const animals: string[] = animalsDict.trim().split(/\s+/)
const adjectives: string[] = adjectivesDict.trim().split(/\s+/)

const getRandomItem = <T>(arr: T[]): T => {
  return arr[Math.floor(arr.length * Math.random())]
}

export const getRandomName = (noun = getRandomItem<string>(animals)): string => {
  const adj = getRandomItem<string>(adjectives)
  return `${adj}-${noun}`
}

export const useMnemonicName = (noun?: string): string => {
  const [name, setName] = useState<string>('')

  useEffect(() => {
    setName(getRandomName(noun))
  }, [noun])

  return name
}

export const useMnemonicSafeName = (): string => {
  const networkName = useCurrentChain()?.chainName
  return useMnemonicName(`${networkName}-safe`)
}
