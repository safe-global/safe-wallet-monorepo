import React from 'react'
import { View } from 'tamagui'
import { Skeleton } from 'moti/skeleton'
import { Container } from '@/src/components/Container'
import random from 'lodash/random'
import { useTheme } from '@/src/theme/hooks/useTheme'

interface TransactionSkeletonProps {
  count?: number
  showSections?: boolean
  sectionTitles?: string[]
}

export const TransactionSkeletonItem = () => {
  const { colorScheme } = useTheme()

  // Memoize random widths to prevent re-renders and maintain consistent skeleton appearance
  const widths = React.useMemo(
    () => ({
      transactionType: random(60, 100),
      transactionLabel: random(60, 180),
      rightSide: random(60, 100),
    }),
    [],
  )

  return (
    <Container spaced paddingVertical="$5" bordered={false}>
      <View flexDirection="row" width="100%" alignItems="center" justifyContent="space-between">
        <View flexDirection="row" maxWidth="55%" alignItems="center" gap="$3">
          {/* Left icon skeleton */}
          <Skeleton colorMode={colorScheme} radius="round" height={32} width={32} />

          <View flex={1} gap="$2">
            {/* Transaction type skeleton */}
            <Skeleton colorMode={colorScheme} height={10} width={widths.transactionType} />

            {/* Transaction label skeleton */}
            <Skeleton colorMode={colorScheme} height={18} width={widths.transactionLabel} />
          </View>
        </View>

        {/* Right side skeleton - value, status, or buttons */}
        <View alignItems="flex-end" gap="$2">
          <Skeleton colorMode={colorScheme} height={16} width={widths.rightSide} />
        </View>
      </View>
    </Container>
  )
}

export const TransactionSkeleton = ({
  count = 6,
  showSections = true,
  sectionTitles = ['Recent transactions'],
}: TransactionSkeletonProps) => {
  const { colorScheme } = useTheme()

  // For pending transactions, we typically have 2 sections (Next, In queue)
  // For history, we typically have date-based sections
  const sections = showSections ? sectionTitles : ['']
  const itemsPerSection = Math.ceil(count / sections.length)

  return (
    <Skeleton.Group show={true}>
      <View>
        {sections.map((sectionTitle, sectionIndex) => (
          <View key={sectionIndex} gap="$4">
            {/* Section header skeleton - only show if we have a title */}
            {showSections && sectionTitle && (
              <View marginBottom="$2">
                <Skeleton
                  colorMode={colorScheme}
                  height={20}
                  width={sectionTitle === 'Recent transactions' ? 120 : random(80, 120)}
                />
              </View>
            )}

            {/* Transaction items skeleton */}
            {Array.from({ length: itemsPerSection }).map((_, itemIndex) => (
              <TransactionSkeletonItem key={`${sectionIndex}-${itemIndex}`} />
            ))}
          </View>
        ))}
      </View>
    </Skeleton.Group>
  )
}
