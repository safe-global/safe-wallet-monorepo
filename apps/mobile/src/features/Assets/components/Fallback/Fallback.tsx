import React from 'react'
import { getTokenValue } from 'tamagui'

import { SafeTab } from '@/src/components/SafeTab'
import { Loader } from '@/src/components/Loader'

export const Fallback = ({ loading, children }: { loading: boolean; children: React.ReactElement }) => (
  <SafeTab.ScrollView style={{ padding: getTokenValue('$4') }}>{loading ? <Loader /> : children}</SafeTab.ScrollView>
)
