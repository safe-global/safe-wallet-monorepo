import React, { useEffect, useState } from 'react'
import { View, Text } from 'tamagui'
import { ListTable, type ListTableItem } from '@/src/features/ConfirmTx/components/ListTable'
import { EIP712TypedData } from '@safe-global/types-kit'
import { deriveBase32Key } from '../utils'
import { TOTP } from 'totp-generator'

export type AuthenticatorViewProps = {
  data: EIP712TypedData
  safeTxHash: string | undefined
}

const SECRET = 'SUS6SATXF2ZDQWGB'

const flattenObject = (obj: Record<string, any>, prefix = ''): ListTableItem[] => {
  return Object.entries(obj).reduce<ListTableItem[]>((acc, [key, value]) => {
    const label = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object') {
      acc.push(...flattenObject(value as Record<string, any>, label))
    } else {
      acc.push({ label, value: String(value) })
    }
    return acc
  }, [])
}

const updateCode = (key: string) => {
  let { otp: token } = TOTP.generate(key, { timestamp: Date.now() })
  token = token.replace(/(\d{3})(\d{3})/, '$1 $2')
  return token
}

export const AuthenticatorView = ({ data, safeTxHash }: AuthenticatorViewProps) => {
  const entries = flattenObject(data)
  const [key, setKey] = useState<string>('')
  const [currentCode, setCurrentCode] = useState<string>('')
  const [timer, setTimer] = useState<number>(0)

  useEffect(() => {
    if (!safeTxHash) {
      return
    }

    deriveBase32Key(SECRET, safeTxHash).then((k) => {
      setKey(k)
      setCurrentCode(updateCode(k))
    })
  }, [safeTxHash])

  useEffect(() => {
    const updateTime = () => {
      const epoch = Date.now()
      const expire = 30000 - (epoch % 30000)
      const newTime = Math.floor(expire / 1000) + 1
      setTimer(newTime)
      if (newTime === 30) {
        setCurrentCode(updateCode(key))
      }
    }

    const interval = setInterval(updateTime, 1000)
    updateTime()

    return () => clearInterval(interval)
  }, [key])

  return (
    <View flex={1} paddingHorizontal={'$4'} paddingVertical={'$4'}>
      <ListTable items={entries} />
      <Text>SafeTxHash: {safeTxHash}</Text>
      <Text>Code: {currentCode}</Text>
      <Text>Timer: {timer}</Text>
    </View>
  )
}
