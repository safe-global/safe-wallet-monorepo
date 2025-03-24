import React from 'react'
import { getTokenValue, Spinner } from 'tamagui'

import { Alert } from '@/src/components/Alert'
import { SafeTab } from '@/src/components/SafeTab'

export const Fallback = ({
  loading,
  hasError,
  children,
}: {
  loading: boolean
  hasError: boolean
  children: React.ReactElement
}) => (
  <SafeTab.ScrollView style={{ padding: getTokenValue('$4') }}>
    {loading ? (
      <Spinner size="small" />
    ) : hasError ? (
      <Alert type="error" message={`Error fetching assets list`} />
    ) : (
      children
    )}
  </SafeTab.ScrollView>
)
