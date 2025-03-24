import { Container } from '@/src/components/Container'
import React from 'react'
import { Text, View } from 'tamagui'

export type ListTableItem = {
  label: string
  value?: string
  render?: () => React.ReactNode
  direction?: 'row' | 'column'
  alignItems?: 'center' | 'flex-start'
}
interface ListTableProps {
  items: ListTableItem[]
  children?: React.ReactNode
}

export function ListTable({ items, children }: ListTableProps) {
  return (
    <Container padding="$4" gap="$5" borderRadius="$3">
      {items.map((item, index) => (
        <View
          key={index}
          alignItems={item.alignItems || 'center'}
          flexDirection={item.direction || 'row'}
          justifyContent="space-between"
          gap={'$2'}
          flexWrap="wrap"
        >
          <Text color="$textSecondaryLight" fontSize="$4">
            {item.label}
          </Text>

          {item.render ? item.render() : <Text fontSize="$4">{item.value}</Text>}
        </View>
      ))}

      {children}
    </Container>
  )
}
