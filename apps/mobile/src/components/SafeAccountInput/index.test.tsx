import React from 'react'
import { Pressable } from 'react-native'
import { FormProvider, useForm } from 'react-hook-form'
import { render, fireEvent, waitFor } from '@/src/tests/test-utils'
import type { FormValues } from '@/src/features/ImportReadOnly/types'
import SafeAccountInput from './index'

// Stub useImportSafe so the test drives importedSafeResult via setValue.
jest.mock('./hooks/useImportSafe', () => ({ useImportSafe: jest.fn() }))

// Derive fixture types from the form contract, not the auto-generated gateway module.
type ImportedSafeResult = NonNullable<FormValues['importedSafeResult']>
type SafeOverviewItem = NonNullable<ImportedSafeResult['data']>[number]

const VALID_ADDRESS = '0x2f3e600a3F38b66aDcbe6530B191F2BE55c2Fbb6'

const safeOverview: SafeOverviewItem = {
  address: { value: VALID_ADDRESS, name: null, logoUri: null },
  awaitingConfirmation: null,
  chainId: '1',
  fiatTotal: '0',
  owners: [],
  queued: 0,
  threshold: 1,
}

// Without `seed`, the result is applied via setValue after mount (the scenario the
// watch() method missed); with `seed` it is in defaultValues from the start.
const Harness = ({ result, seed = false }: { result: ImportedSafeResult; seed?: boolean }) => {
  const methods = useForm<FormValues>({
    defaultValues: { name: '', safeAddress: VALID_ADDRESS, ...(seed ? { importedSafeResult: result } : {}) },
  })

  return (
    <FormProvider {...methods}>
      <SafeAccountInput />
      <Pressable testID="set-result" onPress={() => methods.setValue('importedSafeResult', result)} />
    </FormProvider>
  )
}

describe('SafeAccountInput', () => {
  it('renders the success icon when importedSafeResult is set after mount', async () => {
    const { queryByTestId, getByTestId } = render(
      <Harness result={{ data: [safeOverview], isFetching: false, error: undefined }} />,
    )

    expect(queryByTestId('success-icon')).toBeNull()

    fireEvent.press(getByTestId('set-result'))

    // useWatch must re-render this child so the icon appears.
    await waitFor(() => expect(getByTestId('success-icon')).toBeTruthy())
  })

  it('does not render the success icon while the lookup is still fetching', () => {
    const { queryByTestId } = render(
      <Harness result={{ data: [safeOverview], isFetching: true, error: undefined }} seed />,
    )

    expect(queryByTestId('success-icon')).toBeNull()
  })

  it('does not render the success icon when the lookup returns no Safes', () => {
    const { queryByTestId } = render(<Harness result={{ data: [], isFetching: false, error: undefined }} seed />)

    expect(queryByTestId('success-icon')).toBeNull()
  })
})
