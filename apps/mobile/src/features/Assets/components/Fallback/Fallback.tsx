import React from 'react'
import { getTokenValue, Spinner } from 'tamagui'

import { SafeTab } from '@/src/components/SafeTab'

export const Fallback = ({ loading, children }: { loading: boolean; children: React.ReactElement }) => (
  <SafeTab.ScrollView style={{ padding: getTokenValue('$4') }}>
    {loading ? <Spinner size="small" /> : children}
  </SafeTab.ScrollView>
)
