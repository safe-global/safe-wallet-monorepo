import React from 'react'
import { Link } from 'expo-router'
import { Text } from 'tamagui'
import type { AnalysisResult } from '@safe-global/utils/features/safe-shield/types'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { AnalysisDisplay } from './AnalysisDisplay'

interface FallbackHandlerItemProps {
  result: AnalysisResult
  isPrimary?: boolean
}

export const FallbackHandlerItem = ({ result, isPrimary = false }: FallbackHandlerItemProps) => {
  const description = (
    <Text fontSize="$4" color="$colorLight">
      Verify the{' '}
      <Link href={HelpCenterArticle.FALLBACK_HANDLER} asChild>
        <Text fontSize="$4" color="$colorLight" textDecorationLine="underline">
          fallback handler
        </Text>
      </Link>{' '}
      is trusted and secure before proceeding.
    </Text>
  )

  return (
    <AnalysisDisplay description={description} result={result} severity={isPrimary ? result.severity : undefined} />
  )
}
