import React from 'react'
import { SafeShieldHeadline } from '../SafeShieldHeadline'
import { Severity } from '@safe-global/utils/features/safe-shield/types'

interface AnalysisDetailsHeaderProps {
  severity: Severity
}

export const AnalysisDetailsHeader = ({ severity }: AnalysisDetailsHeaderProps) => {
  return <SafeShieldHeadline type={severity} />
}
