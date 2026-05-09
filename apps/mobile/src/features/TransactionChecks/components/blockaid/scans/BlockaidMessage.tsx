import React from 'react'
import { YStack } from 'tamagui'
import { BlockaidModuleResponse } from '@safe-global/utils/services/security/modules/BlockaidModule'
import { BlockaidHint } from './BlockaidHint'
import groupBy from 'lodash/groupBy'

type BlockaidMessageProps = {
  blockaidResponse?: {
    severity?: number
    isLoading?: boolean
    error?: Error
    payload?: BlockaidModuleResponse
  }
}

export const BlockaidMessage = ({ blockaidResponse }: BlockaidMessageProps) => {
  if (!blockaidResponse) {
    return null
  }

  const { issues } = blockaidResponse.payload ?? {}

  /* Evaluate security warnings */
  const groupedShownWarnings = groupBy(issues, (warning) => warning.severity)
  const sortedSeverities = Object.keys(groupedShownWarnings).sort((a, b) => (Number(a) < Number(b) ? 1 : -1))

  if (sortedSeverities.length === 0) {
    return null
  }

  return (
    <YStack gap="$2">
      {sortedSeverities.map((key) => (
        <BlockaidHint key={key} warnings={groupedShownWarnings[key].map((warning) => warning.description)} />
      ))}
    </YStack>
  )
}
