import React from 'react'
import { Pressable } from 'react-native'
import { FormProvider, useForm } from 'react-hook-form'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { render, fireEvent, waitFor } from '@/src/tests/test-utils'
import type { FormValues } from '@/src/features/ImportReadOnly/types'
import SafeAccountInput from './index'

// useImportSafe runs RTK Query lookups and writes importedSafeResult itself.
// Stub it so the test drives importedSafeResult deterministically via setValue.
jest.mock('./hooks/useImportSafe', () => ({ useImportSafe: jest.fn() }))

const VALID_ADDRESS = '0x2f3e600a3F38b66aDcbe6530B191F2BE55c2Fbb6'

const safeOverview: SafeOverview = {
  address: { value: VALID_ADDRESS, name: null, logoUri: null },
  awaitingConfirmation: null,
  chainId: '1',
  fiatTotal: '0',
  owners: [],
  queued: 0,
  threshold: 1,
}

// importedSafeResult is not in defaultValues and is populated only via setValue,
// so this harness reproduces the exact scenario that the watch() method missed.
const Harness = () => {
  const methods = useForm<FormValues>({
    defaultValues: { name: '', safeAddress: VALID_ADDRESS },
  })

  return (
    <FormProvider {...methods}>
      <SafeAccountInput />
      <Pressable
        testID="set-result"
        onPress={() =>
          methods.setValue('importedSafeResult', { data: [safeOverview], isFetching: false, error: undefined })
        }
      />
    </FormProvider>
  )
}

describe('SafeAccountInput', () => {
  it('renders the success icon when importedSafeResult is set after mount', async () => {
    const { queryByTestId, getByTestId } = render(<Harness />)

    // No result yet → no success icon.
    expect(queryByTestId('success-icon')).toBeNull()

    // useImportSafe would normally do this; simulate the result arriving.
    fireEvent.press(getByTestId('set-result'))

    // useWatch must re-render this child so the icon appears.
    await waitFor(() => expect(getByTestId('success-icon')).toBeTruthy())
  })
})
