import React from 'react'
import { getTokenValue, Spinner } from 'tamagui'

import { Alert } from '@/src/components/Alert'
import { SafeTab } from '@/src/components/SafeTab'
import { NoFunds } from '../NoFunds'

export const Fallback = ({ loading, hasError }: { loading: boolean; hasError: boolean }) => (
  <SafeTab.ScrollView style={{ padding: getTokenValue('$4') }}>
    {loading ? (
      <Spinner size="small" />
    ) : hasError ? (
      <Alert type="error" message={`Error fetching assets list`} />
    ) : (
      <NoFunds />
    )}
  </SafeTab.ScrollView>
)
