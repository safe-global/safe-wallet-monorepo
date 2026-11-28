import { useState, type ReactNode } from 'react'
import { useStore } from 'react-redux'
import type { Decorator } from '@storybook/react'
import type { RootState } from '@/store'
import { selectSafeInfo } from '@/store/safeInfoSlice'
import { selectRpc } from '@/store/settingsSlice'
import { spendingLimitsApi, toSpendingLimitsArgs } from '../store/spendingLimitsApi'
import type { SpendingLimitState } from '../public/types'

const SpendingLimitsCache = ({
  spendingLimits,
  children,
}: {
  spendingLimits: SpendingLimitState[]
  children: ReactNode
}) => {
  const store = useStore<RootState>()
  useState(() => {
    const state = store.getState()
    const safe = selectSafeInfo(state).data
    if (!safe) throw new Error('withSpendingLimits needs a Safe in the store: put it inside createMockStory')
    const args = toSpendingLimitsArgs(safe, selectRpc(state))
    store.dispatch(
      spendingLimitsApi.util.upsertQueryEntries([
        { endpointName: 'getSpendingLimits', arg: args, value: spendingLimits },
      ]),
    )
  })
  return <>{children}</>
}

/** Puts the limits in the cache before the first frame, as read from the chain. Goes inside the store decorator. */
export const withSpendingLimits = (spendingLimits: SpendingLimitState[]): Decorator =>
  function WithSpendingLimits(Story) {
    return (
      <SpendingLimitsCache spendingLimits={spendingLimits}>
        <Story />
      </SpendingLimitsCache>
    )
  }
