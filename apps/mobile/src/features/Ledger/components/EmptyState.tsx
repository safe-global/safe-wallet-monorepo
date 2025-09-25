import React from 'react'
import { Container } from '@/src/components/Container'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Text } from 'tamagui'

interface EmptyStateProps {
  title: string
  subtitle: string
}

export const EmptyState = ({ title, subtitle }: EmptyStateProps) => (
  <Container marginHorizontal="$3" marginTop="$6" alignItems="center">
    <SafeFontIcon name="hardware" size={48} color="$colorSecondary" />
    <Text fontSize="$4" color="$colorSecondary" textAlign="center" marginTop="$3">
      {title}
      {'\n'}
      {subtitle}
    </Text>
  </Container>
)
