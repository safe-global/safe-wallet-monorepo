import React from 'react'
import { Link } from 'expo-router'
import { Text } from 'tamagui'
import type { AnalysisResult } from '@safe-global/utils/features/safe-shield/types'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { AnalysisDisplay } from './AnalysisDisplay'

interface DelegateCallItemProps {
  result: AnalysisResult
  isPrimary?: boolean
}

export const DelegateCallItem = ({ result, isPrimary = false }: DelegateCallItemProps) => {
  const description = (
    <Text fontSize="$4" color="$colorLight">
      This transaction calls a smart contract that will be able to modify your Safe account.{' '}
      <Link href={HelpCenterArticle.UNEXPECTED_DELEGATE_CALL} asChild>
        <Text fontSize="$4" color="$colorPrimary" fontWeight={700}>
          Learn more
        </Text>
      </Link>
    </Text>
  )

  return (
    <AnalysisDisplay description={description} result={result} severity={isPrimary ? result.severity : undefined} />
  )
}
