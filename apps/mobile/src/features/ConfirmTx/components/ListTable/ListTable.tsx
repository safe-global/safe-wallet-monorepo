import { Container } from '@/src/components/Container'
import React from 'react'
import { Text, View } from 'tamagui'

interface ListTableProps {
  items: {
    label: string
    value?: string
    render?: () => React.ReactNode
  }[]
}

export function ListTable({ items }: ListTableProps) {
  return (
    <Container padding="$4" gap="$5" borderRadius="$3">
      {items.map((item, index) => (
        <View key={index} alignItems="center" flexDirection="row" justifyContent="space-between">
          <Text color="$textSecondaryLight" fontSize="$4">
            {item.label}
          </Text>

          {item.render ? item.render() : <Text fontSize="$4">{item.value}</Text>}
        </View>
      ))}
    </Container>
  )
}
