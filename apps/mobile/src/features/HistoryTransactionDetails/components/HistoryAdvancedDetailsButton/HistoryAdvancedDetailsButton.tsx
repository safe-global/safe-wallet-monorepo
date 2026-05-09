import React from 'react'
import { ParametersButton } from '@/src/components/ParametersButton'

interface HistoryAdvancedDetailsButtonProps {
  txId: string
}

export function HistoryAdvancedDetailsButton({ txId }: HistoryAdvancedDetailsButtonProps) {
  return <ParametersButton txId={txId} />
}
